import assert from 'node:assert/strict'
import { COMPANIES } from '../src/data/companies.js'
import { buildPriceScenarios, targetDate, targetChart } from '../src/pages/company-analysis/priceTargets.js'
import { discountedCash, reverseCashGrowth, requiredTargetGrowth, distributionCashAssumptions } from '../src/pages/company-analysis/valuationExplorer.js'
import { valuationPublication } from '../src/pages/company-analysis/valuationPublication.js'
import { companyQualification } from '../src/pages/company-analysis/dataQualification.js'
const close=(a,b)=>assert(Math.abs(a-b)<Math.max(1e-7,Math.abs(b)*1e-10),`${a} != ${b}`)
// Independent geometric-series present value, not the engine's annual loop.
for(const years of [1,3,5])for(const g of [-.2,0,.1,.3]){
 const a={base:7,years,growth:g,multiple:14},rate=.09,q=(1+g)/(1+rate)
 const flows=7*q*(1-q**years)/(1-q),terminal=98*q**years
 close(discountedCash(a,rate).value,flows+terminal)
 close(reverseCashGrowth(a,flows+terminal,rate),g)
 close(requiredTargetGrowth(a,98,.09),.09)
}
// Freeze shares: 10% annual buybacks cannot increase a full-distribution DCF.
const fixture={scenarios:[{cashAssumptions:{base:10,path:[10/.9,10/.9**2,10/.9**3],growth:1/.9-1,years:3,multiple:10}}],evidence:{cash:{drivers:{sharesGrowth:-.1}}}}
const distribution=distributionCashAssumptions(fixture,0)
distribution.path.forEach(x=>close(x,10));close(discountedCash(distribution,.1).value,100)
assert.equal(targetDate('2024-02-29',1),'2025-02-28')
const now=new Date();let count=0
for(const c of COMPANIES)for(const years of [1,3,5]){
 const m=buildPriceScenarios(c,{},now,years),q=companyQualification(c,now,m)
 for(const method of ['cash','earnings']){
  assert.equal(q.methods[method].available,Boolean(m.evidence[method]))
  if(!m.evidence[method]){assert(q.methods[method].reasons.length);assert.throws(()=>valuationPublication(c,{},1,method,now,years));continue}
  for(const [i,s] of m.scenarios.entries()){
   const a=s[method+'Assumptions'],r=s[method+'Target'],expected=a.path.at(-1)*a.multiple
   close(r.value,expected);close(r.annualised,Math.exp(Math.log(expected/c.quote.price)/years)-1)
   close(targetChart(c,m,method).forecast[i].points.at(-1).value,expected)
   const p=valuationPublication(c,{},i,method,now,years)
   assert(p.text.includes('progression annualisée du cours'));assert(!p.text.includes('ce prix suppose'))
   if(method==='cash'){
    const d=distributionCashAssumptions(m,i),cash=discountedCash(d,.1)
    let independently=0
    for(let t=1;t<=years;t++)independently+=a.path[t-1]*(1+m.evidence.cash.drivers.sharesGrowth)**t/1.1**t
    independently+=d.path.at(-1)*a.multiple/1.1**years
    close(cash.value,independently)
   }
   count++
  }
 }
}
const apple=structuredClone(COMPANIES.find(c=>c.id==='apple'))
for(const mutate of [c=>c.quote.currency='EUR',c=>delete c.quote.sourceUrl,c=>c.quote.asOf='2001-01-01']){
 const bad=structuredClone(apple);mutate(bad);const m=buildPriceScenarios(bad)
 assert(!m.inputs.cashReady&&!m.inputs.earningsReady)
}
const stale=structuredClone(apple);stale.decision.observedAt='2001-01-01'
const fields=companyQualification(stale).financialDepth
assert(fields.some(f=>f.present&&!f.fresh&&!f.usable))
console.log(`${count} scenarios checked independently across all active companies, including partial dossiers, unavailable methods, currency/source failures and DCF share funding.`)
