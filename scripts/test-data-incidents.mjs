import assert from 'node:assert/strict'
import {mergeCollectionReport} from './lib/data-incidents.mjs'
const previous = {errors: [{id: 'fund:aum', error: 'transport failed', lastSuccessAt: '2026-09-01'}],
  successes: [{id: 'fund:aum'}, {id: 'fund:ter'}]}
const report = mergeCollectionReport(previous,
  [{id: 'fund:aum', error: 'check-overdue'}, {id: 'fund:pea:qualification', error: 'source conflict'}],
  [{id: 'fund:ter'}])
assert.equal(report.errors.length, 2)
assert.equal(report.errors[0].lastSuccessAt, '2026-09-01')
assert.deepEqual(report.errors[0].reasons, ['transport failed', 'check-overdue'])
assert.deepEqual(report.successes, [{id: 'fund:ter'}])
assert.deepEqual(mergeCollectionReport(report, report.errors, report.successes), report)
console.log('Distinct incidents, provenance and failed/successful field separation validated.')
