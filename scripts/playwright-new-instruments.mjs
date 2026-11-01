import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import IDENTITIES from '../src/data/new-instrument-identities.json' with {type:'json'}
import SOURCES from './new-instrument-nav-sources.json' with {type:'json'}
import COMPARISONS from '../src/data/new-instrument-comparisons.json' with {type:'json'}
import {ASSETS as CALCULATOR_ASSETS} from '../src/data/calculator-history.js'
import {ETFS} from '../src/data/etf-cards.js'
import {getInstrumentListings} from '../src/data/instrument-listings.js'
import {buildText} from '../src/pages/etf-sheets/lib.js'
import {QUALIFIED_FUND_CALENDARS} from '../src/data/qualified-annual-calendars.js'
import {ASSETS as PERFORMANCE} from '../src/pages/tweet-midi/data/performanceHistory.js'
const port=4401,base=`http://127.0.0.1:${port}/shinny-potato/`,out='test-artifacts/new-instruments'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser;const results=[],errors=[]
async function part(page,name){const b=page.locator('.workspace-view-switch').getByRole('button',{name,exact:true});if(await b.isVisible())await b.click()}
async function tab(page,name){const b=page.getByRole('tab',{name,exact:true});if(await b.isVisible())await b.click()}
async function search(picker,query){const b=picker.getByRole('button',{name:'Modifier',exact:true});if(await b.count()&&await b.getAttribute('aria-expanded')==='false')await b.click();await picker.getByRole('searchbox').fill(query)}
async function layout(page,label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label)}
async function png(page,button,name,preview){
 const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);await download.saveAs(`${out}/${name}.png`)
 const bytes=await readFile(`${out}/${name}.png`);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(bytes.readUInt32BE(16)>=1000&&bytes.readUInt32BE(20)>=500)
 if(preview)assert.deepEqual(bytes,Buffer.from(preview.split(',')[1],'base64'),name+': preview and download use the same result')
 results.push({name,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length,previewCompared:!!preview})
}
async function preview(page){await tab(page,'Image');const image=page.locator('.publication-image-stage img').first();await image.waitFor();await image.evaluate(img=>img.decode());return page.evaluate(async src=>{const blob=await(await fetch(src)).blob();return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob)})},await image.getAttribute('src'))}
try{
 await mkdir(out,{recursive:true});for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']})
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{window.__paint=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){if(this.canvas.width>=1000){const m=this.measureText(value);if(x-m.actualBoundingBoxLeft < -1||x+m.actualBoundingBoxRight>this.canvas.width+1||y-m.actualBoundingBoxAscent < -1||y+m.actualBoundingBoxDescent>this.canvas.height+1)throw new Error('Clipped image text: '+value);window.__paint.push(String(value))}return fill.call(this,value,x,y,...rest)}})
  await page.goto(base+'fiches-etf',{waitUntil:'networkidle'})
  for(const identity of [...IDENTITIES,...['IE00B4L5Y983','IE00B5BMR087'].map(isin=>ETFS.find(e=>e.isin===isin))]){
   const etf=ETFS.find(e=>e.isin===identity.isin),picker=page.locator('#es-etf-select');await part(page,'Réglages')
   for(const query of [etf.name,etf.isin,...new Set(getInstrumentListings(etf.isin).map(l=>l.ticker))]){await search(picker,query);assert(await picker.locator(`[data-option][data-value="${etf.id}"]`).count(),query)}
   await choose(picker,etf.id);await part(page,'Aperçu');await tab(page,'Texte');assert((await page.locator('.es-card').innerText()).includes(etf.isin))
   await page.getByRole('button',{name:'📋 Copier le texte',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildText(etf))
   const image=await preview(page);await tab(page,'Texte');await png(page,page.getByRole('button',{name:'Télécharger l’image',exact:true}),`${etf.isin}-sheet-${width}`,image)
   await layout(page,etf.isin+' sheet '+width)
   if(['IE00BSKRJX20','IE00BZ6V7883'].includes(etf.isin))await page.screenshot({path:`${out}/${etf.isin}-${width}-page.png`,fullPage:true})
  }
  for(const c of COMPARISONS){
   await page.goto(base+'comparatif-etf',{waitUntil:'networkidle'});await part(page,'Réglages');const picker=page.locator('#subject-select');await search(picker,c.nom);await choose(picker,c.id);await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();await part(page,'Aperçu');await tab(page,'Texte');await page.waitForFunction(note=>document.querySelector('pre')?.textContent.includes(note),c.cloture)
   const text=await page.locator('pre').innerText();for(const isin of c.funds)assert(text.includes(isin));const image=await preview(page);await tab(page,'Texte');await png(page,page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}),`${c.id}-${width}`,image);await layout(page,c.id)
  }
  for(const s of SOURCES){
   await page.goto(base+'calculateur-investissement?asset='+s.id,{waitUntil:'networkidle'});const picker=page.getByRole('group',{name:'Choisir un actif',exact:true});assert.equal(await picker.getAttribute('data-value'),s.id);
   if(IDENTITIES.find(f=>f.isin===s.isin)?.assetClass==='Fixed Income'){
    await part(page,'Réglages');await search(picker,s.isin);await picker.getByRole('button',{name:'Parcourir',exact:true}).click();await picker.getByRole('button',{name:'Obligations et monétaire',exact:true}).click();assert(await picker.locator(`[data-option][data-value="${s.id}"]`).count(),s.id+': fixed income classification');assert.equal(await picker.getAttribute('data-value'),s.id)
   }
   await part(page,'Aperçu');await png(page,page.getByRole('button',{name:'📊 Télécharger une image',exact:true}),`${s.id}-calculator-${width}`,await preview(page));await layout(page,s.id+' calculator')
   await page.goto(base+'tweet-midi',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Il y a X ans',exact:true}).click();await choose(page.locator('#subject-select'),s.id);await choose(page.locator('#secondary-select'),'1');await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();await part(page,'Aperçu');await tab(page,'Texte');assert((await page.locator('pre').innerText()).includes('Valeur liquidative'));await png(page,page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}),`${s.id}-anniversary-${width}`,await preview(page));await layout(page,s.id+' anniversary')
  }
  for(const {isin} of IDENTITIES){
   const asset=Object.values(PERFORMANCE).find(a=>a.isin===isin),year=Object.keys(QUALIFIED_FUND_CALENDARS[isin].years).sort().at(-1)
   await page.goto(base+'performance-depuis?asset='+asset.id,{waitUntil:'networkidle'});assert.equal(await page.locator('#subject-select').getAttribute('data-value'),asset.id);await choose(page.locator('#secondary-select'),year);await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();await part(page,'Aperçu');await tab(page,'Texte');assert((await page.locator('pre').innerText()).includes('VL'));await png(page,page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}),`${isin}-performance-${width}`,await preview(page));await layout(page,isin+' performance')
  }
  const annualOnly = IDENTITIES.find(f => !Object.values(CALCULATOR_ASSETS).some(a => a.isin === f.isin))
  if(annualOnly){
   await page.goto(base+'calculateur-investissement?asset=annual-'+annualOnly.isin,{waitUntil:'networkidle'})
   assert((await page.getByRole('alert').innerText()).includes('Aucun autre actif n’a été substitué'))
   assert.equal(await page.getByRole('button',{name:'📊 Télécharger une image',exact:true}).count(),0)
  }
  await page.goto(base+'bibliotheque-donnees?q=IE00BZ6V7883&id=IE00BZ6V7883',{waitUntil:'networkidle'});const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Exporter la fiche JSON',exact:true}).click()]);await download.saveAs(`${out}/MBS-${width}.json`);const record=JSON.parse(await readFile(`${out}/MBS-${width}.json`,'utf8'));assert.equal(record.id,'IE00BZ6V7883');assert(record.fields.find(f=>f.label==='Identité').metadata.sourceUrls.length);await layout(page,'library')
  await context.close()
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2));console.log(`${IDENTITIES.length} new ISINs, desktop/mobile; ${results.length} real PNG downloads, text/copy, source JSON, search, 6 comparisons, monthly calculator and separately labelled NAV anniversary exports verified.`)
}finally{await browser?.close();server.kill('SIGTERM')}
