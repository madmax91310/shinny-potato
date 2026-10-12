import records from './automated-indices.json' with { type: 'json' }
import { latestCommonYears } from './annual-window.js'
import { normalizeEvidence } from './evidence.js'
import { getCurrentIndexFacts, buildAutomatedIndexSnapshot } from './index-facts.js'

// These sheets have no numerical archive fallback: every displayed observation
// comes from the validated records maintained by the daily issuer workflow.
export const AUTOMATED_SHEET_DEFINITIONS = [
  { id: 'msci-em-imi', title: 'MSCI Emerging Markets IMI',
    takeaway: 'IMI ajoute les petites capitalisations aux émergents classiques. Les plus grandes entreprises peuvent toutefois garder beaucoup de poids.' },
  { id: 'ftse-all-world-high-dividend-yield', title: 'FTSE All-World High Dividend Yield',
    takeaway: 'Le filtre de dividendes change la sélection du All-World. Un dividende élevé ne garantit ni un revenu stable ni une meilleure performance.' },
  { id: 'sp-global-dividend-aristocrats', title: 'S&P Global Dividend Aristocrats Quality Income',
    takeaway: 'La sélection associe dividendes et qualité financière. Ces critères ne protègent pas le capital et les dividendes peuvent diminuer.' },
  { id: 'msci-world-growth', title: 'MSCI World Growth',
    takeaway: 'Growth décrit un filtre de sélection, sans promettre une hausse des cours. Ce panier peut évoluer différemment du World classique.' },
  { id: 'sp500-equal-weight', title: 'S&P 500 Equal Weight' },
  { id: 'world-ex-usa', title: 'MSCI World ex USA' },
  { id: 'msci-world-minimum-volatility-usd', title: 'World Minimum Volatility (USD)' },
  { id: 'msci-world-sector-neutral-quality', title: 'World Sector Neutral Quality' },
  { id: 'msci-world-enhanced-value', title: 'World Enhanced Value' },
  { id: 'sp-euro-dividend-aristocrats', title: 'S&P Euro High Yield Dividend Aristocrats',
    takeaway: 'La sélection reste limitée à la zone euro. La régularité passée des dividendes ne garantit ni les prochains versements ni la valeur des actions.' },
  { id: 'sp-us-dividend-aristocrats', title: 'S&P High Yield Dividend Aristocrats',
    takeaway: 'La sélection reste américaine. Une longue période de hausse des dividendes ne protège pas contre une baisse des cours ou une réduction des prochains versements.' },
]

export function buildAutomatedIndexSheets(observations = records, now = new Date()) {
  return AUTOMATED_SHEET_DEFINITIONS.map(definition => {
    const { facts, returns } = observations[definition.id] ?? {}
    if (!facts?.asOf || !Number.isInteger(facts.constituents) || facts.constituents <= 0 ||
        !['countries', 'sectors', 'holdings'].every(field => facts[field]?.length &&
          facts[field].every(([label, value]) => label && Number.isFinite(value) && value >= 0 && value <= 100)) ||
        !returns?.asOf || !['NET', 'GROSS', 'TOTAL'].includes(returns.variant) ||
        returns.performance?.kind !== 'indice' || !/dividendes.*réinvestis/.test(returns.performance.detail) ||
        ![facts.source, returns.source].every(source => source?.url?.startsWith('https://') && source.checkedAt && /^[a-f0-9]{64}$/.test(source.sha256))) {
      throw new Error(`Données automatisées complètes exigées : ${definition.id}`)
    }
    const years = latestCommonYears([Object.fromEntries(returns.values)], { length: 5, now })
    if (years.length !== 5) throw new Error(`Cinq années complètes exigées : ${definition.id}`)
    const values = returns.values.filter(([year]) => years.includes(year)).sort((a, b) => b[0] - a[0])
    const snapshot = new Date(`${facts.asOf}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    const canonical = getCurrentIndexFacts(definition.id, records[definition.id].facts.asOf)
    const indexFacts = observations === records ? canonical : {
      ...buildAutomatedIndexSnapshot(facts, canonical), snapshot,
      metadata: normalizeEvidence({ ...facts.source, asOf: facts.asOf, scope: definition.title, method: 'Composition officielle automatisée' }) }
    const { constituents, markets, marketCap, countries, sectors, holdings, topWeight } = indexFacts
    return { ...definition, index: indexFacts.index, indexFacts, snapshot: indexFacts.snapshot,
      constituents, markets, marketCap, countries, sectors, holdings, topWeight,
      source: [facts.source, returns.source], returns: values,
      performance: { kind: 'indice', detail: returns.performance.detail, date: returns.performance.date },
    }
  })
}
