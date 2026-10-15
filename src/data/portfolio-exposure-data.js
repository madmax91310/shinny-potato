import { qualifyExposureClassification } from '../lib/exposure-classification.js'
import { AUTOMATED_ETF } from './automated-etf.js'
// Les tables pays/secteurs sont conservées avec leur périmètre et leur source.
export const PORTFOLIO_EXPOSURES = Object.fromEntries(Object.entries(AUTOMATED_ETF).map(([isin, r]) => [isin,
  Object.fromEntries(['countries', 'sectors'].flatMap(field => {
    const o = r[field]
    const basis = o?.basis ?? (r.provider === 'iShares' ? 'fund' : null)
    if (!o || !['fund', 'index', 'tracked-index'].includes(basis)) return []
    const observation = { ...o, provider:r.provider, basis:basis==='tracked-index'?'index':basis, sourceUrl:o.sourceUrl??r.sourceUrl }
    return [[field,{...observation,classificationMetadata:qualifyExposureClassification(observation,field)}]]
  }))]))
