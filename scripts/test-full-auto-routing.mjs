import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {ASSETS as HISTORY} from '../src/data/market-history.js'
import {ASSETS as PORTFOLIO} from '../src/data/portfolio-assets.js'
import LINKS from '../src/data/equity-history-links.json' with {type:'json'}
import MONTHLY from '../src/data/monthly-duel-returns.json' with {type:'json'}
import {CATALOG,buildCustomDuel} from '../src/pages/portfolio-duels/lib.js'
import {buildManualPortfolio} from '../src/pages/portfolio-generator/engine.js'
import {latestCommonYears} from '../src/data/annual-window.js'
import {projectLightRegistries} from './project-light-registries.mjs'
import {buildAssetFieldReport} from './report-asset-fields.mjs'
import {matchesListing} from './build-equity-history-links.mjs'
import {AUTOMATIC_RECIPE_ISINS} from '../src/data/automated-portfolio-funds.js'
const exposureCatalogue=JSON.parse(readFileSync('src/pages/dca-profiles/catalog.json'));
const exposureStocks=Object.values(exposureCatalogue).filter(r=>r.kind==='equity');
assert(exposureStocks.every(r=>/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(r.isin)));
assert.equal(new Set(exposureStocks.map(r=>r.isin)).size,exposureStocks.length,'No duplicate equity share class in the exposure picker');
const seen=new Set()
for(const [id,link] of Object.entries(LINKS)) {
 assert.equal(HISTORY[id]?.isin,link.isin)
 assert.equal(HISTORY[id]?.instrumentType,'EQUITY')
 assert(!seen.has(link.isin),`${id}: duplicate exact equity identity`);seen.add(link.isin)
}
assert.equal(matchesListing({symbol:'SAN.MC',currency:'EUR'},{ticker:'SAN',currency:'EUR',exchange:'Nyse Euronext - Euronext Paris'}),false)
assert.equal(matchesListing({symbol:'SAP',currency:'USD'},{ticker:'SAP',currency:'EUR',exchange:'Xetra'}),false)
let count=0
for(const asset of PORTFOLIO.filter(a=>a.id.startsWith('equity-')||a.id.startsWith('manual-'))) {
 assert.equal(asset.manualOnly,!AUTOMATIC_RECIPE_ISINS.has(asset.isin),`${asset.id}: statut manuel`)
 assert(latestCommonYears([asset.calendarReturns],{minimum:3}).length>=3)
 const duelAsset=CATALOG.find(a=>a.isin===asset.isin)
 assert(duelAsset,`${asset.id}: duel destination`)
 const manual=buildManualPortfolio([{id:asset.id,pct:100}],'generaliste',[])
 const duel=buildCustomDuel({left:[{id:'msci_world_ishares',pct:100}],right:[{id:duelAsset.id,pct:100}]})
 for(const year of duel.years)assert(Math.abs(manual.perf[year]-duel.b.annual[year])<1e-9,`${asset.id}/${year}: shared EUR returns`)
 if(asset.id.startsWith('manual-'))assert(MONTHLY[asset.isin]?.source)
 count++
}
const code=projectLightRegistries().transform('', '/app/src/data/portfolio-assets.js').code
const projected=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
for(const asset of PORTFOLIO) {
 const light=projected.getAsset(asset.id)
 if(asset.manualOnly&&/^(equity-|manual-)/.test(asset.id)) {
  assert(light.historyPending);assert.equal(light.isin,asset.isin);assert.equal(light.calendarReturns,undefined)
 }else assert.deepEqual(light,asset,`${asset.id}: lossless projected auto allocation`)
}
const report=buildAssetFieldReport()
assert(report.summary.completeHoldings)
assert(report.rows.some(r=>r.field==='pea'&&r.automationConfigured))
for(const row of report.rows.filter(r=>r.field==='completeHoldings'&&r.present))assert(row.asOf&&row.checkedAt&&row.sourceUrl)
const workflow=readFileSync('.github/workflows/update-market-monthly.yml','utf8')
assert(workflow.includes('export-equity-candidates.mjs')&&workflow.includes('build-equity-history-links.mjs'))
console.log(`${count} manual choices: exact identities, common EUR results in duels/generator, automatic qualification and deferred-data parity verified.`)
