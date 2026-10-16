import { instrumentOption } from './asset-selection.js'
import { ETFS } from './etf-cards.js'
import { ETF_TER_BY_ISIN } from './etf-ter.js';
import { ETF_TER_EVIDENCE } from './etf-ter-evidence.js';
// ETF UCITS des fiches : pas de confusion avec ETC, ETP ou frais d’assurance-vie.
export const FEE_COMPARISON_ASSETS = ETFS.filter(asset => /UCITS/i.test(asset.name))
  .map(asset => ({ isin: asset.isin, name: asset.name,
    fee: Number(ETF_TER_BY_ISIN[asset.isin].replace(',', '.')), evidence: ETF_TER_EVIDENCE[asset.isin] }))
  .filter(asset => Number.isFinite(asset.fee)).map(asset => instrumentOption({ ...asset, id: asset.isin })).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
