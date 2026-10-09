import { latestCommonYears, performanceYears, calendarMap, HISTORICAL_YEARS } from '../../data/annual-window.js'
export { performanceYears }
import { getInstrumentDuelSeries } from '../../data/instrument-returns.js'
import { PORTFOLIO_RETURN_EVIDENCE } from '../../data/portfolio-return-evidence.js'
import annualFx from '../../data/annual-fx.json' with { type: 'json' }
import { getAsset } from '../../data/portfolio-assets.js'
import { dataLabels } from './compact.js'

// These exceptions describe the historical series, not the trading currency.
const historicalCurrencies = { fonds_euros: 'EUR', scpi: 'EUR', msci_world_amundi_pea: 'EUR', smallcap_europe: 'EUR', qyld_ucits: 'USD', oblig_hy_amundi: 'EUR' }
export function returnCurrency(asset) {
  const isin = asset.isin ?? getAsset(asset.id)?.isin
  return historicalCurrencies[asset.id] ?? getInstrumentDuelSeries(isin)?.currency
    ?? PORTFOLIO_RETURN_EVIDENCE[isin]?.currency ?? asset.returnCurrency ?? null
}
export function assetReturn(asset, year) {
  const original = (asset.calendarReturns ?? calendarMap(asset.r))[year]
  if (!Number.isFinite(original)) return null
  const currency = returnCurrency(asset)
  if (currency === 'EUR') return original
  if (currency !== 'USD') return null
  const start = annualFx.years[year - 1]?.value
  const end = annualFx.years[year]?.value
  return start > 0 && end > 0 ? ((1 + original / 100) * start / end - 1) * 100 : null
}

export function performanceNotes(selection) {
  const notes = ['En euros · pondérations rétablies chaque année · hors courtage et fiscalité.']
  if (selection.some(asset => returnCurrency(asset) === 'USD')) notes.push('Rendements USD convertis en EUR avec les taux BCE de fin d’année.')
  const proxies = selection.filter(asset => dataLabels(asset).includes('Historique reconstitué') || ['fonds_euros', 'scpi'].includes(asset.id))
  if (proxies.length) notes.push('Historiques indicatifs : ' + proxies.map(asset => `${asset.name} — ${asset.confidenceNote ?? 'historique reconstitué'}`).join(' ; '))
  if (selection.some(asset => !returnCurrency(asset))) notes.push('Performance indisponible : devise historique non documentée pour une ligne.')
  return notes.join('\n')
}

// Chaque ligne est repondérée au début de l'année ; même calcul pour le Générateur et les duels.
export function computeYearlyPerf(selection) {
  const perf = {}
  const maps = selection.map(asset => asset.calendarReturns ?? calendarMap(asset.r))
  const years = latestCommonYears(maps)
  // No mixed periods: retain the explicitly dated archive if a live window is unavailable.
  const selectedYears = years.length ? years : HISTORICAL_YEARS
  selectedYears.forEach(year => {
    perf[year] = selection.some((asset) => !Number.isFinite(assetReturn(asset, year)))
      ? null
      : selection.reduce((sum, asset) => sum + assetReturn(asset, year) * asset.pct / 100, 0)
  })
  return perf
}

// Même capitalisation géométrique pour le tweet et l’image, sur toute la période.
export function annualizedReturn(perf) {
  const YEARS = performanceYears(perf)
  if (!YEARS.length || !YEARS.every(year => Number.isFinite(perf?.[year]))) return null
  const growth = YEARS.reduce((product, year) => product * (1 + perf[year] / 100), 1)
  return growth > 0 ? (Math.pow(growth, 1 / YEARS.length) - 1) * 100 : null
}

export function formatPerformance(value) {
  return Number.isFinite(value)
    ? `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
    : 'non disponible'
}

export function performanceExcerpt(perf) {
  const YEARS = performanceYears(perf)
  const annualized = annualizedReturn(perf)
  return [
    '📈 Performances annuelles simulées (EUR)',
    ...YEARS.map(year => `${Number.isFinite(perf?.[year]) ? perf[year] >= 0 ? '🟢 ' : '🔴 ' : ''}${year} : ${formatPerformance(perf?.[year])}`),
    '',
    `📊 Performance annualisée (${YEARS[0]} à ${YEARS.at(-1)}) : ${formatPerformance(annualized)}${annualized === null ? '' : ' par an'}`,
  ].join('\n')
}

