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
import {ASSETS as PORTFOLIO_ASSETS} from '../src/data/portfolio-assets.js'
import {CATALOG as DUEL_ASSETS} from '../src/data/duel-assets.js'
// The corrected exchange quote is retained as evidence; the active path is now
// independently qualified official NAV. A migration never makes the old quote valid.
const {qualifyHistoryWindow}=await import('../src/data/history-window-quality.js')
const archived=JSON.parse(gunzipSync(fs.readFileSync('reports/donnees-consolidees-2026-10-24/preuves/ishares-reprise-20261025/original-exchange-quote-records.json.gz'))).etf_financials.record
const oldPoints=Object.fromEntries(archived.points)
assert.equal(archived.symbol,'WFNS.AS');assert.equal(archived.listingEvidenceId,'IE00BJ5JP097-XAMS-WFNS-USD')
assert(Math.abs((oldPoints['2023-12']/oldPoints['2022-12']-1)*100-17.2979525156)<1e-8,'The proved old distribution correction is preserved unchanged')
assert.equal(qualifyHistoryWindow(archived,'2022-12','2023-12').qualified,false)
const a=ASSETS.etf_financials
assert.equal(a.currency,'USD');assert.equal(a.isin,'IE00BJ5JP097');assert.equal(a.valuationBasis,'fund-nav-total-return')
assert.equal(a.anniversaryValuationBasis,'fund-nav-price')
for(const candidate of [RANKING_ASSETS.etf_financials,convertAsset(RANKING_ASSETS.etf_financials,'EUR',FX)])assert(Number.isFinite(periodReturn(candidate,'2022-12','2023-12')))
for(const mode of ['lump','dca'])for(const start of ['2022-12','2026-01']){
 const state={assetId:'etf_financials',startYear:+start.slice(0,4),startMonth:+start.slice(5),amountRaw:'100',mode,overridePriceRaw:''}
 const d=derive(state),p=a.points.filter(p=>p.date>=start),expected=mode==='lump'?100*p.at(-1).price/p[0].price:p.reduce((n,p)=>n+100/p.price,0)*p.at(-1).price
 assert(Math.abs(d.result.finalValue-expected)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(state,d)))
}
console.log('WFNS: original cash repair and unresolved quote preserved; independent official income NAV restores 2023; anniversary keeps price-only NAV.')

const amundi=ASSETS.etfFR0007054358, previousAmundi=JSON.parse(gunzipSync(fs.readFileSync('reports/amundi-distributions-2026-10-23/original-record.json.gz'))).active
assert.equal(amundi.isin,'FR0007054358');assert.equal(amundi.currency,'EUR');assert.equal(amundi.ticker,'LYSX');assert.equal(amundi.mic,'XETR')
assert.equal(amundi.points[0].date,previousAmundi.points[0][0],'No earlier history inferred from the creation-date ambiguity')
assert.deepEqual(amundi.anniversaryPoints,previousAmundi.anniversaryPoints.map(([date,price])=>({date,price})))
const fixed2020=-2.885047490153836
assert(Math.abs((amundi.points.find(p=>p.date==='2020-12').price/amundi.points.find(p=>p.date==='2019-12').price-1)*100-fixed2020)<1e-8)
assert.throws(()=>periodReturn(RANKING_ASSETS.etfFR0007054358,'2019-12','2020-12'),/rapprochement financier non résolu/)
assert.throws(()=>periodReturn(convertAsset(RANKING_ASSETS.etfFR0007054358,'EUR',FX),'2019-12','2020-12'),/rapprochement financier non résolu/)
assert.throws(()=>getAnnualReturns('etfFR0007054358',2020),/rapprochement financier non résolu/)
assert.equal(getAnnualReturns('annual-FR0007054358',2020)[0].pct,-2.84)
assert(Math.abs(periodReturn(RANKING_ASSETS.etfFR0007054358,'2017-12','2018-12')-(-12.140103976189353))<1e-8)
const manualAmundi=PORTFOLIO_ASSETS.find(a=>a.isin==='FR0007054358'),duelAmundi=DUEL_ASSETS.find(a=>a.isin==='FR0007054358')
assert.equal(manualAmundi.id,'manual-FR0007054358');assert.equal(duelAmundi.id,manualAmundi.id)
assert.equal(manualAmundi.manualOnly,true)
assert.equal(manualAmundi.basis,'fund-nav');assert.equal(manualAmundi.returnCurrency,'EUR');assert.equal(manualAmundi.calendarReturns[2020],-2.84)
assert.equal(duelAmundi.basis,'fund-nav');assert.equal(duelAmundi.calendarReturns[2020],-2.84)
for(const mode of ['lump','dca']){
 const state={assetId:'etfFR0007054358',startYear:2022,startMonth:1,amountRaw:'100',mode,overridePriceRaw:''}
 const d=derive(state),p=amundi.points.filter(p=>p.date>='2022-01'),expected=mode==='lump'?100*p.at(-1).price/p[0].price:p.reduce((sum,row)=>sum+100/row.price,0)*p.at(-1).price
 assert(Math.abs(d.result.finalValue-expected)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(state,d)))
}
console.log('Amundi: twelve cash omissions repaired; unresolved 2020 quotes stay refused; qualified 2018, annual NAV and original manual/Duel links work independently.')
