import { annualPerformanceInCurrency, annualPerformanceCurrencies } from '../../data/annual-performance-currency.js'
import { latestCommonYears, calendarMap, lastCompleteYear } from '../../data/annual-window.js'
// Only the cited share class: no index, earlier share class or simulation proxy.
import { getInstrumentAnnualPerformance } from '../../data/instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from '../../data/instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from '../../data/comparator-return-evidence.js'
import { COMPARISON_ETF_DETAILS } from '../../data/comparison-etf-details.js'

function closedYears(series) {
  if (!series?.currency) return {}
  const years = series.years ?? calendarMap(series.values, series.calendarYears)
  return Object.fromEntries(Object.entries(years).filter(([year, value]) =>
    Number(year) <= lastCompleteYear() && Number.isFinite(value)))
}

export function getComparisonPerformance(isin, selectedYears, currency = 'native') {
  const reviewed = COMPARISON_ETF_DETAILS[isin]?.performance
  const live = getInstrumentAnnualPerformance(isin)
  let series = reviewed ?? live
  // Once a more recent qualified year is available, use its series as a
  // whole. Reviewed NAV and adjusted listed prices cannot form one calendar.
  if (live && !['proxy', 'index'].includes(live.basis) &&
      Math.max(...Object.keys(closedYears(live))) > Math.max(...Object.keys(closedYears(reviewed)))) series = live
  // A simulation proxy must never hide independently verified fund returns.
  if (series?.basis === 'proxy' || series?.basis === 'index') series = null
  const evidence = COMPARATOR_RETURN_EVIDENCE[isin]
  if (!series && COMPARATOR_RETURNS_BY_ISIN[isin] && evidence?.currency && evidence.sourceUrls?.length) {
    series = { currency: evidence.currency, values: [null, null, null, ...COMPARATOR_RETURNS_BY_ISIN[isin]], source: evidence.sourceUrls[0] }
  }
  if (!series?.currency) return null
  const map = closedYears(series)
  const years = selectedYears ?? latestCommonYears([map], { length: 3, minimum: 1 }).reverse()
  if (!years.some(year => Number.isFinite(map[year]))) return null
  const converted = annualPerformanceInCurrency({ currency: series.currency, values: years.map(year => map[year]), calendarYears: years }, currency)
  const displayMap = Object.fromEntries(years.map((year,i) => [year, converted.values[i]]))
  const rows = years.flatMap(year => Number.isFinite(displayMap[year]) ? [{ year, pct: displayMap[year] }] : [])
  return rows.length ? { rows, calendarReturns: map, currency: converted.currency, label: 'ETF', referenceIsin: isin, source: series.source ?? null, sourceKind: series.sourceKind } : null
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
