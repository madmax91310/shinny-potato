import assert from 'node:assert/strict'
import fs from 'node:fs'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {getComparatifEtfText} from '../src/pages/tweet-midi/data/comparatifEtf.js'
import {buildTweet as buildBrokerPost} from '../src/pages/broker-comparator/data.js'
import {choose}from './card-selection.mjs'
const out='test-artifacts/data-review-recovery';fs.mkdirSync(out,{recursive:true})
const report=JSON.parse(fs.readFileSync('dist/data/financial-reconciliation.json'))
const source=JSON.parse(fs.readFileSync('src/data/automated-practical-sheets.json'))
const series=JSON.parse(fs.readFileSync('data/ai-portfolios/series/94.json'))['IE00B4L5Y983-ETFP']
const latest=Object.keys(series.points).sort().at(-1)
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4397','--strictPort'],{stdio:'ignore'})
const base='http://127.0.0.1:4397/shinny-potato';let browser
try{
 let ready=false;const deadline=Date.now()+30000
 while(Date.now()<deadline){
  if(server.exitCode!==null)throw Error(`Preview exited ${server.exitCode}`)
  try{if((await fetch(base+'/',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break}}catch{}
  await new Promise(r=>setTimeout(r,100))
 }
 assert(ready,'Preview did not become available within 30 seconds')
 browser=await chromium.launch({headless:true})
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/automation-status/automation-status.json',r=>r.fulfill({json:{schemaVersion:1,workflows:{}}}))
 await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'})
 const section=page.getByRole('region',{name:'Écarts financiers à expliquer'})
 await section.getByRole('heading',{name:`${report.summary.open} écarts financiers encore inexpliqués`}).waitFor()
 await section.locator('summary').click()
 await section.getByRole('textbox',{name:'Rechercher un écart financier'}).fill('GB00B15KXQ89')
 assert.equal(await section.locator('article').count(),report.rows.filter(r=>r.open&&r.isin==='GB00B15KXQ89').length)
 const pending=page.waitForEvent('download');await section.getByRole('link',{name:`Télécharger les ${report.summary.total} comparaisons (JSON)`}).click()
 const file=await pending;await file.saveAs(out+'/financial-reconciliation.json');assert.deepEqual(JSON.parse(fs.readFileSync(out+'/financial-reconciliation.json')),report)
 if(report.summary.correctedWithResidual){
  const residual=report.rows.find(r=>r.residualOpen)
  await section.getByRole('textbox',{name:'Rechercher un écart financier'}).fill(residual.isin)
  assert((await section.innerText()).includes(residual.reason),'The proved correction and remaining residual must reach the real review screen')
 }
 await page.screenshot({path:out+'/review-desktop.png',fullPage:true})
 let pngCount=0
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900})
  for(const id of ['gold-physical','gold-av-cto']){
   await page.goto(`${base}/fiches-pratiques?fiche=${id}`,{waitUntil:'networkidle'})
   await page.locator('canvas').waitFor({state:'attached'})
   if(!source.sources.gold.reviewRequired)assert.equal(await page.locator('.practical-warning').count(),0)
   assert((await page.locator('#practical-tweet').inputValue()).length>100)
   const download=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
   const png=await download;await png.saveAs(`${out}/${id}-${width}.png`)
   assert.equal(fs.readFileSync(`${out}/${id}-${width}.png`).subarray(1,4).toString(),'PNG');pngCount++
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  }
 }
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900})
  await page.goto(base+'/comparatif-courtiers',{waitUntil:'networkidle'})
  await page.locator('.bc-duel-chip').filter({hasText:'TR vs IBKR'}).click()
  await page.waitForFunction(expected=>document.querySelector('.bc-tweet-textarea')?.value===expected,buildBrokerPost(['tr','ibkr']))
  assert.equal(await page.locator('.bc-evidence-broker').count(),2)
  const brokerDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
  await (await brokerDownload).saveAs(`${out}/ibkr-${width}.png`);pngCount++
  await page.goto(base+'/le-dca-de?isin=IE00BK5BQT80',{waitUntil:'networkidle'})
  await page.getByRole('searchbox',{name:'Ajouter un actif'}).fill('IE00BFMXXD54')
  await page.getByRole('button',{name:/IE00BFMXXD54/}).click()
  const weights=page.getByRole('spinbutton');await weights.nth(0).fill('50');await weights.nth(1).fill('50')
  await page.getByAltText('Répartition et expositions du portefeuille').waitFor()
  const dcaDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  await (await dcaDownload).saveAs(`${out}/dca-${width}.png`);pngCount++
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
 }
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900})
  await page.goto(base+'/presentations?famille=private-equity',{waitUntil:'networkidle'})
  await page.getByRole('group',{name:'Choisir un acteur',exact:true}).getByRole('button',{name:'Tudigo',exact:true}).click()
  await page.getByText('Activité cessée. Jugement de liquidation du', {exact:false}).waitFor({state:'attached'})
  await page.getByRole('heading',{name:'Archive des conditions antérieures — aucune nouvelle offre',exact:true}).waitFor({state:'attached'})
  const preview=page.getByRole('button',{name:'Aperçu',exact:true})
  if(await preview.isVisible())await preview.click()
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  const text=await page.locator('#actor-draft').inputValue()
  assert(text.includes('cessé son activité')&&text.includes('12/10/2026'))
  assert(!text.includes('Souscription :')&&!text.includes('Pour commencer'))
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.getByRole('img',{name:'Visuel de Tudigo',exact:true}).waitFor({state:'attached'})
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()
  await (await download).saveAs(`${out}/tudigo-cessation-${width}.png`);pngCount++
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
 }
 for(const name of fs.readdirSync(out).filter(n=>n.endsWith('.png'))){
  const bytes=fs.readFileSync(`${out}/${name}`);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert(bytes.length>30000)
 }
 const sectors=JSON.parse(fs.readFileSync('src/data/automated-etf.json'))['IE00B5BMR087'].sectors
 assert.equal(sectors.basis??'fund','fund')
 const comparison=getComparatifEtfText('sp500-equal-weight')
 const weight=Math.max(...sectors.rows.map(r=>r.weightPct)).toLocaleString('fr-FR',{maximumFractionDigits:2})
 const sectorDate=sectors.asOf.split('-').reverse().join('/')
 assert(comparison.includes(weight)&&comparison.includes(sectorDate))
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900})
  await page.goto(base+'/comparatif-etf?subject=sp500-equal-weight',{waitUntil:'networkidle'})
  await page.waitForFunction(({weight,date})=>{const text=document.querySelector('.tool-preview')?.innerText;return text?.includes(weight)&&text.includes(date)},{weight,date:sectorDate})
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
  await(await pending).saveAs(`${out}/sp500-sectors-${width}.png`);pngCount++
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
 }
 const details=await(await page.request.get(base+'/data/ai-portfolios/details/94.json')).json()
 assert.equal(details['IE00B4L5Y983-ETFP'].status.ok,true)
 assert.equal(details['IE00B4L5Y983-ETFP'].status.asOf,latest)
 const published=await(await page.request.get(base+'/data/ai-portfolios/series/94.json')).json()
 assert.deepEqual(published['IE00B4L5Y983-ETFP'].points,series.points)
 await page.setViewportSize({width:1280,height:900})
 await page.goto(base+'/calculateur-investissement?asset=etfGB00B15KXQ89',{waitUntil:'networkidle'})
 const editor=page.getByRole('button',{name:'Éditeur',exact:true});if(await editor.isVisible())await editor.click()
 await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2018')
 await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),'12')
 await page.getByRole('alert').filter({hasText:'rapprochement financier non résolu'}).waitFor()
 assert.equal(await page.getByRole('button',{name:'📊 Télécharger une image',exact:true}).count(),0)
 assert.equal(await page.getByRole('img',{name:'Graphique du placement',exact:true}).count(),0)
 await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2026')
 await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),'1')
 assert.equal(await page.getByRole('alert').count(),0)
 const recovered=page.waitForEvent('download');await page.getByRole('button',{name:'📊 Télécharger une image',exact:true}).click()
 await(await recovered).saveAs(`${out}/copper-compatible-2026.png`);pngCount++
 assert.deepEqual(errors,[])
 console.log(`Recovery UI: original financial cases downloadable, two reviewed gold sheets, ${pngCount} actual PNGs (gold, IBKR, DCA, ETF sectors, Tudigo cessation) on mobile/desktop; SWDA ${latest} is reachable through its actual public consumer.`)
}finally{await browser?.close();server.kill()}
