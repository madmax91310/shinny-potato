import assert from 'node:assert/strict'
import { ASSETS } from '../src/data/market-history.js'
import { qualifyHistoryWindow } from '../src/data/history-window-quality.js'
import { derive, buildTweetText } from '../src/pages/investment-calculator/lib.js'
import { RANKING_ASSETS } from '../src/pages/performance-rankings/data.js'
import { periodReturn } from '../src/pages/performance-rankings/engine.js'
import { MARKET_ASSETS, getAnnualReturns } from '../src/pages/tweet-midi/data/marketHistory.js'

const id = 'etfEuropeRetail'
const asset = ASSETS[id]
const start = '2018-12', end = '2019-12'
const points = asset.points.filter(p => start <= p.date && p.date <= end)
assert.equal(points.length, 13)
assert.equal(asset.reviewedMarketWindowEvidence?.dailyTransitions, 251)
assert(qualifyHistoryWindow(asset, start, end).qualified)
assert(!qualifyHistoryWindow({...asset, reviewedMarketWindowEvidence: undefined}, start, end).qualified)
assert(!qualifyHistoryWindow({...asset, reviewedMarketWindowEvidence: {...asset.reviewedMarketWindowEvidence, cashEvents: []}}, start, end).qualified)
assert(MARKET_ASSETS.some(a => a.id === id))
const expected = (points.at(-1).price / points[0].price - 1) * 100
assert(Math.abs(getAnnualReturns(id, 2019)[0].pct - expected) < 1e-8)
assert(Math.abs(periodReturn(RANKING_ASSETS[id], start, end) - expected) < 1e-8)
for (const mode of ['lump', 'dca']) {
  const state = {assetId:id, amountRaw:'100', mode, startYear:2018, startMonth:12, overridePriceRaw:''}
  const result = derive(state)
  assert.equal(result.startYm, start)
  assert(buildTweetText(state, result).includes('2018'))
}
console.log(id, '13 qualified Xetra month ends, calculation, comparison, annual ranking and text', expected)
