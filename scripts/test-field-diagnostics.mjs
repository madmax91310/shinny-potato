import assert from 'node:assert/strict'
import {fieldDiagnostic} from './lib/field-diagnostics.mjs'
import {buildAssetFieldReport} from './report-asset-fields.mjs'
import {PEA_REVIEWS_BY_ISIN} from '../src/data/instrument-pea.js'
assert.equal(fieldDiagnostic({field:'pea',present:true,status:{observed:['pea'],errors:[{error:'unrelated source'}]}}).code,'observed')
assert.equal(fieldDiagnostic({field:'listings',present:true,state:'check-overdue',status:{observed:['listings']}}).code,'partial-renewal')
assert.equal(fieldDiagnostic({field:'pea',present:true,status:{pending:['pea'],errors:[{sourceUrl:'issuer',error:'timeout'}]}}).code,'collection-incomplete')
assert.equal(fieldDiagnostic({field:'pea',present:false,status:{pending:['pea'],errors:[]}}).code,'not-observed')
assert.equal(fieldDiagnostic({present:false,gap:{status:'not-applicable',reason:'outside equity'}}).code,'not-applicable')
const report=buildAssetFieldReport('2026-10-18')
for(const row of report.rows.filter(r=>r.type==='instrument'&&r.field==='pea')) {
 const review=PEA_REVIEWS_BY_ISIN[row.id]
 assert.equal(row.present,typeof review?.eligible==='boolean'&&!!review.sourceUrl,`${row.id}: unknown and false must remain distinct`)
 if(row.present) assert.equal(row.checkedAt,review.checkedAt)
 assert.ok(Array.isArray(row.sourceUrls))
 if(row.state==='not-applicable'){
  assert.deepEqual(row.sourceUrls,[])
  assert.equal(row.checkedAt,null)
  assert.equal(row.asOf,null)
  assert.equal(row.automationConfigured,false)
 }
}
assert.ok(report.rows.some(r=>r.field==='listings'&&r.present))
console.log('Field diagnostics: retained observations, incomplete collections, unknown PEA and registry dates verified.')
