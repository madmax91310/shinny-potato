import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {getFicheLexiqueText} from '../src/pages/tweet-midi/data/ficheLexique.js'
import {brokerTariffCopy, BROKER_TARIFFS} from '../src/data/broker-tariffs.js'
const base='http://127.0.0.1:4311/shinny-potato'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4311','--strictPort'],{stdio:'pipe'})
let serverOutput=''
server.stdout.on('data',chunk=>{serverOutput+=chunk})
server.stderr.on('data',chunk=>{serverOutput+=chunk})
let browser
try {
 const deadline=Date.now()+30000
 for (;;) {
  try {if((await fetch(base+'/')).ok) break} catch {}
  if(Date.now()>deadline) throw new Error('Preview server unavailable: '+serverOutput)
  await new Promise(resolve=>setTimeout(resolve,250))
 }
 browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})
 const page=await browser.newPage()
 await page.goto(base+'/fiche-lexique')
 for(const id of ['pea','cto','ldds','assurance-vie','flat-tax']) {
  await page.locator(`#subject-select [data-value="${id}"]`).click()
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  const expected=getFicheLexiqueText(id)
  await page.waitForFunction(expected=>Array.from(document.querySelectorAll('pre')).some(e=>e.textContent.trim()===expected.trim()),expected)
 }
 await page.goto(base+'/comparatif-courtiers')
 for (const id of Object.keys(BROKER_TARIFFS)) {
  const selected=await page.locator('.bc-broker-select input:checked').evaluateAll(inputs=>inputs.map(input=>input.id))
  for(const checkbox of selected)await page.locator('#'+checkbox).uncheck()
  await page.locator('#chk-'+id).check();await page.locator('#chk-'+(id==='tr'?'xtb':'tr')).check()
  await page.waitForFunction(full=>Array.from(document.querySelectorAll('textarea')).some(e=>e.value.includes(full)),brokerTariffCopy(id).full)
  assert(await page.locator('.bc-resume').filter({hasText:brokerTariffCopy(id).resume}).count())
 }
 await page.setViewportSize({width:390,height:844})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 console.log('Browser: five fiscal sheets, recalculated examples, seven broker tables/tweets and mobile OK')
} finally {await browser?.close();server.kill()}
