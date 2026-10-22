import assert from 'node:assert/strict'
import capture from './fixtures/audit-20261022/soxx-dividend-split.json' with {type:'json'}
import {ASSETS} from '../src/data/market-history.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
assert.equal(capture.events.splits.length,1)
assert.equal(capture.events.splits[0].splitRatio,'3:1')
assert.equal(capture.events.dividends.length,1)
const bars=capture.observations,dividends=new Map(capture.events.dividends.map(e=>[e.day,e.amount]))
let growth=1
for(let i=1;i<bars.length;i++) {
 const previous=bars[i-1],current=bars[i],dividend=dividends.get(current.date)??0
 // Observed close history already accounts for the split. Yahoo's adjustment
 // factor changes on the ex-dividend date; the cash must not be added twice.
 growth*=current.close/previous.close/(1-dividend/previous.close)
 if(current.date===capture.events.splits[0].day)assert(Math.abs(current.close/previous.close-1)<.2)
}
const adjusted=bars.at(-1).adjusted/bars[0].adjusted
assert(Math.abs(growth-adjusted)<1e-5)
assert(Math.abs(growth/3-adjusted)>.5,'Applying the split again corrupts the result')
assert.notEqual(bars.at(-1).close/bars[0].close,adjusted)
assert.equal(ASSETS.soxx.isin,capture.isin)
assert.equal(ASSETS.soxx.priceMethod,'price')
assert(!RANKING_ASSETS.soxx,'Price-only series cannot enter total-return rankings')
const state={assetId:'soxx',amountRaw:'100',startYear:2024,startMonth:2,mode:'lump',overridePriceRaw:''}
assert(buildTweetText(state,derive(state)).includes('hors dividendes'))
console.log('SOXX: exact US share, price convention, actual March 2024 dividend and 3:1 split; no double counting or total-return admission.')
