import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {choose} from './card-selection.mjs'
const base='http://127.0.0.1:4344/shinny-potato'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4344'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']})
 await mkdir('test-artifacts/roadmap-34',{recursive:true})
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  for(const [isin,id]of [['DE000A0H08F7','etfEuropeConstruction'],['IE00B3F81G20','etfEmSmallCap'],['IE0003Z9E2Y3','etfCopperMiners']]){
   await page.goto(`${base}/performance-depuis?isin=${isin}`,{waitUntil:'networkidle'})
   assert.equal(await page.locator('#subject-select').getAttribute('data-value'),id)
   const button=page.locator('.workspace-view-switch').getByRole('button',{name:'Aperçu',exact:true})
   if(await button.isVisible())await button.click()
   assert(!/undefined|NaN/.test(await page.locator('pre').textContent()))
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
   await page.screenshot({path:`test-artifacts/roadmap-34/${id}-${width}.png`})
  }
  await page.goto(`${base}/fiches-etf`,{waitUntil:'networkidle'})
  await choose(page.locator('#es-etf-select'),'europe-construction')
  const link=page.getByRole('link',{name:'Voir sa performance',exact:true});assert((await link.getAttribute('href')).includes('DE000A0H08F7'))
  const images=await page.evaluate(async()=>{
   const {ETFS}=await import('/shinny-potato/src/data/etf-cards.js')
   const {DEFAULT_THEMES}=await import('/shinny-potato/src/data/etf-themes.js')
   const {DUELS}=await import('/shinny-potato/src/pages/portfolio-duels/data.js')
   const {buildDuel}=await import('/shinny-potato/src/pages/portfolio-duels/lib.js')
   const {renderDuelImage}=await import('/shinny-potato/src/pages/portfolio-duels/canvasImage.js')
   const {renderETFImage}=await import('/shinny-potato/src/pages/etf-sheets/canvasImage.js')
   const {renderComparatifEtfImage}=await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
   const sheet=await renderETFImage(ETFS.find(r=>r.id==='europe-construction'))
   const comparison=await renderComparatifEtfImage(DEFAULT_THEMES.find(r=>r.id==='construction-infrastructures'))
   const duels=await Promise.all(DUELS.filter(d=>['construction-infrastructure','world-em-smallcap','world-copper-miners'].includes(d.id)).map(d=>renderDuelImage(buildDuel(d))))
   return [sheet,comparison,...duels].map(c=>({width:c.width,height:c.height,url:c.toDataURL('image/png')}))
  })
  for(const [i,r]of images.entries()){assert(r.width>=1000&&r.height>=1000);await writeFile(`test-artifacts/roadmap-34/export-${i}-${width}.png`,Buffer.from(r.url.split(',')[1],'base64'))}
  assert.deepEqual(errors,[]);await page.close()
 }
 console.log('Roadmap 3–4: three historical tools at mobile/desktop widths, construction sheet and comparison PNG exports passed.')
}finally{await browser?.close();server.kill()}
