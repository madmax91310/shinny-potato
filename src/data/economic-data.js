import observations from './automated-economic.json' with { type: 'json' }
import { HISTORICAL_YEARS } from './annual-window.js'

export function economicCalendar(id, fallback, snapshot = observations) {
  const years = Object.fromEntries(HISTORICAL_YEARS.map((year, i) => [year, fallback[i]]))
  for (const [key, observation] of Object.entries(snapshot.benchmarks ?? {})) {
    if (key === `${id}:${observation.year}` && Number.isFinite(observation.value)) years[observation.year] = observation.value
  }
  return years
}
export function savingsRates(fallback, snapshot = observations) {
  return { ...fallback, ...Object.fromEntries(Object.values(snapshot.savings ?? {}).map(o => [o.effectiveAt.slice(0, 7), o.rate])) }
}
export function householdObservation(record, snapshot = observations) {
  const o = snapshot.households?.[record.id]
  if (!o || o.population !== (record.population ?? 'ménages') || !Number.isFinite(o.value)) return record
  return { ...record, value: o.value, ...(Number.isFinite(o.secondValue) ? { secondValue: o.secondValue } : {}),
    referencePeriod: o.referencePeriod, provisional: o.provisional, checkedAt: o.checkedAt, table: o.table,
    automatedEvidence: o, automation: 'official-source' }
}
export function householdSources(base) {
  const result = { ...base }
  for (const o of Object.values(observations.households ?? {})) {
    if (o.sourceKey && result[o.sourceKey]) result[o.sourceKey] = { ...result[o.sourceKey], title: o.sourceTitle, url: o.sourceUrl, publishedAt: o.publishedAt }
  }
  return result
}
export { observations as ECONOMIC_OBSERVATIONS }

export function currentSavingsObservation(snapshot = observations, today = new Date().toISOString().slice(0, 10)) {
  return Object.values(snapshot.savings ?? {}).filter(o => o.effectiveAt <= today).sort((a,b) => b.effectiveAt.localeCompare(a.effectiveAt))[0]
}
