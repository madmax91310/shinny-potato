// Real source fixture in an isolated tree; no runtime or production data changed.
import assert from 'node:assert/strict'
import {cpSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync,readdirSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
const dir=mkdtempSync(join(tmpdir(),'oil-prefix-consumers-'))
try{
 cpSync('src',join(dir,'src'),{recursive:true});mkdirSync(join(dir,'scripts'))
 for(const name of readdirSync('scripts').filter(n=>n.endsWith('.json')))cpSync('scripts/'+name,join(dir,'scripts',name))
 writeFileSync(join(dir,'package.json'),'{"type":"module"}')
 const fixture=JSON.parse(readFileSync('scripts/fixtures/wisdomtree-oil-2020-prefix-20261108.json'))
 const path=join(dir,'src/data/automated-etf-monthly.json'),records=JSON.parse(readFileSync(path))
 for(const row of fixture.series)records[row.id]=row.candidate
 writeFileSync(path,JSON.stringify(records))
 const load=p=>import(pathToFileURL(join(dir,p)))
 const {ASSETS}=await load('src/data/market-history.js'),{buildEtfMonthlyHistories}=await load('src/data/etf-monthly-history.js')
 const {qualifyHistoryWindow}=await load('src/data/history-window-quality.js')
 const {derive,buildTweetText}=await load('src/pages/investment-calculator/lib.js')
 const {RANKING_ASSETS}=await load('src/pages/performance-rankings/data.js'),{periodReturn}=await load('src/pages/performance-rankings/engine.js')
 const {convertAsset}=await load('src/pages/performance-rankings/series.js')
 const {ASSETS:PERFORMANCE,getAnnualReturns}=await load('src/pages/tweet-midi/data/performanceHistory.js')
 const {ANNIVERSAIRE_ELIGIBLE_ASSETS}=await load('src/pages/tweet-midi/data/marketHistory.js')
 const fx=JSON.parse(readFileSync(join(dir,'src/data/monthly-fx.json')))
 for(const {id,previous,candidate:r}of fixture.series){
  const a=ASSETS[id],old=buildEtfMonthlyHistories({[id]:previous})[id]
  assert.equal(qualifyHistoryWindow(old,'2019-12','2020-12').qualified,false)
  assert(qualifyHistoryWindow(a,'2019-12','2020-12').qualified)
  assert(qualifyHistoryWindow(a,'2020-11','2020-12').qualified)
  assert.equal(a.historyConvention,'fund-nav-total-return');assert.equal(a.levelUnit,'performance-points');assert.equal(a.allowPriceOverride,false)
  assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(x=>x.id===id),'No raw-price anniversary admission')
  const check=r.calendarProof.checks.find(c=>c.year===2020);assert(check)
  assert(Math.abs(periodReturn(RANKING_ASSETS[id],'2019-12','2020-12')-check.dailyDerived)<1e-6)
  assert(PERFORMANCE[id]);assert(Math.abs(getAnnualReturns(id,2020)[0].pct-check.dailyDerived)<1e-6)
  const factor=m=>fx.months[m].rates.EUR/fx.months[m].rates.USD
  const expected=((1+check.dailyDerived/100)*factor('2020-12')/factor('2019-12')-1)*100
  assert(Math.abs(periodReturn(convertAsset(RANKING_ASSETS[id],'EUR',fx),'2019-12','2020-12')-expected)<1e-6)
  const before=dict(previous.points),after=dict(r.points)
  for(const [month,value]of before)assert.equal(after.get(month),value)
  for(const mode of ['lump','dca']){
   const input={assetId:id,amountRaw:'1000',startYear:2019,startMonth:12,mode,currency:'USD',overridePriceRaw:''}
   const d=derive(input),p=a.points;const expected=(mode==='lump'?1000/p[0].price:p.reduce((n,x)=>n+1000/x.price,0))*p.at(-1).price
   assert(Math.abs(d.result.finalValue-expected)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(input,d)))
  }
  assert(!qualifyHistoryWindow(ASSETS[id.replace('Nav','')],'2020-12','2021-12').qualified,'The original market quote remains refused')
 }
 console.log('Two exact oil NAV routes: official 2020 calendar, unchanged suffix, monthly boundary, USD/EUR, calculator/DCA, Performance depuis and rankings; old quotes and anniversary exclusions retained.')
}finally{rmSync(dir,{recursive:true,force:true})}
function dict(p){return new Map(p)}
