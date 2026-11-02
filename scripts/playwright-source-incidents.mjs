import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {choose} from './card-selection.mjs'
import {ETFS} from '../src/data/etf-cards.js'
import {buildText} from '../src/pages/etf-sheets/lib.js'
import {SHEETS} from '../src/pages/factsheet-tweets/data.js'
import {DEFAULT_THEMES} from '../src/data/etf-themes.js'
import {getComparisonComposition} from '../src/pages/etf-tweets/lib/comparisonComposition.js'
const base=process.env.SOURCE_INCIDENTS_BASE??staticBase,out=process.env.SOURCE_INCIDENTS_OUTPUT??'test-artifacts/source-incidents',results=[]
await mkdir(out,{recursive:true})
for(const width of [1440,390]){
 const setup=process.env.SOURCE_INCIDENTS_BASE?await(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport:{width,height:1000}});return{browser,context,page:await context.newPage()}})():await staticBrowser(width)
 const {browser,context,page}=setup,errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 try{
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin})
  const part=async name=>{const b=page.locator('.workspace-view-switch').getByRole('button',{name,exact:true});if(await b.isVisible())await b.click()}
  const download=async(name,expected,label='Télécharger l’image')=>{const[d]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:label,exact:true}).click()]);assert.equal(await d.failure(),null);const path=`${out}/${name}-${width}.png`;await d.saveAs(path);const bytes=await readFile(path);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.deepEqual(bytes,expected);assert(bytes.length>10000);results.push({name,width,bytes:bytes.length});await page.screenshot({path:`${out}/${name}-${width}-page.png`,fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))}
  await page.goto(base+'fiches-etf',{waitUntil:'networkidle'})
  const etf=ETFS.find(e=>e.isin==='IE00B3FH7618')
  await part('Réglages');await choose(page.locator('#es-etf-select'),etf.id);await part('Aperçu')
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  await page.getByRole('button',{name:'📋 Copier le texte',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildText(etf));assert.doesNotMatch(buildText(etf),/104[,.]56.*rendement/i)
  await page.getByRole('tab',{name:'Image',exact:true}).click();const img=page.locator('.publication-image-stage img').first();await img.evaluate(i=>i.decode());const data=await page.evaluate(async src=>{const blob=await(await fetch(src)).blob();return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob)})},await img.getAttribute('src'))
  await page.getByRole('tab',{name:'Texte',exact:true}).click();await download('treasury',Buffer.from(data.split(',')[1],'base64'))
  for(const id of ['euro-govt-maturities','monetaire-obligations-courtes']){
   const theme=DEFAULT_THEMES.find(t=>t.id===id)
   await page.goto(base+'comparatif-etf',{waitUntil:'networkidle'});await part('Réglages');await choose(page.locator('#subject-select'),id)
   await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();await part('Aperçu');await page.getByRole('tab',{name:'Texte',exact:true}).click()
   const text=await page.locator('pre').innerText(),composition=getComparisonComposition('IE00B3FH7618','sectors')
   for(const fund of theme.etfs)assert(text.includes(fund.isin))
   assert.match(text,/% de l’actif net/)
   for(const [,value]of composition.rows)assert(text.includes(value.toLocaleString('fr-FR',{maximumFractionDigits:2})+' %'))
   if(composition.hasNegativeBalance)assert.match(text,/solde négatif de liquidités et dérivés/)
   await page.getByRole('tab',{name:'Image',exact:true}).click();const image=page.locator('.publication-image-stage img').first();await image.evaluate(i=>i.decode())
   const src=await image.getAttribute('src'),bytes=Buffer.from(await page.evaluate(async url=>Array.from(new Uint8Array(await(await fetch(url)).arrayBuffer())),src))
   await page.getByRole('tab',{name:'Texte',exact:true}).click();await download(id,bytes,'Télécharger l’image PNG')
  }
  await page.goto(base+'tweets-factsheets',{waitUntil:'networkidle'})
  for(const id of ['sp-global-dividend-aristocrats','sp-euro-dividend-aristocrats']){
   const change=page.locator('.fs-change-index');if(await change.isVisible()&&await change.getAttribute('aria-expanded')==='false')await change.click()
   await part('Réglages');await choose(page.locator('#factsheet-subject'),id);await part('Aperçu')
   await page.getByRole('tab',{name:'Coulisses des indices',exact:true}).click()
   await page.getByRole('tab',{name:'Texte',exact:true}).click();const text=await page.locator('#factsheet-draft').inputValue();assert(text.includes(SHEETS.find(s=>s.id===id).title));assert.doesNotMatch(text,/undefined|NaN/)
   await page.getByRole('tab',{name:'Image',exact:true}).click();const image=page.locator('.publication-preview img, .publication-preview-stage img, .studio-preview img').first();await image.evaluate(i=>i.decode());const src=await image.getAttribute('src');assert(src.startsWith('data:image/png'))
   await download(id,Buffer.from(src.split(',')[1],'base64'))
  }
  assert.deepEqual(errors,[])
 }finally{await browser.close()}
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log(`${results.length} exact preview/download PNGs verified on desktop and mobile`)
