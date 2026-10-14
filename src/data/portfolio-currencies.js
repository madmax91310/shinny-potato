import { INSTRUMENTS_BY_ISIN } from './instruments.js'
import { getInstrumentDuelSeries } from './instrument-returns.js'
import { PORTFOLIO_RETURN_EVIDENCE } from './portfolio-return-evidence.js'

// Exact same precedence as the portfolio engine; projected at build time so
// asking for a currency does not load every issuer's raw observations.
export const PORTFOLIO_CURRENCIES = Object.fromEntries(Object.keys(INSTRUMENTS_BY_ISIN).map(isin => [isin,
  getInstrumentDuelSeries(isin)?.currency ?? PORTFOLIO_RETURN_EVIDENCE[isin]?.currency ?? null,
]))
