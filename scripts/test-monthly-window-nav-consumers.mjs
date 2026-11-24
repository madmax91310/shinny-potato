import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ASSETS } from '../src/data/market-history.js'
import { qualifyHistoryWindow } from '../src/data/history-window-quality.js'
import { derive, buildTweetText } from '../src/pages/investment-calculator/lib.js'
import { RANKING_ASSETS } from '../src/pages/performance-rankings/data.js'
import { periodReturn } from '../src/pages/performance-rankings/engine.js'
import { MARKET_ASSETS, getAnnualReturns } from '../src/pages/tweet-midi/data/marketHistory.js'

const windows = {
  etfFR0010755611Nav: ['etfFR0010755611', [2021, 2024]],
  etfFR0013411998Nav: ['etfFR0013411998', [2025]],
  etfFR0013412004Nav: ['etfFR0013412004', [2025]],
  etfDE000A27Z304Nav: ['etfDE000A27Z304', [2021]],
}
const registered = new Set(JSON.parse(readFileSync('scripts/monthly-automation.json')).series.map(s => s.id))
const ids = process.argv.slice(2)
assert(ids.length > 0 && ids.every(id => windows[id] && registered.has(id)), 'Expected registered exact NAV routes')

for (const id of ids) {
  const [quoteId, years] = windows[id]
  const asset = ASSETS[id]
  assert(asset && RANKING_ASSETS[id] && MARKET_ASSETS.some(item => item.id === id), id)
  assert.equal(asset.historyConvention, 'fund-nav-total-return')
  assert(!asset.ticker && !asset.mic, 'NAV must stay distinct from the exchange quote')
  assert.equal(asset.isin, ASSETS[quoteId].isin)

  for (const year of years) {
    const start = `${year - 1}-12`
    const end = `${year}-12`
    const points = asset.points.filter(point => point.date >= start && point.date <= end)
    assert.equal(points.length, 13, `${id} ${year}: missing monthly boundary`)
    assert(qualifyHistoryWindow(asset, start, end).qualified)
    assert(!qualifyHistoryWindow(ASSETS[quoteId], start, end).qualified, 'Original financial restriction must stay in force')
    const expected = (points.at(-1).price / points[0].price - 1) * 100
    assert(Math.abs(periodReturn(RANKING_ASSETS[id], start, end) - expected) < 1e-8)
    assert(Math.abs(getAnnualReturns(id, year)[0].pct - expected) < 1e-8)
    const state = { assetId: id, amountRaw: '100', startYear: year - 1, startMonth: 12, mode: 'dca', overridePriceRaw: '' }
    const result = derive(state)
    assert.equal(result.startYm, start)
    assert(buildTweetText(state, result).includes('VL'))
    console.log(id, year, '13 dates, Performance depuis, classement et simulation', expected)
  }
}
