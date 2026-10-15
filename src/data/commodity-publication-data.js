import { AUTOMATED_ETF } from './automated-etf.js'
export const COMMODITY_PUBLICATION_DATA = Object.fromEntries(Object.entries(AUTOMATED_ETF).filter(([,r])=>r.commodityAllocation).map(([isin,r])=>[isin,r.commodityAllocation]))
