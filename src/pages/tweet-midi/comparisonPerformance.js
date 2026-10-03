// Shared, already documented series only. No currency conversion or inferred returns.
import { getInstrumentDuelSeries, getInstrumentReturnValues } from '../../data/instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from '../../data/instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from '../../data/comparator-return-evidence.js'
import { INDEX_RETURNS } from '../../data/index-returns.js'

// Explicit same-index references. Keep their identity visible on the export.
const references = {
  IE00BD4TXV59: { isin: 'IE00B4L5Y983', label: 'Réf. iShares MSCI World' },
  IE000XZSV718: { isin: 'IE00B5BMR087', label: 'Réf. iShares S&P 500' },
  IE000DQLYVB9: { isin: 'FR0011871128', label: 'Réf. Amundi S&P 500' },
  IE00BTJRMP35: { index: 'em-standard', label: 'Indice MSCI EM net' },
  IE00B4K48X80: { index: 'mscieurope', label: 'Indice MSCI Europe net' },
  FR001400U5Q4: { valuesIsin: 'FR001400U5Q4', currency: 'EUR', label: 'Indice MSCI World net' },
}

export function getComparisonPerformance(isin) {
  let series = getInstrumentDuelSeries(isin)
  let label = 'ETF'
  let referenceIsin = isin
  const ref = references[isin]
  if (!series && COMPARATOR_RETURNS_BY_ISIN[isin] && COMPARATOR_RETURN_EVIDENCE[isin]?.currency) {
    series = { currency: COMPARATOR_RETURN_EVIDENCE[isin].currency, values: [null, null, null, ...COMPARATOR_RETURNS_BY_ISIN[isin]], source: COMPARATOR_RETURN_EVIDENCE[isin].sourceUrls[0] }
  }
  if (!series && ref) {
    label = ref.label
    referenceIsin = ref.isin ?? null
    if (ref.isin) series = getInstrumentDuelSeries(ref.isin)
    else if (ref.valuesIsin) series = { currency: ref.currency, values: getInstrumentReturnValues(ref.valuesIsin) }
    else {
      const snapshot = Object.values(INDEX_RETURNS[ref.index]).at(-1)
      series = { currency: snapshot.metadata.currency, values: Array.from({ length: 6 }, (_, i) => snapshot.values.find(([year]) => year === 2020 + i)?.[1] ?? null), source: snapshot.source.url }
    }
  }
  if (!series?.currency || series.basis === 'proxy') return null
  const rows = [2023, 2024, 2025].flatMap(year => Number.isFinite(series.values[year - 2020]) ? [{ year, pct: series.values[year - 2020] }] : [])
  return rows.length ? { rows, currency: series.currency, label, referenceIsin, source: series.source ?? null } : null
}
