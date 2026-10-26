import assert from 'node:assert/strict'
import fs from 'node:fs'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {getAnnualReturns,getHistoricalPrice,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import {QUALIFIED_FUND_CALENDARS} from '../src/data/qualified-annual-calendars.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}

const id='etfLU2196470426Nav',a=ASSETS[id],start='2024-12',end='2025-12'
const capture=JSON.parse(fs.readFileSync('reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026/nikkei-github-40364575719/nav.json'))
assert.deepEqual(capture.scope.expectedIds,[id])
const record=capture.series[0].record
assert.equal(capture.series[0].status,'validated')
assert(ASSET_ORDER.includes(id))
assert.equal(a.isin,'LU2196470426');assert.equal(a.currency,'EUR')
assert.equal(a.historyConvention,'fund-nav-total-return');assert(!a.ticker&&!a.mic)
assert(qualifyHistoryWindow(a,start,end).qualified)
assert(!qualifyHistoryWindow(ASSETS.etfLU2196470426,start,end).qualified,'The old Xetra quote remains refused for 2025')
assert(!qualifyHistoryWindow(a,'2020-09','2021-12').qualified,'No observation invented before the share launch')
const sourceRows=record.proofRows
const factor=ym=>sourceRows.find(r=>r.date.startsWith(ym)).fxFactor
const check=record.calendarProof.checks.find(r=>r.year===2025)
const expected=((check.endValue/check.startValue)*factor(end)/factor(start)-1)*100
assert(Math.abs(periodReturn(a,start,end)-expected)<1e-7,'Monthly JPY NAV receives exactly one existing monthly ECB conversion')
assert.equal(getAnnualReturns(id,2025)[0].year,2025)
assert(Math.abs(getAnnualReturns(id,2025)[0].pct-expected)<1e-7)
for(const mode of ['lump','dca']){
 const input={assetId:id,startYear:2024,startMonth:12,amountRaw:'1000',mode,currency:'EUR',overridePriceRaw:''}
 const d=derive(input),points=a.points.filter(p=>p.date>=start)
 const oracle=(mode==='lump'?1000/points[0].price:points.reduce((sum,p)=>sum+1000/p.price,0))*points.at(-1).price
 assert.equal(d.startYm,start);assert(Math.abs(d.result.finalValue-oracle)<1e-7)
 assert.match(buildTweetText(input,d),/VL/)
}
assert(RANKING_ASSETS[id]);assert(Math.abs(periodReturn(convertAsset(RANKING_ASSETS[id],'USD',FX),start,end)-periodReturn(convertAsset({...a,basis:RANKING_ASSETS[id].basis},'USD',FX),start,end))<1e-8)
assert(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(r=>r.id===id))
const levels=JSON.parse(fs.readFileSync('src/data/anniversary-levels.json')),live=levels[id]
const latest=resolveAnniversaryLevel(id,'',new Date(live.asOf+'T12:00:00Z'))
assert(latest);assert.equal(latest.value,live.value);assert.equal(latest.currency,'EUR')
assert.equal(latest.valuationBasis,'fund-nav-total-return')
assert.equal(getHistoricalPrice(id,'2025-10'),a.points.find(p=>p.date==='2025-10').price)
assert(!QUALIFIED_FUND_CALENDARS.LU2196470426,'No portfolio admission from performance-only JPY calendars')
const current=JSON.parse(fs.readFileSync('public/data/financial-reconciliation.json')).rows.find(r=>r.id==='LU2196470426/2025')
assert(current.open,'An independent source does not explain the original quote divergence')
console.log('Nikkei exact-share NAV: GitHub provenance, launch bounds, original restriction, one FX conversion, lump/DCA, annual performance, comparison and anniversary verified.')
