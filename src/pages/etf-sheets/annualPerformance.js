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
  return first === last ? String(series.calendarYears?.[first] ?? 2020 + first) : `${series.calendarYears?.[first] ?? 2020 + first}–${series.calendarYears?.[last] ?? 2020 + last}`
}

export function formatPerformanceDate(date) {
  return date.split('-').reverse().join('/')
}

export function performanceEntries(series) {
  const annual = series.values.flatMap((value, index) => Number.isFinite(value) ? [{ label: String(series.calendarYears?.[index] ?? 2020 + index), value }] : [])
  return annual.length ? annual : series.observations ?? []
}

export function performanceImageHeading(series) {
  if (series.values.some(Number.isFinite)) return `Performances annuelles · ${annualPerformanceRange(series)} · ${series.currency}`
  const asOf = series.observations?.[0]?.asOf
  return asOf ? `Performances · ${series.currency} · au ${formatPerformanceDate(asOf)}` : 'Historique de performance'
}

// Les observations datées (YTD, depuis le lancement…) ne deviennent pas des années complètes.
export function formatTweetPerformance(series) {
  const entries = performanceEntries(series)
  const heading = !entries.length ? 'Historique de performance' : series.values.some(Number.isFinite) ? 'Performances annuelles' : 'Performances sur les périodes publiées'
  const lines = entries.map(({ label, value, asOf }) => `${value < 0 ? '🔴' : '🟢'} ${label} : ${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %${asOf ? ` (au ${formatPerformanceDate(asOf)})` : ''}`)
  return `📈 ${heading} (${series.currency})\n${lines.length ? lines.join('\n') : series.note}`
}
