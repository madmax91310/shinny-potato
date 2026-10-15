import assert from 'node:assert/strict'
import fs from 'node:fs'
import { COMPANIES } from '../src/data/companies.js'
import { companyCompleteness } from '../src/pages/company-analysis/completeness.js'
import { buildPriceScenarios } from '../src/pages/company-analysis/priceTargets.js'
import { valuationPublication } from '../src/pages/company-analysis/valuationPublication.js'
const now=new Date(),close=(a,b)=>assert(Math.abs(a-b)<=Math.max(1e-7,Math.abs(b)*1e-10),`${a} != ${b}`)
const cohort=JSON.parse(fs.readFileSync('src/data/company-release-cohort.json','utf8'))
assert.equal(new Set(cohort.ids).size,50,'50 distinct additional companies')
assert.equal(new Set(COMPANIES.map(c=>c.symbol)).size,COMPANIES.length,'No duplicate listings')
for(const id of cohort.ids)assert(COMPANIES.some(c=>c.id===id),`${id}: release company absent`)
let complete=0,publications=0
for(const c of COMPANIES) {
  const coverage=companyCompleteness(c,now)
  if(!coverage.complete)continue
  complete++
  for(const years of [1,3,5])for(const method of coverage.methods)for(const selected of [0,1,2]) {
    const p=valuationPublication(c,{},selected,method,now,years),a=p.assumptions,r=p.scenarios[selected]
    // Independent terminal-value identities and export/chart agreement.
    const terminal=(a.path?.at(-1)??a.base*(1+a.growth)**years)*a.multiple
    close(r.value,terminal);close(r.upside,terminal/c.quote.price-1)
    close((1+r.annualised)**years,terminal/c.quote.price)
    close(p.chart.forecast[selected].points.at(-1).value,terminal)
    assert.equal(p.chart.history.at(-1).value,c.quote.price)
    assert.equal(p.quoteDate,c.quote.asOf)
    assert(p.text.includes(c.activity)&&p.text.includes(c.watch))
    assert(p.text.includes('hors dividendes')&&p.text.includes('Pas un conseil financier'))
    assert(!/NaN|undefined|Infinity/.test(p.text))
    publications++
  }
  for(const method of coverage.methods) {
    const overrides={1:{[method==='cash'?'cashGrowth':'earningsGrowth']:.02,[method==='cash'?'cashMultiple':'earningsMultiple']:10}}
    const p=valuationPublication(c,overrides,1,method,now,5)
    close(p.reading.value,p.assumptions.base*1.02**5*10)
    assert(p.text.includes('personnalisée'))
  }
  const stale=structuredClone(c);stale.quote.asOf='2000-01-01'
  assert(!companyCompleteness(stale,now).complete)
  assert.throws(()=>valuationPublication(stale,{},1,coverage.methods[0],now))
  const missing=structuredClone(c);delete missing.targetForecast;delete missing.targetCashReference
  const suspended=buildPriceScenarios(missing,{},now)
  assert(!suspended.inputs.cashReady&&!suspended.inputs.earningsReady)
}
console.log(`Release: ${complete} complete dossiers, ${publications} publications checked across all horizons/scenarios/methods; changed assumptions, stale prices and missing evidence verified.`)
