// Annual observations never become synthetic monthly prices or anniversary levels.
import { ASSETS as MONTHLY_ASSETS } from '../../../data/market-history.js'
import * as monthly from './marketHistory.js'
import { QUALIFIED_FUND_CALENDARS, QUALIFIED_INDEX_CALENDARS } from '../../../data/qualified-annual-calendars.js'
import { canonicalIndexHistoryId } from '../../../data/index-history-identities.js'
import { returnConvention } from '../../../lib/return-convention.js'
import { performanceBasisLabel } from '../../../lib/performance-conventions.js'
export { MONTHS_FULL } from '../../../data/market-history.js'
const usableMonthlyIsins = new Set(monthly.MARKET_ASSETS.filter(a => monthly.getAnnualReturnStartYears(a.id).length).map(a => a.isin).filter(Boolean))
const indexKey = a => `${canonicalIndexHistoryId(a.indexId ?? a.id)}|${a.currency}|${returnConvention(a)}`
const existingIndices = new Set(monthly.MARKET_ASSETS.filter(a => a.priceUnit === 'points' && monthly.getAnnualReturnStartYears(a.id).length).map(a => indexKey({ ...a, detail: monthly.performanceBasis(a.id) })))
const annual = [...Object.values(QUALIFIED_FUND_CALENDARS).filter(a => !usableMonthlyIsins.has(a.isin)),
  ...Object.values(QUALIFIED_INDEX_CALENDARS).filter(a => !existingIndices.has(indexKey(a))).map(a => ({ ...a, label: `${a.label} ${a.variant}` }))]
  .map(a => ({ ...a, icon: '📊', tweetPhrase: a.label }))
const annualById = Object.fromEntries(annual.map(a => [a.id, a]))
export const ASSETS = { ...MONTHLY_ASSETS, ...annualById }
export const MARKET_ASSETS = [...monthly.MARKET_ASSETS, ...annual]
export function getAnnualReturnStartYears(id) {
  return annualById[id] ? Object.keys(annualById[id].years).map(Number).sort((a, b) => a - b) : monthly.getAnnualReturnStartYears(id)
}
export function getAnnualReturns(id, start) {
  const asset = annualById[id]
  if (!asset) return monthly.getAnnualReturns(id, start)
  const rows = []
  for (let year = Number(start); Number.isFinite(asset.years[year]); year++) rows.push({ year, pct: asset.years[year], startDate: `${year - 1}-12`, endDate: `${year}-12` })
  return rows
}
export function performanceBasis(id) {
  const asset = annualById[id]
  return asset ? performanceBasisLabel({ currency: asset.currency, ...(['ETC','ETN','ETP'].includes(asset.instrumentType) ? { detail: `valeur liquidative de l’${asset.instrumentType}` } : {}), income: asset.basis === 'index-net' ? 'net' : asset.basis === 'index-gross' ? 'gross' : 'reinvested' }) : monthly.performanceBasis(id)
}
