import assert from 'node:assert/strict'
import fs from 'node:fs'
import {historicalResolutionProof} from '../src/pages/data-review/review-causes.js'
import {buildInbox} from '../src/pages/data-review/review-inbox.js'
const fixture=JSON.parse(fs.readFileSync('scripts/fixtures/qualified-monthly-return-resolutions-20261029.json'))
const now=Date.parse('2026-10-29T13:00:00Z')
assert.equal(fixture.rows.length,6)
for(const row of fixture.rows){
 assert.equal(historicalResolutionProof(row,now),true,row.id)
 const wrong=[
  r=>{r.dataId='GB00B15KXQ89'},
  r=>{r.currency='EUR'},
  r=>{r.method='Unadjusted market closing prices'},
  r=>{r.id=r.id.replace('automated-etf-monthly','monthly-market-quotes')},
  r=>{r.unqualifiedReturnWindow.start='2015-12'},
  r=>{r.resolutionEvidence.window.start='2015-12'},
  r=>{r.resolutionEvidence.window.year--},
  r=>{r.resolutionEvidence.window.convention='price-only'},
  r=>{r.resolutionEvidence.responseSha256='not-a-hash'},
  r=>{r.resolutionEvidence.window.sourceRuntime.kind='cache'},
  r=>{r.resolutionEvidence.window.sourceRuntime.event='pull_request'},
  r=>{r.resolutionEvidence.window.sourceRuntime.runId=''},
  r=>{r.resolutionEvidence.window.sourceRuntime.attempt=0},
  r=>{r.resolutionEvidence.window.sourceRuntime.codeRevision='main'},
  r=>{r.resolutionEvidence.window.sourceCheck.year--},
  r=>{r.resolutionEvidence.window.sourceCheck.start='2015-12-31'},
  r=>{r.resolutionEvidence.window.sourceCheck.end='2026-06-30'},
  r=>{r.resolutionEvidence.window.sourceCheck.startValue=0},
  r=>{r.resolutionEvidence.window.sourceCheck.dailyDerived=null},
  r=>{delete r.resolutionEvidence.window.sourceCheck},
  r=>{r.resolutionEvidence.checkedAt='2026-10-30'},
  r=>{r.resolutionEvidence.kind='unrecognised-proof'},
  r=>{delete r.resolutionEvidence},
 ]
 for(const mutate of wrong){const r=structuredClone(row);mutate(r);assert.equal(historicalResolutionProof(r,now),false,`${row.id}: mismatching evidence accepted`)}
}
const status={schemaVersion:1,updatedAt:fixture.sourceMonitorCheckedAt,workflows:{},monitoring:{resolved:fixture.rows}}
const issues=buildInbox({status,now}).issues.filter(r=>r.id.startsWith('history:history:automated-etf-monthly:'))
assert.equal(issues.length,6)
assert(issues.every(r=>r.kind==='history'&&!r.qualificationBlock),'Known exact proofs must reach the public inbox reducer')
assert.deepEqual(fixture.rows.map(r=>r.unqualifiedReturnWindow),JSON.parse(fs.readFileSync('scripts/fixtures/qualified-monthly-return-resolutions-20261029.json')).rows.map(r=>r.unqualifiedReturnWindow),'Original failed-window evidence remains unchanged')
console.log('Six actual public monthly resolutions recognised through inbox reducer; 138 mismatched/missing/cache/quote/future evidence variants rejected, original financial incidents preserved.')

const retained=buildInbox({status:{...status,monitoring:{active:Object.fromEntries(fixture.retained.map(r=>[r.id,r]))}},now}).issues.filter(r=>fixture.retained.some(f=>f.id===r.id))
assert.equal(retained.length,2)
for(const row of retained){
 const original=fixture.retained.find(r=>r.id===row.id)
 assert.equal(row.kind,'qualification');assert.equal(row.stage,'Qualification historique')
 assert.equal(row.originalKind,'conflict');assert.equal(row.qualificationBlock,'historical-resolution-unproven')
 assert.equal(row.cause,original.cause);assert.deepEqual(row.observations,original.observations)
 assert.equal(row.resolvedAt,undefined,'A changed classification never closes the old contradiction')
}
const activeAgain=structuredClone(fixture.retained[0]);delete activeAgain.proofStatus
const renewed=buildInbox({status:{...status,monitoring:{active:{[activeAgain.id]:activeAgain}}},now}).issues.find(r=>r.id===activeAgain.id)
assert.equal(renewed.kind,'failure','A source-reobserved conflict without the retention marker remains an active failure')
assert.equal(renewed.qualificationBlock,undefined)
console.log('Actual Bitwise superseded-photo incidents remain open qualifications with all original evidence; reobserved active source contradictions remain failures.')
