import assert from 'node:assert/strict'
import { cashValue, earningsValue, impliedGrowth, impliedReturn, buildScenarios } from '../src/pages/company-analysis/valuation.js'
import { valuationChart, chartGeometry, valuationReading } from '../src/pages/company-analysis/valuationPresentation.js'
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
// Fixed synthetic accounting fixture: scheduled refreshes must not change unit-test inputs.
const years = [2022,2023,2024,2025].map((year,i)=>({end:`${year}-12-31`, revenue:1000, netIncome:100,
  freeCashFlow:100+i*5, operatingCashFlow:120+i*5, capitalExpenditure:20, averageDilutedShares:10,
  freeCashFlowDefinition:'operating-minus-capex', sourceUrl:'https://example.com/accounts', sharesBasisSource:'https://example.com/accounts'}))
const company={currency:'USD', accountingStandard:'IFRS', accountsObservedAt:'2026-10-14',
  annual:{...years.at(-1),dilutedEPS:10}, quarter:{end:'2026-06-30'},
  quote:{price:200,currency:'USD',asOf:'2026-10-14',splits:[]},
  estimates:{observedAt:'2026-10-14',accountsEndAtCollection:'2026-06-30',forwardEPS:12,growthEPS5Y:9},
  decision:{observedAt:'2026-10-14',annualEnd:'2025-12-31',accountsEndAtCollection:'2026-06-30',years}}

const now=new Date('2026-10-14T12:00:00Z')
company.valuationShareBasis={version:1,currency:company.currency,observedAt:'2026-10-14',annualEnd:company.annual.end,accountsEndAtCollection:company.quarter.end,splitCheckFrom:'2020-01-01',splitCheckThrough:'2026-10-14',sourceUrl:'https://example.com/splits'}
let model=buildScenarios(company,{},now)
assert(model.inputs.cashReady)
assert(model.scenarios[0].cash.value<model.scenarios[1].cash.value)
assert(model.scenarios[1].cash.value<model.scenarios[2].cash.value)
assert.notEqual(model.scenarios[1].cashAssumptions.growth,model.scenarios[1].earningsAssumptions.growth)
const chart=valuationChart(company,model,'cash',now)
assert.equal(chart.forecast[1].points.at(-1).value,model.scenarios[1].cash.flows.at(-1))
assert.equal(new Date(chart.forecast[1].points.at(-1).time).getUTCFullYear(),2036)
assert(!chartGeometry(chart).path(chart.forecast[1].points).includes('NaN'))
const reading=valuationReading(model,1,'cash')
assert.equal(reading.value,model.scenarios[1].cash.value)
assert(reading.sensitivity.low<reading.value && reading.sensitivity.high>reading.value)
assert(valuationReading(buildScenarios(company,{1:{cashGrowth:.01}},now),1,'cash').value<reading.value)
assert.equal(valuationReading(undefined),null)
company.valuationShareBasis.normalisedYears=company.decision.years.map(r=>({end:r.end,reportedAverageDilutedShares:r.averageDilutedShares,averageDilutedShares:r.averageDilutedShares*10,sourceUrl:r.sharesBasisSource,adjustments:[{ratio:10,issuerSourceUrl:'https://example.com/split'}]}))
assert.equal(buildScenarios(company,{},now).inputs.cashBase,model.inputs.cashBase/10)
company.valuationShareBasis.normalisedYears[0].reportedAverageDilutedShares=999
assert.equal(buildScenarios(company,{},now).inputs.cashReady,false)
delete company.valuationShareBasis.normalisedYears
company.valuationShareBasis.splitCheckThrough='2026-10-01';assert(!buildScenarios(company,{},now).inputs.cashReady)
company.valuationShareBasis.splitCheckThrough='2026-10-14'
company.decision.years[0].freeCashFlow=-1;assert(!buildScenarios(company,{},now).inputs.cashReady)
assert(!buildScenarios(company,{},new Date('2027-01-01')).inputs.earningsReady)
for (const c of COMPANIES) assert.doesNotThrow(()=>buildScenarios(c,{},now))
console.log('Company valuation: independent annuity, inverse, bounds, monotonicity and eligibility checks passed')
