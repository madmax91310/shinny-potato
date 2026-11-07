import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {nativeIndexCompanyView,retainIndexCompanyView} from './lib/native-index-company-view.mjs'
import {calculateConcentration} from '../src/data/index-concentration-core.js'
import {indexQualificationReport} from './index-qualification-report.mjs'
import routes from './index-company-sources.json' with {type:'json'}
import identities from '../src/data/index-company-identities.json' with {type:'json'}
const fixture=JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/native-index-companies-20261107/full-books.json.gz',import.meta.url))))
const oracles=JSON.parse(readFileSync(new URL('./fixtures/native-index-companies-20261107/decimal-oracles.json',import.meta.url)))
const now=new Date('2026-11-07T18:30:00Z'),clone=value=>structuredClone(value)
function view(id,records=fixture.records,route=routes.nativeReferences[id],time=now){return nativeIndexCompanyView({id,index:routes.nativeReferences[id].targetIndexName},route,records,fixture.status,identities,time)}
const close=(actual,expected)=>assert(Math.abs(actual-Number(expected))<1e-10,`${actual} versus ${expected}`)
const before=JSON.stringify(fixture.records)
for(const[id,oracle]of Object.entries(oracles)){
 const result=view(id)
 assert(result.available,id+': '+result.reason);assert.equal(result.approximation,false)
 assert.equal(result.sourceBasis,'qualified-native-index');assert.equal(result.asOf,oracle.asOf)
 assert.equal(result.checkedAt,fixture.records[result.indexProofSubjectIsin].checkedAt,'A projection does not renew source controls')
 assert.equal(result.sourceRowCount,oracle.sourceRowCount);assert.equal(result.normalizationApplied,false)
 close(result.topWeight,oracle.topWeight);close(result.publishedWeightSum,oracle.publishedWeightSum)
 close(result.publishedRoundingResidualPct,oracle.roundingResidualPct)
 assert.equal(result.top.length,10);assert.equal(result.topWeight+result.otherWeight,100)
 for(let i=0;i<10;i++){
  assert.equal(result.top[i].id,oracle.top[i].id);close(result.top[i].weightPct,oracle.top[i].weightPct)
  assert.deepEqual([...result.top[i].securities].sort(),oracle.top[i].securities)
 }
 const reordered=clone(fixture.records)
 for(const r of Object.values(reordered))r.rows.reverse()
 assert.deepEqual(view(id,reordered),result,'Financial output is invariant to input order')
 assert.equal(result.capabilities.mainFactsheet,false,'No country/sector photograph is invented')
 assert.equal(result.visualFacts,undefined)
}
assert.equal(JSON.stringify(fixture.records),before,'All published rows and evidence remain immutable')
const id='topix',record=view(id),subject=record.indexProofSubjectIsin
for(const mutation of [
 r=>{r.complete=false},r=>{r.basis='fund'},r=>{r.scope='substitute-basket'},
 r=>{r.unidentifiedSecurityCount=1;r.unidentifiedWeightPct=.01},
 r=>{r.rows.pop()},r=>{r.rows[0].isin=null},r=>{r.rows[1].isin=r.rows[0].isin},
 r=>{r.coverageProof.normalizationApplied=true},r=>{r.sourceUrl='https://example.com/not-the-index'},
 r=>{r.checkedAt='2027-01-01T00:00:00Z'},r=>{r.rows[0].weightPct=50},
]){
 const records={[subject]:clone(fixture.records[subject])};mutation(records[subject]);assert.equal(view(id,records).available,false)
}
assert.equal(view(id,fixture.records,{...routes.nativeReferences[id],targetIndexName:'Wrong index'}).available,false)
assert.equal(view(id,fixture.records,{...routes.nativeReferences[id],sourceIndexName:'ETF portfolio'}).available,false)
assert.equal(view(id,fixture.records,routes.nativeReferences[id],new Date('2027-01-01')).available,false,'Stale controls stay stale')

// The full-book generic tolerance is unchanged. These source rows have a
// separate, existing publisher-precision contract and are never renormalised.
for(const id of ['world','nasdaq-pea']){
 const result=view(id),full=fixture.records[result.indexProofSubjectIsin]
 assert.equal(calculateConcentration(full,identities).available,false)
 assert(result.publishedWeightSum>100&&result.publishedRoundingResidualPct<0)
 assert(result.top.every(r=>r.weightPct<100));assert.equal(result.normalizationApplied,false)
}
const conflict=clone(fixture.records),worlds=Object.entries(conflict).filter(([,r])=>r.indexId==='msci-world-net'&&r.approximation!==true)
assert(worlds.length>=2)
worlds[1][1].rows[0].weightPct+=.0001;worlds[1][1].rows[1].weightPct-=.0001
assert.equal(view('world',conflict).available,false,'No majority/latest choice between conflicting same-date native records')

const candidate=view('world'),proxy={...candidate,sourceBasis:'fund',approximation:true,asOf:'2026-11-05'},proxyBefore=clone(proxy)
const promoted=retainIndexCompanyView(candidate,proxy)
assert.equal(promoted.approximation,false);assert.equal(promoted.asOf,candidate.asOf)
assert.equal(promoted.checkedAt,candidate.checkedAt);assert(promoted.sourcePromotion);assert.deepEqual(proxy,proxyBefore)
const older={...candidate,asOf:'2026-09-22'}
const held=retainIndexCompanyView(older,candidate)
assert.equal(held.asOf,candidate.asOf);assert.equal(held.checkedAt,candidate.checkedAt);assert(held.retained)
const contradictory=retainIndexCompanyView({...candidate,weightVectorSha256:'f'.repeat(64)},candidate)
assert(contradictory.retained);assert.equal(contradictory.refresh.status,'failed')
const failed=retainIndexCompanyView({available:false,sourceBasis:'qualified-native-index',reason:'Source contract failed'},candidate)
assert(failed.retained);assert.equal(failed.checkedAt,candidate.checkedAt)
const report=indexQualificationReport({world:failed},[{id:'world',error:failed.refresh.error}],now.toISOString(),['world'])
assert.equal(report.sourceAttempted,false);assert.deepEqual(report.scope.networkRequestedIds,[])
assert.equal(report.outcomes[0].status,'failed');assert.equal(report.outcomes[0].checkedAt,candidate.checkedAt)
console.log('Seven exact native-index company views: independent Decimal oracles, original rounded weights, no name joins, no source-clock renewal, full-book/identity/age rejection, order invariance and scope-aware retention.')
