import IDENTITIES from './new-instrument-identities.json' with { type: 'json' }
import { AUTOMATED_ETF } from './automated-etf.js'
import { frenchCharacteristic } from './french-characteristics.js'

// Only collected facts, with their own field evidence. No PEA or hedge inference.
export const NEW_INSTRUMENT_FACTS = Object.fromEntries(IDENTITIES.map(({ isin }) => {
  const record = AUTOMATED_ETF[isin], facts = record?.characteristics ?? {}
  return [isin, {
    instrumentType: 'ETF', benchmark: facts.index ?? null,
    domicile: facts.domicile ?? null, replicationMethod: facts.replicationMethod ?? null,
    currencyHedge: null,
    positionsLabel: facts.index ? `Exposition suivie : ${facts.index}` : null,
    location: [facts.domicile, facts.replicationMethod].filter(Boolean).map(frenchCharacteristic).join(' · '),
    characteristicsSource: { url: facts.sourceUrl ?? record?.sourceUrl, checkedAt: facts.checkedAt },
    automatedFields: { benchmark: record?.characteristicChecks?.index },
    reviewedAt: facts.checkedAt?.split('-').reverse().join('/'),
  }]
}))
