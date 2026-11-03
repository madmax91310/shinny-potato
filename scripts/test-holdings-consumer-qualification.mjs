import assert from 'node:assert/strict'
import {holdingsConsumerQualifications,applyHoldingsConsumerQualification} from './lib/holdings-consumer-qualification.mjs'

const isin='IE000W8WMSL2',now=new Date('2026-10-30T12:00:00Z')
const book={asOf:'2026-10-23',checkedAt:'2026-10-30T08:57:46Z',sourceUrl:'https://issuer.example/positions',sha256:'a'.repeat(64),basis:'fund',complete:true,
 rows:[{isin:'US0378331005',name:'Apple',weightPct:50},{isin:'US5949181045',name:'Microsoft',weightPct:50.0002}]}
const references={quantum:{isin}},sourceRecords={[isin]:book},holdings={quantum:book}
const before=JSON.stringify({references,sourceRecords,holdings})
const qualifications=holdingsConsumerQualifications({references,sourceRecords,holdings,now})
assert.deepEqual(qualifications[isin].expectedAssetIds,['quantum'])
const q=qualifications[isin].outcomes[0]
assert.equal(q.status,'evaluated');assert.equal(q.valid,true);assert.equal(q.complete,false)
assert.match(q.reasons.join(' '),/dépasse 100/)
assert.equal(q.sourceCoverage,100.0002)
const current={field:'completeHoldings',actionState:'current',checkedAt:book.checkedAt,asOf:book.asOf,requiresAction:false,reason:null}
const limited=applyHoldingsConsumerQualification(current,qualifications[isin])
assert.equal(limited.actionState,'unqualified');assert.equal(limited.requiresAction,true)
assert.match(limited.reason,/recouvrement intégral/);assert.match(limited.reason,/dépasse 100/)
assert.equal(limited.checkedAt,book.checkedAt);assert.equal(limited.asOf,book.asOf)
assert.equal(JSON.stringify({references,sourceRecords,holdings}),before,'Admission diagnostics never alter source weights, identities or clocks')

const complete={...book,rows:[{...book.rows[0]},{...book.rows[1],weightPct:50}]}
const accepted=holdingsConsumerQualifications({references,sourceRecords:{[isin]:complete},holdings:{quantum:complete},now})
assert.equal(accepted[isin].outcomes[0].complete,true)
assert.equal(applyHoldingsConsumerQualification(current,accepted[isin]).actionState,'current')
for(const patch of[{sha256:'b'.repeat(64)},{asOf:'2026-10-22'},{checkedAt:'2026-10-29T08:00:00Z'},
 {rows:complete.rows},{scope:'other-perimeter'},{rows:[{...book.rows[0],isin:'US02079K3059'},book.rows[1]]}]){
 const deferred=holdingsConsumerQualifications({references,sourceRecords,holdings:{quantum:{...book,...patch}},now})[isin]
 assert.equal(deferred.outcomes[0].status,'deferred')
 assert.equal(applyHoldingsConsumerQualification(current,deferred).actionState,'unqualified','Another snapshot never certifies this consumer')
}
const missing=holdingsConsumerQualifications({references,sourceRecords,holdings:{},now})[isin]
assert.equal(missing.outcomes.length,1);assert.equal(missing.outcomes[0].status,'deferred','Missing projection is not silently omitted from expected scope')
for(const actionState of['collection-error','source-conflict','outside-equity-scope','waiting-publication']){
 const prior={...current,actionState,reason:'Original source result',lastAttemptAt:'2026-10-30',lastSuccessAt:'2026-10-23'}
 const after=applyHoldingsConsumerQualification(prior,accepted[isin])
 assert.equal(after.actionState,prior.actionState);assert.equal(after.reason,prior.reason);assert.equal(after.lastAttemptAt,prior.lastAttemptAt);assert.equal(after.lastSuccessAt,prior.lastSuccessAt)
}
const sectors={...current,field:'sectors'}
assert.equal(applyHoldingsConsumerQualification(sectors,qualifications[isin]),sectors,'A full-overlap refusal never blocks donuts or another field')
assert.deepEqual(holdingsConsumerQualifications({references:{bond:{isin,outsideClassification:true}},sourceRecords,holdings,now}),{},'No company-overlap obligation for excluded asset classes')
assert.deepEqual(holdingsConsumerQualifications({references,assets:{},sourceRecords,holdings,now}),{},'A registry entry outside actual selection is not an expected consumer result')
const aliases=holdingsConsumerQualifications({references:{first:{isin},second:{isin}},sourceRecords,holdings:{first:book},now})[isin]
assert.deepEqual(aliases.expectedAssetIds,['first','second']);assert.equal(aliases.outcomes.length,2)
assert.equal(aliases.outcomes[1].status,'deferred')
const substitute=holdingsConsumerQualifications({references:{swap:{isin,synthetic:true}},sourceRecords,holdings:{swap:{...book,synthetic:true}},now})[isin].outcomes[0]
assert.equal(substitute.status,'evaluated','Known synthetic classification is a consumer input, not a new source snapshot')
assert.equal(substitute.valid,false);assert.match(substitute.reasons.join(' '),/substitution/)
console.log('Actual holdings admission: excess weights stay partial; valid windows/scopes, source failures, expected aliases and immutable source clocks preserved.')
