import assert from 'node:assert/strict'
import fs from 'node:fs'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import registry from '../src/data/automation-workflows.json' with {type:'json'}
const folder='test-artifacts/review-product';fs.mkdirSync(folder,{recursive:true})
const external=process.env.REVIEW_BASE_URL,server=external?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4398','--strictPort'],{stdio:'ignore'})
const base=external??'http://127.0.0.1:4398/shinny-potato'
const fresh=()=>new Date().toISOString()
const workflows=Object.fromEntries(Object.entries(registry).map(([id,c])=>[id,{name:c.name,completedAt:fresh(),status:'success',collectionStatus:'success',validationStatus:'success',dataFailures:{}}]))
const incidents=Object.fromEntries(Array.from({length:181},(_,i)=>{const id='fixture:'+i;return[id,{id,name:'Source-'+String(i).padStart(3,'0'),kind:'collection',dataId:'test-'+i,field:'Champ de recette',cause:'Échec de recette isolée',tools:['Outil de recette'],asOf:'2026-09',lastSuccessAt:'2026-10-22T10:00:00Z',attemptedAt:'2026-10-24T08:00:00Z',runUrl:'https://github.com/test/repo/actions/runs/1',sourceUrls:['https://example.com/source'],observations:[{cause:'Panne précédente',asOf:'2026-09'}]}]}))
let snapshot={schemaVersion:1,workflows,monitoring:{schemaVersion:1,checkedAt:fresh(),active:incidents,resolved:[]}},unavailable=false,badCoverage=false
let browser
try{
 for(let n=0;n<100;n++){try{if((await fetch(base+'/',{signal:AbortSignal.timeout(1000)})).ok)break}catch{}if(n===99)throw Error('Preview unavailable');await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true})
 const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/automation-status/automation-status.json',r=>unavailable?r.fulfill({status:503,body:'unavailable'}):r.fulfill({json:snapshot}))
 await page.route('https://api.github.com/**/actions/workflows/automation-status.yml/runs?**',r=>r.fulfill({json:{workflow_runs:[{id:1,head_branch:'master',event:'schedule',status:'completed',conclusion:'success'}]}}))
 await page.route('**/data/asset-field-coverage.json',r=>badCoverage?r.fulfill({json:{schemaVersion:99}}):r.continue())
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'})
  const inbox=page.getByRole('region',{name:'Tous les problèmes de données'}),search=inbox.getByRole('searchbox',{name:'Recherche globale des problèmes'})
  await search.fill('Source-180');await inbox.getByRole('heading',{name:'Source-180 · Champ de recette'}).waitFor()
  assert.equal(await inbox.locator('article').count(),1,'An entry beyond the first page remains searchable')
  assert((await inbox.innerText()).includes('2026-09'))
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('clipboard denied')}}}))
  await inbox.getByRole('button',{name:'Copier le diagnostic complet',exact:true}).click()
  const fallback=inbox.getByRole('textbox',{name:'Diagnostic complet à copier'});await fallback.waitFor()
  assert((await fallback.inputValue()).includes('2026-10-22T10:00:00Z'));assert((await fallback.inputValue()).includes('Panne précédente'))
  await inbox.getByRole('combobox',{name:'Outil concerné',exact:true}).selectOption('Outil de recette')
  await search.fill('');await inbox.getByRole('navigation',{name:'Pages des problèmes de données'}).getByRole('button',{name:'Dernière page'}).click()
  await inbox.getByRole('heading',{name:'Source-180 · Champ de recette'}).waitFor();assert(await inbox.getByRole('navigation',{name:'Pages des problèmes de données'}).getByRole('button',{name:'Dernière page'}).isDisabled())
  const download=page.waitForEvent('download');await inbox.getByRole('button',{name:/Exporter les 181 diagnostics/}).click();const file=await download;await file.saveAs(folder+'/all-'+width+'.json');const payload=JSON.parse(fs.readFileSync(folder+'/all-'+width+'.json'));assert.equal(payload.rows.length,181)
  await inbox.getByRole('checkbox',{name:'Regrouper les causes en conservant chaque champ et chaque preuve'}).check();const group=inbox.locator('details').filter({has:page.locator('summary').filter({hasText:'181 points'})}).first();await group.locator('summary').first().click();assert((await group.innerText()).includes('Champ de recette'))
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  await page.screenshot({path:folder+'/queue-'+width+'.png',fullPage:false})
 }
 // Stale, missing, malformed and transport failure are never reassuring states.
 for(const [name,value]of [['absent',{schemaVersion:1,workflows}],['invalid',{schemaVersion:1,workflows,monitoring:{schemaVersion:1,active:[],resolved:[]}}],['stale',{schemaVersion:1,workflows,monitoring:{schemaVersion:1,checkedAt:'2020-01-01',active:incidents,resolved:[]}}]]){
  snapshot=value;await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'});const inbox=page.getByRole('region',{name:'Tous les problèmes de données'});await inbox.getByRole('alert').waitFor();assert((await inbox.innerText()).includes('moniteur')||(await inbox.innerText()).includes('Moniteur'));await page.screenshot({path:folder+'/monitor-'+name+'.png',fullPage:false})
 }
 unavailable=true;badCoverage=true;await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'});const inbox=page.getByRole('region',{name:'Tous les problèmes de données'});await inbox.getByRole('alert').waitFor();await inbox.getByRole('searchbox').fill('asset-field-coverage.json');await inbox.locator('article').first().waitFor()
 unavailable=false;badCoverage=false;snapshot={schemaVersion:1,workflows,monitoring:{schemaVersion:1,checkedAt:fresh(),active:{},resolved:[]}};await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'});await page.getByRole('region',{name:'Écarts financiers à expliquer'}).waitFor();assert.equal(await page.getByRole('region',{name:'Tous les problèmes de données'}).getByRole('alert').count(),0)
 assert.deepEqual(errors,[])
 fs.writeFileSync(folder+'/results.json',JSON.stringify({desktop:true,mobile:true,all181Accessible:true,diagnosticFallback:true,allFilteredExported:true,monitorFaults:['absent','invalid','stale','network'],invalidCoverage:true,recovery:true,pageErrors:errors},null,2)+'\n')
 console.log('Review product: desktop/mobile, exhaustive pagination/search/export/copy, monitor faults, isolated report failure and recovery verified.')
}finally{await browser?.close();server?.kill()}
