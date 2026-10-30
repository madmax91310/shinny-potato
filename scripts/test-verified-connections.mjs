import {RESOURCE_DUEL_CHOICES} from '../src/data/resource-selections.js'
import { isQualifiedAnnualPortfolioFund } from '../src/data/annual-portfolio-funds.js'
import { INVESTMENT_ART } from '../src/pages/investment-calculator/emeraldArt.js'
import assert from 'node:assert/strict'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { ETFS } from '../src/data/etf-cards.js'
import { closedCalendarYears, currentAnnualEvidence, qualifyFundCalendar, qualifyIndexCalendar, QUALIFIED_FUND_CALENDARS } from '../src/data/qualified-annual-calendars.js'
import INDICES from '../src/data/automated-indices.json' with { type:'json' }
import * as history from '../src/pages/tweet-midi/data/performanceHistory.js'
import { derive as calculateInvestment } from '../src/pages/investment-calculator/lib.js'
import { CERTIFIED_INDEX_HISTORIES } from '../src/data/certified-monthly-indices.js'
import { ASSETS as MONTHLY } from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS } from '../src/pages/tweet-midi/data/marketHistory.js'
import { getPerformanceAssetId } from '../src/data/performance-links.js'
import engine from '../src/pages/tweet-midi/engines/performance.js'
import { projectLightRegistries } from './project-light-registries.mjs'
import { annualProjection } from './project-selected-data.mjs'
import { ASSETS as PORTFOLIO } from '../src/data/portfolio-assets.js'
import { CATALOG, buildCustomDuel } from '../src/pages/portfolio-duels/lib.js'
import { generateDuel } from '../src/pages/portfolio-duels/generate.js'
import { buildManualPortfolio } from '../src/pages/portfolio-generator/engine.js'
import { AUTOMATIC_FACTOR_ADMISSIONS } from '../src/data/portfolio-admissions.js'
import { getRecipes } from '../src/pages/portfolio-generator/recipes.js'
import { RANKING_ASSETS, ANNUAL_ASSETS } from '../src/pages/performance-rankings/data.js'
import { buildRanking, commonCoverage } from '../src/pages/performance-rankings/engine.js'
import { convertAsset } from '../src/pages/performance-rankings/series.js'
import { annualRankingColumns } from '../src/pages/performance-rankings/annualRanking.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
import { references } from '../src/pages/dca-profiles/records.js'
import { ASSETS as EXPOSURE_CHOICES } from '../src/pages/dca-profiles/data.js'
import { sharedPositions } from '../src/pages/dca-profiles/verification.js'
import { dcaExposure, exposureDisplay } from '../src/pages/dca-profiles/exposure.js'
import { readFileSync } from 'node:fs'
for(const [id,record] of Object.entries(CERTIFIED_INDEX_HISTORIES)){
 assert(MONTHLY[id]);assert.equal(record.priceUnit,'points');assert(record.points.length>=24)
 const [year,month]=record.points[0].date.split('-').map(Number)
 const base={assetId:id,startYear:year,startMonth:month,amountRaw:'1000',currency:'USD',overridePriceRaw:''}
 const lump=calculateInvestment({...base,mode:'lump'})
 assert(Math.abs(lump.result.finalValue-1000*record.points.at(-1).price/record.points[0].price)<1e-8,`${id}: real monthly level ratio`)
 const dca=calculateInvestment({...base,mode:'dca'});assert(Number.isFinite(dca.result.finalValue))
 const euro=calculateInvestment({...base,mode:'lump',currency:'EUR'})
 if(year<2010){assert.equal(euro.inflation,null,'Missing pre-2010 inflation cannot be treated as zero');assert.equal(euro.livretA,null)}
 if(!record.anniversaryAvailable)assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===id),'Monthly levels do not qualify a new anniversary feed')
 assert(history.getAnnualReturnStartYears(id).length)
}
const bounded=calculateInvestment({assetId:'ftseAllWorld',startYear:2010,startMonth:1,amountRaw:'1000',currency:'USD',mode:'lump',overridePriceRaw:''})
assert.equal(bounded.startYm,MONTHLY.ftseAllWorld.points[0].date,'No synthetic purchases before the first verified month')
const now = new Date('2026-10-21T12:00:00Z')
const isin = 'LU0908500753', identity = ETFS.find(a=>a.isin===isin)
const record={...AUTOMATED_ETF[isin],performance:{...AUTOMATED_ETF[isin].performance,checkedAt:'2026-10-21',asOf:'2025-12-31',years:{2023:5,2024:-3,2025:7}}}
assert(qualifyFundCalendar(isin,record,identity,now))
for (const mutation of [
  {basis:'index'}, {portfolioHistoryBasis:'proxy'}, {method:'cumulative exact-share NAV total return'},
  {sourceUrl:42}, {checkedAt:'2026-10-22'}, {checkedAt:'2026-10-01'}, {checkedAt:'2026-99-30'}, {currency:'GBP'},
]) assert.equal(qualifyFundCalendar(isin,{...record,performance:{...record.performance,...mutation}},identity,now),null)
assert.equal(qualifyFundCalendar(isin,{...record,productId:'IE00B5BMR087'},identity,now),null)
// The performance consumer can convert native JPY; portfolio admissions keep
// their existing EUR/USD contract and must not inherit this extra capability.
const nativeRecord={...record,performance:{...record.performance,currency:'JPY'}}
const performanceCurrencies={nativeCurrencies:['EUR','USD','JPY']}
assert.equal(qualifyFundCalendar(isin,nativeRecord,identity,now),null)
assert.equal(qualifyFundCalendar(isin,nativeRecord,identity,now,performanceCurrencies).currency,'JPY')
for(const mutation of [{basis:'index'},{portfolioHistoryBasis:'proxy'},{checkedAt:'2026-10-22'},{currency:'GBP'}])
 assert.equal(qualifyFundCalendar(isin,{...nativeRecord,performance:{...nativeRecord.performance,...mutation}},identity,now,performanceCurrencies),null)
