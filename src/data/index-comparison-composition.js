// Résumés cohérents pour le PNG et le tweet ; le détail reste dans le registre.
export const cleanExposureLabel = label => label.replace(/^[^\p{L}\p{N}]+/u, '').trim()
export const exposurePercent = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
export function completeIndexAllocation(entries, remainderLabel) {
  if (!entries?.length) return []
  const remainder = Math.round((100 - entries.reduce((sum, [, value]) => sum + value, 0)) * 100) / 100
  return remainder > 0.2 ? [...entries, [remainderLabel, remainder]] : entries
}
export function summarizeIndexAllocation(entries, limit = 3, remainderLabel = 'Autres') {
  if (!entries?.length) return []
  const valid = entries.filter(([, value]) => Number.isFinite(value) && value >= 0 && value <= 100)
  const main = valid.filter(([name]) => !/autres|other/i.test(name)).sort((a, b) => b[1] - a[1]).slice(0, limit)
  const remainder = Math.round((100 - main.reduce((sum, [, value]) => sum + value, 0)) * 100) / 100
  return remainder > 0.05 ? [...main, [remainderLabel, remainder]] : main
}
export function getIndexComparisonComposition(index) {
  const facts = index.indexFacts
  if (facts?.metadata?.sourceStatus !== 'documented') return null
  return { count: facts.constituents, targetCount: facts.targetConstituents, asOf: facts.asOf,
    countries: summarizeIndexAllocation(facts.countries, 3, 'Autres pays'),
    sectors: summarizeIndexAllocation(facts.sectors, 3, 'Autres secteurs'),
    classification: facts.sectorClassification ?? null }
}
