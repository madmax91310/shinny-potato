import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
execFileSync(process.execPath,['scripts/build-review-reconciliation.mjs'])
const original=JSON.parse(readFileSync('reports/reliquat-2026-10-23/reconciliation-90-ecarts.json')).cases
const report=JSON.parse(readFileSync('public/data/financial-reconciliation.json'))
const integrated=JSON.parse(readFileSync('reports/data-review-2026-10-23/preuves/reconciliation-79-master-integre.json'))
const currentCases=new Map(integrated.rows.map(r=>[`${r.isin}/${r.year}`,r]))
assert.equal(report.rows.length,original.length)
assert.equal(report.summary.total,report.summary.open+report.summary.corrected+report.summary.correctedWithResidual+report.summary.nonComparable)
for(const row of original){
 const current=report.rows.find(r=>r.id===`${row.isin}/${row.year}`)
 assert(current)
 assert.equal(current.initialStatus,row.status,'The initial alert is never rewritten')
 assert.equal(current.status,currentCases.get(current.id)?.status||row.status,'Only the integrated proof registry can change a financial cause; never the latest HTTP response')
 if(current.status!==current.initialStatus)assert(current.resolutionEvidence)
 assert.equal(current.original.differencePp,row.recollectedDifferencePp)
 assert.equal(current.original.marketReturn,row.recollectedMarketReturn)
 assert.equal(current.original.marketStartDate,row.marketStartDate)
 assert.equal(current.original.marketEndDate,row.marketEndDate)
 assert.equal(current.open,current.status==='anomalie encore inexpliquée')
 if(current.open)assert(current.missingPiece)
}
const wfns=report.rows.find(r=>r.id==='IE00BJ5JP097/2023')
assert.equal(wfns.open,false)
assert.equal(wfns.residualOpen,true,'The proved missing dividend does not attribute the remaining market/NAV residual')
console.log('Every original alert, value and period survives; only integrated financial proof updates its status, with residuals preserved.')
