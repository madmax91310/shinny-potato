import assert from 'node:assert/strict'
import {ASSETS} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {derive} from '../src/pages/investment-calculator/lib.js'
import {computeComparativeSeries} from '../src/pages/investment-calculator/videoExport.js'
import {getAnnualReturns} from '../src/pages/tweet-midi/data/marketHistory.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import {monthlyCalendarReturns} from './monthly-return-projection.mjs'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const state=(assetId,startYear)=>({assetId,startYear,startMonth:12,amountRaw:'100',mode:'dca',currency:'native',overridePriceRaw:''})
for(const [id,year] of [['etfIE000U9ODG19',2025],['etfIE00B579F325',2022]]) {
 const a=ASSETS[id],start=`${year-1}-12`,end=`${year}-12`
 assert(!qualifyHistoryWindow(a,start,end).qualified)
 assert.throws(()=>derive(state(id,year-1)),/cours reportés/)
 assert.throws(()=>computeComparativeSeries(id,start,end,100,'dca'),/cours reportés/)
 assert.throws(()=>periodReturn(a,start,end),/cours reportés/)
 assert.throws(()=>periodReturn(convertAsset({...a,basis:'adjusted'},a.currency==='EUR'?'USD':'EUR',FX),start,end),/cours reportés/)
 assert.throws(()=>getAnnualReturns(id,year),/cours reportés/)
 assert.equal(monthlyCalendarReturns({...a,points:a.points.map(p=>[p.date,p.price])})[year],undefined)
}
assert(qualifyHistoryWindow(ASSETS.etfIE00B579F325,'2024-12','2025-12').qualified)
assert(Number.isFinite(derive(state('etfIE00B579F325',2024)).result.finalValue))
const lowLiquidity={currency:'USD',basis:'spot-close',points:[{date:'2025-01',price:1},{date:'2025-02',price:1},{date:'2025-03',price:1}]}
assert(qualifyHistoryWindow(lowLiquidity,'2025-01','2025-03').qualified,'Repeated prices alone do not prove corruption')
assert(!qualifyHistoryWindow({...lowLiquidity,points:[lowLiquidity.points[0],lowLiquidity.points[2]]},'2025-01','2025-03').qualified)
assert(qualifyHistoryWindow(ASSETS['aerospace-paris-eur'],'2024-12','2025-12').qualified)
assert(Number.isFinite(derive(state('aerospace-paris-eur',2024)).result.finalValue))
console.log('Window guards: calculator, video, annual formats, rankings, FX conversion and portfolio projections; independent valid periods preserved.')

assert(!qualifyHistoryWindow({...lowLiquidity,basis:undefined},'2025-01','2025-03').qualified,'A price array alone cannot qualify its financial convention')