assert.equal(qualifyFundCalendar(isin,{...nativeRecord,productId:'IE00B5BMR087'},identity,now,performanceCurrencies),null)
assert(!QUALIFIED_FUND_CALENDARS.LU2196470426,'No new portfolio admission from the performance-only currency capability')
assert(history.getAnnualReturnStartYears('annual-LU2196470426').includes(2025))
assert(engine.getSubjectsForFormat('performance-depuis').flatMap(group=>group.items).some(a=>a.id==='annual-LU2196470426'))
assert.equal(getPerformanceAssetId('LU2196470426'),'annual-LU2196470426','The generated ISIN shortcut uses the qualified calendar')
assert(!history.getAnnualReturnStartYears('annual-LU2196470426').includes(2020),'No complete launch year invented')
assert.equal(qualifyHistoryWindow(MONTHLY.etfLU2196470426,'2024-12','2025-12').qualified,false,'Original contested quote remains refused')
assert.deepEqual(closedCalendarYears({2020:1,2021:true,2022:-100,2023:Infinity,2026:5},now),{2020:1})
assert.equal(currentAnnualEvidence('2026-10-21','2026-02-30','index.returns',now),false)
const indexFixture={...INDICES['russell-1000'],returns:{...INDICES['russell-1000'].returns,asOf:'2026-09-30',currency:'USD',values:[[2025,5]],source:{url:'https://issuer.example/index.pdf',sha256:'a'.repeat(64),checkedAt:'2026-10-21'},variant:'NET'}}
assert(qualifyIndexCalendar('fixture',indexFixture,now))
assert.equal(qualifyIndexCalendar('fixture',{...indexFixture,returns:{...indexFixture.returns,variant:'TOTAL'}},now),null,'TOTAL does not prove net/gross taxation')
assert(engine.getSubjectsForFormat('performance-depuis').flatMap(group=>group.items).every(a=>history.getAnnualReturnStartYears(a.id).length),'Every performance choice must calculate at least one complete calendar year')
const projection=annualProjection(), added=history.MARKET_ASSETS.filter(a=>a.frequency==='annual')
for(const asset of added) {
  assert.equal(MONTHLY[asset.id],undefined)
  assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===asset.id))
  assert.equal(asset.points,undefined)
  assert.deepEqual(projection.years[asset.id],history.getAnnualReturnStartYears(asset.id))
  const year=history.getAnnualReturnStartYears(asset.id)[0]
  const item={format:'performance-depuis',mode:'simple',assetId:asset.id,year,currency:'EUR'}
  assert(engine.getSubjectsForFormat('performance-depuis','simple').flatMap(group=>group.items).some(a=>(a.id??a.value)===asset.id),asset.id)
  assert(engine.getPerformanceEntries(item)[0].returns.every(r=>Number.isFinite(r.pct)))
  assert.doesNotMatch(engine.buildTweetText(item),/undefined|NaN/)
}
// Consecutive calendar rows stop on gaps; no invented annual/monthly levels.
const annual=added.find(a=>a.isin==='IE000QDFFK00')
if(annual){assert(history.getAnnualReturnStartYears(annual.id).every(year=>year>=2023));assert.deepEqual(history.getAnnualReturns(annual.id,2020),[])}
else assert(history.MARKET_ASSETS.some(a=>a.isin==='IE000QDFFK00'&&history.getAnnualReturnStartYears(a.id).length),'A newly completed monthly history may replace the annual fallback, never the exact share')
for(const asset of PORTFOLIO.filter(a=>a.annualManual)) {
  assert(isQualifiedAnnualPortfolioFund(asset))
  assert(!isQualifiedAnnualPortfolioFund({...asset,returnCurrency:asset.returnCurrency==='EUR'?'USD':'EUR'}))
  assert(!isQualifiedAnnualPortfolioFund({...asset,calendarReturns:{...asset.calendarReturns,2025:999}}))
  const duel=CATALOG.find(a=>a.isin===asset.isin);assert(duel,asset.isin)
  const manual=buildManualPortfolio([{id:asset.id,pct:100}],'generaliste',[])
  const result=buildCustomDuel({left:[{id:'msci_world_ishares',pct:100}],right:[{id:duel.id,pct:100}]})
  for(const year of result.years) assert(Math.abs(manual.perf[year]-result.b.annual[year])<1e-9,`${asset.isin}/${year}: same EUR results`)
  assert.equal(asset.manualOnly,true)
}
const admissionCode=projectLightRegistries().transform('', '/app/src/data/portfolio-admissions.js').code
const projectedAdmissions=await import('data:text/javascript;base64,'+Buffer.from(admissionCode).toString('base64'))
assert.deepEqual(projectedAdmissions.AUTOMATIC_FACTOR_ADMISSIONS,AUTOMATIC_FACTOR_ADMISSIONS,'Build projections preserve role, profile and allocation permissions')
assert(!admissionCode.includes('automated-etf'))
let duelId=''
for(let i=0;i<30;i++){const duel=generateDuel(duelId);duelId=duel.id;assert([...duel.a.assets,...duel.b.assets].every(a=>!a.annualManual || RESOURCE_DUEL_CHOICES.some(([id,isin,,,role])=>id===a.id && isin===a.isin && role===a.role)),'New annual admissions do not enter generated Duels; exact pre-existing resource roles remain available')}
for(const admission of AUTOMATIC_FACTOR_ADMISSIONS) {
  assert.equal(PORTFOLIO.find(a=>a.id===admission.id).manualOnly,false)
  for(const profile of ['generaliste','rentier','bouclier','pro_europe'])for(const risk of ['prudent','defensif','equilibre','dynamique','offensif']) {
    const recipes=getRecipes(profile,risk).filter(recipe=>recipe.assets.some(slot=>(slot.idOptions??[slot.id]).includes(admission.id)))
    if(profile!=='pro_europe'||!admission.risks.includes(risk))assert.equal(recipes.length,0)
    for(const recipe of recipes){const slot=recipe.assets.find(slot=>(slot.idOptions??[slot.id]).includes(admission.id));assert(slot.maxPct<=admission.maxPct);assert(recipe.assets.some(s=>s.id===admission.core))}
  }
}
assert.equal(RANKING_ASSETS.soxx,undefined,'Price-only SOXX must not become total return')
for(const id of ['etfIE00BDFBTQ78','etfGB00B15KXQ89']){
 assert(RANKING_ASSETS[id],`${id}: a historical repetition does not exclude independent valid windows`)
 assert(qualifyHistoryWindow(RANKING_ASSETS[id],'2024-12','2025-12').qualified)
}
const {gunzipSync}=await import('node:zlib')
const {readFileSync:readOriginalHistory}=await import('node:fs')
const originalSwiss=JSON.parse(gunzipSync(readOriginalHistory('reports/reliquat-2026-10-23/preuves/original-exchange-quote-records.json.gz'))).etfIE000U9ODG19.record
assert.equal(qualifyHistoryWindow(originalSwiss,'2024-12','2025-12').qualified,false,'Archived Swiss Aerospace 2025 remains refused')
assert.equal(RANKING_ASSETS.etfIE000U9ODG19.valuationBasis,'fund-nav-total-return')
assert(qualifyHistoryWindow(RANKING_ASSETS.etfIE000U9ODG19,'2024-12','2025-12').qualified,'Independently verified exact-share NAV restores the valid window')
const aerospace=RANKING_ASSETS['aerospace-paris-eur']
assert(aerospace);assert.equal(aerospace.isin,'IE000U9ODG19');assert.equal(aerospace.currency,'EUR');assert.equal(aerospace.points[0].date,'2024-08')
assert(commonCoverage([aerospace,RANKING_ASSETS.etfIE00B4L5Y983]).years.includes(2025))
const newIndex=Object.values(ANNUAL_ASSETS).filter(a=>a.id.startsWith('annual-index-'))
for(const a of newIndex) {
  const other=Object.values(ANNUAL_ASSETS).find(b=>b.id!==a.id&&b.basis===a.basis)
  const assets=[a,other].map(r=>convertAsset(r,'EUR',FX)), years=commonCoverage(assets).years
  assert(years.length)
  const end=years.findLast((year,i)=>i>0&&year===years[i-1]+1)
  const ranking=buildRanking(assets,{mode:'years',startYear:end?end-1:years.at(-1),endYear:end??years.at(-1)})
  if(end){const columns=annualRankingColumns(ranking);assert.equal(columns.length,2);assert.equal(columns[0].rows.length,2)}
  else assert.throws(()=>annualRankingColumns(ranking),/2 années/)
}
const routingReport=JSON.parse(readFileSync('docs/asset-tool-routing.json'))
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const holdings=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
for(const id of ['IE00BFMXYX26','IE00BK5BQZ41','IE00BKX55R35']) {
  assert(EXPOSURE_CHOICES[id]);assert(references[id]);assert(holdings[id]?.complete)
  assert.equal(references[id].compositionOnly,true)
  assert.equal(routingReport.rows.find(r=>r.isin===id)?.blocker,null,'Composition-only data does not create a spurious requirement for monthly prices')
  const line={asset:id,isin:id,label:id,weight:100}
  for(const field of ['countries','sectors'])assert(exposureDisplay(dcaExposure([line],references,field,now)).coverage>95)
  const result=sharedPositions([line,{...line,asset:'other',weight:0}],references,now,holdings)
  assert(result.totals.length)
}
// Verified share classes of the same issuer consolidate, similar names never do.
const A='US02079K3059', C='US02079K1079', unrelated='US0378331005'
const refs={x:{isin:'IE00B4L5Y983'},y:{isin:'IE00B5BMR087'}}
const lines=[{asset:'x',isin:refs.x.isin,label:'X',weight:50},{asset:'y',isin:refs.y.isin,label:'Y',weight:50}]
const obs=rows=>({asOf:'2026-10-20',sourceUrl:'https://issuer.example/full',basis:'fund',complete:true,rows})
const left=obs([{isin:A,name:'Alphabet A',weightPct:60},{isin:unrelated,name:'Alphabet lookalike',weightPct:40}])
const right=obs([{isin:C,name:'Other share class label',weightPct:100}])
const pair=sharedPositions(lines,refs,now,{x:left,y:right}).pairs[0]
assert.doesNotThrow(()=>sharedPositions(lines,refs,now,{x:obs([{isin:A,weightPct:100}]),y:right}),'Known identifiers remain usable when a display name is absent')
assert.equal(pair.common.length,0);assert.equal(pair.companyCommon.length,1);assert.equal(pair.overlap,60)
assert.equal(sharedPositions(lines,refs,now,{x:{...left,complete:false},y:right}).pairs[0].overlap,null)
console.log(`${added.length} annual Performance choices; ${newIndex.length} index calendars; eight manual/six Duel shares; three factor roles; three composition choices; issuer overlap and evidence guards verified.`)

for(const id of Object.keys(CERTIFIED_INDEX_HISTORIES)) assert(INVESTMENT_ART[id], `Investment PNG art required for ${id}`)
