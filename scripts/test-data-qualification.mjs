import {metadataFieldAttempt} from './report-asset-fields.mjs'
import assert from 'node:assert/strict'
import {fieldQualification,registryQualification,qualifyCoverage} from './lib/data-qualification.mjs'
import {buildDataAutomationInventory} from './data-automation-inventory.mjs'
await import('./test-holdings-consumer-qualification.mjs')
const report=buildDataAutomationInventory()
for(const row of report.connections.filter(row=>row.consumerQualification)){
 const q=row.consumerQualification
 assert.equal(q.sourceContacted,false)
 assert.deepEqual(q.expectedAssetIds,[...new Set(q.outcomes.map(result=>result.asset))])
 if(row.actionState==='current')assert(q.outcomes.every(result=>result.status==='evaluated'&&result.complete))
}
assert.equal(report.fields.length,Object.values(report.summary.fieldKinds).reduce((a,b)=>a+b,0))
assert.equal(report.registries.length,Object.values(report.summary.registryRoles).reduce((a,b)=>a+b,0))
assert(report.fields.every(f=>f.nature?.reason),'Every catalog field retains a qualification reason')
assert(report.registries.every(r=>r.qualification?.reason))
assert(report.fields.filter(f=>!f.sourceUrls.length).every(f=>f.nature.kind==='archive'),'Known source gaps are immutable archives, not silently backfilled live observations')
assert.equal(registryQualification({path:'src/data/new-unknown.js',mode:'manual-or-editorial'}).role,'unclassified')
assert.equal(fieldQualification({label:'New number',registry:'new'},{}).kind,'unclassified')
const retained={id:'test',name:'Equity fund',field:'completeHoldings',present:true,state:'current',checkedAt:'2026-10-01'}
const failure=qualifyCoverage(retained,{holdingStatus:{status:'failed',checkedAt:'2026-10-20',lastSuccessAt:'2026-10-01',error:'HTTP 503'}})
assert.equal(failure.actionState,'collection-error');assert.equal(failure.observationState,'current')
assert.equal(failure.checkedAt,'2026-10-01');assert.equal(failure.lastAttemptAt,'2026-10-20');assert.equal(failure.lastSuccessAt,'2026-10-01')
assert(failure.requiresAction)
const nested=qualifyCoverage(retained,{holdingStatus:{status:'failed',error:'Fund-of-funds look-through is not qualified'}})
assert.equal(nested.actionState,'lookthrough-needed');assert(nested.requiresAction)
const swap=qualifyCoverage({...retained,present:false,state:'missing'},{record:{characteristics:{replicationMethod:'Synthetic'}}})
assert.equal(swap.observationState,'missing');assert.equal(swap.actionState,'tracked-index-needed');assert(swap.requiresAction)
const bond=qualifyCoverage({...retained,name:'Corporate Bond ETF',present:false,state:'missing'})
assert.equal(bond.actionState,'outside-equity-scope');assert.equal(bond.observationState,'missing')
assert.equal(qualifyCoverage({...retained,field:'pea',state:'manual'},{metadataStatus:{errors:[{field:'pea',qualificationRequired:true}]}}).actionState,'source-conflict')
assert(report.backlog.every(row=>row.requiresAction&&row.nextAction&&row.priority))
assert.equal(new Set(report.connections.map(r=>`${r.type}:${r.id}:${r.field}`)).size,report.connections.length)
console.log('Field lifecycles, explicit module roles, unknown defaults, immutable proof dates, nested funds and actionable connections passed.')

const partialFund=qualifyCoverage({...retained,scope:'fund',unidentifiedSecurityCount:1,unidentifiedWeightPct:.1})
assert.equal(partialFund.actionState,'unqualified','Missing identities matter for fund holdings as well as index holdings')
assert(partialFund.requiresAction)

const failedPartial=qualifyCoverage({...retained,unidentifiedSecurityCount:1,unidentifiedWeightPct:1.49},{holdingStatus:{status:'failed',checkedAt:'2026-10-23',lastSuccessAt:'2026-10-20',error:'HTTP 403'}})
assert.equal(failedPartial.actionState,'collection-error','Retained unknown identities must not mask a failed refresh')
assert.match(failedPartial.reason,/HTTP 403/)
assert.match(failedPartial.reason,/identités restent inconnues/)
assert.equal(failedPartial.checkedAt,retained.checkedAt)
assert.equal(failedPartial.unidentifiedWeightPct,1.49)

assert.equal(registryQualification({path:'src/data/evidence-freshness.js',mode:'manual-or-editorial'}).reviewedAt,'2026-10-23')
assert.equal(registryQualification({path:'src/data/annual-window.js',mode:'manual-or-editorial'}).reviewedAt,'2026-10-20','Classifying a new module must not redate already reviewed modules')

const scoped={checkedAt:'2026-10-28',fields:{pea:{lastAttemptAt:'2026-10-27'}}}
assert.equal(metadataFieldAttempt(scoped,'pea'),'2026-10-27')
assert.equal(metadataFieldAttempt(scoped,'listings'),null,'A PEA retry never renews the listing attempt clock')
