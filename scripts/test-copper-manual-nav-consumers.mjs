import assert from'node:assert/strict'
import fs from'node:fs'
import{QUALIFIED_FUND_CALENDARS}from'../src/data/qualified-annual-calendars.js'
import{qualifyPreferredManualNav}from'../src/data/annual-portfolio-funds.js'
import{ASSETS,getAsset}from'../src/data/portfolio-assets.js'
import{CATALOG}from'../src/data/duel-assets.js'
import{AUTOMATED_PORTFOLIO_FUNDS}from'../src/data/automated-portfolio-funds.js'
import{commoditySourceExplanation,assetEditorial}from'../src/pages/portfolio-generator/asset-editorial.js'
import{ASSETS as MARKET}from'../src/data/market-history.js'
import{qualifyHistoryWindow}from'../src/data/history-window-quality.js'
import{buildManualPortfolio,renderTweetText}from'../src/pages/portfolio-generator/engine.js'
import{buildCustomDuel,buildTweet}from'../src/pages/portfolio-duels/lib.js'
import{convertCalendarReturn}from'../src/data/calendar-fx.js'
const isin='GB00B15KXQ89',id='manual-'+isin,calendar=JSON.parse(fs.readFileSync(new URL('./fixtures/copper-manual-nav/annual-calendar-20261030.json',import.meta.url))).record,now=new Date('2026-10-30T12:00:00Z')
assert(calendar&&qualifyPreferredManualNav(calendar,now))
for(const patch of[{isin:'GB00B15KXV33'},{currency:'EUR'},{instrumentType:'ETF'},{basis:'market-price'},{frequency:'monthly'},{sourceUrls:['https://another.invalid']},{method:'proxy total return'},{checkedAt:'2000-01-01'},{checkedAt:'2100-01-01'},{years:{2021:1,2022:2,2023:3,2024:4,2025:5}},{years:{...calendar.years,2022:NaN}}])assert.equal(qualifyPreferredManualNav({...calendar,...patch},now),null,JSON.stringify(patch))
assert.equal(qualifyPreferredManualNav(null),null)
assert(qualifyPreferredManualNav({...calendar,checkedAt:'2027-01-02',asOf:'2026-12-31',years:{...calendar.years,2026:1}},new Date('2027-01-02T12:00:00Z')),'New closed year uses the same explicit qualification clock')
const g=getAsset(id),d=CATALOG.find(x=>x.isin===isin),live=QUALIFIED_FUND_CALENDARS[isin]
assert.equal(ASSETS.filter(x=>x.isin===isin).length,1);assert.equal(CATALOG.filter(x=>x.isin===isin).length,1)
assert.equal(g.id,id);assert.equal(d.id,'cuivre_wisdomtree');assert.equal(g.manualOnly,true)
const fallback=AUTOMATED_PORTFOLIO_FUNDS.find(x=>x.isin===isin)
assert(fallback&&fallback.manualOnly);assert.equal(fallback.cat,'matieres_premieres');assert.equal(fallback.basis,'market-price')
assert.equal(assetEditorial(fallback).text,commoditySourceExplanation(fallback));assert(commoditySourceExplanation(fallback).includes('contrats à terme'));assert(!/métal physique|valeur liquidative/.test(commoditySourceExplanation(fallback)))
assert(!ASSETS.filter(x=>!x.manualOnly).some(x=>x.isin===isin),'No automatic role granted')
if(qualifyPreferredManualNav(live)){
 assert.equal(g.cat,'matieres_premieres');assert.equal(g.basis,'fund-nav');assert.equal(d.basis,'fund')
 assert.equal(g.returnCurrency,'USD');assert.equal(d.currency,'USD');assert.equal(g.underlyingMechanism,'commodity-futures-swap');assert(!g.automatedManual)
 const p=buildManualPortfolio([{id,pct:100}],'generaliste',[]),duel=buildCustomDuel({left:[{id:d.id,pct:100}],right:[{id:'msci_world_ishares',pct:100}]})
 const years=Object.keys(live.years).map(Number).filter(y=>y<new Date().getUTCFullYear()).sort((a,b)=>a-b).slice(-6)
 assert.equal(years.length,6);assert.deepEqual(Object.keys(p.perf).map(Number),years);assert.equal(duel.years.length,6)
 for(const y of years)assert(Math.abs(p.perf[y]-convertCalendarReturn(live.years[y],y,'USD','EUR'))<1e-12)
 let capital=10000
 for(const y of duel.years){const expected=convertCalendarReturn(live.years[y],y,'USD','EUR');assert(Math.abs(duel.a.annual[y]-expected)<1e-12);capital*=1+expected/100}
 assert(Math.abs(duel.a.final-capital)<1e-8)
 const text=renderTweetText(p),tweet=buildTweet(duel)
 assert(text.includes(String(years[0]))&&text.includes(String(years.at(-1)))&&text.includes('valeur liquidative')&&text.includes('contrats à terme'))
 assert(!text.includes('métal physique'));assert(tweet.includes(String(duel.years[0]))&&tweet.includes(String(duel.years.at(-1))))
 assert(duel.sources.find(x=>x.isin===isin).note.includes('NAV'));assert(duel.sources.find(x=>x.isin===isin).url===live.sourceUrls[0])
}else{
 assert.notEqual(g.annualManual,true,'An unqualified preferred calendar cannot replace the independently qualified market fallback')
 console.log('Copper live preferred NAV inactive: fallback admission checked; this test does not certify supplier availability.')
}
// Independent manual NAV admission must not release the old quote's refused window.
const old=MARKET.etfGB00B15KXQ89
assert.equal(qualifyHistoryWindow(old,'2017-12','2018-12').qualified,false)
assert.equal(qualifyHistoryWindow(old,'2020-12','2025-12').qualified,true)
console.log('Copper: same two selectors, six complete NAV years, one ECB conversion, manual commodity role only; old quote refusals preserved.')
