import assert from 'node:assert/strict'
import { scheduledReview } from '../src/pages/data-review/lib.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
const today = '2026-10-14'
const base = { checkedAt: today, metadata: { asOf: '2026-06-30' } }
for (const field of [
  { registry: 'src/data/instrument-aum.js', label: 'Encours' },
  { registry: 'src/data/instrument-aum-observations.js', label: 'Encours daté' },
  { registry: 'src/data/index-facts.js', label: 'Composition courante · juin 2026' },
]) {
  const old = scheduledReview(base, field, today)
  assert.equal(old.category, 'stale')
  assert.equal(old.nextReviewAt, '2026-09-30')
  for (const asOf of ['2026-02-30', 'invalid']) assert.equal(scheduledReview({ ...base, metadata: { asOf } }, field, today).category, 'undated')
  assert.equal(scheduledReview({ ...base, metadata: { asOf: '2026-10-15' } }, field, today).category, 'future-date')
  assert.equal(scheduledReview({ ...base, metadata: { asOf: '2026-09-30' } }, field, today).category, 'current')
}
assert.equal(scheduledReview(base, { registry: 'src/data/index-facts.js', label: 'Photographie · juin 2026' }, today).category, 'current', 'A dated archive does not pretend to be the current composition')
assert.equal(scheduledReview(base, { registry: 'src/data/etf-ter.js', label: 'Frais' }, today).category, 'current', 'An unchanged fee can be rechecked without changing its effective date')
for (const record of DATA_CATALOG) for (const field of record.fields) assert(!/undefined|NaN/.test(field.label), `${record.id}: ${field.label}`)
console.log('Observation age: old, future and invalid AUM/composition dates; unchanged fees and historical archives; catalogue labels verified.')
