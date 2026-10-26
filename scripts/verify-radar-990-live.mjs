import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {validateRadarOverview,overviewUnread} from '../src/lib/radar-overview.js'
const base='https://madmax91310.github.io/shinny-potato/',root='test-artifacts/radar-live'
const required='7b0a19b0184517218159e6953f8bc41b0b3933c7'
await mkdir(root,{recursive:true})
let build
for(let attempt=0;attempt<60;attempt++){
 try{
  const r=await fetch(base+'build-info.json?verify='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)})
  assert.ok(r.ok);build=await r.json();assert.match(build.sha,/^[a-f0-9]{40}$/)
  try{execFileSync('git',['cat-file','-e',build.sha],{stdio:'ignore'})}catch{execFileSync('git',['fetch','--no-tags','origin',build.sha],{stdio:'ignore'})}
  execFileSync('git',['merge-base','--is-ancestor',required,build.sha],{stdio:'ignore'})
  break
 }catch{
  build=null
  if(attempt===59)throw Error('Public version has not adopted Radar #990 after the bounded verification window')
  await new Promise(r=>setTimeout(r,30000))
 }
}
assert.ok(build)
const browser=await chromium.launch({args:['--no-sandbox']})
const result=[]
try{
 for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message))
  const summaryResponse=page.waitForResponse(r=>r.url().includes('/radar-data/summary.json')&&r.status()===200,{timeout:60000})
  await page.goto(base+'?verify='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000})
  const summary=validateRadarOverview(await(await summaryResponse).json())
  await page.getByRole('heading',{name:'À publier maintenant',exact:true}).waitFor()
  await page.getByLabel(overviewUnread(summary)+' sujets exploitables non lus',{exact:true}).first().waitFor({state:'attached'})
  const home=page.locator('.home-radar-now');assert.equal(await home.locator('li').count(),Math.min(3,summary.selection.length))
  if(device==='mobile')await page.locator('.workspace-mobile-radar').waitFor({state:'visible'})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.screenshot({path:root+'/'+device+'-home.png',fullPage:true})
  const feedResponse=page.waitForResponse(r=>r.url().includes('/radar-data/feed.json')&&r.status()===200,{timeout:60000})
  await home.getByRole('link',{name:/Ouvrir le Radar/}).click()
  const feed=await(await feedResponse).json()
  await page.getByRole('heading',{name:'Radar éditorial',exact:true}).waitFor()
  await page.waitForFunction(()=>!document.body.innerText.includes('Chargement des derniers signaux'))
  const selected=await page.locator('.radar-list > .radar-card').evaluateAll(nodes=>nodes.map(n=>n.id.slice(8)))
  assert.deepEqual(selected,summary.selection.map(r=>r.id),'Public home and Radar selections differ')
  await page.screenshot({path:root+'/'+device+'-selection.png',fullPage:true})
  await page.getByRole('button',{name:'Historique complet',exact:true}).click()
  await page.getByText('Filtrer les sujets',{exact:true}).click()
  const search=page.getByRole('searchbox');await search.fill('salaire médian')
  const salary=page.locator('.radar-list > .radar-card').filter({has:page.getByRole('heading',{name:/Salaire médian/})}).first()
  await salary.waitFor();const salaryText=await salary.innerText()
  assert.match(salaryText,/Publication originale/);assert.ok(await salary.locator('a[href="https://www.insee.fr/fr/statistiques/9087193"]').count())
  await salary.locator('.radar-proof > summary').click();await salary.locator('.radar-related').first().waitFor({state:'attached'})
  const salaryFacts=await salary.locator('.radar-related').count();assert.ok(salaryFacts>=2)
  await page.screenshot({path:root+'/'+device+'-salary.png',fullPage:true})
  await search.fill('Amundi')
  const issuer=page.locator('.radar-list > .radar-card').filter({has:page.getByRole('heading',{name:/Amundi.*(?:trois|thématiques)/i})}).first();await issuer.waitFor()
  let issuerText=await issuer.innerText()
  await issuer.locator('.radar-proof > summary').click();await issuer.locator('.radar-related > summary').first().click()
  await issuer.locator('.radar-related h3').first().waitFor();issuerText=await issuer.innerText()
  await page.screenshot({path:root+'/'+device+'-issuer.png',fullPage:true})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[])
  result.push({device,build,summary:{checkedAt:summary.checkedAt,sourceRevision:summary.sourceRevision,unread:overviewUnread(summary),selected},feed:{checkedAt:feed.checkedAt,sourceRevision:feed.sourceRevision,events:feed.events.length,notifications:feed.notifications},salaryFacts,salaryText,issuerText,errors,readOnly:true,mobileReception:'Not tested; no test alert sent'})
  await context.close()
 }
 await writeFile(root+'/report.json',JSON.stringify(result,null,2))
 console.log(JSON.stringify(result.map(({device,build,summary,errors})=>({device,build,summary,errors})),null,2))
}finally{await browser.close()}
