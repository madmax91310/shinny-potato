import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {TWEETS} from '../src/pages/tweet-bank/data.js'
import {curateTweet,groupTweetVariants} from '../src/lib/tweet-discovery.js'
import {contentValidity,bankToday} from '../src/pages/tweet-bank/validity.js'
import {ETFS} from '../src/data/etf-cards.js'
import {buildText} from '../src/pages/etf-sheets/lib.js'
import {buildAnniversaireText} from '../src/pages/tweet-midi/engines/anniversaire.js'
import {choose} from './card-selection.mjs'
const base=process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4449/shinny-potato'
const server=process.env.TEST_BASE_URL ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4449'],{stdio:'ignore'})
for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(resolve=>setTimeout(resolve,150))}
const out=process.env.TEST_OUTPUT_DIR ?? 'test-artifacts/editorial-tools-20261108'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH??process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']})
const results=[]
async function download(page,button,img,name){
 await img.waitFor({state:'visible'});await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode())
 const bytes=Buffer.from(await img.evaluate(async i=>{if(i.src.startsWith('data:'))return i.src.split(',')[1];const blob=await(await fetch(i.src)).blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob)})}),'base64')
 const event=page.waitForEvent('download');await button.click();const d=await event;await d.saveAs(`${out}/${name}.png`)
 assert.deepEqual(await readFile(`${out}/${name}.png`),bytes,`${name}: aperçu/export`)
 return {name,png:true,previewIdentical:true}
}
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true})
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000)
  await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copy=text}}})})
  console.log('Bank navigation',width);await page.goto(base+'/banque-tweets?category=Guide%20ETF',{waitUntil:'networkidle'});console.log('Bank loaded',width)
  assert.equal(await page.locator('.tb-tweet').count(),groupTweetVariants(TWEETS).filter(t=>t.category==='Guide ETF').length)
  const guides=TWEETS.filter(t=>curateTweet(t).category==='Guide ETF')
  for(const guide of guides) {
   console.log('Guide',width,guide.id)
   let card=page.locator(`[data-tweet-id="${guide.id}"]`)
   if(!await card.count()) await choose(page.getByRole('group',{name:'Versions : ETF multi-actifs : actions et obligations',exact:true}),guide.id)
   const text=card.getByRole('textbox',{name:'Texte de la publication',exact:true})
   assert.equal(await text.inputValue(),guide.text,String(guide.id))
   assert(await text.evaluate(e=>e.clientHeight>=e.scrollHeight-2))
   const ready=contentValidity(guide,null,bankToday()).ready
   assert.equal(await card.getByRole('button',{name:'📋 Copier',exact:true}).isEnabled(),ready,String(guide.id))
   if(ready){await card.getByRole('button',{name:'📋 Copier',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copy),guide.text)}
   if(guide.image)results.push(await download(page,card.getByRole('link',{name:'Télécharger l’image PNG'}),card.locator('figure img'),`guide-${guide.id}-${width}`))
  }
  // Recheck an unchanged restricted guide, then revoke verification by editing its date/text.
  const card=page.locator('[data-tweet-id="49"]'),source=TWEETS.find(t=>t.id===49).text
  await card.getByLabel('Date de référence',{exact:true}).fill('2026-11-01')
  await card.getByLabel('J’ai vérifié ce texte et sa date de référence.').check()
  await card.getByRole('button',{name:'📋 Copier',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__copy),source+'\n\n📅 Données de référence au 2026-11-01.')
  await card.getByRole('button',{name:"Marquer publié aujourd'hui",exact:true}).click()
  assert.equal(await card.getByLabel('Date de dernière publication',{exact:true}).inputValue(),bankToday())
  await page.reload({waitUntil:'networkidle'})
  assert(await card.getByLabel('J’ai vérifié ce texte et sa date de référence.').isChecked())
  await card.getByLabel('Date de référence',{exact:true}).fill('2026-11-02')
  assert(await card.getByRole('button',{name:'📋 Copier',exact:true}).isDisabled())
  await card.getByLabel('J’ai vérifié ce texte et sa date de référence.').check()
  await card.getByLabel('Texte de la publication').fill(source+'\nBrouillon de recette.')
  assert(await card.getByRole('button',{name:'📋 Copier',exact:true}).isDisabled())
  await card.getByRole('button',{name:'Utiliser la date d’aujourd’hui'}).click()
  await card.getByLabel('J’ai vérifié ce texte et sa date de référence.').check()
  await card.getByRole('button',{name:'Effacer la date',exact:true}).click()
  await card.getByLabel('Date de dernière publication',{exact:true}).fill('2026-10-01')
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await card.getByLabel('Date de dernière publication',{exact:true}).inputValue(),'2026-10-01')
  assert((await card.getByLabel('Texte de la publication').inputValue()).endsWith('Brouillon de recette.'))
  await card.getByRole('button',{name:'Revenir au texte archivé'}).click()
  assert(await card.getByRole('button',{name:'📋 Copier',exact:true}).isDisabled())
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  results.push({width,guides:guides.length,dateInput:true,verification:true,copy:true,publicationTracking:true,persistentDraft:true})
  const yesterday=new Date(Date.parse(bankToday())-86400000).toISOString().slice(0,10)
  await page.evaluate(({yesterday})=>{const key='pc-tweet-bank-drafts-v1';const drafts=JSON.parse(localStorage.getItem(key)||'{}');drafts['10']={text:'Ancien brouillon personnel',asOf:yesterday,checkedAt:yesterday,verifiedAsOf:yesterday,verifiedText:'Ancien brouillon personnel'};localStorage.setItem(key,JSON.stringify(drafts))},{yesterday})
  await page.reload({waitUntil:'networkidle'})
  assert(await page.locator('[data-tweet-id=\"10\"]').getByRole('button',{name:'📋 Copier',exact:true}).isDisabled())
  const sheets=['sp500','msci-world','topix-pea-hedged','support-sp500_ishares','covered-call','lifestrategy60','oblig_eur_long_ishares','new-ie00bskrjz44','technologie'].map(id=>ETFS.find(e=>e.id===id)).filter(Boolean)
  for(const etf of sheets) {
   await page.goto(base+'/fiches-etf?isin='+etf.isin,{waitUntil:'networkidle'})
   const preview=page.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click()
   await page.getByRole('button',{name:/Copier le texte|Copié !/}).click()
   assert.equal(await page.evaluate(()=>window.__copy),buildText(etf))
   await page.getByRole('tab',{name:'Image',exact:true}).click()
   results.push(await download(page,page.getByRole('button',{name:'Télécharger l’image',exact:true}),page.locator('.studio-preview img'),`etf-${etf.id}-${width}`))
   await page.screenshot({path:`${out}/preview-etf-${etf.id}-${width}.png`})
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),etf.id)
  }
  for(const id of ['stockUS49338L1035','apple','msciWorld','etfFR0011550185']) {
   await page.goto(base+'/il-y-a-x-ans?asset='+id,{waitUntil:'networkidle'})
   // Direct legacy asset links use the same selector and financial admission policy.
   const picker=page.locator('#subject-select')
   await choose(picker,id)
   if(id==='stockUS49338L1035')await choose(page.locator('#secondary-select'),'10')
   await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
   const preview=page.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click()
   if(id==='stockUS49338L1035'){await page.getByRole('button',{name:'Copier le texte',exact:true}).click();const copy=await page.evaluate(()=>window.__copy);assert.equal(copy,buildAnniversaireText({assetId:id,yearsBack:10},''))}
   await page.getByRole('tab',{name:'Image',exact:true}).click()
   results.push(await download(page,page.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/}).first(),page.locator('.studio-preview img'),`anniversary-${id}-${width}`))
   await page.screenshot({path:`${out}/preview-anniversary-${id}-${width}.png`})
  }
  assert.deepEqual(errors,[])
  await context.close();console.log('UI',width,'OK');await writeFile(`${out}/results.json`,JSON.stringify(results,null,2))
 }
} finally {await browser.close();server?.kill()}
