import {choose} from './card-selection.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { ASSETS, LATEST_YM } from '../src/data/market-history.js'
import official from '../src/data/official-performance-currencies.json' with { type: 'json' }

// Expected values come from the data the automations refresh, never from literals:
// a legitimate monthly or annual update must not break this check.
const START_YEAR = 2016
const LAST_YEAR = Number(LATEST_YM.slice(0, 4)) - 1
const close = year => ASSETS.msciWorld.points.find(point => point.date === `${year}-12`)?.price
assert(close(START_YEAR - 1) && close(LAST_YEAR), 'MSCI World year-end closes missing')
const officialEur = official.msciWorld?.EUR?.annualReturns ?? {}
const years = Array.from({ length: LAST_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)
const hasOfficialEur = years.every(year => Number.isFinite(officialEur[year]))
const EXPECTED = {
  USD: (close(LAST_YEAR) / close(START_YEAR - 1) - 1) * 100,
  EUR: hasOfficialEur ? (years.reduce((acc, year) => acc * (1 + officialEur[year] / 100), 1) - 1) * 100 : null,
}
const parsePct = text => Number(text.replace(/[\s  ]/g, '').replace('−', '-').replace(',', '.'))
const periodTotal = tweet => tweet.match(/Sur toute la période : ([+−-][\d\s  ,]+) %/)
const yearRow = (tweet, year) => tweet.match(new RegExp(`${year} : ([+−-][\\d\\s\\u00a0\\u202f,]+) %`))
const port=4359,base=process.env.TEST_BASE_URL || `http://127.0.0.1:${port}/shinny-potato`
const server=process.env.TEST_BASE_URL ? null : spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 for(const route of ['performance-depuis','calculateur-investissement','il-y-a-x-ans']){
  await page.goto(`${base}/${route}?asset=nasdaq100`,{waitUntil:'networkidle'})
  await choose(route==='calculateur-investissement'?page.getByRole('group',{name:'Choisir un actif',exact:true}):page.locator('#subject-select'),'nasdaq100')
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
 await page.locator(`#secondary-select [data-option][data-value="${START_YEAR}"]`).click()
 await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
 let previousImage
 for(const [currency,label] of [['USD','Dollars (USD)'],['EUR','Euros (EUR)']]) {
  await page.getByRole('button',{name:label,exact:true}).click()
  assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true')
  const tweet=await page.locator('pre').innerText()
  assert(tweet.includes(`de début ${START_YEAR} à fin ${LAST_YEAR}`),tweet)
  assert(tweet.includes(`Gross Return · ${currency} · dividendes bruts réinvestis`),tweet)
  const totalMatch=periodTotal(tweet)
  assert(totalMatch,tweet)
  const total=`${totalMatch[1]} %`
  if(EXPECTED[currency]!=null) assert(Math.abs(parsePct(totalMatch[1])-EXPECTED[currency])<0.051,`${currency}: ${total} vs ${EXPECTED[currency]}`)
  if(currency==='EUR'){
   if(hasOfficialEur){
    assert.match(tweet,/série officielle/);assert.doesNotMatch(tweet,/conversion BCE/)
    const last=yearRow(tweet,LAST_YEAR);assert(last,tweet)
    assert(Math.abs(parsePct(last[1])-officialEur[LAST_YEAR])<0.051,`${LAST_YEAR}: ${last[1]} vs ${officialEur[LAST_YEAR]}`)
   } else assert.match(tweet,/conversion BCE/)
  }
  await page.evaluate(()=>{window.__currencyPaint=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__currencyPaint.push(String(text));return original.call(this,text,...args)}})
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000})
  const image=await page.locator('.publication-image-stage img').getAttribute('src')
  assert.notEqual(image,previousImage)
  previousImage=image
  assert(await page.evaluate(currency=>window.__currencyPaint.some(label=>label.endsWith(`EN ${currency}`)),currency))
  assert(await page.evaluate(total=>window.__currencyPaint.includes(total),total))
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
 }
 await page.setViewportSize({width:390,height:844})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 console.log('MSCI World: EUR/USD controls, exact periods, converted cumulative returns, PNG and mobile verified')
 assert.deepEqual(errors,[])
} finally {await browser?.close();server?.kill()}
