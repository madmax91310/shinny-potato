import assert from 'node:assert/strict'
import SOURCES from './new-distributing-nav-sources.json' with {type:'json'}
import RAW from '../src/data/automated-etf-monthly.json' with {type:'json'}
import {ASSETS} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {ASSETS as PERFORMANCE} from '../src/pages/tweet-midi/data/performanceHistory.js'
import {ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {ASSETS as PORTFOLIO} from '../src/data/portfolio-assets.js'
import {CATALOG as DUELS} from '../src/data/duel-assets.js'
import {AUTOMATIC_RECIPE_ISINS} from '../src/data/automated-portfolio-funds.js'
import {anniversaryReferenceDate} from '../src/lib/anniversary-reference.js'
import {ANNIVERSARY_ART} from '../src/pages/tweet-midi/anniversaryArt.js'

for(const source of SOURCES){
 const record=RAW[source.id],asset=ASSETS[source.id]
 assert(asset&&record&&asset.isin===source.isin)
 assert.equal(asset.currency,source.navCurrency)
 assert.equal(asset.historyConvention,'fund-nav-total-return')
 assert(!asset.ticker&&!asset.mic,'A NAV is not an exchange quote')
 const quote=RAW[source.id.replace(/Nav$/,'')]
 assert(quote?.isin===source.isin&&quote.parser==='yahoo'&&quote.field==='adjclose','Existing exact-share quote retained')
 const start=asset.points[0].date,end=asset.points.at(-1).date
 assert.equal(end,record.periodEnd)
 assert(qualifyHistoryWindow(asset,start,end).qualified)
 for(const withheld of record.calendarProof.withheldMonthlyEnds??[]){
  assert(end<withheld.month)
  assert(!qualifyHistoryWindow(asset,start,withheld.month).qualified)
  assert(record.historyExcludedMonths.includes(withheld.month))
 }
 for(const mode of ['lump','dca']){
  const state={assetId:source.id,startYear:Number(start.slice(0,4)),startMonth:Number(start.slice(5)),amountRaw:'100',overridePriceRaw:'',mode}
  const result=derive(state)
  const units=mode==='lump'?100/asset.points[0].price:asset.points.reduce((n,p)=>n+100/p.price,0)
  assert(Math.abs(result.result.finalValue-units*asset.points.at(-1).price)<1e-6)
  const text=buildTweetText(state,result)
  assert(text.includes('VL'));assert(!/NaN|undefined/.test(text))
 }
 const expected=(asset.points.at(-1).price/asset.points[0].price-1)*100
 assert(Math.abs(periodReturn(RANKING_ASSETS[source.id],start,end)-expected)<1e-6)
 assert(PERFORMANCE[source.id])
 assert(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===source.id))
 assert.equal(record.anniversaryValuationBasis,'fund-nav-price')
 assert.equal(record.latestLevel.valuationBasis,'fund-nav-price')
 assert.equal(record.latestLevel.currency,source.navCurrency)
 assert(!/undefined/.test(ANNIVERSARY_ART[source.id].subtitle))
 assert(ANNIVERSARY_ART[source.id].subtitle.includes(source.isin),'The NAV image identifies the exact share without inventing a ticker')
 const reference=anniversaryReferenceDate([{asset,observation:record.latestLevel}],new Date())
 assert.equal(reference.getMonth()+1,Number(record.latestLevel.asOf.slice(5,7)))
 assert(record.anniversaryPoints.every(([month])=>month<=end))
 const generator=PORTFOLIO.find(a=>a.isin===source.isin),duel=DUELS.find(a=>a.isin===source.isin)
 assert(generator?.manualOnly&&duel)
 assert(!AUTOMATIC_RECIPE_ISINS.has(source.isin),'A source qualification does not authorize an automatic recipe')
}
const clock=new Date(2026,10,2),nav={historyConvention:'fund-nav-total-return'},price={historyConvention:'adjusted-close'}
assert.equal(anniversaryReferenceDate([{asset:nav,observation:{asOf:'2026-10-30'}}],clock).getMonth(),9)
assert.equal(anniversaryReferenceDate([{asset:nav,observation:{manual:true}}],clock).getMonth(),10)
assert.equal(anniversaryReferenceDate([{asset:price,observation:{asOf:'2026-10-30'}}],clock).getMonth(),10)
assert.equal(anniversaryReferenceDate([{asset:nav,observation:{asOf:'2026-10-29'}},{asset:nav,observation:{asOf:'2026-11-02'}}],clock).getMonth(),9)
console.log('Income NAV recovery: exact quotes retained; qualified windows, lump/DCA, performance, rankings, raw-NAV anniversary and manual portfolio links verified.')
