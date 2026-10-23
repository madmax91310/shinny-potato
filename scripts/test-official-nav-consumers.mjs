import assert from 'node:assert/strict'
import {gunzipSync} from 'node:zlib'
import fs from 'node:fs'
import {ASSETS} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {getAnnualReturns,performanceBasis} from '../src/pages/tweet-midi/data/marketHistory.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
const levels=JSON.parse(fs.readFileSync('src/data/anniversary-levels.json'))
const archive=JSON.parse(gunzipSync(fs.readFileSync('reports/reliquat-2026-10-23/preuves/original-exchange-quote-records.json.gz')))
const swiss=archive.etfIE000U9ODG19.record
assert(!qualifyHistoryWindow(swiss,'2024-12','2025-12').qualified,'The archived Swiss carried-forward quote remains unqualified')
for(const id of ['etfEqualWeight','etfIE000U9ODG19','etfIE00BDFBTQ78']){
 const asset=ASSETS[id]
 assert.equal(asset.historyConvention,'fund-nav-total-return')
 assert(asset.label.endsWith(' · VL'))
 assert(!asset.mic&&!asset.ticker,'NAV must not impersonate a stock-exchange listing')
 const start=asset.points[0].date
 for(const mode of ['lump','dca']){
  const inputs={assetId:id,startYear:Number(start.slice(0,4)),startMonth:Number(start.slice(5)),amountRaw:'100',overridePriceRaw:'',mode}
  const d=derive(inputs),text=buildTweetText(inputs,d)
  const expected=(mode==='lump'?100/asset.points[0].price:asset.points.reduce((sum,p)=>sum+100/p.price,0))*asset.points.at(-1).price
  assert(Math.abs(d.result.finalValue-expected)<1e-7)
  assert(text.includes('VL'));assert(!/NaN|undefined/.test(text))
 }
 assert(getAnnualReturns(id,2025).length)
 const latest=resolveAnniversaryLevel(id,'',new Date(levels[id].asOf+'T12:00:00Z'))
 assert(latest&&latest.valuationBasis===asset.valuationBasis)
 assert.match(latest.label,/Valeur liquidative/)
}
assert(Math.abs(periodReturn(ASSETS.etfIE000U9ODG19,'2024-12','2025-12')-54.5533885)<.0001)
assert.equal(ASSETS.etfEqualWeight.periodStart,'2015-06')
console.log('Official NAV: exact identity, source convention, qualified windows, lump/DCA, annual performance, text and matching latest level; Swiss quote restriction preserved.')

const {ASSETS:portfolioAssets}=await import('../src/data/portfolio-assets.js')
const {CATALOG}=await import('../src/data/duel-assets.js')
for(const roster of [portfolioAssets,CATALOG]){const mining=roster.find(a=>a.id==='manual-IE00BDFBTQ78');assert(mining?.annualManual&&mining.isin==='IE00BDFBTQ78','Previously delivered Mining manual and duel IDs stay selectable');assert.equal(mining.returnCurrency??mining.currency,'USD','Official annual NAV currency is explicit and independent of the converted monthly history')}
