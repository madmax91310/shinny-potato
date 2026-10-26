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
import {QUALIFIED_FUND_CALENDARS,qualifiedFundCalendars} from '../src/data/qualified-annual-calendars.js'
import {ANNUAL_PORTFOLIO_FUNDS,qualifyManualCurrencyCalendar,isQualifiedAnnualPortfolioFund,comparableAnnualNavReturns} from '../src/data/annual-portfolio-funds.js'
import {getInstrumentAnnualPerformance} from '../src/data/instrument-returns.js'
import {getInstrumentComparatorReturns} from '../src/data/instrument-comparator-returns.js'
import {ASSETS as PORTFOLIO_ASSETS} from '../src/data/portfolio-assets.js'
import {buildManualPortfolio,renderTweetText,generatePortfolio} from '../src/pages/portfolio-generator/engine.js'
import {CATALOG,buildCustomDuel,buildTweet as buildDuelTweet} from '../src/pages/portfolio-duels/lib.js'
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
assert(!QUALIFIED_FUND_CALENDARS.LU2196470426,'Global portfolio calendars retain the EUR/USD contract')
const current=JSON.parse(fs.readFileSync('public/data/financial-reconciliation.json')).rows.find(r=>r.id==='LU2196470426/2025')
assert(current.open,'An independent source does not explain the original quote divergence')
console.log('Nikkei exact-share NAV: GitHub provenance, launch bounds, original restriction, one FX conversion, lump/DCA, annual performance, comparison and anniversary verified.')

// The same exact-share calendar has an explicit EUR route for manual portfolios
// and Duels. It does not make five years into six or admit an automatic recipe.
const isin='LU2196470426',manualId=`manual-${isin}`
const native=qualifiedFundCalendars({nativeCurrencies:['JPY']})[isin]
const manual=ANNUAL_PORTFOLIO_FUNDS.find(row=>row.isin===isin)
assert(native && manual && isQualifiedAnnualPortfolioFund(manual))
assert.equal(manual.id,manualId);assert.equal(manual.manualOnly,true)
assert.throws(()=>generatePortfolio([], 'equilibre', 'generaliste', {locked:[manualId]}),'Manual qualification cannot authorize an automatic locked allocation')
assert.equal(manual.basis,'fund-nav');assert.equal(manual.returnCurrency,'EUR')
assert.equal(manual.nativeReturnCurrency,'JPY');assert(manual.fxSourceUrls.includes(FX.sourceUrl))
assert.match(manual.confidenceNote,/NAV.*JPY.*EUR/)
for(const list of [PORTFOLIO_ASSETS,CATALOG])assert.equal(list.filter(row=>row.isin===isin).length,1,'Existing ISIN cannot become two allocation choices')
const expectedYears=Object.fromEntries(Object.entries(native.years).map(([year,pct])=>[year,
  ((1+pct/100)*FX.months[`${Number(year)-1}-12`].rates.JPY/FX.months[`${year}-12`].rates.JPY-1)*100]))
