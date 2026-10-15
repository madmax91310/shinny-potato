import assert from 'node:assert/strict'
import { COMPANIES } from '../src/data/companies.js'
import { buildPriceScenarios, TARGET_POLICY } from '../src/pages/company-analysis/priceTargets.js'
import { targetExplanation } from '../src/pages/company-analysis/targetExplanation.js'
import { discountedCash } from '../src/pages/company-analysis/valuationExplorer.js'
const company=structuredClone(COMPANIES.find(c=>c.id==='apple'))
// A persistent contraction must survive the long-term anchor, not become zero.
company.decision.years.forEach((r,i)=>{r.revenue=1e12*.95**i})
company.annual.revenue=company.decision.years.at(-1).revenue
const model=buildPriceScenarios(company)
assert.equal(TARGET_POLICY.version,3)
assert(Math.abs(model.evidence.earnings.anchor+.05)<1e-12)
assert(model.evidence.earnings.curve.at(-1).value<model.evidence.earnings.curve.at(-2).value)
const explanation=targetExplanation(company,model,1,'earnings')
assert(explanation.anchorExplanation.includes('-5.0 %'))
if(model.evidence.cash)assert(explanation.methodComparison.includes('Aucun objectif moyen'))
// Operating-company formulas cannot silently produce bank/insurance targets.
for(const type of ['bank','insurance','reit']){
 const unsupported=structuredClone(company);unsupported.valuationBusinessType=type
 const blocked=buildPriceScenarios(unsupported)
 assert(!blocked.evidence.earnings&&!blocked.evidence.cash)
}
// Independent annuity identity when growth equals the discount rate.
const a={base:10,years:5,growth:.1,multiple:15}
assert(Math.abs(discountedCash(a,.1).value-200)<1e-10)
console.log('Professional model: contraction, method scope, explanatory comparison and equal-rate DCF verified.')

// Catalog expansion must not change review records or share mutable objects.
const {compactLiteral}=await import('./project-tool-data.mjs')
const {DATA_CATALOG}=await import('../src/data/catalog.js')
const {projectReviewCatalog}=await import('../src/data/review-projection.js')
const catalog=projectReviewCatalog(DATA_CATALOG)
const roundtrip=(await import('data:text/javascript;base64,'+Buffer.from(compactLiteral(catalog)).toString('base64'))).default
assert.deepEqual(roundtrip,JSON.parse(JSON.stringify(catalog)))
const fixture=Array.from({length:4},()=>({longRepeatedValue:'A repeated nested value for lossless compaction',nested:[1,2,3]}))
const compact=(await import('data:text/javascript;base64,'+Buffer.from(compactLiteral(fixture)).toString('base64'))).default
compact[0].nested[0]=999
assert.equal(compact[1].nested[0],1)
console.log('Review catalog compaction: full round-trip and independent mutable records verified.')
