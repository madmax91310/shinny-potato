import { INSTRUMENT_FACTS_BY_ISIN } from './instrument-facts.js'
import { INSTRUMENTS_BY_ISIN, getInstrumentName, getInstrumentPeaStatus } from './instruments.js'
import { getPreferredInstrumentTicker } from './preferred-instrument-tickers.js'
import { ETF_TER_BY_ISIN } from './etf-ter.js'

export { normalizeSearch } from './search-text.js'
import { shortAssetName, exposureGroup } from './asset-labels.js'
export { shortAssetName, exposureGroup } from './asset-labels.js'
export function instrumentOption(asset) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[asset.isin] ?? {}
  const ticker = getPreferredInstrumentTicker(asset.isin)
  const pea = INSTRUMENTS_BY_ISIN[asset.isin] ? getInstrumentPeaStatus(asset.isin) : null
  const name = asset.name ?? asset.label ?? (INSTRUMENTS_BY_ISIN[asset.isin] ? getInstrumentName(asset.isin) : '')
  return {
    ...asset, id: asset.id ?? asset.isin, name, label: shortAssetName(name),
    group: exposureGroup({ ...asset, name, benchmark: facts.benchmark }),
    detail: facts.benchmark ?? '',
    search: `${name} ${asset.isin ?? ''} ${asset.listing?.ticker ?? ticker ?? ''} ${facts.benchmark ?? ''}`,
    badges: [pea === true ? 'PEA' : pea === false ? 'CTO · hors PEA' : null,
      facts.distribution, ETF_TER_BY_ISIN[asset.isin] ? `${ETF_TER_BY_ISIN[asset.isin]} %` : null].filter(Boolean),
  }
}

// Explicit aliases only. Do not erase ESG, IMI, factors, leverage or hedging.
export function benchmarkKey(isin) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin]
  if (!facts?.benchmark) return null
  const aliases = {
    'MSCI ACWI Index (EUR, Net Return)': 'MSCI All Country World (ACWI)',
    'MSCI World ex USA Index (Net Total Return)': 'MSCI World ex USA',
  }
  return `${aliases[facts.benchmark] ?? facts.benchmark}|hedge:${facts.currencyHedge ?? 'none'}`
}
export function sameBenchmarkSupports(isin) {
  const key = benchmarkKey(isin)
  if (!key) return []
  return Object.keys(INSTRUMENTS_BY_ISIN).filter(other => other !== isin && benchmarkKey(other) === key)
    .map(other => instrumentOption({ isin: other })).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
