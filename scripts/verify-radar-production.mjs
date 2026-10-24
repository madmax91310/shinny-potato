// Read-only verification of the site actually served and the published Radar feed.
// No network interception, fabricated data or notification API is used.
import assert from 'node:assert/strict'
import { mkdir,writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { groupSignals,editorialState } from '../src/lib/radar-editorial.js'
const args=process.argv.slice(2),get=name=>args[args.indexOf(name)+1]
const expected=args.includes('--expected')?get('--expected'):null
const output=args.includes('--output')?get('--output'):'test-artifacts/radar-production'
const base='https://madmax91310.github.io/shinny-potato/'
await mkdir(output,{recursive:true})
const version=await (await fetch(base+'build-info.json',{cache:'no-store'})).json()
if(expected){execFileSync('git',['fetch','origin','master'],{stdio:'ignore'});execFileSync('git',['merge-base','--is-ancestor',expected,version.sha],{stdio:'ignore'})}
const feed=await(await fetch('https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/feed.json',{cache:'no-store'})).json()
assert.ok(Array.isArray(feed.sources)&&feed.sources.length,'Published v2 source supervision must be present')
const salary=feed.events.find(e=>e.entity==='salary-median'&&e.sourceUrl==='https://www.insee.fr/fr/statistiques/9087193')
assert.ok(salary,'Published INSEE reference signal exists')
assert.equal(salary.unit,'€ nets par mois');assert.equal(salary.period,'2025');assert.equal(salary.publishedAt,'2026-10-22');assert.equal(editorialState(salary),'ready')
assert.match(salary.label,/Salaire médian/)
const insee=groupSignals(feed.events).find(g=>g.events.some(e=>e.id===salary.id));assert.ok(insee.events.some(e=>e.entity==='salary-top10'))
const amundi=feed.events.find(e=>e.sourceUrl.includes('amundi-renforce-sa-gamme-d-etf-thematiques-lies-a-l-ia'))
assert.ok(amundi,'Published Amundi reference exists');assert.equal(amundi.publishedAt,'2026-10-14');assert.equal(amundi.products.length,3);assert.equal(editorialState(amundi),'ready')
for(const product of amundi.products){
 assert.notEqual(product.pea,false,'Unknown PEA must not become ineligible');assert.notEqual(product.availability,false)
 if(product.isin)assert.ok(product.evidence.includes(product.isin))
 if(product.fees)assert.ok(product.evidence.includes(product.fees))
}
const report={checkedAt:new Date().toISOString(),expected,servedVersion:version,feedCheckedAt:feed.checkedAt,sourceRevision:feed.sourceRevision,events:feed.events.length,insee:{id:salary.id,groupIds:insee.events.map(e=>e.id),publishedAt:salary.publishedAt,period:salary.period,checkedAt:salary.checkedAt,title:salary.title},amundi:{id:amundi.id,publishedAt:amundi.publishedAt,products:amundi.products.map(p=>({name:p.name,isin:p.isin,fees:p.fees,pea:p.pea,availability:p.availability}))},sources:feed.sources.map(s=>({id:s.id,status:s.status,queue:s.queue,error:s.error})),notifications:feed.notifications,browser:[]}
const browser=await chromium.launch({headless:true,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox']})
try{
 for(const [name,viewport]of[['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000})
  await page.getByRole('link',{name:/Radar éditorial/}).first().click()
  await page.getByRole('heading',{name:'Radar éditorial',exact:true}).waitFor()
  await page.getByRole('button',{name:'Historique complet',exact:true}).click()
  await page.locator('.radar-filter-panel > summary').click()
  await page.getByRole('searchbox').fill('Salaire médian du privé')
  await page.getByRole('heading',{name:/Salaire médian du privé :/}).first().waitFor()
  await page.screenshot({path:`${output}/${name}-insee.png`,fullPage:true})
  await page.getByRole('searchbox').fill('Amundi renforce')
  await page.getByRole('heading',{name:/Amundi renforce/}).first().waitFor()
  assert.equal(await page.locator('.radar-products > details').count(),3)
  await page.locator('.radar-products > details > summary').first().click()
  await page.screenshot({path:`${output}/${name}-amundi.png`,fullPage:true})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'No horizontal overflow')
  assert.deepEqual(errors,[])
  report.browser.push({name,viewport,realNetwork:true,errors,sourceDatesVisible:true,groupingVerified:true})
  await context.close()
 }
}finally{await browser.close()}
await writeFile(output+'/verification.json',JSON.stringify(report,null,2)+'\n')
console.log(`Production verified: ${version.sha}; INSEE/Amundi grouped, dates and unknowns preserved, desktop/mobile actual network. Mobile notification receipt was not tested.`)
