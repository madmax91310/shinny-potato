// Only the cited share class: no index, earlier share class or simulation proxy.
import { getInstrumentAnnualPerformance } from '../../data/instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from '../../data/instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from '../../data/comparator-return-evidence.js'
import { COMPARISON_ETF_DETAILS } from '../../data/comparison-etf-details.js'

export const COMPARISON_YEARS = [2025, 2024, 2023]
export function getComparisonPerformance(isin) {
  const reviewed = COMPARISON_ETF_DETAILS[isin]?.performance
  let series = reviewed ?? getInstrumentAnnualPerformance(isin)
  // A simulation proxy must never hide independently verified fund returns.
  if (series?.basis === 'proxy' || series?.basis === 'index') series = null
  const evidence = COMPARATOR_RETURN_EVIDENCE[isin]
  if (!series && COMPARATOR_RETURNS_BY_ISIN[isin] && evidence?.currency && evidence.sourceUrls?.length) {
    series = { currency: evidence.currency, values: [null, null, null, ...COMPARATOR_RETURNS_BY_ISIN[isin]], source: evidence.sourceUrls[0] }
  }
  if (!series?.currency) return null
  const rows = COMPARISON_YEARS.flatMap(year => Number.isFinite(series.values?.[year - 2020]) ? [{ year, pct: series.values[year - 2020] }] : [])
  return rows.length ? { rows, currency: series.currency, label: 'ETF', referenceIsin: isin, source: series.source ?? null } : null
}
