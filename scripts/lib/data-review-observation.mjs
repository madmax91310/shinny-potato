import assert from 'node:assert/strict'
import { dayNumber, parisToday } from '../../src/pages/data-review/lib.js'

// A new certification is accepted only against the current validated evidence,
// never merely because a consumer's date is later than the historical snapshot.
export function assertReviewObservation({ recordId, field, observation, closureCheckedAt, automated, reviewed, today = parisToday() }) {
  const context = `${recordId} / ${field.label}`
  const validDay = (date, label) => {
    const day = dayNumber(date)
    assert.notEqual(day, null, `${context}: ${label} invalide (${date})`)
    return day
  }
  const now = validDay(today, 'date actuelle')
  const baseline = validDay(closureCheckedAt, 'date de revue')
  const evidence = automated ?? reviewed
  const expectedDate = evidence ? evidence.checkedAt : closureCheckedAt
  const expectedDay = validDay(expectedDate, 'date de preuve')
  const checkedDay = validDay(field.metadata.checkedAt, 'date de contrôle')
  assert(expectedDay >= baseline, `${context}: preuve antérieure à la revue`)
  assert(expectedDay <= now && checkedDay <= now, `${context}: date de contrôle future`)
  assert.equal(field.metadata.checkedAt, expectedDate, `${context}: contrôle différent de la preuve validée`)
  const sources = evidence ? [evidence.source] : observation.sourceUrls
  assert(sources?.length && sources.every(url => typeof url === 'string' && /^https?:\/\//.test(url) && field.metadata.sourceUrls.includes(url)), `${context}: source contrôlée différente ou absente`)
  assert.deepEqual(observation.type === 'index' ? field.value.constituents : field.value,
    automated?.values ?? observation.constituents ?? observation.values, `${context}: valeur différente de la preuve validée`)
  if (observation.currency) assert.equal(field.metadata.currency, automated?.currency ?? observation.currency, `${context}: devise différente`)
  if (field.metadata.asOf) assert(validDay(field.metadata.asOf, 'date de valeur') <= checkedDay, `${context}: valeur postérieure au contrôle`)
}
