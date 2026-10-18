import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4386/shinny-potato'
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4386'],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,150))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/data/portfolio/'))requests.push(r.url())})
 await mkdir('test-artifacts/full-auto',{recursive:true})
 for(const [id,name] of [['equity-apple','Apple'],['equity-abb','ABB'],['equity-stockUS57636Q1040','Mastercard'],['equity-stockGB0009895292','AstraZeneca'],['manual-FR0013412012','Amundi PEA Asie Emergente']]) {
  const start=requests.length
  await page.goto(`${base}/generateur-portefeuilles?asset=${id}`,{waitUntil:'networkidle'})
  assert.equal(requests.length,start,'Manual calendars are not loaded on opening the route')
  if(id==='equity-apple') {
   await page.route('**/data/portfolio/**',route=>route.fulfill({status:503,body:'Try again'}),{times:1})
   await page.getByRole('button',{name:'Générer le tweet',exact:true}).click()
   await page.getByRole('alert').filter({hasText:'réessayez'}).waitFor()
   assert(await page.locator('.pg-manual-selection-list').innerText().then(t=>t.includes('Apple')),'Selection survives a failed history request')
  }
  await page.getByRole('button',{name:'Générer le tweet',exact:true}).click()
  await page.locator('.pg-manual-result-panel').waitFor()
  assert(requests.length>start,'Only the selected calendar is fetched')
  assert((await page.locator('.pg-alloc-list').innerText()).includes(name))
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  const image=page.locator('.publication-image-stage img')
  await image.waitFor();assert(await image.evaluate(img=>img.naturalWidth>1000))
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.screenshot({path:`test-artifacts/full-auto/${id}.png`,fullPage:true})
  await page.setViewportSize({width:1440,height:1000})
 }
 await page.goto(`${base}/duels-portefeuilles?asset=equity-apple`,{waitUntil:'networkidle'})
 assert((await page.locator('#pd-tweet').inputValue()).includes('Apple'))
 await page.goto(`${base}/le-dca-de?isin=US0378331005`,{waitUntil:'networkidle'})
 await page.locator('.dca-simple-preview img').waitFor()
 await page.getByAltText('Répartition et expositions du portefeuille').waitFor()
 await page.goto(`${base}/performance-depuis?isin=US0378331005`,{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
 await page.waitForFunction(()=>/Apple/.test(document.querySelector('pre')?.textContent??''))
 assert.deepEqual(errors,[])
 console.log('Manual stock/ETF calendars: lazy requests, retry, correct allocation, PNG, mobile, duels, exposures and performance verified.')
} finally {await browser?.close();server?.kill()}
