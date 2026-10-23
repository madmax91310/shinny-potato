// Annual observations never become synthetic monthly prices or anniversary levels.
import { ASSETS as MONTHLY_ASSETS } from '../../../data/market-history.js'
import * as monthly from './marketHistory.js'
import { QUALIFIED_FUND_CALENDARS, QUALIFIED_INDEX_CALENDARS } from '../../../data/qualified-annual-calendars.js'
import { canonicalIndexHistoryId } from '../../../data/index-history-identities.js'
import { returnConvention } from '../../../lib/return-convention.js'
import { performanceBasisLabel } from '../../../lib/performance-conventions.js'
import { qualifyHistoryWindow }from '../../../data/history-window-quality.js'
export { MONTHS_FULL } from '../../../data/market-history.js'
const indexKey = a => `${canonicalIndexHistoryId(a.indexId ?? a.id)}|${a.currency}|${returnConvention(a)}`
const existingIndices = new Set(monthly.MARKET_ASSETS.filter(a => a.priceUnit === 'points' && monthly.getAnnualReturnStartYears(a.id).length).map(a => indexKey({ ...a, detail: monthly.performanceBasis(a.id) })))
const annual = [...Object.values(QUALIFIED_FUND_CALENDARS).filter(a => {
 const matches=monthly.MARKET_ASSETS.filter(r=>r.isin===a.isin)
 return !matches.some(r=>monthly.getAnnualReturnStartYears(r.id).length)||matches.some(r=>Object.keys(a.years).some(y=>qualifyHistoryWindow(r,`${Number(y)-1}-12`,`${y}-12`).code==='financial-window-unconfirmed'))
}).map(a=>({...a,label:`${a.label} · calendrier VL`})),
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
  return asset ? performanceBasisLabel({ currency: asset.currency, ...(asset.basis==='fund-nav'?{detail:`valeur liquidative de ${['ETC','ETN','ETP'].includes(asset.instrumentType)?'l’'+asset.instrumentType:'la part'}`} : {}), income: asset.basis === 'index-net' ? 'net' : asset.basis === 'index-gross' ? 'gross' : 'reinvested' }) : monthly.performanceBasis(id)
}
