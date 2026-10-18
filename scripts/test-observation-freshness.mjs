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

const {fieldState,productFieldEvidence}=await import('./report-asset-fields.mjs')
const checkedAt='2026-10-18'
assert.equal(fieldState({checkedAt,periodEnd:'2020-01'},checkedAt),'publication-old')
for(const asOf of ['date-invalide','2026-02-30','2027-01-01'])assert.equal(fieldState({checkedAt,asOf},checkedAt),'invalid-date')
assert.equal(fieldState({checkedAt,years:{2020:4}},checkedAt,{dataDays:550}),'publication-old')
assert.equal(fieldState({checkedAt,asOf:'2022-01-01'},checkedAt,{effectiveDate:true}),'current')
assert.equal(fieldState({checkedAt},checkedAt,{requireObservation:true}),'undated-observation')
const euroFunds=productFieldEvidence([{years:[{year:2025}]},{years:[{year:2020}]}],{checkedAt},'euroFunds')
assert.equal(fieldState(euroFunds,checkedAt,{dataDays:550}),'publication-old')
