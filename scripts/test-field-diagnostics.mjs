import assert from 'node:assert/strict'
import {fieldDiagnostic} from './lib/field-diagnostics.mjs'
import {buildAssetFieldReport} from './report-asset-fields.mjs'
import {PEA_REVIEWS_BY_ISIN} from '../src/data/instrument-pea.js'
import {readFileSync} from 'node:fs'
assert.equal(fieldDiagnostic({field:'pea',present:true,status:{observed:['pea'],errors:[{error:'unrelated source'}]}}).code,'observed')
assert.equal(fieldDiagnostic({field:'listings',present:true,state:'check-overdue',status:{observed:['listings']}}).code,'partial-renewal')
assert.equal(fieldDiagnostic({field:'pea',present:true,status:{pending:['pea'],errors:[{sourceUrl:'issuer',error:'timeout'}]}}).code,'collection-incomplete')
assert.equal(fieldDiagnostic({field:'pea',present:false,status:{pending:['pea'],errors:[]}}).code,'not-observed')
assert.equal(fieldDiagnostic({present:false,gap:{status:'not-applicable',reason:'outside equity'}}).code,'not-applicable')
const report=buildAssetFieldReport('2026-10-18')
const sourceRecords=JSON.parse(readFileSync(new URL('./instrument-metadata-sources.json',import.meta.url))).instruments
const reordered=sourceRecords.slice().reverse().map(r=>({...r,urls:r.urls.slice().reverse()}))
assert.deepEqual(buildAssetFieldReport('2026-10-18',{metadataSourceRecords:reordered}),report,'Equivalent source discovery order cannot invalidate a prepared publication')
const changed=structuredClone(sourceRecords),target=changed.find(r=>report.rows.some(o=>o.id===r.isin&&o.field==='listings'&&o.sourceUrls?.length))
target.urls.push('https://example.com/isolated-additional-source')
const changedReport=buildAssetFieldReport('2026-10-18',{metadataSourceRecords:changed})
assert.notDeepEqual(changedReport,report,'An actual source change must remain visible')
const before=report.rows.find(r=>r.id===target.isin&&r.field==='listings'),after=changedReport.rows.find(r=>r.id===target.isin&&r.field==='listings')
assert(after.sourceUrls.includes('https://example.com/isolated-additional-source'))
assert.deepEqual({...after,sourceUrls:before.sourceUrls},before,'No financial value, date or source outcome is renewed')
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
