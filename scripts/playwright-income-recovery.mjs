import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import SOURCES from './new-distributing-nav-sources.json' with {type:'json'}
import {performanceBasis,getAnnualReturnStartYears} from '../src/pages/tweet-midi/data/performanceHistory.js'
const remote=process.argv.find(a=>a.startsWith('--base='))?.slice(7),base=remote??'http://127.0.0.1:4429/shinny-potato/'
const out=remote?'/tmp/nav-recovery-public-browser':'test-artifacts/income-recovery'
const server=remote?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4429'],{stdio:'ignore'})
let browser;const exports=[],errors=[]
async function part(page,name){const b=page.locator('.workspace-view-switch').getByRole('button',{name,exact:true});if(await b.isVisible())await b.click()}
async function tab(page,name){const b=page.getByRole('tab',{name,exact:true});if(await b.isVisible())await b.click()}
async function preview(page){await tab(page,'Image');const i=page.locator('.publication-image-stage img').first();await i.waitFor();await i.evaluate(i=>i.decode());return page.evaluate(async src=>{const b=await(await fetch(src)).blob();return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(b)})},await i.getAttribute('src'))}
async function png(page,button,name,expected){const[d]=await Promise.all([page.waitForEvent('download'),button.click()]);await d.saveAs(`${out}/${name}.png`);const b=await readFile(`${out}/${name}.png`);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.deepEqual(b,Buffer.from(expected.split(',')[1],'base64'));exports.push({name,bytes:b.length});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name)}
try{
 await mkdir(out,{recursive:true})
 if(server){
  let ready=false
  for(let n=0;n<120;n++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,250))}
  assert(ready,'Preview server did not start')
 }
 browser=await chromium.launch({headless:true,args:['--no-sandbox']})
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{window.__incomeLabels=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/undefined|NaN/.test(String(text)))throw new Error('Invalid canvas label: '+text);window.__incomeLabels.push(String(text));return fill.call(this,text,...args)}})
  for(const source of SOURCES){
   await page.goto(base+'calculateur-investissement?asset='+source.id,{waitUntil:'networkidle'})
   assert.equal(await page.getByRole('group',{name:'Choisir un actif',exact:true}).getAttribute('data-value'),source.id)
   await part(page,'Réglages')
   const picker=page.getByRole('group',{name:'Choisir un actif',exact:true})
   const modifier=picker.getByRole('button',{name:'Modifier',exact:true})
   if(await modifier.count() && await modifier.getAttribute('aria-expanded')==='false')await modifier.click()
   await picker.getByRole('searchbox').fill(source.isin)
   assert(await picker.locator(`[data-option][data-value="${source.id}"]`).count(),`${source.isin}: exact NAV lane searchable`)
   await choose(picker,source.id)
   await part(page,'Aperçu');await png(page,page.getByRole('button',{name:'📊 Télécharger une image',exact:true}),`${source.isin}-calculator-${width}`,await preview(page))
   await page.goto(base+'performance-depuis?asset='+source.id,{waitUntil:'networkidle'});assert.equal(await page.locator('#subject-select').getAttribute('data-value'),source.id)
   const year=[...getAnnualReturnStartYears(source.id)].sort((a,b)=>a-b).at(-1);assert(year)
   await choose(page.locator('#secondary-select'),String(year));await page.getByRole('group',{name:'Devise des performances',exact:true}).getByRole('button',{name:'Devise d’origine',exact:true}).click()
   await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();await part(page,'Aperçu');await tab(page,'Texte');assert((await page.locator('pre').innerText()).includes(performanceBasis(source.id)))
   await png(page,page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}),`${source.isin}-performance-${width}`,await preview(page))
   await page.goto(base+'tweet-midi',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Il y a X ans',exact:true}).click();await choose(page.locator('#subject-select'),source.id);await choose(page.locator('#secondary-select'),'1')
   await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();await part(page,'Aperçu');await tab(page,'Texte');const text=await page.locator('pre').innerText();assert(text.includes('Valeur liquidative'));assert(!/NaN|undefined/.test(text))
   await png(page,page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}),`${source.isin}-anniversary-${width}`,await preview(page))
  }
  await page.screenshot({path:`${out}/last-anniversary-${width}-page.png`,fullPage:true});await page.close()
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/results.json`,JSON.stringify({base,widths:[1440,390],exports,errors},null,2));console.log(`Income NAV recovery: ${SOURCES.length} exact shares, desktop/mobile, ${exports.length} actual PNG downloads identical to previews; native performance and raw-NAV anniversary conventions retained.`)
}finally{await browser?.close();server?.kill()}
