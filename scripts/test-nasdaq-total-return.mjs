import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ASSETS } from '../src/data/market-history.js'
import { performanceBasis } from '../src/pages/tweet-midi/data/marketHistory.js'
import { derive } from '../src/pages/investment-calculator/lib.js'
const record=JSON.parse(readFileSync('src/data/automated-monthly.json')).nasdaq100
assert.equal(record.symbol,'XNDX')
assert.equal(record.variant,'TOTAL')
assert.equal(record.parser,'fred')
assert.match(performanceBasis('nasdaq100'),/dividendes bruts réinvestis/)
assert.match(ASSETS.nasdaq100.methodNote,/XNDX/)
const points=Object.fromEntries(record.points)
// Independent Nasdaq factsheet calendar figures, already collected by the annual pipeline.
const { INDEX_COMPARISON_RETURN_ADDITIONS } = await import('../src/data/index-comparison-return-additions.js')
for(const [year,expected] of INDEX_COMPARISON_RETURN_ADDITIONS['nasdaq-pea']['2025-12-31'].values) {
  assert(Math.abs((points[`${year}-12`]/points[`${year-1}-12`]-1)*100-expected)<.015)
}
const result=derive({assetId:'nasdaq100',amountRaw:'100',startYear:2020,startMonth:1,mode:'lump',overridePriceRaw:''})
assert(Math.abs(result.result.finalValue-100*record.points.at(-1)[1]/points['2020-01'])<1e-8)
console.log('XNDX: full monthly series, independent annual returns, text convention and simulation verified.')
