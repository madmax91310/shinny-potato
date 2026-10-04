import { YEARS } from '../../data/portfolio-assets.js'

// Chaque ligne est repondérée au début de l'année ; même calcul pour le Générateur et les duels.
export function computeYearlyPerf(selection) {
  const perf = {}
  YEARS.forEach((year, index) => {
    perf[year] = selection.some((asset) => !Number.isFinite(asset.r[index]))
      ? null
      : selection.reduce((sum, asset) => sum + asset.r[index] * asset.pct / 100, 0)
  })
  return perf
}

// Même capitalisation géométrique pour le tweet et l’image, sur toute la période.
export function annualizedReturn(perf) {
  if (!YEARS.every(year => Number.isFinite(perf?.[year]))) return null
  const growth = YEARS.reduce((product, year) => product * (1 + perf[year] / 100), 1)
  return growth > 0 ? (Math.pow(growth, 1 / YEARS.length) - 1) * 100 : null
}

export function formatPerformance(value) {
  return Number.isFinite(value)
    ? `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
    : 'non disponible'
}

export function performanceExcerpt(perf) {
  const annualized = annualizedReturn(perf)
  return [
    '📈 Performances annuelles simulées',
    ...YEARS.map(year => `${year} : ${formatPerformance(perf?.[year])}`),
    '',
    `📊 Performance annualisée (${YEARS[0]} à ${YEARS.at(-1)}) : ${formatPerformance(annualized)}${annualized === null ? '' : ' par an'}`,
    '',
    'Simulation avec rééquilibrage annuel, sans conversion des devises.',
  ].join('\n')
}
