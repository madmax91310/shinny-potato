import assert from'node:assert/strict'
import fs from'node:fs'
import{ASSETS,ASSET_ORDER}from'../src/data/market-history.js'
import{qualifyHistoryWindow}from'../src/data/history-window-quality.js'
import{derive,buildTweetText}from'../src/pages/investment-calculator/lib.js'
import{getAnnualReturns,getHistoricalPrice,ANNIVERSAIRE_ELIGIBLE_ASSETS}from'../src/pages/tweet-midi/data/marketHistory.js'
import{periodReturn}from'../src/pages/performance-rankings/engine.js'
import{RANKING_ASSETS}from'../src/pages/performance-rankings/data.js'
import{resolveAnniversaryLevel}from'../src/data/anniversary-levels.js'
const id='etfLU1737652823Nav',a=ASSETS[id],r=JSON.parse(fs.readFileSync('reports/donnees-consolidees-2026-10-24/preuves/reprise-20261027/reit-nav-local.json')).series[0].record
assert(a&&ASSET_ORDER.includes(id));assert.equal(a.isin,'LU1737652823');assert.equal(a.currency,'EUR');assert.equal(a.historyConvention,'fund-nav-total-return')
assert(!a.ticker&&!a.mic);assert(qualifyHistoryWindow(a,'2023-12','2024-12').qualified)
assert(!qualifyHistoryWindow(a,'2018-12','2019-12').qualified,'No fabricated first full year')
assert(!qualifyHistoryWindow(ASSETS.etfLU1737652823,'2023-12','2024-12').qualified,'Original Xetra divergence remains refused')
const expected=r.calendarProof.checks.find(c=>c.year===2024).dailyDerived
assert(Math.abs(periodReturn(a,'2023-12','2024-12')-expected)<1e-7)
assert(Math.abs(getAnnualReturns(id,2024)[0].pct-expected)<1e-7);assert(RANKING_ASSETS[id])
for(const ym of ['2023-12','2024-12']){
 assert(Math.abs(getHistoricalPrice(id,ym)-r.anniversaryPoints.find(p=>p[0]===ym)[1])<1e-7)
 assert.notEqual(getHistoricalPrice(id,ym),a.points.find(p=>p.date===ym).price,'Historical anniversary prices exclude reinvested cash')
}
for(const mode of ['lump','dca']){
 const input={assetId:id,startYear:2023,startMonth:12,amountRaw:'1000',mode,currency:'EUR',overridePriceRaw:''},d=derive(input),points=a.points.filter(p=>p.date>='2023-12')
 const oracle=(mode==='lump'?1000/points[0].price:points.reduce((s,p)=>s+1000/p.price,0))*points.at(-1).price
 assert(Math.abs(d.result.finalValue-oracle)<1e-7);assert.match(buildTweetText(input,d),/VL/)
}
assert(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===id));assert.equal(resolveAnniversaryLevel(id,'').valuationBasis,'fund-nav-price')
console.log('Exact distributing Amundi REIT: one reinvestment, 2024 annual/monthly consumers, price-only anniversary, no pre-2019 window and original quote refusal verified.')
