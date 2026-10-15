import { AUTOMATED_ETF } from './automated-etf.js'
import { getInstrumentAnnualPerformance } from './instrument-returns.js'
import { INSTRUMENT_AUM_BY_ISIN } from './instrument-aum.js'
import { ETFS } from './etf-cards.js'

// Projection recalculée au build : aucune seconde saisie de données financières.
export const ETF_PUBLICATION_DATA = Object.fromEntries(ETFS.map(etf => {
  const record = AUTOMATED_ETF[etf.isin]
  return [etf.isin, { holdings: record?.holdings, commodityAllocation: record?.commodityAllocation,
    performance: getInstrumentAnnualPerformance(etf.isin), aumSource: INSTRUMENT_AUM_BY_ISIN[etf.isin]?.source }]
}))
