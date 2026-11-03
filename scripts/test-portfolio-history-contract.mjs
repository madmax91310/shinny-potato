import assert from 'node:assert/strict'
import {ASSETS} from '../src/data/portfolio-assets.js'
import {hasCompleteAutomaticWindow, computeYearlyPerf} from '../src/pages/portfolio-generator/performance.js'
import {portfolioHistoryContract} from './lib/portfolio-history-contract.mjs'

const affected = ['bitcoin', 'ethereum', 'quality_dividend', 'bitcoin_etcgroup', 'tech_europe', 'actions_asie_ex_japon']
for (const id of affected) {
  const asset = ASSETS.find(row => row.id === id)
  assert(asset, id)
  assert.equal(portfolioHistoryContract(asset), 'partial-manual', id)
  assert.equal(hasCompleteAutomaticWindow(asset), false, 'Six-year Auto floor remains unchanged: ' + id)
  const perf = computeYearlyPerf([{...asset, pct: 100}])
  assert(Object.keys(perf).length >= 3 && Object.keys(perf).length < 6)
  assert(Object.values(perf).every(Number.isFinite), 'Existing dated manual calculation remains usable')
}
const base = {id: 'isolated', returnCurrency: 'EUR', r: [null, null, 1, 2, 3, 4], calendarReturns: {2022: 1, 2023: 2, 2024: 3, 2025: 4}}
assert.equal(portfolioHistoryContract(base), 'partial-manual')
for (const r of [[null, null, null, null, 3, 4], [null, null, 1, null, 3, 4], [null, null, 1, 2, 3, null], [null, null, 1, 2, 3, NaN], [null, null, 1, 2, 3, -101], [1, 2, 3]]) {
  assert.equal(portfolioHistoryContract({...base, r}), 'invalid')
}
assert.equal(portfolioHistoryContract({...base, calendarReturns: undefined}), 'invalid')
assert.equal(portfolioHistoryContract({...base, calendarReturns: {...base.calendarReturns, 2020: 9}}), 'invalid', 'Do not hide a conflicting leading year')
assert.equal(portfolioHistoryContract({...base, r: [0, 1, 2, 3, 4, 5]}), 'complete')
const NativeDate = Date
try {
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : ['2027-01-03T12:00:00Z'])) }
    static now() { return NativeDate.parse('2027-01-03T12:00:00Z') }
  }
  const rolling = {...base, r: [null, 1, 2, 3, 4, 5], calendarReturns: {2021: 1, 2022: 2, 2023: 3, 2024: 4, 2025: 5, 2026: 6}}
  assert.equal(hasCompleteAutomaticWindow(rolling), true)
  assert.equal(portfolioHistoryContract(rolling), 'complete-current', 'Do not manufacture 2020 or reject the real rolling six-year window after a year change')
  assert.equal(rolling.r[0], null)
} finally { globalThis.Date = NativeDate }
assert(ASSETS.every(asset => portfolioHistoryContract(asset) !== 'invalid'), 'Audit every current support, not just the six examples')
console.log('Portfolio structure: six short calendars valid for existing manual uses; Auto floor and malformed/missing-year failures preserved')
