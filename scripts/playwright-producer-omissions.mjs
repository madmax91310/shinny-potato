// Isolated omission recipe. Only monitoring is simulated; no provider/production write.
import assert from 'node:assert/strict'
import {execFileSync,spawn} from 'node:child_process'
import {mkdir,writeFile}from'node:fs/promises'
import {chromium}from'playwright'
const model=JSON.parse(execFileSync('python',['-S','-c',`
import sys,json,hashlib,datetime as dt,tempfile,gzip
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,'scripts')
from producer_report_plans import build_plan
from producer_report_contract import finish
from publish_automation_status import read_report,update_status,REGISTRY
from automation_monitoring import evaluate_monitoring
w='update-practical-sheets.yml';now=dt.datetime.now(dt.timezone.utc).isoformat()
p=build_plan('collect_practical_sheets',[],report_stem='practical-observation',module=SimpleNamespace(CONFIG=Path('scripts/practical-sheet-sources.json')))
p.update(producer='collect_practical_sheets',reportStem='practical-observation',declaredAt=now,nonce='isolated-ui-test')
p['sha256']=hashlib.sha256(json.dumps(p,sort_keys=True).encode()).hexdigest()
missing=p['items'][-1]['id'];sources={r['id'].removeprefix('practical:'):{'status':'ok','lastSuccessfulCheckAt':now}for r in p['items']if r['id']!=missing}
with tempfile.TemporaryDirectory()as folder:
 path=Path(folder)/'practical-observation.json';path.write_text(json.dumps(finish({'sources':sources,'failed':[],'changed':[]},p)))
 report=read_report(path,w)
c=REGISTRY[w];steps=list(dict.fromkeys(c.get('collectionSteps',[])+c.get('validationSteps',[])+['Validate collected observations','Commit validated observations']))
jobs=[{'name':c['collectionJob'],'conclusion':'success','steps':[{'name':n,'conclusion':'success'}for n in steps]}]
run={'id':999999,'path':'.github/workflows/'+w,'head_branch':'master','event':'workflow_dispatch','status':'completed','conclusion':'success','updated_at':now,'html_url':'https://example.invalid/isolated-monitoring-recipe'}
state=update_status({},run,jobs,[report])
# Exercise the real, immutable scheduled 13F report: source checks succeed without
# a filing change while the actual subsequent recording step fails.
proof=Path('reports/data-review-product-2026-10-24/preuves-contrats-producteurs-20261025/planifie-13f')
execution=json.loads((proof/'execution-github.json').read_text())
with tempfile.TemporaryDirectory()as folder:
 path=Path(folder)/'investor-observations.json'
 with gzip.open(proof/'investor-observations.json.gz','rt')as f:path.write_text(f.read())
 with gzip.open(proof/'investor-observations.contract-plan.json.gz','rt')as f:declared=json.load(f)
 real_report=read_report(path,'update-investor-13f.yml',declared)
assert len(real_report['successes'])==28 and all(r['status']=='unchanged-verified'for r in real_report['successes'])
state=update_status(state,execution['run'],execution['jobs'],[real_report])
investor=state['workflows']['update-investor-13f.yml']
assert investor['collectionStatus']=='success'and investor['recordingStatus']=='failure'and investor['publicationStatus']=='not-run'
state['monitoring']=evaluate_monitoring(state,{'schemaVersion':1,'alerts':[],'entities':[]}, {w:c,'update-investor-13f.yml':REGISTRY['update-investor-13f.yml']},now,{'errors':[]})
print(json.dumps({'state':state,'missing':missing,'investorName':REGISTRY['update-investor-13f.yml']['name'],'mode':'isolated omission plus real archived 13F recording failure; no provider request'}))
`],{encoding:'utf8'}))
assert(Object.keys(model.state.workflows['update-practical-sheets.yml'].proofFailures).some(k=>k.includes(model.missing)))
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4326','--strictPort'],{stdio:'ignore'})
let browser
try{
 for(let n=0;;n++){try{if((await fetch('http://127.0.0.1:4326/shinny-potato/')).ok)break}catch{}assert(n<300);await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
 await page.context().grantPermissions(['clipboard-read','clipboard-write'])
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/automation-status/automation-status.json*',r=>r.fulfill({json:model.state}))
 await page.route('https://api.github.com/**/actions/workflows/automation-status.yml/runs?**',r=>r.fulfill({json:{workflow_runs:[{id:999999,status:'completed',conclusion:'success',head_branch:'master',event:'workflow_dispatch'}]}}))
 await page.goto('http://127.0.0.1:4326/shinny-potato/donnees-a-revoir?q='+encodeURIComponent('Résultat attendu absent'),{waitUntil:'networkidle'})
 await page.getByText('Résultat attendu absent',{exact:false}).first().waitFor()
 await mkdir('test-artifacts/producer-omissions',{recursive:true})
 for(const [name,width,height]of[['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height});assert.match(await page.locator('body').innerText(),/Résultat attendu absent/)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  await page.screenshot({path:'test-artifacts/producer-omissions/'+name+'.png',fullPage:true})
 }
 await page.locator('article.dr-item').filter({hasText:'Résultat attendu absent'}).filter({hasText:model.missing}).first().getByRole('button',{name:'Copier le diagnostic complet'}).click()
 const diagnostic=await page.evaluate(()=>navigator.clipboard.readText());await writeFile('test-artifacts/producer-omissions/diagnostic.txt',diagnostic);assert(diagnostic.includes(model.missing));assert(diagnostic.includes('expectedIds'))
 await page.getByRole('searchbox',{name:'Recherche globale des problèmes'}).fill(model.investorName)
 const recording=page.locator('article.dr-item').filter({hasText:model.investorName}).filter({hasText:/enregistrement/i}).first()
 await recording.waitFor();assert.match(await recording.innerText(),/enregistrement/i)
 for(const [name,width,height]of[['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  await page.screenshot({path:'test-artifacts/producer-omissions/13f-'+name+'.png',fullPage:true})
 }
 assert.deepEqual(errors,[])
 await writeFile('test-artifacts/producer-omissions/results.json',JSON.stringify({mode:model.mode,missing:model.missing,errors,viewports:['desktop','mobile'],greenWorkflowWithMissingIndividualResult:true,unchanged13FSourceChecks:28,sourceSuccessDoesNotCloseRecordingFailure:true},null,2))
 console.log('Actual reader/reducer -> isolated public-page model: green workflow omission and real 13F recording failure after 28 unchanged source checks visible on desktop and mobile.')
}finally{await browser?.close();server.kill()}
