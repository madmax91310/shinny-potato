import { INDEX_RETURNS } from './index-returns.js'

// Sélection explicite de la version d’indice ; jamais de fallback vers une part ETF.
const HISTORICAL = '2026-08-31'
const PERIOD_END = '2025-12-31'
const selections = {
 'monde-facteurs': ['world','msci-world-sector-neutral-quality','msci-world-momentum','msci-world-minimum-volatility-usd'],
 'monde-toutes-tailles': ['world','acwi',['acwi-imi','2026-09-30']],
  'usa-constructions': ['sp500-pea', 'sp500-equal-weight', ['russell-2000', HISTORICAL]],
  europe: [['stoxx600', HISTORICAL], ['eurostoxx50', HISTORICAL], 'mscieurope'],
  monde: [['world', HISTORICAL], ['acwi', HISTORICAL], ['ftse-all-world', HISTORICAL]],
  usa: ['sp500-pea', 'nasdaq-pea', 'msci-usa', 'russell-1000'],
  'emergents-pea': ['em-esg', 'msci-em-asia-screened', 'msci-em-latin-america-selection', 'msci-india', 'msci-em-emea-esg'],
  'emergents-cto': ['msci-em-imi', 'ftse-em', 'msci-em-ex-china'],
  style: ['msci-world-enhanced-value', 'msci-world-sector-neutral-quality', 'msci-world-growth'],
  'dividendes-cto': ['ftse-all-world-high-dividend-yield', 'msci-world-high-dividend-yield-advanced-select', 'sp-global-dividend-aristocrats'],
  'dividendes-pea': ['sp-global-dividend-aristocrats', 'sp-euro-dividend-aristocrats'],
  chine: ['msci-china', 'ftse-china-50', 'msci-china-a'],
  japon: ['nikkei225', 'topix', 'msci-japan-imi'],
  crypto: ['bitcoin', 'ethereum'],
  'or-argent': ['gold-physical', 'silver-physical'],
  'monde-segments': [['world', HISTORICAL], ['world-ex-usa', HISTORICAL], ['world-small-cap', HISTORICAL]],
}
const existingLabels = { 'acwi-imi': 'MSCI ACWI IMI', world: 'MSCI World', acwi: 'MSCI ACWI', 'ftse-all-world': 'FTSE All-World', 'world-ex-usa': 'MSCI World ex USA', 'world-small-cap': 'MSCI World Small Cap', 'russell-2000': 'Russell 2000', stoxx600: 'STOXX 600', eurostoxx50: 'EURO STOXX 50' }
const currencyNames = { USD: 'dollars', EUR: 'euros', JPY: 'yens', HKD: 'dollars de Hong Kong' }

export function getIndexComparisonPerformance(family) {
  const selected = selections[family.id]
  if (!selected || selected.length !== family.indices.length) throw new Error(`Séries de comparaison absentes : ${family.id}`)
  return selected.map(selection => {
    const [id, asOf] = Array.isArray(selection) ? selection : [selection, PERIOD_END]
    const series = INDEX_RETURNS[id]?.[asOf]
    if (!series) throw new Error(`Rendements d’indice absents : ${id}/${asOf}`)
    const values = Object.fromEntries(series.values.map(([year, value]) => [`y${year}`, value]))
    const method = series.method ?? (/hors dividendes/.test(series.performance.detail) ? 'hors dividendes' : 'dividendes réinvestis')
    return { key: id, label: existingLabels[id] ?? series.performance.detail.split(' · ')[0],
      ...values, currency: series.metadata.currency, method, kind: series.performance.kind,
      source: series.source, metadata: series.metadata, note: series.note }
  })
}
export function getIndexComparisonPerformanceHeading(family, rows = getIndexComparisonPerformance(family)) {
  const asset = ['crypto', 'or-argent'].includes(family.id)
  const subject = asset ? 'actifs' : 'indices'
  const sameBasis = rows.every(row => row.currency === rows[0].currency && row.method === rows[0].method)
  if (!sameBasis) return `📈 Les performances des ${subject}, avec la devise et la méthode de chaque série :`
  const basis = asset ? `en ${currencyNames[rows[0].currency]}` : `en ${currencyNames[rows[0].currency]} et ${rows[0].method}`
  return `📈 Les performances des ${family.id === 'monde' ? 'trois ' : ''}${subject}, ${basis} :`
}
export function getIndexComparisonPerformanceLabel(row, rows) {
  const sameBasis = rows.every(item => item.currency === rows[0].currency && item.method === rows[0].method)
  return sameBasis ? row.label : `${row.label} (${row.currency ?? 'devise à confirmer'}, ${row.method})`
}
