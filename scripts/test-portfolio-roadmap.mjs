import assert from 'node:assert/strict'
import { ASSETS } from '../src/data/portfolio-assets.js'
import { CATALOG, euroReturn } from '../src/data/duel-assets.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { buildDuel } from '../src/pages/portfolio-duels/lib.js'
import { computeYearlyPerf, assetReturn } from '../src/pages/portfolio-generator/performance.js'
import { comparePortfolioExposure } from '../src/lib/portfolio-exposure.js'
import { getPerformanceHref, getPerformanceAssetId } from '../src/data/performance-links.js'
import { getSimulationHref } from '../src/data/simulation-links.js'
import { prioritizeIncidents } from '../src/pages/data-review/incident-priority.js'
import { groupReviews } from '../src/pages/data-review/groups.js'
const recent=ASSETS.find(a=>a.id==='blockchain_ishares')
const recentPerf=computeYearlyPerf([{...recent,pct:100}])
assert.deepEqual(Object.keys(recentPerf),['2023','2024','2025'])
assert(Object.values(recentPerf).every(Number.isFinite))
assert.match(buildDuel(DUELS.find(d=>d.id==='sp500-equal-europe')).readings[1],/Europe ajoutent une autre zone/)
let compared=0
for(const asset of ASSETS) {
  const duel=asset.isin ? CATALOG.find(d=>d.isin===asset.isin) : null
  if(!duel)continue
  for(const year of Object.keys(duel.calendarReturns).map(Number)) {
    const a=assetReturn(asset,year),b=euroReturn(duel,year)
    if(a===null||b===null)continue
    assert.ok(Math.abs(a-b)<1e-9,`${asset.id} / ${year}: ${a} != ${b}`)
    compared++
  }
}
for(const definition of DUELS) {
 const duel=buildDuel(definition)
 for(const portfolio of [duel.a,duel.b]) {
  const selection=portfolio.assets.map(a=>({...a,r:a.values,returnCurrency:a.currency}))
  const generated=computeYearlyPerf(selection)
  for(const y of duel.years) if(Number.isFinite(generated[y]))assert.ok(Math.abs(generated[y]-portfolio.annual[y])<1e-9)
 }
}
const observation=(date,weight)=>({countries:{asOf:date,basis:'fund',method:'Country of risk, all holdings',sourceUrl:'https://example.org/source',rows:[{name:'France',weightPct:weight},{name:'Japan',weightPct:100-weight}]}})
const records={a:observation('2026-09-30',70),b:observation('2026-09-30',40)}
const left=[{isin:'a',pct:100}],right=[{isin:'b',pct:100}]
assert.equal(comparePortfolioExposure(left,right,records,'countries')[0].rows[0].difference,-30)
assert.deepEqual(comparePortfolioExposure(left,[{isin:'missing',pct:20},{isin:'b',pct:80}],records,'countries'),[])
assert.deepEqual(comparePortfolioExposure(left,right,{...records,b:observation('2026-08-31',40)},'countries'),[])
const rows=[{id:'collection',kind:'collection',tools:['A','B']},{id:'publication',kind:'publication',tools:['A']}]
assert.equal(prioritizeIncidents(rows)[0].id,'publication');assert.equal(rows[0].id,'collection')
const review={id:'one',name:'ETF',category:'stale',urls:['https://example.org'],tools:['A']}
assert.equal(groupReviews([review,review])[0].items.length,1)
for(const isin of ['IE000I8KRLL9','IE00BJ5JP097','IE00BJGWQN72','IE00BQQP9F84']) {
 assert(getPerformanceHref(isin),isin)
 const id=getPerformanceAssetId(isin)
 if(id.startsWith('annual-'))assert.equal(getSimulationHref(id),null,'Annual NAV cannot provide monthly simulated prices')
 else assert(getSimulationHref(id),isin)
}
console.log(`${compared} rendements comparés entre outils ; allocations, expositions incompatibles, liens historiques et priorités vérifiés.`)
