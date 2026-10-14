import { targetExplanation } from '../src/pages/company-analysis/targetExplanation.js'
import { buildPriceScenarios, priceTarget, targetChart } from '../src/pages/company-analysis/priceTargets.js'
import { valuationPublication } from '../src/pages/company-analysis/valuationPublication.js'
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
const company={valuationBusinessType:'operating-company',currency:'USD', accountingStandard:'IFRS', accountsObservedAt:'2026-10-14',
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
company.id='fixture';company.name='Entreprise témoin';company.symbol='TEST'
company.targetForecast={version:1,symbol:'TEST',currency:'USD',basis:'adjusted-non-gaap',multipleBasis:'forward-adjusted-eps',asOf:'2026-10-14',observedAt:'2026-10-14',sourceUrl:'https://example.com/adjusted',
  points:[{end:'2025-12-31',eps:10,kind:'observed-adjusted'},{end:'2026-12-31',eps:12,kind:'estimate'},{end:'2027-12-31',eps:15,kind:'estimate'}],
  historicalMultiples:[{end:'2023-12-31',multiple:15},{end:'2024-12-31',multiple:20},{end:'2025-12-31',multiple:25}]}
company.targetCashReference={version:1,currency:'USD',annualEnd:'2025-12-31',observedAt:'2026-10-14',sourceUrl:'https://example.com/history',historicalMultiples:years.slice(0,3).map((r,i)=>({end:r.end,base:r.freeCashFlow/r.averageDilutedShares,multiple:10+i*2}))}

for (const method of ['cash','earnings']) {
  for (const selected of [0,1,2]) {
    const publication=valuationPublication(company,{},selected,method,now)
    const targets=buildPriceScenarios(company,{},now)
    const expected=method==='cash'?targets.scenarios[selected].cashTarget.value:targets.scenarios[selected].earningsTarget.value
    assert.equal(publication.reading.value,expected)
    assert.equal(publication.scenarios[selected].value,expected)
    assert(publication.text.includes(model.scenarios[selected].name.toLowerCase()))
    assert.equal(publication.chart.forecast[selected].points.at(-1).value,targetChart(company,targets,method).forecast[selected].points.at(-1).value)
    assert(!/NaN|undefined|Infinity/.test(publication.text))
    assert(publication.text.includes('hors dividendes'))
    assert(publication.text.includes(company.targetForecast.sourceUrl) || method==='cash')
    assert(!publication.text.includes('croissance annualisée équivalente'))
    assert.equal((publication.text.match(/Pas un conseil financier/g)||[]).length,1)
    assert.equal((publication.text.match(/Trois scénarios au/g)||[]).length,1)
  }
}
const exported=valuationPublication(company,{1:{cashGrowth:.02,cashMultiple:18}},1,'cash',now)
assert.equal(exported.years,5)
assert.equal(exported.assumptions.multiple,18)
assert(exported.text.includes('18'))
assert.notEqual(exported.reading.value,model.scenarios[1].cash.value)
assert.throws(()=>valuationPublication(company,{1:{cashMultiple:0}},1,'cash',now))
assert.throws(()=>valuationPublication(company,{},1,'cash',new Date('2027-10-14')))
assert.throws(()=>valuationPublication(company,{},1,'earnings',new Date('2027-10-14')))
assert.throws(()=>valuationPublication(company,{},1,'history',now))
assert.throws(()=>valuationPublication(company,{},9,'cash',now))

// Product contract: future price, not discounted present value.
const benchmark=priceTarget({base:10,growth:.1,years:5,multiple:20},200)
assert(Math.abs(benchmark.value-322.102)<1e-8)
assert(Math.abs(benchmark.upside-.61051)<1e-10)
assert(Math.abs(benchmark.annualised-.1)<1e-10)
assert.equal(priceTarget({base:10,growth:0,years:3,multiple:20},200).value,200)
assert(priceTarget({base:10,growth:-.1,years:5,multiple:15},200).upside<0)
assert.throws(()=>priceTarget({base:10,growth:.1,years:10,multiple:20},200))
assert.throws(()=>priceTarget({base:10,growth:.1,years:5,multiple:NaN},200))
company.quote.sourceUrl='https://example.com/quotes'
company.quote.history=[{asOf:'2026-09-30',close:190},{asOf:'2026-10-14',close:200}]
for(const horizon of [1,3,5]) {
  const targets=buildPriceScenarios(company,{},now,horizon)
  assert.equal(targets.scenarios[1].earningsAssumptions.base,12)
  if(horizon===1)assert.equal(targets.scenarios[1].earningsTarget.value,300)
  assert.equal(targets.scenarios[1].earningsAssumptions.multiple,20)
  for(const method of ['cash','earnings']) {
    const graph=targetChart(company,targets,method)
    assert(graph.hasPriceHistory)
    assert.equal(graph.history.at(-1).value,200)
    for(const [i,series] of graph.forecast.entries()) {
      const result=method==='cash'?targets.scenarios[i].cashTarget:targets.scenarios[i].earningsTarget
      assert.equal(series.points[0].value,200)
      assert(Math.abs(series.points.at(-1).value-result.value)<1e-8)
      assert.equal(series.points.at(-1).end,targets.targetDate)
      const pub=valuationPublication(company,{},i,method,now,horizon)
      assert.equal(pub.reading.value,result.value)
      assert(pub.text.includes(targets.targetDate.split('-').reverse().join('/')))
    }
  }
}
const originalTargets=buildPriceScenarios(company,{},now)
company.estimates.growthEPS5Y=5
assert.equal(buildPriceScenarios(company,{},now).scenarios[1].earningsTarget.value,originalTargets.scenarios[1].earningsTarget.value)
company.targetForecast.points.at(-1).eps=13
assert(buildPriceScenarios(company,{},now).scenarios[1].earningsTarget.value<originalTargets.scenarios[1].earningsTarget.value)
company.targetForecast.points.at(-1).eps=15
const saved=company.targetForecast.basis;company.targetForecast.basis='unknown'
assert.equal(buildPriceScenarios(company,{},now).inputs.earningsReady,false)
assert.throws(()=>valuationPublication(company,{},1,'earnings',now))
company.targetForecast.basis=saved
company.quote.splits=['2026-10-15'];company.targetForecast.asOf='2026-10-13'
assert.equal(buildPriceScenarios(company,{},now).inputs.earningsReady,false)
company.quote.splits=[];company.targetForecast.asOf='2026-10-14'
const normalTarget=buildPriceScenarios(company,{},now).scenarios[1].earningsTarget.value
company.quote.price=400
assert.equal(buildPriceScenarios(company,{},now).scenarios[1].earningsTarget.value,normalTarget)
company.quote.price=200
company.quote.history[1].close=199
assert(!targetChart(company,originalTargets,'earnings').hasPriceHistory)
company.quote.history[1].close=200
assert.equal(targetChart(company,originalTargets,'history').forecast.length,0)

// Explanations must reconcile independently to prices, including custom scenarios.
for(const horizon of [1,3,5])for(const method of ['cash','earnings'])for(const index of [0,1,2]) {
  for(const overrides of [{},{[index]:{[method==='cash'?'cashGrowth':'earningsGrowth']:.02}}]) {
    const m=buildPriceScenarios(company,overrides,now,horizon),x=targetExplanation(company,m,index,method)
    const target=m.scenarios[index][method+'Target']
    assert(Math.abs(200+x.fundamentalEffect+x.multipleEffect-target.value)<1e-8)
    assert.equal(x.periods.at(-1).value,target.fundamental)
    assert.equal(x.customGrowth,Object.keys(overrides).length>0)
    assert.equal(x.historyCount,4)
    if(x.customGrowth)assert(x.periods.every(p=>p.origin==='Réglage personnel'))
    if(method==='earnings'&&horizon===1&&!x.customGrowth)assert.equal(x.extrapolated,0)
    if(method==='earnings'&&horizon===5&&!x.customGrowth)assert.equal(x.extrapolated,4)
    const pub=valuationPublication(company,overrides,index,method,now,horizon)
    assert(pub.text.includes(x.summary)&&pub.text.includes(x.coverage))
  }
}
// Independent bridge example: 200 -> 240 at unchanged multiple -> 180 at 15x.
const bridgeModel={inputs:{price:200},evidence:{earnings:{periods:['2027-12-31'],curve:[{end:'2027-12-31',kind:'estimate'}],calibration:{multiples:{count:3}},asOf:'2026-10-14'}},scenarios:[{earningsAssumptions:{base:10,path:[12],multiple:15},earningsTarget:{fundamental:12,value:180,upside:-.1}}]}
const bridge=targetExplanation(company,bridgeModel,0,'earnings')
assert.equal(bridge.fundamentalEffect,40);assert.equal(bridge.multipleEffect,-60)
assert(bridge.summary.includes('ne compense pas'))
for(const type of [undefined,'bank','insurer','reit']) {
  const bad={...company,valuationBusinessType:type}
  assert.equal(buildPriceScenarios(bad,{},now).inputs.earningsReady,false)
  assert.equal(buildPriceScenarios(bad,{},now).inputs.cashReady,false)
}
for(const mutate of [
  c=>{c.targetForecast.points[1].end='2026-01-01'},
  c=>{c.targetForecast.points[1].kind='unknown'},
  c=>{c.targetForecast.points[2].kind='observed-adjusted'},
  c=>{c.targetForecast.historicalMultiples[1].end=c.targetForecast.historicalMultiples[0].end},
  c=>{c.decision.years[1].end='2020-01-01'}
]) {
  const bad=structuredClone(company);mutate(bad)
  assert.equal(buildPriceScenarios(bad,{},now).inputs.earningsReady,false)
}

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
