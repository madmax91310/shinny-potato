import {buildCustomDuel} from '../src/pages/portfolio-duels/lib.js'
import ANNUAL_FX from '../src/data/annual-fx.json' with {type:'json'}
import {getETFArt} from '../src/pages/etf-sheets/visualIdentity.js'
import {getManualDuelArt} from '../src/pages/portfolio-duels/visualIdentity.js'
import {CATALOG as DUEL_ASSETS} from '../src/data/duel-assets.js'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import IDENTITIES from '../src/data/new-instrument-identities.json' with {type:'json'}
import ABSENCE from '../docs/new-instruments-absence-2026-11-01.json' with {type:'json'}
import NAV_SOURCES from './new-instrument-nav-sources.json' with {type:'json'}
import COMPARISONS from '../src/data/new-instrument-comparisons.json' with {type:'json'}
import {INSTRUMENTS_BY_ISIN,getInstrumentPeaStatus} from '../src/data/instruments.js'
import {getPreferredInstrumentListing,getInstrumentListings} from '../src/data/instrument-listings.js'
import {getInstrumentFacts} from '../src/data/instrument-facts.js'
import {ETF_TER_BY_ISIN} from '../src/data/etf-ter.js'
import {ETFS} from '../src/data/etf-cards.js'
import {instrumentOption} from '../src/data/asset-selection.js'
import {filterAssetOptions} from '../src/lib/asset-picker-preferences.js'
import {buildText,buildFactRows} from '../src/pages/etf-sheets/lib.js'
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'
import {QUALIFIED_FUND_CALENDARS} from '../src/data/qualified-annual-calendars.js'
import {DATA_CATALOG} from '../src/data/catalog.js'
import {ASSETS as PORTFOLIO} from '../src/data/portfolio-assets.js'
import {ASSETS as MONTHLY} from '../src/data/market-history.js'
import {ASSETS as PERFORMANCE,getAnnualReturns} from '../src/pages/tweet-midi/data/performanceHistory.js'
import {ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {DEFAULT_THEMES} from '../src/data/etf-themes.js'
import {buildTweetText as compareText} from '../src/pages/etf-tweets/lib/tweetFormat.js'
import {getComparisonPaperCards} from '../src/pages/tweet-midi/comparatifEtfImage.js'
import {derive,buildTweetText} from '../src/pages/investment-calculator/lib.js'
import {RANKING_ASSETS,ANNUAL_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {currentStrategyFirstYear} from '../src/data/benchmark-changes.js'
import {resolveAnniversaryLevel} from '../src/data/anniversary-levels.js'

assert(IDENTITIES.length>0)
assert.equal(new Set(IDENTITIES.map(r=>r.isin)).size,IDENTITIES.length)
assert.equal(new Set(IDENTITIES.map(r=>r.id)).size,IDENTITIES.length)
const receipts=JSON.parse(fs.readFileSync('docs/new-instruments-sources-2026-11-01.json')).observations
for(const identity of IDENTITIES){
 const {isin,id}=identity, absent=ABSENCE.rows.find(r=>r.isin===isin)
 assert(absent&&!absent.instrumentPresent&&!absent.listingPresent,`${isin}: catalogue and listing absence at the declared base`)
 assert(receipts.some(r=>r.isin===isin))
 assert.equal(INSTRUMENTS_BY_ISIN[isin].name,identity.name)
 const sheets=ETFS.filter(e=>e.isin===isin);assert.equal(sheets.length,1)
 const etf=sheets[0],facts=getInstrumentFacts(isin),record=AUTOMATED_ETF[isin]
 assert.equal(etf.id,id);assert.equal(facts.instrumentType,'ETF')
 assert.equal(facts.benchmark,record.characteristics.index)
 assert.equal(facts.domicile,record.characteristics.domicile)
 assert.equal(facts.characteristicsSource.checkedAt,record.characteristics.checkedAt)
 assert.equal(etf.pea,getInstrumentPeaStatus(isin))
 const listing=getPreferredInstrumentListing(isin);assert(listing?.sourceUrl&&listing.checkedAt)
 const option=instrumentOption(etf)
 if(identity.assetClass==='Fixed Income')assert.equal(option.group,'Obligations et monétaire')
 for(const query of [isin,identity.name,listing.ticker])assert(filterAssetOptions([option],{query}).some(r=>r.id===id),query)
 const art=getETFArt(id);assert(fs.existsSync(`public/asset-art/${art.scene}`))
 assert.deepEqual(getManualDuelArt(identity),art)
 assert(DUEL_ASSETS.some(a=>a.isin===isin),`${isin}: manual duel admission`)
 const text=buildText(etf)
 assert(text.includes(isin)&&text.includes(listing.ticker)&&text.includes(ETF_TER_BY_ISIN[isin]))
 assert(text.includes('Ce que tu achètes')&&text.includes('Le point de vigilance'))
 assert(!/\b(?:undefined|NaN|null)\b/.test(text))
 assert(buildFactRows(etf).some(r=>r.text.includes(isin)))
 const catalogue=DATA_CATALOG.find(r=>r.id===isin)
 assert(catalogue?.consumers.some(c=>c.tool==='Présentation ETF'))
 assert(catalogue.fields.find(f=>f.label==='Identité').metadata.sourceUrls.length)
 const calendar=QUALIFIED_FUND_CALENDARS[isin];assert(calendar&&calendar.basis==='fund-nav')
 const first=currentStrategyFirstYear(isin)
 for(const year of Object.keys(calendar.years))assert(Number(year)<new Date().getUTCFullYear()&&(!first||Number(year)>=first))
 const annualId='annual-'+isin
 assert(ANNUAL_ASSETS[annualId])
 assert.deepEqual(ANNUAL_ASSETS[annualId].years,calendar.years)
 assert(PERFORMANCE[annualId]||Object.values(PERFORMANCE).some(a=>a.isin===isin))
 if(PERFORMANCE[annualId])assert(getAnnualReturns(annualId,Number(Object.keys(calendar.years).sort().at(-1))).length)
 const portfolio=PORTFOLIO.find(a=>a.isin===isin)
 if(portfolio){assert(portfolio.manualOnly);assert.equal(portfolio.cat,identity.portfolioCategory)}
}
for(const source of NAV_SOURCES){
 const a=MONTHLY[source.id];assert(a&&a.isin===source.isin)
 assert.equal(a.currency,source.navCurrency,'No conversion at a current FX quote')
 assert.equal(a.historyConvention,'fund-nav-total-return');assert(a.label.endsWith(' · VL'))
 assert(!a.ticker&&!a.mic,'NAV is never a historical exchange quote')
 const start=a.points[0].date,end=a.points.at(-1).date
 assert(qualifyHistoryWindow(a,start,end).qualified)
 for(const mode of ['lump','dca']){
  const state={assetId:a.id,startYear:Number(start.slice(0,4)),startMonth:Number(start.slice(5)),amountRaw:'100',overridePriceRaw:'',mode}
  const d=derive(state),expected=(mode==='lump'?100/a.points[0].price:a.points.reduce((n,p)=>n+100/p.price,0))*a.points.at(-1).price
  assert(Math.abs(d.result.finalValue-expected)<1e-6)
  assert(buildTweetText(state,d).includes('VL'))
 }
 assert.equal(RANKING_ASSETS[a.id].basis,'fund-nav-total-return')
 const expected=(a.points.at(-1).price/a.points[0].price-1)*100
 assert(Math.abs(periodReturn(RANKING_ASSETS[a.id],start,end)-expected)<1e-6)
 assert(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(r=>r.id===a.id))
 const record=JSON.parse(fs.readFileSync('src/data/anniversary-levels.json'))[a.id]
 assert(resolveAnniversaryLevel(a.id,'',new Date(record.asOf+'T12:00:00Z')))
}
for(const comparison of COMPARISONS){
 const theme=DEFAULT_THEMES.find(r=>r.id===comparison.id);assert(theme)
 const text=compareText(theme);assert(text.includes(comparison.cloture))
 assert(getComparisonPaperCards(theme).length===comparison.funds.length)
 for(const isin of comparison.funds)assert(text.includes(isin))
}
// A missing future year never becomes a zero, an index return or a synthetic quote.
const {qualifyFundCalendar}=await import('../src/data/qualified-annual-calendars.js')
const source=IDENTITIES[0],record=AUTOMATED_ETF[source.isin],sheet=ETFS.find(e=>e.isin===source.isin)
assert.equal(qualifyFundCalendar(source.isin,{...record,performance:{...record.performance,years:{}}},sheet),null)
assert.equal(qualifyFundCalendar(source.isin,{...record,performance:{...record.performance,basis:'index'}},sheet),null)
console.log(`${IDENTITIES.length} new ISINs: canonical identity, listings, shared facts, reviewed presentations, annual consumers, ${NAV_SOURCES.length} qualified monthly histories and ${COMPARISONS.length} editorial comparisons verified.`)

for (const fund of IDENTITIES) {
  for (const listing of getInstrumentListings(fund.isin)) {
    assert(filterAssetOptions([instrumentOption(fund)], {query:listing.ticker}).length, `${fund.isin}: search ${listing.ticker}`)
  }
}
console.log('Toutes les cotations officielles des nouveaux fonds sont recherchables.')

for(const fund of IDENTITIES){
 const asset=DUEL_ASSETS.find(a=>a.isin===fund.isin)
 const result=buildCustomDuel({left:[{id:asset.id,pct:100}],right:[{id:asset.id,pct:100}]})
 let capital=10000
 for(const year of result.years){
  const raw=QUALIFIED_FUND_CALENDARS[fund.isin].years[year]
  const ratio=fund.currency==='USD'?ANNUAL_FX.years[year-1].value/ANNUAL_FX.years[year].value:1
  const annual=((1+raw/100)*ratio-1)*100
  assert(Math.abs(result.a.annual[year]-annual)<1e-9)
  capital*=1+annual/100
 }
 assert.equal(result.currency,'EUR')
 assert(Math.abs(result.a.final-capital)<1e-7)
 assert.equal(result.a.final,result.b.final)
}
console.log('Duels manuels : 21 calendriers, change historique de décembre et capitalisation rapprochés.')
