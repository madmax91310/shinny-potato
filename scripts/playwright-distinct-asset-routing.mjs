import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {DISTINCT_ASSET_SELECTIONS} from '../src/data/distinct-asset-selections.js'
const base='http://127.0.0.1:4398/shinny-potato/',dir='test-artifacts/distinct-assets'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4398'],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message));await mkdir(dir,{recursive:true})
 for(const s of DISTINCT_ASSET_SELECTIONS) {
  await page.goto(base+'fiches-pratiques?fiche='+s.id,{waitUntil:'networkidle'})
  assert((await page.locator('#practical-tweet').inputValue()).includes(s.cloture))
  const images=await page.evaluate(async id=>{
   const {buildSheet}=await import('/shinny-potato/src/pages/practical-sheets/lib.js')
   const {drawSheet}=await import('/shinny-potato/src/pages/practical-sheets/image.js')
   const {DEFAULT_THEMES}=await import('/shinny-potato/src/data/etf-themes.js')
   const {renderComparatifEtfImage}=await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
   const canvas=document.createElement('canvas');drawSheet(canvas,buildSheet(id))
   const comparison=await renderComparatifEtfImage(DEFAULT_THEMES.find(t=>t.id===id))
   return [canvas.toDataURL('image/png'),comparison.toDataURL('image/png')]
  },s.id)
  for(const [i,url] of images.entries()) {assert(url.startsWith('data:image/png;base64,'));await writeFile(`${dir}/${s.id}-${i}.png`,Buffer.from(url.split(',')[1],'base64'))}
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),s.id+' mobile overflow')
  await page.screenshot({path:`${dir}/${s.id}-mobile.png`,fullPage:true})
  await page.setViewportSize({width:1440,height:1000})
 }
 await page.goto(base+'duels-portefeuilles',{waitUntil:'networkidle'})
 for(const id of ['world-cloud-robotics','world-copper-miners']) {
  const png=await page.evaluate(async id=>{
   const {DUELS}=await import('/shinny-potato/src/pages/portfolio-duels/data.js')
   const {buildDuel}=await import('/shinny-potato/src/pages/portfolio-duels/lib.js')
   const {renderDuelImage}=await import('/shinny-potato/src/pages/portfolio-duels/canvasImage.js')
   return await renderDuelImage(buildDuel(DUELS.find(d=>d.id===id)))
  },id)
  await writeFile(`${dir}/${id}.png`,Buffer.from(png.split(',')[1],'base64'))
 }
 assert.deepEqual(errors,[])
 console.log('7 practical sheets, 7 comparison PNGs, 2 duel PNGs and mobile layouts verified.')
}finally{await browser?.close();server.kill()}
