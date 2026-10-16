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
  const text=await page.locator(route==='calculateur-investissement' ? '[aria-label="Résultat de la simulation"]' : 'pre').innerText()
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
 // Currency selection updates the same actual period in text and PNG, including mobile.
 await page.goto(`${base}/performance-depuis?asset=msciWorld`,{waitUntil:'networkidle'})
 await page.locator('#secondary-select [data-option][data-value="2016"]').click()
 await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
 let previousImage
 for(const [currency,label,total] of [['USD','Dollars (USD)','+231,7 %'],['EUR','Euros (EUR)','+207,4 %']]) {
  await page.getByRole('button',{name:label,exact:true}).click()
  assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true')
  const tweet=await page.locator('pre').innerText()
  assert.match(tweet,/de début 2016 à fin 2025/)
  assert(tweet.includes(`Gross Return · ${currency} · dividendes bruts réinvestis`),tweet)
  assert(tweet.includes(`Sur toute la période : ${total}`),tweet)
  await page.evaluate(()=>{window.__currencyPaint=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__currencyPaint.push(String(text));return original.call(this,text,...args)}})
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000})
  const image=await page.locator('.publication-image-stage img').getAttribute('src')
  assert.notEqual(image,previousImage)
  previousImage=image
  assert(await page.evaluate(currency=>window.__currencyPaint.includes(`EN ${currency}`),currency))
  assert(await page.evaluate(total=>window.__currencyPaint.includes(total),total))
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
 }
 await page.setViewportSize({width:390,height:844})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 console.log('MSCI World: EUR/USD controls, exact periods, converted cumulative returns, PNG and mobile verified')
 assert.deepEqual(errors,[])
} finally {await browser?.close();server?.kill()}
