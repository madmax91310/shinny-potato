import assert from 'node:assert/strict'
import { mkdtempSync,readFileSync,writeFileSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { appendSnapshot,readSnapshots,evaluate,snapshot } from './company-forecast-ledger.mjs'
import { calibrateScenarios,scenarioFactor } from '../src/pages/company-analysis/scenarioCalibration.js'
import { projectCash } from '../src/pages/company-analysis/cashProjection.js'
import { COMPANIES } from '../src/data/companies.js'
const dates=['2022-12-31','2023-12-31','2024-12-31','2025-12-31']
const stable=dates.map((end,i)=>({end,revenue:1000*1.05**i,netIncome:100*1.05**i}))
const volatile=stable.map((r,i)=>({...r,netIncome:[100,160,80,240][i]}))
const cal=calibrateScenarios(stable,[15,20,25],'earnings'),risk=calibrateScenarios(volatile,[8,20,40],'earnings')
assert(risk.sigma>cal.sigma)
assert(scenarioFactor(risk,-1,5)<scenarioFactor(cal,-1,5))
assert(risk.multiples.lower<cal.multiples.lower)
assert(risk.multiples.upper>cal.multiples.upper)
assert.equal(calibrateScenarios(stable.slice(0,2),[10,20,30],'earnings'),null)
const company={decision:{years:dates.map(end=>({end,revenue:1000,netIncome:100,operatingCashFlow:200,capitalExpenditure:50,freeCashFlow:150,averageDilutedShares:100,shareBasedCompensation:10,shareRepurchases:0,dividendsPaid:0}))}}
const cash=projectCash(company,{},0)
assert.equal(cash.curve.at(-1).value,1.5)
const capex=structuredClone(company);capex.decision.years.at(-1).capitalExpenditure=100;capex.decision.years.at(-1).freeCashFlow=100
assert(projectCash(capex,{},0).curve.at(-1).value<cash.curve.at(-1).value)
const dilution=structuredClone(company);dilution.decision.years.forEach((r,i)=>r.averageDilutedShares=100*1.05**i)
const diluted=projectCash(dilution,{},0)
assert(diluted.sharesGrowth>0)
assert(diluted.curve.at(-1).value<cash.curve.at(-1).value)
const buyback=structuredClone(company);buyback.decision.years.forEach((r,i)=>{r.averageDilutedShares=100*.98**i;r.shareRepurchases=100;r.dividendsPaid=100})
const bought=projectCash(buyback,{},0)
assert.equal(bought.funding,.5)
assert(Math.abs(bought.sharesGrowth-bought.observedShares*.5)<1e-12)
const expectedShares=buyback.decision.years.at(-1).averageDilutedShares*(1+bought.sharesGrowth)**8
assert(Math.abs(bought.curve.at(-1).value-150/expectedShares)<1e-12)
delete buyback.decision.years.at(-1).dividendsPaid
assert.equal(projectCash(buyback,{},0).sharesGrowth,0)
const anomalous=structuredClone(company);Object.assign(anomalous.decision.years.at(-1),{operatingCashFlow:500,freeCashFlow:450})
assert(projectCash(anomalous,{},0).warning)
assert.equal(projectCash(anomalous,{},0).curve[0].ocf,500)
// Hand-built matured cohort: a 120 forecast versus 100 realised -> 20% error,
// an unchanged 90 baseline -> 10%. This does not depend on the live model.
const record={id:'fixture',symbol:'TEST',currency:'USD',quote:{price:90,asOf:'2025-01-01',sourceUrl:'https://example.com/quote',splits:[],coverageFrom:'2024-01-01'},actuals:{cash:[],earnings:[]},forecasts:[{method:'earnings',years:1,targetDate:'2026-01-01',fundamentalPeriod:'2026-12-31',fundamentalValue:10,scenarios:[80,120,160].map(value=>({target:{value}}))}]}
const original={version:1,modelVersion:2,issuedAt:'2025-01-02',revision:'initial',records:[record]}
const observed={version:1,modelVersion:3,issuedAt:'2026-01-03',revision:'new-model',records:[{...structuredClone(record),forecasts:[],quote:{...record.quote,asOf:'2026-01-02',price:100}}]}
const accounting={version:1,modelVersion:3,issuedAt:'2027-02-01',revision:'new-model',records:[{...structuredClone(record),forecasts:[],quote:{...record.quote,asOf:'2027-01-31',price:110},actuals:{earnings:[{end:'2026-12-31',value:8,asOf:'2027-01-31',sourceUrl:'https://example.com/adjusted'}],cash:[]}}]}
const dir=mkdtempSync(join(tmpdir(),'company-ledger-test-'))
try {
  const file=appendSnapshot(dir,original),bytes=readFileSync(file,'utf8')
  assert.equal(appendSnapshot(dir,original),file)
  assert.equal(readSnapshots(dir).length,1)
  appendSnapshot(dir,observed);appendSnapshot(dir,accounting)
  let evaluated=evaluate(readSnapshots(dir),'2027-02-02')
  const result=evaluated.results[0]
  assert.equal(result.priceStatus,'evaluated');assert.equal(result.lagDays,1)
  assert(Math.abs(result.absoluteError-.2)<1e-12)
  assert(Math.abs(result.baselineAbsoluteError-.1)<1e-12)
  assert.equal(result.fundamentalError,.25)
  assert.equal(result.insideRange,true)
  assert.equal(evaluated.summary.groups[0].modelVersion,2)
  assert.equal(readFileSync(file,'utf8'),bytes)
  assert.equal(evaluate(readSnapshots(dir),'2025-12-31').results[0].priceStatus,'pending')
  assert.equal(evaluate([{hash:'original',snapshot:original}],'2027-02-01').results[0].priceStatus,'missing-observation')
  for(const change of [r=>r.quote.splits=['2025-06-01'],r=>r.quote.coverageFrom='2025-06-01']) {
    const blocked=structuredClone(observed);change(blocked.records[0])
    assert.equal(evaluate([{hash:'initial',snapshot:original},{hash:'later',snapshot:blocked}],'2026-01-04').results[0].priceStatus,'basis-unqualified')
  }
  const wrong=structuredClone(observed);wrong.records[0].currency='EUR'
  assert.equal(evaluate([{hash:'initial',snapshot:original},{hash:'wrong',snapshot:wrong}],'2026-01-10').results[0].priceStatus,'missing-observation')
  const cashOrigin=structuredClone(original),cashActual=structuredClone(accounting)
  Object.assign(cashOrigin.records[0].forecasts[0],{method:'cash',accountingDefinition:'operating-minus-capex'})
  cashActual.records[0].actuals={earnings:[],cash:[{end:'2027-01-02',value:8,asOf:'2027-01-31',sourceUrl:'https://example.com/cash',definition:'operating-minus-capex'}]}
  const assess=()=>evaluate([{hash:'cash-original',snapshot:cashOrigin},{hash:'cash-actual',snapshot:cashActual}],'2027-02-02').results[0]
  assert.equal(assess().fundamentalStatus,'evaluated')
  assert.equal(assess().actualFundamentalPeriod,'2027-01-02')
  cashActual.records[0].actuals.cash[0].end='2027-02-01'
  assert.equal(assess().fundamentalStatus,'awaiting-comparable-accounts')
  cashActual.records[0].actuals.cash[0].end='2027-01-02'
  cashActual.records[0].actuals.cash[0].definition='issuer-adjusted-cash'
  assert.equal(assess().fundamentalStatus,'awaiting-comparable-accounts')
  cashActual.records[0].actuals.cash[0].definition='operating-minus-capex'
  cashActual.records[0].actuals.cash.push({...cashActual.records[0].actuals.cash[0],end:'2026-12-31'})
  assert.equal(assess().fundamentalStatus,'awaiting-comparable-accounts')
  writeFileSync(file,bytes.replace('"revision": "initial"','"revision": "altered"'))
  assert.throws(()=>readSnapshots(dir),/corrompue/)
}finally{rmSync(dir,{recursive:true,force:true})}
const live=snapshot(COMPANIES,new Date(),'test-revision')
assert.equal(live.records.length,COMPANIES.length)
assert(live.records.every(r=>r.forecasts.length+r.excluded.length===6))
assert(live.records.flatMap(r=>r.forecasts).length>0)
console.log('Company scenarios, FCF drivers and immutable forecast ledger: independent numerical and lifecycle checks passed')
