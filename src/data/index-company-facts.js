import observations from './index-company-observations.json' with { type: 'json' }
// Common index registry entries; no fund count or return series is substituted.
const scopes = { cac40: 'France, grandes entreprises', 'dow-jones': 'États-Unis, grandes entreprises', dax: 'Allemagne, grandes entreprises', 'msci-korea': 'Corée du Sud, grandes et moyennes capitalisations' }
export const COMPANY_INDEX_IDS = Object.keys(scopes)
export const COMPANY_INDEX_FACTS = Object.fromEntries(COMPANY_INDEX_IDS.flatMap(id => {
  const record = observations[id]
  if (!record?.facts) return []
  const history = { ...record.factsHistory, [record.facts.asOf]: record.facts }
  return [[id, Object.fromEntries(Object.entries(history).map(([date, facts]) => [date, { ...facts, markets: scopes[id],
    snapshot: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) }]))]]
}))
export function getCompanyIndexFacts(id) {
  const history = COMPANY_INDEX_FACTS[id] ?? {}
  return history[Object.keys(history).sort().at(-1)]
}
