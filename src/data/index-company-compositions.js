import records from './index-company-compositions.json' with { type: 'json' }
import policy from './freshness-policy.json' with { type: 'json' }
export { aggregateCompanies, calculateConcentration, roundedComposition } from './index-concentration-core.js'
export function getIndexConcentration(id, now = new Date()) {
  const record = records[id]
  if (!record?.available) return { ...record, available: false, status: 'unavailable', reason: record?.reason ?? 'Aucune composition exploitable pour cet indice.' }
  const age = value => (now - new Date(value)) / 86400000
  const rule = policy.fields[record.approximation ? 'etf.default' : 'index.facts']
  const stale = age(record.asOf) > rule.dataDays || age(record.checkedAt) > rule.checkDays
  return { ...record, status: stale ? 'stale' : 'available' }
}

export function retainedCompositionDate(composition) {
  const { available, retained, refresh, asOf, checkedAt } = composition
  if (!available || refresh?.status !== 'failed') return null
  const retainedByCollector = refresh.asOf === asOf && refresh.lastSuccessAt === checkedAt &&
    Date.parse(refresh.checkedAt) > Date.parse(checkedAt)
  return retained || retainedByCollector ? asOf : null
}
// The historical tweet and its performance/currency conventions remain untouched.
// Only the render model receives a coherent, explicitly qualified composition.
export function compositionImageSheet(sheet, concentration) {
  if (!concentration.available) return sheet
  const facts = concentration.visualFacts
  // A ten-company view does not need countries/sectors. Never borrow another
  // photograph to turn that capability into the complete classic factsheet.
  if(!facts?.countries?.length||!facts?.sectors?.length)return sheet
  return { ...sheet, countries: facts.countries, sectors: facts.sectors, holdings: facts.holdings,
    constituents: facts.constituents, indexFacts: { ...sheet.indexFacts, ...facts },
    concentration, snapshot: facts.asOf }
}
