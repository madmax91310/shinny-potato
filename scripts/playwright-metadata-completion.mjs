import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {mkdir} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'

const metadata=JSON.parse(readFileSync('src/data/automated-instrument-metadata.json','utf8'))
const base='http://127.0.0.1:4389/shinny-potato'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4389'],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 await mkdir('test-artifacts/metadata',{recursive:true})
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  for(const isin of ['IE00B4L5Y983','IE00BDBRDM35']) {
   const observation=metadata[isin]?.currencyHedge
   assert.equal(typeof observation?.value,'boolean',`${isin}: actual observed hedge evidence required`)
   assert(observation.sourceUrl&&observation.checkedAt&&observation.sha256)
   await page.goto(`${base}/fiches-etf?isin=${isin}`,{waitUntil:'networkidle'})
   const facts=page.locator('.es-card .es-facts')
   await facts.getByText(`ISIN : ${isin}`,{exact:true}).waitFor()
   const text=await facts.innerText()
   assert(text.includes(observation.value?'couverture de change':'sans couverture de change'),`${isin}: observed hedge reaches the actual sheet`)
   assert(!text.includes('couverture en euros'),'A boolean observation cannot preserve an older hedge-currency claim')
   await page.screenshot({path:`test-artifacts/metadata/${isin}-${width}.png`,fullPage:true})
  }
  await page.goto(`${base}/comparatif-etf?subject=monde`,{waitUntil:'networkidle'})
  await page.waitForFunction(()=>document.querySelector('pre')?.textContent.includes('IE00B4L5Y983'))
  assert((await page.locator('pre').innerText()).includes('Capitalisant'))
  assert(await page.getByRole('button',{name:'Copier le texte',exact:true}).isEnabled())
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  await page.screenshot({path:`test-artifacts/metadata/comparison-${width}.png`,fullPage:true})
  assert.deepEqual(errors,[])
  await page.close()
 }
 console.log('Observed metadata: exact sheets, current hedge wording and ETF comparison verified on mobile and desktop.')
} finally {await browser?.close();server.kill()}
