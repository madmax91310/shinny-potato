import assert from 'node:assert/strict'
import {holdingsReconciliationDetails,rejectedPerimeterDetails,accountingWeight} from '../src/data/holdings-reconciliation.js'
import {projectDcaHoldings} from './lib/dca-holdings-projection.mjs'
import {sharedPositions} from '../src/pages/dca-profiles/verification.js'
import {connectNativeIndexCandidates} from './lib/native-index-source-candidates.mjs'
const h={complete:true,basis:'fund',asOf:'2026-10-28',sha256:'a'.repeat(64),sourceUrl:'https://issuer.example/full',
 rows:[{name:'Known company',isin:'US0378331005',weightPct:99.3},{name:'Unknown CVR',isin:null,weightPct:.0003}],
 navReconciliation:{schemaVersion:1,asOf:'2026-10-28',normalizationApplied:false,method:'Same dated source',
  sourceRowCount:3,selectedRowCount:2,excludedRowCount:1,selectedWeightPct:99.3003,publishedNetWeightPct:100,
  sourceWeightPctByType:{Equity:99.3003,Cash:.6997},excludedWeightPctByType:{Cash:.6997},unidentifiedPositions:[{name:'Unknown CVR',weightPct:.0003}]}}
assert(holdingsReconciliationDetails(h));assert.equal(accountingWeight(.0003),'0,0003 %')
assert.deepEqual(projectDcaHoldings(h,false).navReconciliation,h.navReconciliation)
for(const patch of [{selectedWeightPct:100},{publishedNetWeightPct:99},{asOf:'2026-10-27'},{normalizationApplied:true},{selectedRowCount:1},{sourceRowCount:4},{unidentifiedPositions:[]},{excludedWeightPctByType:{Cash:0}}])assert.equal(holdingsReconciliationDetails({...h,navReconciliation:{...h.navReconciliation,...patch}}),null)
const line={asset:'fund',isin:'IE00B6R52259',label:'Fund',weight:100},refs={fund:{isin:line.isin}}
const before=sharedPositions([line],refs,new Date('2026-10-29'),{fund:{...h,navReconciliation:undefined}})
const after=sharedPositions([line],refs,new Date('2026-10-29'),{fund:h})
assert.deepEqual(after,before,'Accounting metadata cannot change math or complete-overlap admission')
assert.equal(after.totals[0].complete,false,'Unknown CVR and insufficient coverage remain partial')
for(const id of ['FR0011550193','FR0011871110','FR0011869304']){
 const original={id,field:'completeHoldings',actionState:'tracked-index-needed',configuredSourceUrls:[]}
 const c=connectNativeIndexCandidates(original)
 assert(c.configuredSourceUrls.length);assert.equal(c.actionState,original.actionState);assert.equal(c.checkedAt,undefined)
 assert.deepEqual(original.configuredSourceUrls,[]);assert.equal(c.financialDataQualified,undefined)
 assert.deepEqual(connectNativeIndexCandidates({...original,field:'performance'}),{...original,field:'performance'})
}
console.log('NAV reconciliation: exact original weights, excluded classes and unknown identities survive projection; invalid proofs rejected; no effect on conservative overlap; three native-index sourcing leads monitored without financial admission.')
const rejected={kind:'unsupported-gross-net-perimeter',subjectIsin:line.isin,asOf:'2026-10-28',checkedAt:'2026-10-29T10:00:00Z',
 sourceUrl:h.sourceUrl,sha256:h.sha256,financialDataQualified:false,navReconciliation:{...h.navReconciliation,
 selectedWeightPct:100.8,publishedNetWeightPct:100,sourceWeightPctByType:{Equity:100.8,Forwards:-.8},excludedWeightPctByType:{Forwards:-.8}}}
const status={asOf:'2026-10-23',lastRejectedObservation:rejected}
assert(rejectedPerimeterDetails(status,line.isin))
for(const patch of [{financialDataQualified:true},{subjectIsin:'OTHER'},{sha256:'bad'},{asOf:'2026-02-30'},{checkedAt:'2026-01-01'},
 {navReconciliation:{...rejected.navReconciliation,normalizationApplied:true}},
 {navReconciliation:{...rejected.navReconciliation,excludedWeightPctByType:{Forwards:0}}}])
 assert.equal(rejectedPerimeterDetails({...status,lastRejectedObservation:{...rejected,...patch}},line.isin),null)
