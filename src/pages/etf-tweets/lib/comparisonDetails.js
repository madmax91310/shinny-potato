import { COMPARISON_ETF_DETAILS } from '../../../data/comparison-etf-details.js'
import { getComparisonPerformance } from '../../tweet-midi/comparisonPerformance.js'
import { AUTOMATED_ETF } from '../../../data/automated-etf.js'
import { getComparisonPolicy, isComparisonEtc } from './comparisonPolicy.js'
import { commodityAllocationLines } from '../../../data/commodity-allocation.js'

export const comparisonPct = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const weight = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const date = value => value ? value.split('-').reverse().join('/') : ''
export function buildComparisonEtfDetails(etf, selectedYears) {
  const performance = getComparisonPerformance(etf.isin, selectedYears)
  const details = COMPARISON_ETF_DETAILS[etf.isin]
  const policy = getComparisonPolicy(etf)
  const lines = [`📊 Performances de cet ${isComparisonEtc(etf) ? 'ETC' : 'ETF'}${performance ? ` (${performance.currency})` : ''}`]
  for (const year of selectedYears ?? performance?.rows.map(row => row.year) ?? []) {
    const row = performance?.rows.find(row => row.year === year)
    lines.push(`${year} : ${row ? comparisonPct(row.pct) : 'non disponible'}`)
  }
  if (!lines.slice(1).length) lines.push('Historique annuel non disponible')
  // Chaque champ peut provenir d’un document différent : la collecte de secteurs
  // ne doit pas transformer des positions d’indice en positions détenues.
  const collected = AUTOMATED_ETF[etf.isin]
  const commodities = commodityAllocationLines(etf.isin)
  if (commodities.length) lines.push('', ...commodities)
  const holdingsExposure = collected?.holdings ? collected.holdings.basis === 'index' : details?.basis === 'tracked-index'
  const sectorsExposure = collected?.sectors ? collected.sectors.basis === 'index' : details?.basis === 'tracked-index'
  const holdingsDate = date(details?.holdingsAsOf ?? details?.asOf)
  const sectorsDate = date(details?.sectorsAsOf ?? details?.asOf)
  if (policy.showHoldings && details?.holdings?.length) {
    lines.push('', `🏢 ${holdingsExposure ? 'Principales entreprises de l’indice suivi' : 'Principales positions du fonds'}${holdingsDate ? ` au ${holdingsDate}` : ''}`,
      ...details.holdings.slice(0, 3).map(([name, value]) => `${name} : ${weight(value)}`))
  }
  const sectors = details?.sectors?.filter(([, value]) => value > 0) ?? []
  if (policy.showSectors && sectors.length) {
    lines.push('', `🏭 ${sectorsExposure ? 'Secteurs de l’indice suivi' : 'Répartition sectorielle du fonds'}${sectorsDate ? ` au ${sectorsDate}` : ''}`,
      ...sectors.map(([name, value]) => `${name} : ${weight(value)}`))
  }
  return lines
}
