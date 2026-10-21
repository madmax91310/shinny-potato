import { SHEETS as indexSheets } from '../../data/index-factsheets.js'
import observations from '../../data/index-company-compositions.json' with { type: 'json' }
// Additional composition subjects stay in this tool; no performance is invented.
const additional = [
  ['cac40', 'CAC 40'], ['dow-jones', 'Dow Jones Industrial Average'],
  ['dax', 'DAX'], ['msci-korea', 'MSCI Korea'],
].map(([id, title]) => {
  const facts = observations[id]?.visualFacts
  return { id, title, index: title, compositionOnly: true, indexFacts: facts ?? {},
    snapshot: facts?.asOf ?? 'indisponible', source: facts?.source ? [facts.source] : [],
    countries: facts?.countries ?? [], sectors: facts?.sectors ?? [], holdings: facts?.holdings ?? [],
    constituents: facts?.constituents ?? null, returns: [], performance: { kind: 'indice', detail: '', date: '' } }
})
export const SHEETS = [...indexSheets.map(sheet => sheet.id === 'nasdaq-pea' ? { ...sheet, title: 'Nasdaq-100' } : sheet), ...additional]
