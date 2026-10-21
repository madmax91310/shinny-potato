// Exact-index routing aliases only. Currency and net/gross variants stay separate.
// Names such as “World Quality” are historical navigation labels for the collected
// MSCI World Sector Neutral Quality series, never permission to substitute an ETF.
export const INDEX_HISTORY_ALIASES = Object.freeze({
  'world-net':'world', 'emerging-net':'em-standard', 'japan-net':'msci-japan', 'acwi-gross':'acwi',
  msciAcwiImi:'acwi-imi', msciAcwi:'acwi', msciWorldExUsa:'world-ex-usa', msciWorld:'world',
  msciEmerging:'em-standard', msciWorldSmallCap:'world-small-cap', msciEurope:'mscieurope',
  msciUsa:'msci-usa', msciIndia:'msci-india', msciEmergingExChina:'msci-em-ex-china',
  msciWorldMomentum:'msci-world-momentum', msciWorldQuality:'msci-world-sector-neutral-quality',
  msciWorldValue:'msci-world-enhanced-value', ftseAllWorld:'ftse-all-world', russell2000:'russell-2000',
  nasdaq100:'nasdaq-pea', sp500:'sp500-pea',
})
export function canonicalIndexHistoryId(id) {
  const canonical = id?.replace(/^annual-/, '').replace(/^index-/, '')
  return INDEX_HISTORY_ALIASES[canonical] ?? canonical
}
