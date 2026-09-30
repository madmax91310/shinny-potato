import { getInstrumentAnnualPerformance } from '../../data/instrument-returns.js'

export function getAnnualPerformance(etf) {
  return getInstrumentAnnualPerformance(etf.isin)
}

export function formatAnnualPerformance(series) {
  return [2020, 2021, 2022, 2023, 2024, 2025].flatMap((year, index) => {
    const value = series.values[index]
    return Number.isFinite(value) ? [`${year} ${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`] : []
  }).join(' · ')
}

export function annualPerformanceRange(series) {
  const first = series.values.findIndex(Number.isFinite)
  return `${2020 + first}–2025`
}
