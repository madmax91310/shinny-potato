import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {buildInbox} from '../src/pages/data-review/review-inbox.js'
import {buildReview,parisToday} from '../src/pages/data-review/lib.js'
import registry from '../src/data/automation-workflows.json' with {type:'json'}
const read=p=>JSON.parse(fs.readFileSync(p)),folder='reports/data-review-product-2026-10-24'
fs.mkdirSync(folder,{recursive:true})
const status=read(process.argv[2]),inventory=read('public/data/data-automation-inventory.json'),coverage=read('public/data/asset-field-coverage.json'),financial=read('public/data/financial-reconciliation.json')
const result=buildInbox({status,inventory,coverage,financial,review:buildReview(parisToday())})
const columns=['id','kind','name','field','stage','asset','tools','asOf','lastSuccessAt','attemptedAt','signalIds','cause']
const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"'
fs.writeFileSync(folder+'/suivi-perimetre.csv',[columns.join(','),...result.issues.map(r=>columns.map(k=>cell(k==='signalIds'?r.signals.map(s=>s.id).join(' | '):k==='tools'?r.tools.join(' | '):r[k])).join(','))].join('\n')+'\n')
const workflowScope=fs.readdirSync('.github/workflows').filter(p=>p.endsWith('.yml')).sort().map(id=>{
 const text=fs.readFileSync('.github/workflows/'+id,'utf8'),header=text.split('permissions:')[0]
 const scope=registry[id]?'supervised':id==='automation-status.yml'?'independent-browser-heartbeat':id==='publish-validated-data.yml'?'supervised-in-parent-run':/schedule:/.test(header)?'observation-only-pilot':/workflow_dispatch:/.test(header)?'manual-isolated-qualification':/pull_request_target:/.test(header)?'closed-pr-cleanup':'pull-request-validation'
 return{id,scope,consumerPublication:scope==='supervised'||scope==='supervised-in-parent-run',note:scope==='manual-isolated-qualification'||scope==='observation-only-pilot'?'Does not publish active data. Successful probe is not a production qualification; individual resulting gaps remain in source/financial contracts.':scope==='pull-request-validation'?'PR control results are gated in PR CI; production build/check failures are supervised in deploy-pages.':''}
})
const evidence=[]
for(const folderName of ['test-artifacts/review-product','test-artifacts/data-review-recovery'])if(fs.existsSync(folderName))for(const file of fs.readdirSync(folderName).sort()){
 const path=folderName+'/'+file,bytes=fs.readFileSync(path);evidence.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})
}
fs.writeFileSync(folder+'/bilan.json',JSON.stringify({checkedAt:new Date().toISOString(),monitorCheckedAt:status.monitoring?.checkedAt,monitorHealthy:result.health.ok,
 counts:{issues:result.issues.length,signals:result.signals,byKind:Object.fromEntries(Object.keys((await import('../src/pages/data-review/review-inbox.js')).ISSUE_KINDS).map(k=>[k,result.issues.filter(r=>r.kind===k).length])),fields:coverage.rows.length,consumerTools:inventory.consumerUsage.tools.length,requiredUsages:inventory.consumerUsage.summary?.required??inventory.summary.consumerUsage.required,financialOpenOrResidual:financial.rows.filter(r=>r.open||r.residualOpen).length},
 workflowScope,evidence,limits:['Source transport and financial qualification belong to producers; supervisor tests do not certify their success.','Legacy reports without attemptedIds remain explicitly unqualified for attempted scope completeness.','Job-only producers cannot certify per-field coverage.','Historical archived resolutions without explicit evidence remain labelled unqualified.','Manual isolated qualification workflows and the observation-only Bitcoin pilot do not publish active data and are outside continuous producer supervision.']},null,2)+'\n')
console.log(JSON.stringify({issues:result.issues.length,signals:result.signals,monitorHealthy:result.health.ok,workflowFiles:workflowScope.length}))
