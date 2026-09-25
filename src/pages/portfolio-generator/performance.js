import { YEARS } from './data.js'

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
