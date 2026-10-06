import { latestCommonYears, calendarMap } from '../../data/annual-window.js'
// Only the cited share class: no index, earlier share class or simulation proxy.
import { getInstrumentAnnualPerformance } from '../../data/instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from '../../data/instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from '../../data/comparator-return-evidence.js'
import { COMPARISON_ETF_DETAILS } from '../../data/comparison-etf-details.js'

export const COMPARISON_YEARS = [2025, 2024, 2023]
export function getComparisonPerformance(isin, selectedYears) {
  const reviewed = COMPARISON_ETF_DETAILS[isin]?.performance
  let series = reviewed ?? getInstrumentAnnualPerformance(isin)
  // A simulation proxy must never hide independently verified fund returns.
  if (series?.basis === 'proxy' || series?.basis === 'index') series = null
  const evidence = COMPARATOR_RETURN_EVIDENCE[isin]
  if (!series && COMPARATOR_RETURNS_BY_ISIN[isin] && evidence?.currency && evidence.sourceUrls?.length) {
    series = { currency: evidence.currency, values: [null, null, null, ...COMPARATOR_RETURNS_BY_ISIN[isin]], source: evidence.sourceUrls[0] }
  }
  if (!series?.currency) return null
  const map = series.years ?? calendarMap(series.values, series.calendarYears)
  const years = selectedYears ?? latestCommonYears([map], { length: 3, minimum: 1 }).reverse()
  const rows = years.flatMap(year => Number.isFinite(map[year]) ? [{ year, pct: map[year] }] : [])
  return rows.length ? { rows, calendarReturns: map, currency: series.currency, label: 'ETF', referenceIsin: isin, source: series.source ?? null } : null
}

export function getComparisonYears(isins) {
  const maps = isins.map(isin => getComparisonPerformance(isin)).filter(Boolean).map(series => series.calendarReturns);
  return latestCommonYears(maps, { length: 3, minimum: 1 }).reverse();
}
