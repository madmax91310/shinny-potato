import { qualifyExposureClassification } from '../src/lib/exposure-classification.js'
import { EXPOSURE_MAX_AGE_DAYS } from '../src/pages/dca-profiles/exposure.js'

// Prefer the documented risk-country contract while it is still current.
// A newer published geography table is a different contract, not an update to it.
export function selectDcaCountryObservation(observation, source, now = new Date()) {
  const risk = source?.countriesRisk
  const candidate = risk && { ...risk, provider: source.provider, basis: 'fund' }
  const classification = candidate && qualifyExposureClassification(candidate, 'countries')
  const date = Date.parse(`${candidate?.asOf}T00:00:00Z`)
  const today = Date.parse(now.toISOString().slice(0, 10) + 'T00:00:00Z')
  const age = (today - date) / 86400000
  const validDate = Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === candidate.asOf
  const sum = candidate?.rows?.reduce((total, row) => total + row.weightPct, 0)
  if (classification?.id === 'ishares-risk-net' && validDate && age >= 0 && age <= EXPOSURE_MAX_AGE_DAYS
      && candidate.sourceUrl && sum >= 99 && sum <= 100.5
      && candidate.rows.every(row => Number.isFinite(row.weightPct) && row.weightPct >= 0)) {
    return { ...candidate, classificationMetadata: classification }
  }
  return observation
}
