import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
// Vite transforms the exact shared export modules for execution in Chromium.
const port=4343, base=`http://127.0.0.1:${port}/shinny-potato`
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++) {
  try {if((await fetch(base+'/')).ok)break}catch{}
  await new Promise(r=>setTimeout(r,100))
 }
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:1280,height:900}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(base+'/',{waitUntil:'networkidle'})
 const results=await page.evaluate(async()=>{
  const {DEFAULT_THEMES}=await import('/shinny-potato/src/data/etf-themes.js')
  const {renderComparatifEtfImage}=await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
  const output=[]
  for(const theme of DEFAULT_THEMES.filter(t=>t.id.startsWith('lifestrategy-'))) {
   const result=await renderComparatifEtfImage(theme)
   const url=result.toDataURL('image/png')
   const image=new Image();image.src=url;await image.decode()
   output.push({id:theme.id,url,width:image.naturalWidth,height:image.naturalHeight})
  }
  return output
 })
 assert.equal(results.length,3);assert.deepEqual(errors,[])
 await mkdir('test-artifacts/lifestrategy',{recursive:true})
 for(const r of results) {
  assert(r.width>1000&&r.height>1000&&r.url.startsWith('data:image/png'))
  await writeFile(`test-artifacts/lifestrategy/${r.id}.png`,Buffer.from(r.url.split(',')[1],'base64'))
 }
 console.log('Chromium: three LifeStrategy comparison PNG exports rendered; four sheet exports covered by playwright-tools.')
} finally {await browser?.close();server.kill()}
