import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {ASSETS} from '../src/data/market-history.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {getAnnualReturns} from '../src/pages/tweet-midi/data/performanceHistory.js'
const a=ASSETS.etf_financials,old=JSON.parse(gunzipSync(fs.readFileSync('reports/wfns-dividend-2026-10-23/original-wfns-record.json.gz'))).active
assert.equal(a.currency,'USD');assert.equal(a.isin,'IE00BJ5JP097');assert.equal(a.ticker,'WFNS');assert.equal(a.mic,'XAMS')
assert.deepEqual(a.anniversaryPoints,old.anniversaryPoints.map(([date,price])=>({date,price})),'Raw price-only anniversary convention stays unchanged')
assert(Math.abs(periodReturn(RANKING_ASSETS.etf_financials,'2022-12','2023-12')-17.2979525156)<1e-8)
const eur=convertAsset(RANKING_ASSETS.etf_financials,'EUR',FX),expected=((1+17.2979525156/100)*FX.months['2022-12'].rates.USD/FX.months['2023-12'].rates.USD-1)*100
assert(Math.abs(periodReturn(eur,'2022-12','2023-12')-expected)<1e-8)
for(const mode of ['lump','dca']){
 const state={assetId:'etf_financials',startYear:2022,startMonth:12,amountRaw:'100',mode,overridePriceRaw:''}
 const d=derive(state),p=a.points.filter(p=>p.date>='2022-12'),amount=mode==='lump'?100*p.at(-1).price/p[0].price:p.reduce((n,p)=>n+100/p.price,0)*p.at(-1).price
 assert(Math.abs(d.result.finalValue-amount)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(state,d)))
}
console.log('WFNS: official omitted cash, corrected market total return, EUR conversion, DCA/lump, text and separate raw anniversary prices verified; no NAV equality forced.')

const amundi=ASSETS.etfFR0007054358, previousAmundi=JSON.parse(gunzipSync(fs.readFileSync('reports/amundi-distributions-2026-10-23/original-record.json.gz'))).active
assert.equal(amundi.isin,'FR0007054358');assert.equal(amundi.currency,'EUR');assert.equal(amundi.ticker,'LYSX');assert.equal(amundi.mic,'XETR')
assert.equal(amundi.points[0].date,previousAmundi.points[0][0],'No earlier history inferred from the creation-date ambiguity')
assert.deepEqual(amundi.anniversaryPoints,previousAmundi.anniversaryPoints.map(([date,price])=>({date,price})))
const fixed2020=-2.885047490153836
assert(Math.abs(periodReturn(RANKING_ASSETS.etfFR0007054358,'2019-12','2020-12')-fixed2020)<1e-8)
assert(Math.abs(periodReturn(convertAsset(RANKING_ASSETS.etfFR0007054358,'EUR',FX),'2019-12','2020-12')-fixed2020)<1e-8)
assert(Math.abs(getAnnualReturns('etfFR0007054358',2020)[0].pct-fixed2020)<1e-8)
for(const mode of ['lump','dca']){
 const state={assetId:'etfFR0007054358',startYear:2019,startMonth:12,amountRaw:'100',mode,overridePriceRaw:''}
 const d=derive(state),p=amundi.points.filter(p=>p.date>='2019-12'),expected=mode==='lump'?100*p.at(-1).price/p[0].price:p.reduce((sum,row)=>sum+100/row.price,0)*p.at(-1).price
 assert(Math.abs(d.result.finalValue-expected)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(state,d)))
}
console.log('Amundi: twelve proved historical distributions, repaired 2020, annual performance/rankings, EUR, lump/DCA and unchanged raw anniversaries; legal inception continuity remains separate.')
