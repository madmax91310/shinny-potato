import { annualPerformanceInCurrency, annualPerformanceCurrencies } from '../../data/annual-performance-currency.js'
import { latestCommonYears, calendarMap } from '../../data/annual-window.js'
// Only the cited share class: no index, earlier share class or simulation proxy.
import { getInstrumentAnnualPerformance } from '../../data/instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from '../../data/instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from '../../data/comparator-return-evidence.js'
import { COMPARISON_ETF_DETAILS } from '../../data/comparison-etf-details.js'

export const COMPARISON_YEARS = [2025, 2024, 2023]
export function getComparisonPerformance(isin, selectedYears, currency = 'native') {
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
  const converted = annualPerformanceInCurrency({ currency: series.currency, values: years.map(year => map[year]), calendarYears: years }, currency)
  const displayMap = Object.fromEntries(years.map((year,i) => [year, converted.values[i]]))
  const rows = years.flatMap(year => Number.isFinite(displayMap[year]) ? [{ year, pct: displayMap[year] }] : [])
  return rows.length ? { rows, calendarReturns: map, currency: converted.currency, label: 'ETF', referenceIsin: isin, source: series.source ?? null } : null
}

export function getComparisonYears(isins) {
  // A missing fund must stay in the intersection: otherwise the other funds'
  // years would be presented as a common comparison period.
  const maps = isins.map(isin => getComparisonPerformance(isin)?.calendarReturns ?? {});
  return latestCommonYears(maps, { length: 3, minimum: 1 }).reverse();
}

export function comparisonCurrencies(isins) {
  const years = getComparisonYears(isins)
  if (!years.length) return []
  return ['EUR','USD'].filter(currency => isins.every(isin => {
    const p = getComparisonPerformance(isin, years)
    return p && annualPerformanceCurrencies({ currency: p.currency, values: p.rows.map(r => r.pct), calendarYears: p.rows.map(r => r.year) }).includes(currency)
  }))
}