assert.deepEqual(Object.keys(expectedYears),['2021','2022','2023','2024','2025'])
for(const year of Object.keys(expectedYears))assert(Math.abs(manual.calendarReturns[year]-expectedYears[year])<1e-10)
const portfolio=buildManualPortfolio([{id:manualId,pct:100}],'generaliste',[])
assert.deepEqual(portfolio.perf,manual.calendarReturns)
assert.match(renderTweetText(portfolio),/2021.*2025/)
assert(!/NaN|undefined/.test(renderTweetText(portfolio)))
const euro=CATALOG.find(row=>row.isin==='FR0007054358')
assert(euro)
const duel=buildCustomDuel({left:[{id:manualId,pct:100}],right:[{id:euro.id,pct:100}]})
assert.deepEqual(duel.years,[2021,2022,2023,2024,2025])
assert.deepEqual(duel.a.annual,manual.calendarReturns,'EUR route cannot receive a second JPY conversion')
const final=Object.values(expectedYears).reduce((capital,pct)=>capital*(1+pct/100),10000)
assert(Math.abs(duel.a.final-final)<1e-7)
assert(!/NaN|undefined/.test(buildDuelTweet(duel)))
assert.equal(qualifyManualCurrencyCalendar({...native,isin:'LU0000000000'}),null)
assert.equal(qualifyManualCurrencyCalendar({...native,currency:'USD'}),null)
assert.equal(qualifyManualCurrencyCalendar({...native,basis:'market-price'}),null)
assert.equal(qualifyManualCurrencyCalendar({...native,checkedAt:'2000-01-01'}),null)
const missing=structuredClone(FX);delete missing.months['2024-12']
const partial=qualifyManualCurrencyCalendar(native,missing)
assert.deepEqual(Object.keys(partial.years),['2021','2022','2023'],'Valid independent years survive a missing fixing')
for(const year of ['2024','2025']){
  assert.equal(partial.currencyQualifications[year].qualified,false)
  assert.match(partial.currencyQualifications[year].reason,/BCE absent/)
  assert(!Object.hasOwn(partial.years,year),'Neither boundary is interpolated')
}
assert.equal(partial.asOf,'2023-12-31');assert.equal(partial.nativeCalendarAsOf,native.asOf)
// Isolated rollover fixture: a newly closed issuer year does not invent a
// December FX observation or remove the previously qualified five years.
const rolled=qualifyManualCurrencyCalendar({...native,checkedAt:'2027-01-02',asOf:'2026-12-31',years:{...native.years,2026:20}},FX,new Date('2027-01-02T12:00:00Z'))
assert.deepEqual(rolled.years,manual.calendarReturns)
assert.equal(rolled.currencyQualifications[2026].qualified,false)
assert.equal(rolled.asOf,'2025-12-31');assert.equal(rolled.nativeCalendarAsOf,'2026-12-31')
assert.equal(qualifyManualCurrencyCalendar(native,{...FX,months:{}}),null)
assert.equal(qualifyManualCurrencyCalendar(native,{...FX,sha256:''}),null)
assert.equal(qualifyManualCurrencyCalendar(native,{...FX,checkedAt:'2100-01-01'}),null)
const wrongMonth=structuredClone(FX);wrongMonth.months['2024-12'].asOf='2024-11-29'
assert.deepEqual(Object.keys(qualifyManualCurrencyCalendar(native,wrongMonth).years),['2021','2022','2023'])
const displayed=getInstrumentComparatorReturns(isin)
const source={...getInstrumentAnnualPerformance(isin),isin,years:Object.fromEntries([2023,2024,2025].map(year=>[year,displayed['y'+year]]))}
const comparable=comparableAnnualNavReturns(manual,source)
assert.equal(comparable.sourceCurrency,'JPY');assert.equal(comparable.currency,'EUR')
for(const year of [2023,2024,2025]){
  const value=source.years[year]
  const oracle=((1+value/100)*FX.months[`${year-1}-12`].rates.JPY/FX.months[`${year}-12`].rates.JPY-1)*100
  assert(Math.abs(comparable.years[year]-oracle)<1e-10)
  assert(Math.abs(comparable.years[year]-manual.calendarReturns[year])<.1,'Only the original display-rounding tolerance remains')
}
assert(Math.abs(source.years[2025]-manual.calendarReturns[2025])>14,'Reproduce the unconverted cross-tool audit failure')
const altered=comparableAnnualNavReturns(manual,{...source,years:{...source.years,2025:source.years[2025]+1}})
assert(Math.abs(altered.years[2025]-manual.calendarReturns[2025])>.1,'Conversion cannot hide a genuine changed return')
for(const patch of [{isin:'other'},{basis:'market-price'},{currency:'USD'},{source:'https://example.test/other-share'},{checkedAt:'2000-01-01'}])assert.equal(comparableAnnualNavReturns(manual,{...source,...patch}),null)
assert.equal(comparableAnnualNavReturns({...manual,nativeReturnCurrency:'USD'},source),null)
assert.equal(comparableAnnualNavReturns(manual,source,missing),null)
assert(!qualifyHistoryWindow(ASSETS.etfLU2196470426,start,end).qualified,'Independent manual recovery does not alter the original quote controls')
console.log('Nikkei manual and Duels: five exact closed NAV years, independent EUR oracle, one ISIN/choice, no automatic admission, missing FX/stale/wrong source refusal and original quote protection verified.')
