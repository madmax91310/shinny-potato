import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {publicationSelection} from '../src/lib/radar-editorial.js'
import {makeRadarOverview,overviewUnread} from '../src/lib/radar-overview.js'
import {RADAR_URL} from '../src/pages/editorial-radar/client.js'
const now=new Date('2026-10-26T16:00:00Z'),output='test-artifacts/radar-reliability',url='http://127.0.0.1:4338/shinny-potato/'
const capture=JSON.parse(await readFile('scripts/fixtures/radar-publication/cases.json','utf8')),real=JSON.parse(await readFile('scripts/fixtures/radar-composition-2026-10-28.json','utf8'))
const events=[...capture.events.map(e=>({...e,backfill:false,migratedEditorial:false})),...real.events]
const feed={schemaVersion:1,checkedAt:now.toISOString(),coverage:{},errors:[],events},summary=makeRadarOverview(feed,publicationSelection(events,{now:+now}))
const salary=events.find(e=>e.entity==='salary-median'),salaryGroup=publicationSelection(events,{now:+now}).groups.find(g=>g.events.some(e=>e.id===salary.id)),salaryId=salaryGroup.event.id
assert(!summary.selection.some(r=>real.events.some(e=>e.id===r.id)))
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4338','--strictPort'],{stdio:'ignore'}),results=[]
let browser
await mkdir(output,{recursive:true})
try{
 for(let i=0;i<450;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']})
 for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(15000);await page.clock.setFixedTime(now);page.on('pageerror',e=>errors.push(e.message))
  await context.route(RADAR_URL,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(feed)}))
  await context.route('https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/summary.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(summary)}))
  await page.goto(url);await page.locator('.home-radar-now li').first().waitFor()
  const unread=overviewUnread(summary)
  await page.getByLabel(`${unread} sujets exploitables non lus`,{exact:true}).first().waitFor({state:'attached'})
  assert.doesNotMatch(await page.locator('.home-radar-now').innerText(),/liquidités et dérivés|Cash and\/or/)
  const other=await context.newPage();await other.clock.setFixedTime(now);await other.goto(url+'radar-editorial?subject='+salaryId)
  let card=other.locator('#subject-'+salaryId);await card.waitFor()
  await card.locator('.radar-draft > summary').click();await card.getByRole('textbox',{name:/Brouillon/}).fill('Mon brouillon conservé après traitement')
  await card.getByText('Brouillon mémorisé sur cet appareil.',{exact:true}).waitFor()
  const readBefore=await other.evaluate(()=>localStorage.getItem('epargnantlibre-radar-read-v1'))
  await card.getByRole('button',{name:'Écarter ce sujet',exact:true}).click()
  assert.equal(await other.evaluate(()=>localStorage.getItem('epargnantlibre-radar-read-v1')),readBefore,'Discard is not reading')
  await page.getByLabel(`${unread-1} sujets exploitables non lus`,{exact:true}).first().waitFor({state:'attached'})
  assert.equal(await page.locator(`.home-radar-now a[href$="${salaryId}"]`).count(),0)
  await other.reload();await other.getByRole('button',{name:'Sujets écartés',exact:true}).click();await other.locator('#subject-'+salaryId).waitFor()
  await other.screenshot({path:`${output}/${device}-discarded.png`,fullPage:true})
  await other.locator('#subject-'+salaryId).getByRole('button',{name:'Annuler le traitement',exact:true}).click()
  await page.getByLabel(`${unread} sujets exploitables non lus`,{exact:true}).first().waitFor({state:'attached'})
  await other.getByRole('button',{name:'Historique complet',exact:true}).click();card=other.locator('#subject-'+salaryId)
  await card.locator('.radar-draft > summary').click();assert.equal(await card.getByRole('textbox',{name:/Brouillon/}).inputValue(),'Mon brouillon conservé après traitement')
  await card.getByRole('button',{name:'Sujet exploité',exact:true}).click();await other.getByRole('button',{name:'Sujets exploités',exact:true}).click();await other.locator('#subject-'+salaryId).waitFor()
  await other.locator('#subject-'+salaryId).getByRole('button',{name:'Annuler le traitement',exact:true}).click()
  await other.getByRole('button',{name:'Historique complet',exact:true}).click();card=other.locator('#subject-'+salaryId)
  await card.getByRole('button',{name:/Marquer .*lu/}).click();assert.equal(await card.getByRole('button',{name:'Sujet exploité',exact:true}).count(),1)
  await other.getByText('Filtrer les sujets',{exact:true}).click();await other.getByRole('searchbox').fill('iShares Listed Private')
  const suspect=other.locator('.radar-list > .radar-card').first();await suspect.waitFor();assert.equal(await other.locator('.radar-list > .radar-card .radar-draft').count(),0)
  assert.match(await suspect.innerText(),/À suivre|vérifier/)
  await other.screenshot({path:`${output}/${device}-pending.png`,fullPage:true})
  // Simulate a real quota failure without touching the user's browser/storage.
  await other.getByRole('searchbox').fill('salaire médian');card=other.locator('#subject-'+salaryId);await card.waitFor()
  await other.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('Simulated quota exceeded')}})
  await card.getByRole('button',{name:'Écarter ce sujet',exact:true}).click();await other.getByText(/Sauvegarde impossible/).waitFor()
  assert.equal(await card.getByRole('button',{name:'Sujet exploité',exact:true}).count(),1)
  assert.ok(await other.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[])
  await page.screenshot({path:`${output}/${device}-home.png`,fullPage:true})
  results.push({device,discardUndo:true,usedUndo:true,readingIndependent:true,homeBadgeCrossTab:true,draftRetained:true,saveFailureVisible:true,pendingNotExploitable:true,errors})
  await context.close()
 }
 await writeFile(output+'/report.json',JSON.stringify({mode:'Frozen real documents and API simulation; no user notification or deployment',results},null,2))
 console.log('Radar reliability browser: desktop/mobile home, pending observations, discard/use/undo, separate reading, filters, saved drafts, cross-tab badge and explicit save failure passed. No notification sent.')
}finally{await browser?.close();server.kill('SIGTERM')}
