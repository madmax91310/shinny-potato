import { AUTOMATED_ETF } from './automated-etf.js'
import { TOPICS, FUND_GROUPS } from './practical-sheet-topics.js'
import { getCurrentIndexFacts } from './index-facts.js'

const isins = new Set([...Object.values(FUND_GROUPS).flat(), ...TOPICS.flatMap(topic => topic.products ?? []), 'FR0013416716'])
// These sheets use identity, fees, AUM and calendar returns, not full holdings.
export const PRACTICAL_ETF = Object.fromEntries([...isins].filter(isin => AUTOMATED_ETF[isin]).map(isin => {
  const { sourceUrl, characteristics, aum, performance, sectors } = AUTOMATED_ETF[isin]
  return [isin, {sourceUrl, characteristics, aum, performance, sectors: sectors ? {basis: sectors.basis, index: sectors.index} : undefined}]
}))
export const PRACTICAL_INDEX_FACTS = Object.fromEntries([...new Set(TOPICS.flatMap(t => t.indices ?? []))].map(id => [id, getCurrentIndexFacts(id)]))
