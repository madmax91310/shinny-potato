import { latestCommonYears, performanceYears, calendarMap, HISTORICAL_YEARS } from '../../data/annual-window.js'
export { performanceYears }
export const assetReturn = (asset, year) => (asset.calendarReturns ?? calendarMap(asset.r))[year]

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
    '📈 Performances annuelles simulées',
    ...YEARS.map(year => `${year} : ${formatPerformance(perf?.[year])}`),
    '',
    `📊 Performance annualisée (${YEARS[0]} à ${YEARS.at(-1)}) : ${formatPerformance(annualized)}${annualized === null ? '' : ' par an'}`,
  ].join('\n')
}
