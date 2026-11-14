// Replay stored, frozen signals only. No collection or notification is enabled.
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {publicationSelection} from '../src/lib/radar-editorial.js'
import {makeRadarOverview} from '../src/lib/radar-overview.js'
import {radarToolActions} from './lib/radar-tool-actions.mjs'
import {RADAR_URL} from '../src/pages/editorial-radar/client.js'

const summaryUrl='https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/summary.json'
const now=new Date('2026-10-26T16:00:00Z')
const capture=JSON.parse(await readFile('scripts/fixtures/radar-publication/cases.json','utf8'))
const events=capture.events.map(e=>({...e,backfill:false,migratedEditorial:false,toolActions:radarToolActions(e,+now)}))
const feed={schemaVersion:1,checkedAt:now.toISOString(),sourceRevision:'frozen-read-order-test',coverage:{},observationCount:events.length,errors:[],events}
const url='http://127.0.0.1:4336/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4336','--strictPort'],{stdio:'ignore'})
let browser
const reports=[]
try {
  for(let i=0;i<450;i++) {
    try {if((await fetch(url)).ok)break} catch {}
    await new Promise(resolve=>setTimeout(resolve,100))
  }
  browser=await chromium.launch({...process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{},args:['--no-sandbox','--disable-dev-shm-usage']})
  for(const width of [1440,390]) for(const scenario of ['older-success-after-failure','older-failure-after-success']) {
    const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390})
    let calls=0,releaseOlder,olderStarted
    const held=new Promise(resolve=>{releaseOlder=resolve})
    const started=new Promise(resolve=>{olderStarted=resolve})
    await context.route(summaryUrl,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(makeRadarOverview(feed,publicationSelection(events,{now:+now})))}))
    await context.route(RADAR_URL,async route=>{
      calls++
      if(calls===2) {
        olderStarted()
        await held
        await route.fulfill(scenario==='older-success-after-failure'
          ?{contentType:'application/json',body:JSON.stringify({...feed,events:[]})}
          :{status:503,body:'Older simulated outage'})
      } else if(calls===3 && scenario==='older-success-after-failure') {
        await route.fulfill({status:503,body:'Latest simulated outage'})
      } else {
        await route.fulfill({contentType:'application/json',body:JSON.stringify(feed)})
      }
    })
    const page=await context.newPage(),errors=[]
    page.on('pageerror',error=>errors.push(error.message))
    await page.clock.setFixedTime(now)
    await page.goto(url+'radar-editorial',{waitUntil:'networkidle'})
    await page.getByText(/Veille automatique arrêtée/).waitFor()
    await page.locator('.radar-card').first().waitFor()
    const initialCards=await page.locator('.radar-card').count()
    const reload=page.getByRole('button',{name:'Recharger les signaux enregistrés',exact:true})
    await reload.click()
    await started
    const latestStatus=scenario==='older-success-after-failure'?503:200
    const latest=page.waitForResponse(response=>response.url()===RADAR_URL&&response.status()===latestStatus)
    await reload.click()
    await latest
    if(latestStatus===503)await page.getByRole('alert').waitFor()
    else await page.waitForLoadState('networkidle')
    const older=page.waitForResponse(response=>response.url()===RADAR_URL&&response.status()!==latestStatus)
    releaseOlder()
    await older
    await page.waitForLoadState('networkidle')
    assert.equal(calls,3,'Only the three explicitly simulated stored-feed reads are attempted')
    assert.equal(await page.getByRole('alert').count(),latestStatus===503?1:0,'A late older response must not replace the latest outcome')
    assert.equal(await page.locator('.radar-card').count(),initialCards,'The last valid signal list survives a stale empty response')
    assert.deepEqual(errors,[])
    reports.push({width,scenario,calls,initialCards,latestStatus,errors,collectionEnabled:false,notificationsSent:0})
    await context.close()
  }
  await mkdir('test-artifacts/radar-read-order',{recursive:true})
  await writeFile('test-artifacts/radar-read-order/report.json',JSON.stringify(reports,null,2)+'\n')
  console.log('Stored Radar reads: late success/failure ordering, last valid feed and stopped collection preserved on desktop/mobile.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
