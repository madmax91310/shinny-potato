import assert from 'node:assert/strict'
import fs from 'node:fs'
import {AUTOMATED_ETF,HISTORICAL_AUTOMATED_PERFORMANCE} from '../src/data/automated-etf.js'
import {SIMULATION_PROXIES} from '../src/data/simulation-proxies.js'
import {getInstrumentReturnValues,getInstrumentCalendarReturns} from '../src/data/instrument-returns.js'
import {DATA_CATALOG} from '../src/data/catalog.js'
import {ASSETS,getAsset} from '../src/data/portfolio-assets.js'
import {CATALOG} from '../src/data/duel-assets.js'
import {QUALIFIED_FUND_CALENDARS} from '../src/data/qualified-annual-calendars.js'
import {qualifyPreferredManualNav,isQualifiedAnnualPortfolioFund,qualifiedManualMechanism} from '../src/data/annual-portfolio-funds.js'
import {assetEditorial} from '../src/pages/portfolio-generator/asset-editorial.js'
import {generatedDuelPool} from '../src/pages/portfolio-duels/generate.js'
import {getRecipes} from '../src/pages/portfolio-generator/recipes.js'
import {hasCompleteAutomaticWindow} from '../src/pages/portfolio-generator/performance.js'
import {PROFILES} from '../src/pages/portfolio-generator/theses.js'
import {buildManualPortfolio,renderTweetText} from '../src/pages/portfolio-generator/engine.js'
import {buildCustomDuel,buildTweet} from '../src/pages/portfolio-duels/lib.js'
import {convertCalendarReturn} from '../src/data/calendar-fx.js'
import {ASSETS as MARKET} from '../src/data/market-history.js'
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/exact-share-annual-20261030/source-contracts.json',import.meta.url)))
const sourceBefore=JSON.stringify(AUTOMATED_ETF),marketBefore=JSON.stringify([MARKET.bitcoin,MARKET.ethereum])
for(const[isin,source]of Object.entries(fixture.partialCalendars)){
 const live=AUTOMATED_ETF[isin].performance
 assert.equal(live.basis,'fund');assert.equal(live.currency,source.currency)
 const actual=getInstrumentReturnValues(isin),archive=HISTORICAL_AUTOMATED_PERFORMANCE[isin].values
 assert.deepEqual(actual,archive,isin+': keep exact-share gaps')
 const catalog=DATA_CATALOG.find(r=>r.id===isin)
 assert(catalog);assert(!catalog.fields.some(f=>f.label==='Historique de simulation 2020–2025'),isin+': old proxy is not the current source')
 const currentField=catalog.fields.find(f=>f.label==='Rendements 2020–2025');assert(currentField);assert.equal(currentField.metadata.checkedAt,live.checkedAt)
 const map=getInstrumentCalendarReturns(isin,source.previous.legacySelected)
 for(let i=0;i<6;i++)assert.equal(map[2020+i],archive[i]??undefined,isin+': explicit fallback cannot backfill an exact calendar')
 const g=ASSETS.find(a=>a.isin===isin),d=CATALOG.find(a=>a.isin===isin)
 assert(g&&d,isin);assert.equal(g.manualOnly??false,source.previous.generator[0].manualOnly)
 for(let i=0;i<6;i++)for(const a of[g,d])assert.equal(a.calendarReturns[2020+i],archive[i]??undefined,isin+'/'+a.id)
 const p=buildManualPortfolio([{id:g.id,pct:100}],'generaliste',[])
 const duel=buildCustomDuel({left:[{id:d.id,pct:100}],right:[{id:'msci_world_ishares',pct:100}]})
 const years=Object.keys(p.perf).map(Number)
 assert(years.length>=3);assert(!years.includes(2020));assert(!duel.years.includes(2020))
 for(const y of years)assert(Math.abs(p.perf[y]-convertCalendarReturn(live.years[y],y,live.currency,'EUR'))<1e-10,isin+'/'+y)
 let capital=10000
 for(const y of duel.years){const expected=convertCalendarReturn(live.years[y],y,live.currency,'EUR');assert(Math.abs(duel.a.annual[y]-expected)<1e-10);capital*=1+expected/100}
 assert(Math.abs(duel.a.final-capital)<1e-7)
 for(const text of[renderTweetText(p),buildTweet(duel)]){assert(!/NaN|undefined/.test(text));assert(text.includes(String(years.at(-1))))}
}
for(const profile of PROFILES)for(const risk of Object.keys(profile.riskCombos))for(const recipe of getRecipes(profile.id,risk))for(const slot of recipe.assets)for(const id of slot.idOptions??[slot.id])assert(hasCompleteAutomaticWindow(getAsset(id)),profile.id+'/'+risk+'/'+recipe.id+'/'+id)
// Null issuer calendars with explicitly reviewed simulation proxies remain
// separate. No generic removal of existing automatic allocation permissions.
for(const isin of['FR001400U5Q4','LU2970735911'])assert(getInstrumentReturnValues(isin).every(Number.isFinite))
for(const[isin,proxy]of Object.entries(SIMULATION_PROXIES))if(!HISTORICAL_AUTOMATED_PERFORMANCE[isin]?.values.every(Number.isFinite)){
 if(proxy.values)assert.deepEqual(getInstrumentReturnValues(isin),proxy.values)
}
for(const[isin,source]of Object.entries(fixture.restoredAnnual)){
 const live=QUALIFIED_FUND_CALENDARS[isin],g=getAsset('manual-'+isin),d=CATALOG.find(a=>a.isin===isin)
 for(const[year,value]of Object.entries(source.years))assert.equal(live.years[year],value);assert(qualifyPreferredManualNav(live));assert(isQualifiedAnnualPortfolioFund(g));assert(isQualifiedAnnualPortfolioFund(d))
 assert.equal(g.manualOnly,true);assert.equal(g.cat,'actions_larges');assert.equal(d.id,'manual-'+isin)
 assert.equal(ASSETS.filter(a=>a.isin===isin).length,1);assert.equal(CATALOG.filter(a=>a.isin===isin).length,1)
 assert.equal(qualifiedManualMechanism(isin,{...AUTOMATED_ETF[isin]?.characteristics,replicationMethod:'Synthétique',annualSwapRatePct:0}),undefined)
 assert(!/cuivre|swap|métal physique/.test(assetEditorial(g).text))
 const before=fixture.preservedDuelRoles.find(a=>a.isin===isin)
 assert(before.inPool);assert.equal(d.role,before.role);assert(generatedDuelPool(before.role).some(a=>a.id===before.id&&a.isin===isin))
 const p=buildManualPortfolio([{id:g.id,pct:100}],'generaliste',[]),duel=buildCustomDuel({left:[{id:d.id,pct:100}],right:[{id:'msci_world_ishares',pct:100}]})
 const expectedYears=Object.keys(live.years).map(Number).filter(y=>y<new Date().getUTCFullYear()).sort((a,b)=>a-b).slice(-6);assert.deepEqual(Object.keys(p.perf).map(Number),expectedYears);assert.deepEqual(duel.years,expectedYears)
 for(const y of duel.years){assert.equal(p.perf[y],live.years[y]);assert.equal(duel.a.annual[y],live.years[y])}
 for(const patch of[{currency:'USD'},{isin:'IE00B4K6B023'},{basis:'market-price'},{method:'calendar-year gross price return'},{method:'calendar-year proxy total return, net of fees'},{sourceUrls:['https://other.invalid']},{checkedAt:'2000-01-01'}])assert.equal(qualifyPreferredManualNav({...live,...patch}),null)
 const tweet=renderTweetText(p);assert(tweet.includes('2020')&&tweet.includes('2025'))
}
assert.equal(JSON.stringify(AUTOMATED_ETF),sourceBefore,'No observation, currency, source date, distribution or adjustment modified')
assert.equal(JSON.stringify([MARKET.bitcoin,MARKET.ethereum]),marketBefore,'Native spot histories keep their independent namespace')
assert(MARKET.bitcoin.points.some(point=>point.date.startsWith('2020')))
console.log('Eight partial exact-share calendars: no spot/static backfill; valid years, explicit proxies, EUR arithmetic and native crypto preserved. Two existing annual NAV routes restored in both engines with unchanged admission roles.')
