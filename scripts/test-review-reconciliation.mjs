import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
execFileSync(process.execPath,['scripts/build-review-reconciliation.mjs'])
const original=JSON.parse(readFileSync('reports/reliquat-2026-10-23/reconciliation-90-ecarts.json')).cases
const report=JSON.parse(readFileSync('public/data/financial-reconciliation.json'))
assert.equal(report.rows.length,original.length)
assert.equal(report.summary.total,report.summary.open+report.summary.corrected+report.summary.nonComparable)
for(const row of original){
 const current=report.rows.find(r=>r.id===`${row.isin}/${row.year}`)
 assert(current)
 assert.equal(current.status,row.status,'A fresh HTTP response must never explain a historic financial discrepancy')
 assert.equal(current.original.differencePp,row.recollectedDifferencePp)
 assert.equal(current.original.marketReturn,row.recollectedMarketReturn)
 assert.equal(current.original.marketStartDate,row.marketStartDate)
 assert.equal(current.original.marketEndDate,row.marketEndDate)
 assert.equal(current.open,row.status==='anomalie encore inexpliquée')
 if(current.open)assert(current.missingPiece)
}
console.log('Every original alert, value, period and unresolved cause survives current source checks.')
