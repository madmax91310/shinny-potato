import assert from 'node:assert/strict'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {getAnnualReturns,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const id='etfCH0454664001Nav',a=ASSETS[id]
assert(a&&ASSET_ORDER.includes(id));assert.equal(a.isin,'CH0454664001');assert.equal(a.currency,'EUR')
assert.equal(a.historyConvention,'fund-nav-total-return');assert(!a.ticker&&!a.mic)
for(const year of [2024,2025]){
 const start=`${year-1}-12`,end=`${year}-12`
 assert(qualifyHistoryWindow(a,start,end).qualified)
 const official=year===2024?114.17:-4.71
 const expected=((1+official/100)*FX.months[start].rates.USD/FX.months[end].rates.USD-1)*100
 assert(Math.abs(periodReturn(a,start,end)-expected)<.006)
 assert(Math.abs(getAnnualReturns(id,year)[0].pct-periodReturn(a,start,end))<1e-9)
 assert(RANKING_ASSETS[id]);assert(!qualifyHistoryWindow(ASSETS.etfCH0454664001,start,end).qualified,'Original quotation remains refused')
}
assert(!qualifyHistoryWindow(a,'2019-02','2020-12').qualified,'No month before qualified history')
for(const mode of ['lump','dca']){
 const input={assetId:id,startYear:2023,startMonth:12,amountRaw:'1000',mode,currency:'EUR',overridePriceRaw:''}
 const d=derive(input),points=a.points.filter(p=>p.date>='2023-12')
 const oracle=(mode==='lump'?1000/points[0].price:points.reduce((sum,p)=>sum+1000/p.price,0))*points.at(-1).price
 assert(Math.abs(d.result.finalValue-oracle)<1e-7);assert.match(buildTweetText(input,d),/VL/)
}
assert(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(x=>x.id===id))
assert.equal(resolveAnniversaryLevel(id,'').valuationBasis,'fund-nav-total-return')
console.log('ABTC: exact split-adjusted issuer NAV, one FX conversion, 2024/2025 restored, original quote refused, lump/DCA, annual, comparison and current NAV consumers verified.')
