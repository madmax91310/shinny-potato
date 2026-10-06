import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js'
import { assertReviewObservation } from './lib/data-review-observation.mjs'

const closure = JSON.parse(readFileSync(new URL('./source-snapshots/data-review-2026-10-02.json', import.meta.url)))
const observation = closure.records.find(r => r.isin === 'LU1931975079')
const field = DATA_CATALOG.find(r => r.id === observation.isin).fields.find(f => f.label === 'Rendements 2020–2025')
const evidence = AUTOMATED_PERFORMANCE[observation.isin]
const fixture = { recordId: observation.isin, field: structuredClone(field), observation,
  closureCheckedAt: closure.checkedAt, automated: structuredClone(evidence), today: '2026-10-06' }
fixture.automated.checkedAt = fixture.field.metadata.checkedAt = '2026-10-05'
assertReviewObservation(fixture)
// Reproduce the exact former failure: the validated certification advances from
// 4 to 5 October, while a consumer must still agree with the current proof.
for (const date of ['2026-10-04', '2026-10-05', '2026-10-06']) {
  const next = structuredClone(fixture)
  next.automated.checkedAt = next.field.metadata.checkedAt = date
  assertReviewObservation(next)
}
const rejects = (label, change, message) => {
  const bad = structuredClone(fixture)
  change(bad)
  assert.throws(() => assertReviewObservation(bad), message, label)
}
rejects('changed value', f => { f.field.value[0] += 1 }, /valeur différente/)
rejects('missing source', f => { f.field.metadata.sourceUrls = [] }, /source contrôlée/)
rejects('different source', f => { f.field.metadata.sourceUrls = ['https://example.org'] }, /source contrôlée/)
rejects('consumer date ahead of proof', f => { f.field.metadata.checkedAt = '2026-10-06' }, /contrôle différent/)
rejects('older proof', f => { f.automated.checkedAt = f.field.metadata.checkedAt = '2026-10-01' }, /antérieure/)
for (const date of [null, '2026-02-30', 'not-a-date']) {
  rejects(`invalid consumer date ${date}`, f => { f.field.metadata.checkedAt = date }, /invalide/)
  rejects(`invalid proof date ${date}`, f => { f.automated.checkedAt = date }, /invalide/)
}
rejects('future proof', f => { f.automated.checkedAt = f.field.metadata.checkedAt = '2026-10-07' }, /future/)
rejects('future value', f => { f.field.metadata.asOf = '2026-10-07' }, /postérieure/)
rejects('wrong currency', f => { f.field.metadata.currency = 'USD' }, /devise différente/)
// Dates alone cannot recertify historical observations with no current evidence.
const historical = structuredClone(fixture)
historical.automated = null
historical.field.value = observation.values
historical.field.metadata.checkedAt = closure.checkedAt
historical.field.metadata.sourceUrls = observation.sourceUrls
assertReviewObservation(historical)
historical.field.metadata.checkedAt = '2026-10-05'
assert.throws(() => assertReviewObservation(historical), /contrôle différent/)
console.log('Recertification LU1931975079 : dates plus récentes validées ; valeurs, sources, devises, dates invalides/futures et archives protégées.')
