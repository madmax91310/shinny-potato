import { COMPARISON_ETF_DETAILS } from '../../../data/comparison-etf-details.js'
import { getComparisonPerformance } from '../../tweet-midi/comparisonPerformance.js'

export const comparisonPct = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const weight = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const date = value => value ? value.split('-').reverse().join('/') : ''
export function buildComparisonEtfDetails(etf, selectedYears) {
  const performance = getComparisonPerformance(etf.isin, selectedYears)
  const details = COMPARISON_ETF_DETAILS[etf.isin]
  const lines = [`📊 Performances de cet ${etf.isCopperEtc || /\bETC\b/.test(etf.nom) ? 'ETC' : 'ETF'}${performance ? ` (${performance.currency})` : ''}`]
  for (const year of selectedYears ?? performance?.rows.map(row => row.year) ?? []) {
    const row = performance?.rows.find(row => row.year === year)
    lines.push(`${year} : ${row ? comparisonPct(row.pct) : 'non disponible'}`)
  }
  const exposure = details?.basis === 'tracked-index'
  const holdingsDate = date(details?.holdingsAsOf ?? details?.asOf)
  const sectorsDate = date(details?.sectorsAsOf ?? details?.asOf)
  if (details?.holdings?.length) {
    lines.push('', `🏢 ${exposure ? 'Principales entreprises de l’indice suivi' : 'Principales positions du fonds'}${holdingsDate ? ` au ${holdingsDate}` : ''}`,
      ...details.holdings.slice(0, 3).map(([name, value]) => `${name} : ${weight(value)}`))
  } else lines.push('', '🏢 Principales positions : non disponibles')
  if (details?.sectors?.length) {
    lines.push('', `🏭 ${exposure ? 'Secteurs de l’indice suivi' : 'Répartition sectorielle du fonds'}${sectorsDate ? ` au ${sectorsDate}` : ''}`,
      ...details.sectors.map(([name, value]) => `${name} : ${weight(value)}`))
  } else lines.push('', '🏭 Répartition sectorielle : non disponible')
  return lines
}
