import { getInstrumentAnnualPerformance } from '../../data/instrument-returns.js'

export function getAnnualPerformance(etf) {
  return getInstrumentAnnualPerformance(etf.isin)
}

export function formatAnnualPerformance(series) {
  const entries = performanceEntries(series)
  if (!entries.length) return series.note
  return entries.map(({ label, value, asOf }) => `${label} ${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %${asOf ? ` (au ${formatPerformanceDate(asOf)})` : ''}`).join(' · ')
}

export function annualPerformanceRange(series) {
  const first = series.values.findIndex(Number.isFinite)
  if (first < 0) return series.observations?.length ? 'sur les périodes publiées' : 'non encore publiées'
  const last = series.values.findLastIndex(Number.isFinite)
  return first === last ? String(2020 + first) : `${2020 + first}–${2020 + last}`
}

export function formatPerformanceDate(date) {
  return date.split('-').reverse().join('/')
}

export function performanceEntries(series) {
  const annual = series.values.flatMap((value, index) => Number.isFinite(value) ? [{ label: String(2020 + index), value }] : [])
  return annual.length ? annual : series.observations ?? []
}

export function performanceImageHeading(series) {
  if (series.values.some(Number.isFinite)) return `Performances annuelles · ${annualPerformanceRange(series)} · ${series.currency}`
  const asOf = series.observations?.[0]?.asOf
  return asOf ? `Performances · ${series.currency} · au ${formatPerformanceDate(asOf)}` : 'Historique de performance'
}
