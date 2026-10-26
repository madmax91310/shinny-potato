import assert from 'node:assert/strict'
import {readFileSync}from 'node:fs'
import {execFileSync}from 'node:child_process'
// Prepare before loading consumers: they import the generated restriction snapshot.
execFileSync(process.execPath,['scripts/build-review-reconciliation.mjs'],{stdio:'inherit'})
const {ASSETS}=await import('../src/data/market-history.js')
const {qualifyHistoryWindow}=await import('../src/data/history-window-quality.js')
const {derive}=await import('../src/pages/investment-calculator/lib.js')
const {computeComparativeSeries}=await import('../src/pages/investment-calculator/videoExport.js')
const {periodReturn}=await import('../src/pages/performance-rankings/engine.js')
const {convertAsset,buildPortfolio}=await import('../src/pages/performance-rankings/series.js')
const {getAnnualReturnStartYears,getHistoricalPrice,MARKET_ASSETS}=await import('../src/pages/tweet-midi/data/marketHistory.js')
const {monthlyCalendarReturns}=await import('./monthly-return-projection.mjs')
const {selectionDates,qualifiedYearWindow,qualifiedMonthlyWindows}=await import('../src/pages/performance-rankings/selection-windows.js')
const {RANKING_ASSETS}=await import('../src/pages/performance-rankings/data.js')
import FX from '../src/data/monthly-fx.json'with{type:'json'}
const performance=await import('../src/pages/tweet-midi/data/performanceHistory.js')
const rows=JSON.parse(readFileSync('public/data/financial-reconciliation.json')).rows.filter(r=>r.open||r.residualOpen)
let refused=0,nav=0
for(const row of rows){
 const asset=Object.values(ASSETS).find(a=>a.isin===row.isin)
 if(!asset)continue
 const start=`${row.year-1}-12`,end=`${row.year}-12`
 const result=qualifyHistoryWindow(asset,start,end,{contiguous:false})
 const reported=row.currentConsumer.windows.find(w=>w.id===asset.id)
 assert.equal(reported.qualification.qualified,qualifyHistoryWindow(asset,start,end).qualified,'Review screen reports actual consumer admission')
 if(asset.historyConvention==='fund-nav-total-return'){
  assert.notEqual(result.code,'financial-window-unconfirmed');nav++;continue
 }
 assert.equal(result.qualified,false,`${row.id}: unresolved original quote must not be offered`)
 if(result.code==='financial-window-unconfirmed')refused++
}
const id='etfGB00B15KXQ89',asset=ASSETS[id],start='2017-12',end='2018-12'
const error=/rapprochement financier non résolu/
assert.throws(()=>derive({assetId:id,startYear:2017,startMonth:12,amountRaw:'100',mode:'dca',currency:'native',overridePriceRaw:''}),error)
assert.throws(()=>computeComparativeSeries(id,start,end,100,'dca'),error)
assert.throws(()=>periodReturn(asset,start,end),error)
assert.throws(()=>periodReturn(convertAsset({...asset,basis:'adjusted'},'EUR',FX),start,end),error)
assert.throws(()=>getHistoricalPrice(id,'2018-12'),error)
assert(!getAnnualReturnStartYears(id).includes(2018))
assert.equal(qualifyHistoryWindow(MARKET_ASSETS.find(a=>a.id===id),start,end).qualified,false,'Selector projections retain the same restriction as loaded prices')
assert.equal(monthlyCalendarReturns({...asset,points:asset.points.map(p=>[p.date,p.price])})[2018],undefined)
assert(qualifyHistoryWindow(asset,'2026-01','2026-09').qualified,'Compatible recent months remain available')
assert(Number.isFinite(periodReturn(asset,'2026-01','2026-09')))
const definition={id:'copper-only',label:'Copper',lines:[{id,pct:100}],rebalance:'annual'}
assert.throws(()=>buildPortfolio(definition,{[id]:{...asset,basis:'adjusted'}},'USD',FX),error)
const recent=buildPortfolio(definition,{[id]:{...asset,basis:'adjusted'}},'USD',FX,{start:'2026-01',end:'2026-09'})
assert(Math.abs(periodReturn(recent,'2026-01','2026-09')-periodReturn(asset,'2026-01','2026-09'))<1e-9)
const annual=performance.ASSETS['annual-GB00B15KXQ89']
assert.equal(annual.frequency,'annual');assert.equal(annual.basis,'fund-nav');assert.equal(annual.currency,'USD')
assert(performance.getAnnualReturnStartYears(annual.id).includes(2018))
assert(performance.getAnnualReturns(annual.id,2018).every(r=>Number.isFinite(r.pct)))
assert(performance.performanceBasis(annual.id).includes('valeur liquidative'))
assert(annual.label.includes('calendrier VL'),'An annual NAV option never pretends to supply monthly prices')
assert.equal(qualifyHistoryWindow({...asset,portfolio:{lines:[{asset}]}},start,end).qualified,false)
const other={...asset,symbol:'OTHER.L',sourceUrls:['https://query2.finance.yahoo.com/v8/finance/chart/OTHER.L']}
assert(qualifyHistoryWindow(other,start,end).qualified,'A different explicitly identified listing is not the disputed quote')
assert(refused>40);assert(nav>=20)
console.log(JSON.stringify({unresolvedComparisons:rows.length,activeQuotesRefused:refused,independentNavCasesPreserved:nav,calculator:true,video:true,rankings:true,fx:true,anniversary:true,annualProjection:true,recentMonths:true}))

assert.deepEqual(qualifiedYearWindow([2017,2018,2020,2023,2024,2025],3),[2023,2024,2025])
assert.deepEqual(qualifiedYearWindow([2017,2018,2020,2023,2024,2025],4),[])
const members=[RANKING_ASSETS[id],RANKING_ASSETS.apple]
const safeDates=selectionDates(members)
assert(members.every(a=>qualifyHistoryWindow(a,safeDates.start,safeDates.end).qualified))
assert(qualifiedMonthlyWindows(members).some(w=>w.start===safeDates.start&&w.end===safeDates.end))
