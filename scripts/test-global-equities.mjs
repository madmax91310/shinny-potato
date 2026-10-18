import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import GLOBAL from '../src/data/global-equities.json' with {type:'json'}
import RECORDS from '../src/data/automated-monthly.json' with {type:'json'}
import FX from '../src/data/monthly-fx.json' with {type:'json'}
import COMPLETE from '../src/data/dca-complete-holdings.json' with {type:'json'}
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { PORTFOLIO_EQUITIES } from '../src/data/portfolio-equities.js'
import { getAnnualReturns, getAnnualReturnStartYears } from '../src/pages/tweet-midi/data/marketHistory.js'
import { convertPerformanceEntries } from '../src/pages/tweet-midi/performanceCurrency.js'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
import { references } from '../src/pages/dca-profiles/engine.js'
import { catalogCoverage, sharedPositions } from '../src/pages/dca-profiles/verification.js'
import { RANKING_ASSETS, CATEGORIES } from '../src/pages/performance-rankings/data.js'
import { convertAsset } from '../src/pages/performance-rankings/series.js'
import { buildCustomDuel } from '../src/pages/portfolio-duels/lib.js'
import { buildManualPortfolio, renderTweetText } from '../src/pages/portfolio-generator/engine.js'
import { isStock } from '../src/lib/is-stock.js'
import { fxRate } from '../src/lib/fx-rate.js'
import { projectLightRegistries } from './project-light-registries.mjs'
import { convertCalendarReturn } from '../src/data/calendar-fx.js'

// The registry only holds qualified identities: curated candidates stay in
// scripts/global-equity-candidates.json until their real collection succeeds.
assert(GLOBAL.length >= 50, 'the original 50 international equities stay connected')
assert.equal(new Set(GLOBAL.map(a=>a.isin)).size, GLOBAL.length)
assert.equal(new Set(GLOBAL.map(a=>a.id)).size, GLOBAL.length)
const REGIONS = ['Europe','Asie','Océanie','États-Unis','Canada']
for (const a of GLOBAL) assert(REGIONS.includes(a.region) && a.periodStart && a.country && a.sector && a.identitySourceUrl, `${a.id}: complete qualified identity`)
const byRegion=Object.fromEntries(REGIONS.map(region=>[region,GLOBAL.filter(a=>a.region===region).length]))
assert(byRegion.Europe>=15 && byRegion.Asie>=20 && byRegion['États-Unis']>=15, JSON.stringify(byRegion))
const CANDIDATES = JSON.parse(readFileSync('scripts/global-equity-candidates.json')).candidates
for (const c of CANDIDATES) assert(!GLOBAL.some(a=>a.isin===c.isin || a.id===c.id), `${c.id}: candidate already promoted`)
const config=JSON.parse(readFileSync('scripts/monthly-automation.json')).series
const coverage=new Map(catalogCoverage(references).map(r=>[r.isin,r]))
const simulation=new Set(JSON.parse(readFileSync('src/data/simulation-links.json')))
for (const identity of GLOBAL) {
  const {id,isin,currency}=identity, record=RECORDS[id], asset=ASSETS[id]
  const source=config.find(s=>s.id===id)
  assert(record && source && asset, `${id}: active automatic series`)
  assert.equal(record.symbol,identity.symbol)
  assert.equal(record.currency,currency)
  assert.equal(record.periodStart,identity.periodStart)
  assert.equal(record.field,'adjclose')
  assert.equal(record.points.length,record.anniversaryPoints.length)
  assert(record.responseSha256 && record.sourceUrls.length>=2)
  assert.equal(ASSET_ORDER.filter(value=>value===id).length,1)
  assert.equal(asset.isin,isin)
  assert(isStock(RANKING_ASSETS[id]))
  assert(simulation.has(id))
  assert(resolveAnniversaryLevel(id,''),`${id}: fresh automated session`)
  const exposure=coverage.get(isin)
  assert.equal(exposure.countries.coverage,100,`${id}: complete geography`)
  assert.equal(exposure.sectors.coverage,100,`${id}: complete sector`)
  assert(CATEGORIES.some(c=>c.ids.includes(id)),`${id}: prepared comparison`)
  const years=getAnnualReturnStartYears(id)
  assert(years.length>=3,`${id}: three full verified years`)
  const entries=convertPerformanceEntries([{asset,returns:getAnnualReturns(id,years[0])}],'EUR')
  const converted=convertAsset(RANKING_ASSETS[id],'EUR',FX)
  for (const row of entries[0].returns) {
    const points=new Map(record.points), y=row.year
    const start=fxRate(FX.months[`${y-1}-12`].rates,currency), end=fxRate(FX.months[`${y}-12`].rates,currency)
    const expected=(points.get(`${y}-12`)/points.get(`${y-1}-12`)*start/end-1)*100
    assert(Math.abs(row.pct-expected)<1e-9,`${id}/${y}: independent native-to-EUR ratio`)
    const p=new Map(converted.points.map(p=>[p.date,p.price]))
    assert(Math.abs((p.get(`${y}-12`)/p.get(`${y-1}-12`)-1)*100-expected)<1e-9)
  }
  const duel=buildCustomDuel({left:[{id:'msci_world_ishares',pct:100}],right:[{id:`equity-${id}`,pct:100}]})
  const manual=buildManualPortfolio([{id:`equity-${id}`,pct:100}],'generaliste',[])
  assert(PORTFOLIO_EQUITIES.some(a=>a.isin===isin))
  assert.doesNotMatch(renderTweetText(manual),/undefined|NaN/)
  for (const year of duel.years) assert(Math.abs(duel.b.annual[year]-manual.perf[year])<1e-9)
}
const stock=GLOBAL.find(a=>a.id==='csco'), r=references.csco
const overlap=sharedPositions([{asset:'world',isin:references.world.isin,label:'World',weight:80},{asset:'csco',isin:stock.isin,label:'Cisco',weight:20}], references,new Date(),{world:COMPLETE[references.world.isin]})
assert(overlap.pairs.some(p=>p.common.some(s=>s.isin===r.isin && s.portfolioWeight>20)), 'Direct Cisco exposure combines with its actual ETF holding')
assert.equal(fxRate({GBP:0.8},'GBp'),80)
assert.equal(fxRate({},'INR'),null)
const projection=projectLightRegistries().transform('', '/app/src/data/calendar-fx.js')
const code=projection.code.replace("import { fxRate } from '../lib/fx-rate.js';",fxRate.toString())
const projected=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
for(const currency of new Set(GLOBAL.map(a=>a.currency))) assert.equal(projected.convertCalendarReturn(10,2025,currency),convertCalendarReturn(10,2025,currency))
assert.equal(projected.calendarRate(1800,'USD'),null)
console.log(`${GLOBAL.length} global equities (${JSON.stringify(byRegion)}): 7 tools, exact identities, full exposures, real ETF overlap, dated quotes, native/ECB returns and common years verified.`)
