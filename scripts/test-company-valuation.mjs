import assert from 'node:assert/strict'
import { cashValue, earningsValue, impliedGrowth, impliedReturn, buildScenarios } from '../src/pages/company-analysis/valuation.js'
import { COMPANIES } from '../src/data/companies.js'
// Independent closed-form annuity benchmark: zero growth, 10 annual units,
// 10% discount, terminal resale 100 after 10 years => exactly 100 today.
const a = {base:10,growth:0,discount:.1,years:10,multiple:10}
assert(Math.abs(cashValue(a).value-100)<1e-9)
assert(Math.abs(earningsValue(a)-100/1.1**10)<1e-9)
assert(Math.abs(impliedGrowth(a,100))<1e-8)
assert(Math.abs(impliedReturn(a,100)-.1)<1e-8)
assert.equal(impliedGrowth(a,1e30),null)
assert.equal(impliedReturn(a,1e30),null)
for(const bad of [{base:0},{base:-1},{discount:NaN},{discount:-1},{growth:-1},{years:2.5},{multiple:Infinity}]) assert.throws(()=>cashValue({...a,...bad}))
assert(cashValue({...a,growth:.03}).value>cashValue(a).value)
assert(cashValue({...a,discount:.15}).value<cashValue(a).value)
const company=structuredClone(COMPANIES.find(c=>c.id==='apple'))
const now=new Date('2026-10-14T12:00:00Z')
company.valuationShareBasis={version:1,currency:company.currency,observedAt:'2026-10-14',annualEnd:company.annual.end,accountsEndAtCollection:company.quarter.end,splitCheckFrom:'2020-01-01',splitCheckThrough:'2026-10-14',sourceUrl:'https://example.com/splits'}
let model=buildScenarios(company,{},now)
assert(model.inputs.cashReady)
assert(model.scenarios[0].cash.value<model.scenarios[1].cash.value)
assert(model.scenarios[1].cash.value<model.scenarios[2].cash.value)
assert.notEqual(model.scenarios[1].cashAssumptions.growth,model.scenarios[1].earningsAssumptions.growth)
company.valuationShareBasis.splitCheckThrough='2026-10-01';assert(!buildScenarios(company,{},now).inputs.cashReady)
company.valuationShareBasis.splitCheckThrough='2026-10-14'
company.decision.years[0].freeCashFlow=-1;assert(!buildScenarios(company,{},now).inputs.cashReady)
assert(!buildScenarios(company,{},new Date('2027-01-01')).inputs.earningsReady)
for (const c of COMPANIES) assert.doesNotThrow(()=>buildScenarios(c,{},now))
console.log('Company valuation: independent annuity, inverse, bounds, monotonicity and eligibility checks passed')
