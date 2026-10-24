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
const a=ASSETS.etf_financials,old=JSON.parse(gunzipSync(fs.readFileSync('reports/wfns-dividend-2026-10-23/original-wfns-record.json.gz'))).active
assert.equal(a.currency,'USD');assert.equal(a.isin,'IE00BJ5JP097');assert.equal(a.ticker,'WFNS');assert.equal(a.mic,'XAMS')
assert.deepEqual(a.anniversaryPoints,old.anniversaryPoints.map(([date,price])=>({date,price})),'Raw price-only anniversary convention stays unchanged')
const rawReturn=(a.points.find(p=>p.date==='2023-12').price/a.points.find(p=>p.date==='2022-12').price-1)*100
assert(Math.abs(rawReturn-17.2979525156)<1e-8,'The proved omitted distribution correction is preserved')
assert.throws(()=>periodReturn(RANKING_ASSETS.etf_financials,'2022-12','2023-12'),/rapprochement financier non résolu/)
const eur=convertAsset(RANKING_ASSETS.etf_financials,'EUR',FX)
assert.throws(()=>periodReturn(eur,'2022-12','2023-12'),/rapprochement financier non résolu/)
for(const mode of ['lump','dca']){
 const disputed={assetId:'etf_financials',startYear:2022,startMonth:12,amountRaw:'100',mode,overridePriceRaw:''}
 assert.throws(()=>derive(disputed),/rapprochement financier non résolu/)
 const state={...disputed,startYear:2026,startMonth:1}
 const d=derive(state),p=a.points.filter(p=>p.date>='2026-01'),amount=mode==='lump'?100*p.at(-1).price/p[0].price:p.reduce((n,p)=>n+100/p.price,0)*p.at(-1).price
 assert(Math.abs(d.result.finalValue-amount)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(state,d)))
}
console.log('WFNS: cash correction retained; disputed 2023 quotes still refused, qualified recent periods and independent annual NAV remain distinct.')

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
