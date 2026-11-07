// An isolated fixture tree exercises actual selectors and engines before the
// ordinary producer records the new source. No production data file is edited.
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {cpSync,readdirSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
const dir=mkdtempSync(join(tmpdir(),'hsbc-monthly-consumers-'))
try{
 cpSync('src',join(dir,'src'),{recursive:true});mkdirSync(join(dir,'scripts'))
 for(const name of readdirSync('scripts').filter(n=>n.endsWith('.json')))cpSync('scripts/'+name,join(dir,'scripts',name))
 writeFileSync(join(dir,'package.json'),'{"type":"module"}')
 const replay=spawnSync('python',['-c',`import sys,json;sys.path.insert(0,'scripts');from test_hsbc_monthly_nav import inputs,SOURCE,NOW;import hsbc_nav_history as h;from issuer_nav_history import monthly;nav,p,d,c=inputs();levels,proof=h.qualify(nav,p,d,c,SOURCE,NOW);points,_=monthly(levels,'EUR','EUR','2023-12',NOW);print(json.dumps({**SOURCE,'points':points,'periodEnd':points[-1][0],'checkedAt':'2026-11-07','sourceCredit':'HSBC / FCA NSM','sourceUrls':[SOURCE['sourceUrl']],'anniversaryAvailable':False,'calendarProof':proof}))`],{encoding:'utf8'})
 assert.equal(replay.status,0,replay.stderr);const record=JSON.parse(replay.stdout),id=record.id
 const file=join(dir,'src/data/automated-etf-monthly.json'),records=JSON.parse(readFileSync(file));const quoteBefore=records.etfIE00B4K6B022;records[id]=record;writeFileSync(file,JSON.stringify(records))
 const load=path=>import(pathToFileURL(join(dir,path)))
 const {ASSETS,ASSET_ORDER}=await load('src/data/market-history.js'),{derive,buildTweetText}=await load('src/pages/investment-calculator/lib.js'),{qualifyHistoryWindow}=await load('src/data/history-window-quality.js')
 assert(ASSET_ORDER.includes(id));assert.equal(ASSETS[id].isin,'IE00B4K6B022');assert.equal(ASSETS[id].currency,'EUR');assert.equal(ASSETS[id].historyConvention,'fund-nav-total-return');assert.equal(ASSETS[id].anniversaryAvailable,false)
 assert(qualifyHistoryWindow(ASSETS[id],'2023-12','2024-12').qualified)
 assert(!qualifyHistoryWindow(ASSETS.etfIE00B4K6B022,'2023-12','2024-12').qualified,'Old suspect quote window stays refused')
 assert.deepEqual(records.etfIE00B4K6B022,quoteBefore)
 for(const mode of ['lump','dca']){
  const state={assetId:id,amountRaw:'100',startYear:2023,startMonth:12,mode,overridePriceRaw:''},r=derive(state),p=record.points
  const expected=mode==='lump'?100*p.at(-1)[1]/p[0][1]:p.reduce((n,x)=>n+100/x[1],0)*p.at(-1)[1]
  assert(Math.abs(r.result.finalValue-expected)<1e-6);assert(!/NaN|undefined/.test(buildTweetText(state,r)))
 }
 const {ASSETS:PERFORMANCE,getAnnualReturns}=await load('src/pages/tweet-midi/data/performanceHistory.js');assert(PERFORMANCE[id]);assert(Math.abs(getAnnualReturns(id,2024)[0].pct-11.571110862628764)<1e-7)
 const {RANKING_ASSETS}=await load('src/pages/performance-rankings/data.js'),{periodReturn}=await load('src/pages/performance-rankings/engine.js')
 assert.equal(RANKING_ASSETS[id].basis,'fund-nav-total-return');assert(Math.abs(periodReturn(RANKING_ASSETS[id],'2023-12','2024-12')-11.571110862628764)<1e-7)
 const {ANNIVERSAIRE_ELIGIBLE_ASSETS}=await load('src/pages/tweet-midi/data/marketHistory.js');assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===id),'No anniversary/raw-price admission from a new total return route')
 console.log('HSBC exact-share independent NAV/cash fixture: selectors, qualification, lump/DCA, performance and ranking engines; old quote refusal and anniversary exclusion preserved.')
}finally{rmSync(dir,{recursive:true,force:true})}
