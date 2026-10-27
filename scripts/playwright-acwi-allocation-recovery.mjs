import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import {chromium} from 'playwright'
import {references}from'../src/pages/dca-profiles/records.js'
import {equityChartObservations}from'./equity-chart-observations.mjs'
const isin='IE00B6R52259',source=JSON.parse(await fs.readFile('src/data/automated-etf.json','utf8'))[isin]
const complete=JSON.parse(await fs.readFile('src/data/dca-complete-holdings.json','utf8'))[isin]
const equityCharts=equityChartObservations(complete)
const reference=Object.values(references).find(r=>r.isin===isin)
for(const field of ['countries','sectors']){
 assert(source[field].rows.length>5)
 if(source[field].unidentifiedSecurityCount>0)assert.equal(source[field].overlapQualified,false)
 assert(Math.abs(source[field].rows.reduce((n,r)=>n+r.weightPct,0)-source[field].portfolioWeightPct)<1e-5)
 // A newer qualified equity-holdings snapshot has its own date and scope.
 // It must not be forced back to the older all-position NAV observation.
 const expected=equityCharts?.[field]??source[field]
 assert.equal(reference[field].asOf,expected.asOf)
 if(equityCharts){assert.equal(reference[field].compatibility,expected.compatibility);assert.deepEqual(reference[field].rows,expected.rows)}
}
const port=4398,base=process.env.TEST_BASE_URL??`http://127.0.0.1:${port}/shinny-potato`,out=process.env.TEST_OUTPUT_DIR??'test-artifacts/acwi-allocation'
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try{
 await fs.mkdir(out,{recursive:true})
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  async function png(button,name){const pending=page.waitForEvent('download');await button.click();const d=await pending;await d.saveAs(`${out}/${name}-${width}.png`);const bytes=await fs.readFile(`${out}/${name}-${width}.png`);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(bytes.length>10000)}
  await page.goto(`${base}/fiches-etf?isin=${isin}`,{waitUntil:'networkidle'})
  const preview=page.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click()
  assert((await page.locator('.es-card').innerText()).includes(isin))
  await png(page.getByRole('button',{name:'Télécharger l’image',exact:true}),'factsheet')
  await page.goto(`${base}/le-dca-de?isin=${isin}`,{waitUntil:'networkidle'})
  await page.getByAltText('Répartition et expositions du portefeuille').waitFor()
  await png(page.getByRole('button',{name:'Télécharger le PNG',exact:true}),'exposures')
  await page.getByText('Voir l’analyse détaillée',{exact:true}).click();await page.getByText('Tous les pays et secteurs',{exact:true}).click()
  const detail=await page.locator('.dca-exposure-detail').innerText();assert(/États-Unis|United States/.test(detail));assert(/Technolog|Information Technology/.test(detail));assert(!/NaN|undefined/.test(detail))
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  assert.deepEqual(errors,[]);await page.close()
 }
 console.log('ACWI: selected allocation dates/scopes, factsheet and exposure PNGs verified on desktop/mobile; incomplete identity coverage remains unqualified.')
}finally{await browser?.close();server?.kill()}
