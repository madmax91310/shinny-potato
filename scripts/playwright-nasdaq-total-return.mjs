import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const port=4359,base=process.env.TEST_BASE_URL || `http://127.0.0.1:${port}/shinny-potato`
const server=process.env.TEST_BASE_URL ? null : spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 for(const route of ['performance-depuis','calculateur-investissement','il-y-a-x-ans']){
  await page.goto(`${base}/${route}?asset=nasdaq100`,{waitUntil:'networkidle'})
  await page.locator('[data-option][data-value="nasdaq100"]').click()
  if(route!=='calculateur-investissement')await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  const text=await page.locator('pre').innerText()
  assert.match(text,/dividendes bruts réinvestis/)
  assert(!/hors dividendes|NaN|undefined/.test(text),text)
  await page.evaluate(()=>{window.__painted=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__painted.push(String(text));return original.call(this,text,...args)}})
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000})
  assert((await page.locator('.publication-image-stage img').getAttribute('src')).startsWith('data:image/png'))
  assert(!await page.evaluate(()=>window.__painted.some(t=>/hors dividendes/.test(t))))
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.setViewportSize({width:1280,height:900})
  console.log(`${route}: Nasdaq Total Return text, PNG and mobile verified`)
 }
 assert.deepEqual(errors,[])
} finally {await browser?.close();server?.kill()}
