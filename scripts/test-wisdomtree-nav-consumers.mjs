import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {ASSETS} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import {ANNIVERSAIRE_ELIGIBLE_ASSETS,getHistoricalPrice} from '../src/pages/tweet-midi/data/marketHistory.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
import records from '../src/data/automated-etf-monthly.json' with {type:'json'}
import {historyAlerts} from './history-alerts.mjs'
const archive=JSON.parse(gunzipSync(fs.readFileSync('scripts/fixtures/wisdomtree-export/qualified-collection.json.gz')))
const checks={},alerts=historyAlerts('2026-10-29',[],checks)
let targets=0,oldRefusals=0,currentRefusals=0
for(const {record:old} of archive.series){
 const r=records[old.id],a=ASSETS[old.id]
 assert(a);assert.equal(a.isin,r.isin);assert.equal(a.historyConvention,'fund-nav-total-return');assert.equal(a.currency,'USD')
 assert.equal(a.anniversaryAvailable,false);assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(x=>x.id===r.id))
 assert.equal(resolveAnniversaryLevel(r.id,''),null);assert.throws(()=>getHistoricalPrice(r.id,r.periodStart),/hors distributions/)
 assert(!a.symbol&&!a.ticker&&!a.mic);assert(RANKING_ASSETS[r.id])
 assert(['official-xlsx-post','official-dataspan-nav-tr'].includes(r.navHistoryTransport))
 // Compare the active consumer to its actual active source proof. The original
 // export remains a separate immutable witness, with all six original guards.
 for(const c of r.calendarProof.checks){
  const start=`${c.year-1}-12`,end=`${c.year}-12`
  assert(qualifyHistoryWindow(a,start,end).qualified)
  assert(Math.abs(periodReturn(a,start,end)-c.dailyDerived)<1e-6)
 }
 for(const year of r.requiredQualifiedCalendarYears){assert(qualifyHistoryWindow(a,`${year-1}-12`,`${year}-12`).qualified);targets++}
 const original={...a,points:old.points.map(([date,price])=>({date,price})),historyUnqualifiedReturnWindows:old.historyUnqualifiedReturnWindows}
 for(const w of old.historyUnqualifiedReturnWindows??[]){
  assert.equal(qualifyHistoryWindow(original,w.start,w.end).code,'issuer-return-window-unconfirmed')
  assert.throws(()=>periodReturn(original,w.start,w.end),/non rapprochés/);oldRefusals++
 }
 for(const w of r.historyUnqualifiedReturnWindows??[]){
  assert.equal(qualifyHistoryWindow(a,w.start,w.end).code,'issuer-return-window-unconfirmed')
  assert.throws(()=>periodReturn(a,w.start,w.end),/non rapprochés/)
  assert.throws(()=>periodReturn(convertAsset(RANKING_ASSETS[r.id],'EUR',FX),w.start,w.end),/non rapprochés/)
  assert.throws(()=>derive({assetId:r.id,startYear:Number(w.start.slice(0,4)),startMonth:12,amountRaw:'100',mode:'dca',currency:'USD',overridePriceRaw:''}),/non rapprochés/)
  const alert=alerts.find(x=>x.id===`automated-etf-monthly:${r.id}:return-window:${w.start}:${w.end}`)
  assert(alert);assert.equal(alert.unqualifiedReturnWindow.year,w.year);currentRefusals++
 }
 if(r.navHistoryTransport==='official-dataspan-nav-tr'){
  assert.equal(a.levelUnit,'performance-points');assert.equal(a.allowPriceOverride,false)
  assert.throws(()=>derive({assetId:r.id,startYear:Number(r.periodStart.slice(0,4)),startMonth:Number(r.periodStart.slice(5)),amountRaw:'100',mode:'lump',currency:'USD',overridePriceRaw:'100'}),/unités de performance/)
  assert.equal(r.calendarProof.navHistoryTransport,r.navHistoryTransport)
  assert(r.calendarProof.calendarSourceConsultedByThisCollector)
  assert.equal(r.calendarProof.scaleProof.anchor.isin,r.isin)
  assert.equal(r.calendarProof.scaleProof.anchorIsFreshSourceCheck,false)
  for(const w of old.historyUnqualifiedReturnWindows??[]){
   assert(r.calendarProof.checks.some(c=>c.year===w.year),'Every restored window needs its own source/calendar proof')
   assert(qualifyHistoryWindow(a,w.start,w.end).qualified)
   assert(!alerts.some(x=>x.id===`automated-etf-monthly:${r.id}:return-window:${w.start}:${w.end}`))
  }
 }
 const lastBad=(r.historyUnqualifiedReturnWindows??[]).map(w=>w.end).sort().at(-1),start=lastBad??r.periodStart
 for(const mode of ['lump','dca']){
  const input={assetId:r.id,startYear:Number(start.slice(0,4)),startMonth:Number(start.slice(5)),amountRaw:'1000',mode,currency:'USD',overridePriceRaw:''}
  const d=derive(input),ps=a.points.filter(p=>p.date>=start)
  const oracle=(mode==='lump'?1000/ps[0].price:ps.reduce((sum,p)=>sum+1000/p.price,0))*ps.at(-1).price
  assert(Math.abs(d.result.finalValue-oracle)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(input,d)))
 }
}
assert.equal(targets,7);assert.equal(oldRefusals,6)
console.log(`Four exact ETCs: seven initial targets, six original export refusals preserved as historical evidence, ${currentRefusals} active refusals. Active source proofs, units, DCA, FX, monitoring and anniversary exclusions checked.`)
