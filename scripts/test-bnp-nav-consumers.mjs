import assert from 'node:assert/strict'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {ETF_HISTORY_IDENTITIES} from '../src/data/etf-history-identities.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const id='etfFR0011550185Nav',a=ASSETS[id],quote=ASSETS.etfFR0011550185
assert(ASSET_ORDER.includes(id));assert.equal(a.isin,quote.isin)
assert.deepEqual(ETF_HISTORY_IDENTITIES[id],ETF_HISTORY_IDENTITIES.etfFR0011550185)
assert.equal(a.currency,'EUR');assert.equal(a.points[0].date,'2019-12');assert(a.points.length>=82)
const lastDate=a.points.at(-1).date
assert.equal(a.points.length,(Number(lastDate.slice(0,4))-2019)*12+Number(lastDate.slice(5))-12+1,'Every supplied month is present, including later ordinary updates')
assert.equal(a.historyConvention,'fund-nav-total-return');assert.equal(a.anniversaryAvailable,false)
assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(r=>r.id===id));assert.equal(resolveAnniversaryLevel(id,''),null)
assert.equal(qualifyHistoryWindow(quote,'2020-12','2021-12').qualified,false,'Original disputed quote is retained and refused on the same window')
assert.equal(qualifyHistoryWindow(a,'2020-12','2021-12').qualified,true)
assert.equal(qualifyHistoryWindow(a,'2018-12','2019-12').qualified,false,'Earlier unit/date continuity is not invented')
assert.equal(RANKING_ASSETS[id].frequency,undefined,'The comparison uses monthly levels, not an annual fallback')
assert(Math.abs(periodReturn(RANKING_ASSETS[id],'2020-12','2021-12')-38.202989205834335)<1e-7)
const converted=convertAsset(RANKING_ASSETS[id],'USD',FX)
const expected=(1+38.202989205834335/100)*FX.months['2021-12'].rates.USD/FX.months['2020-12'].rates.USD*100-100
assert(Math.abs(periodReturn(converted,'2020-12','2021-12')-expected)<1e-7)
for(const mode of ['lump','dca']){
 const state={assetId:id,startYear:2020,startMonth:12,amountRaw:'1000',mode,currency:'native',overridePriceRaw:''},result=derive(state)
 const rows=a.points.filter(p=>p.date>='2020-12'),last=rows.at(-1).price
 const native=mode==='lump'?1000*last/rows[0].price:rows.reduce((sum,p)=>sum+1000*last/p.price,0)
 assert(Math.abs(result.result.finalValue-native)<1e-6)
 const text=buildTweetText(state,result);assert(text.includes('VL'));assert(!/NaN|undefined/.test(text))
}
console.log('BNP exact EUR C NAV: original quote refused, qualified monthly comparison, explicit USD conversion, lump/DCA text, shared artwork and no anniversary substitution.')
