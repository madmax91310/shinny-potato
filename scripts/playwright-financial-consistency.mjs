import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { staticBrowser, staticBase } from './static-browser.mjs'
import { choose } from './card-selection.mjs'
import { derive, fmtEUR, buildTweetText } from '../src/pages/investment-calculator/lib.js'
import { computeComparison, buildComparisonTweet } from '../src/pages/investment-calculator/comparison.js'
import { ASSETS as portfolioAssets } from '../src/data/portfolio-assets.js'
import { computeYearlyPerf, formatPerformance, performanceYears } from '../src/pages/portfolio-generator/performance.js'
import { buildCustomDuel, buildTweet as buildDuelTweet } from '../src/pages/portfolio-duels/lib.js'
const base=process.env.FINANCE_PUBLIC_BASE??staticBase,out=process.env.FINANCE_BROWSER_OUTPUT??'test-artifacts/financial-consistency'
await mkdir(out,{recursive:true})
const proof=[]
for(const width of [1440,390]){
 const setup=process.env.FINANCE_PUBLIC_BASE?await (async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport:{width,height:1000}});return{browser,context,page:await context.newPage()}})():await staticBrowser(width)
 const {browser,context,page}=setup,errors=[]
 try{
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin})
  await page.addInitScript(()=>{window.__paint=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.__paint.push(String(value));return fill.call(this,value,...args)}})
  page.on('pageerror',e=>errors.push(e.message))
  const part=async name=>{const b=page.locator('.workspace-view-switch').getByRole('button',{name,exact:true});if(await b.isVisible())await b.click()}
  const download=async(button,name)=>{const [file]=await Promise.all([page.waitForEvent('download'),button.click()]);await file.saveAs(`${out}/${name}`);assert.equal(await file.failure(),null);const bytes=await readFile(`${out}/${name}`);assert(bytes.length>10000);return bytes}
  await page.goto(base+'calculateur-investissement?asset=bitcoin')
  await page.locator('.ic-hero-number').waitFor({state:'attached'})
  await part('Réglages')
  await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),'12')
  await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2020')
  await page.getByRole('button',{name:'Mensuel (DCA)',exact:true}).first().click()
  const amount=page.locator('input[type="number"]').filter({visible:true})
  // Inputs have stable semantics; the amount is the last numeric field in settings.
  await amount.last().fill('100')
  const details=page.locator('details').filter({hasText:'Actualiser le prix'})
  if(await details.count()&&!await details.evaluate(el=>el.open))await details.locator('summary').click()
  await page.getByPlaceholder(/Prix à jour/).fill('100000')
  await part('Aperçu')
  const state={assetId:'bitcoin',startYear:2020,startMonth:12,amountRaw:'100',mode:'dca',currency:'native',overridePriceRaw:'100000'}
  const d=derive(state),expected=fmtEUR(d.result.finalValue,d.currency)
  assert.equal(await page.locator('.ic-hero-number').innerText(),expected)
  await page.getByRole('button',{name:'𝕏 Copier le texte du post',exact:true}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildTweetText(state,d))
  const png=await download(page.getByRole('button',{name:'📊 Télécharger une image',exact:true}),`bitcoin-dca-${width}.png`)
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
  assert((await page.evaluate(()=>window.__paint)).includes(expected),'PNG draws the same final amount')
  await page.getByRole('button',{name:'Comparatif',exact:true}).click()
  await choose(page.getByRole('group',{name:'Actif vidéo 2',exact:true}),'bitcoin')
  const fields=page.locator('.ic-video-comparative-fields .ic-row2 > div')
  await fields.nth(0).getByRole('button',{name:'Versement unique',exact:true}).click()
  await fields.nth(1).getByRole('button',{name:'Mensuel (DCA)',exact:true}).click()
  const comparison=computeComparison({amount:100,startYm:d.startYm,endYm:d.endYm,mode:'dca',currency:'native',overrideAssetId:'bitcoin',overridePriceRaw:'100000'},'bitcoin','bitcoin','lump','dca')
  const text=buildComparisonTweet(comparison)
  await page.waitForFunction(t=>document.querySelector('#ic-comparison-text')?.value===t,text)
  await page.getByRole('button',{name:'𝕏 Copier le texte du comparatif',exact:true}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),text)
  await page.screenshot({path:`${out}/same-asset-${width}.png`,fullPage:true})
  await writeFile(`${out}/same-asset-${width}.txt`,text)
  // Exercise the video consumer of the same comparison result at desktop size.
  if(width===1440){
   await page.evaluate(()=>{window.__paint=[]})
   await page.getByRole('button',{name:'🎬 Générer la vidéo',exact:true}).click()
   const save=page.getByRole('button',{name:'⬇️ Télécharger (.webm)',exact:true});await save.waitFor({timeout:60000})
   const paint=await page.evaluate(()=>window.__paint)
   for(const s of comparison.sides)assert(paint.includes(fmtEUR(s.result.finalValue,s.asset.currency)),'Video final amount')
   await download(save,'same-asset.webm')
  }
  await page.goto(base+'calculateur-investissement?asset=etfFR0011871128')
  await page.locator('.ic-hero-number').waitFor({state:'attached'});await part('Aperçu')
  assert.match(await page.locator('.ic-method-note').innerText(),/Valeurs liquidatives, revenus réinvestis, frais du fonds inclus/)
  assert.doesNotMatch(await page.locator('.ic-method-note').innerText(),/Cours ajustés de l’ETF/)
  await page.getByRole('button',{name:'𝕏 Copier le texte du post',exact:true}).click()
  assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Valeurs liquidatives, revenus réinvestis/)
  await download(page.getByRole('button',{name:'📊 Télécharger une image',exact:true}),`nav-calculator-${width}.png`)
  await page.goto(base+'performance-depuis?asset=etfFR0011871128')
  await page.locator('pre').waitFor({state:'attached'});await part('Aperçu')
  assert.match(await page.locator('pre').innerText(),/valeur liquidative · revenus réinvestis/)
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  const img=page.locator('.publication-image-stage img');await img.waitFor()
  await page.waitForFunction(()=>document.querySelector('.publication-image-stage img')?.complete)
  const preview=Buffer.from(await img.evaluate(async el=>{const blob=await fetch(el.src).then(r=>r.blob());return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob)})}),'base64')
  const image=await download(page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}),`nav-performance-${width}.png`)
  assert.deepEqual(image,preview)
  // Real qualified EUR allocation that previously displayed 6.4% for an exact
  // 6.45% weighted return. Expectations move with the canonical observations.
  const lines=[{id:'europe-retail',pct:25},{id:'europe-construction',pct:20},{id:'euro-ultrashort-ishares',pct:55}]
  const selection=lines.map(row=>({...portfolioAssets.find(a=>a.id===row.id),pct:row.pct})),perf=computeYearlyPerf(selection)
  const year=performanceYears(perf).includes(2024)?2024:performanceYears(perf).at(-1),number=formatPerformance(perf[year])
  await page.goto(base+'generateur-portefeuilles');await part('Réglages')
  await page.getByRole('button',{name:/Composition manuelle/}).click()
  for(const row of selection){
   await page.locator('.pg-manual-search').fill(row.isin)
   await page.locator(`.pg-manual-available [data-option][data-asset-id="${row.id}"]`).click()
   await page.locator('.pg-manual-pct-input').last().fill(String(row.pct))
  }
  await page.evaluate(()=>{window.__paint=[]})
  await page.getByRole('button',{name:'Générer le tweet',exact:true}).click();await part('Aperçu')
  const generatorText=await page.locator('.pg-tweet-body').innerText();assert(generatorText.includes(`${year} : ${number}`))
  await page.getByRole('button',{name:'📋 Copier le texte',exact:true}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),generatorText)
  await page.waitForFunction(n=>window.__paint.some(t=>t.endsWith(n)),number)
  await download(page.getByRole('link',{name:'⬇️ Télécharger l’image PNG',exact:true}),`weighted-generator-${width}.png`)
  assert((await page.evaluate(()=>window.__paint)).some(t=>t.endsWith(number)))
  await page.goto(base+'duels-portefeuilles?asset=euro-ultrashort-ishares');await part('Réglages')
  for(let i=1;i<lines.length;i++)await page.getByRole('button',{name:'Ajouter un actif à A',exact:true}).click()
  for(const [i,row] of lines.entries()){
   await choose(page.getByRole('group',{name:`Actif ${i+1} du portefeuille A`,exact:true}),row.id)
   await page.getByRole('spinbutton',{name:`Poids actif ${i+1} du portefeuille A`,exact:true}).fill(String(row.pct))
  }
  await part('Aperçu')
  const expectedDuel=buildCustomDuel({left:lines,right:[{id:'msci_world_ishares',pct:100}]})
  assert.equal(await page.locator('#pd-tweet').inputValue(),buildDuelTweet(expectedDuel))
  await page.getByRole('button',{name:'📋 Copier le texte',exact:true}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildDuelTweet(expectedDuel))
  await download(page.getByRole('button',{name:'🖼️ Télécharger l’image PNG',exact:true}),`weighted-duel-${width}.png`)
  assert((await page.evaluate(()=>window.__paint)).some(t=>t.endsWith(number)))
  assert.deepEqual(errors,[])
  proof.push({width,base,start:d.startYm,end:d.endYm,final:d.result.finalValue,comparison:comparison.sides.map(s=>({mode:s.mode,final:s.result.finalValue,override:s.override})),weighted:{year,return:perf[year],display:number},pngPreviewMatches:true,errors})
 }finally{await browser.close()}
}
await writeFile(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n')
console.log('Financial browser: desktop/mobile same-asset modes, overrides, display/copy/PNG and video amounts, NAV method and preview/download equality passed.')
