import {metadataFieldAttempt} from './report-asset-fields.mjs'
import assert from 'node:assert/strict'
import {fieldQualification,registryQualification,qualifyCoverage} from './lib/data-qualification.mjs'
import {buildDataAutomationInventory} from './data-automation-inventory.mjs'
import {outsideEquityClassification} from './lib/dca-asset-scope.mjs'
import {references} from '../src/pages/dca-profiles/records.js'
import {sharedPositions} from '../src/pages/dca-profiles/verification.js'
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

// Reproduce the real consumer before qualifying its requirements. These exact
// fixed-income shares are neutral, even though their names contain no "bond".
for(const isin of ['IE00B1FZSC47','IE00BZ6V7883']){
 const [asset,reference]=Object.entries(references).find(([,r])=>r.isin===isin)
 assert.equal(reference.outsideClassification,'Obligations')
 const line={asset,isin,label:reference.name,weight:100}
 const unread=new Proxy({},{get(){throw Error('A non-applicable company book must not be read')}})
 const actual=sharedPositions([line],references,new Date('2026-11-08'),unread)
 assert.deepEqual(actual.qualification,[]);assert.deepEqual(actual.unavailable,[]);assert.deepEqual(actual.pairs,[])
 const row={id:isin,name:reference.name,field:'completeHoldings',present:false,state:'missing',checkedAt:'2026-11-05'}
 const qualified=qualifyCoverage(row)
 assert.equal(qualified.actionState,'outside-equity-scope');assert.equal(qualified.requiresAction,false)
 assert.equal(qualified.observationState,'missing');assert.equal(qualified.checkedAt,row.checkedAt)
 assert.equal(outsideEquityClassification(isin,'A renamed exact share'),'Obligations','Identity, not a fund-name keyword')
 const unknown=qualifyCoverage({...row,id:'IE9999999999'})
 assert.equal(unknown.actionState,'connector-needed');assert(unknown.requiresAction,'An unqualified identity does not inherit the bond exemption')
 const sourceFailure=qualifyCoverage({...row,field:'holdings',state:'collection-error',reason:'HTTP503'})
 assert.equal(sourceFailure.actionState,'collection-error');assert(sourceFailure.requiresAction,'Other fields and actual producer failures remain visible')
 const present=qualifyCoverage({...row,present:true,state:'current',unidentifiedWeightPct:100,unidentifiedSecurityCount:1})
 assert.equal(present.actionState,'outside-equity-scope','An unused company-identity requirement remains non-applicable when positions exist')
}
assert.equal(qualifyCoverage({...retained,id:'US0378331005',present:false,state:'missing'}).actionState,'connector-needed')
assert.equal(qualifyCoverage({...retained,id:'FR0010755611',present:false,state:'missing'},{record:{characteristics:{replicationMethod:'Synthetic'}}}).actionState,'tracked-index-needed')
console.log('Exact TIPS/MBS consumer exclusions, unchanged source clocks, unknown identities and genuine source/equity/index gaps passed.')
