import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {ASSETS} from '../src/data/market-history.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
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
