import assert from 'node:assert/strict'
import { historicalGrowth, scenarioContext, reverseComparison } from '../src/pages/company-analysis/scenarioContext.js'
import { COMPANIES } from '../src/data/companies.js'
import { buildPriceScenarios } from '../src/pages/company-analysis/priceTargets.js'
import { targetExplanation } from '../src/pages/company-analysis/targetExplanation.js'
const history=[{end:'2021-01-01',value:100},{end:'2022-01-01',value:110},{end:'2023-01-01',value:121}]
assert(Math.abs(historicalGrowth(history).value-.1)<.0001)
for(const bad of [history.slice(0,2),[history[0],{...history[1],value:0},history[2]],[history[0],history[2],{end:'2024-01-01',value:130}]])assert.equal(historicalGrowth(bad),null)
assert(reverseComparison(.08,.04).includes('supérieure de 4 points'))
assert(reverseComparison(-.08,-.04).includes('inférieure de 4 points'))
assert(reverseComparison(.04,.04).includes('proche'))
assert.equal(reverseComparison(null,.04),null)
let checked=0
for(const c of COMPANIES)for(const years of [1,3,5]){
 const model=buildPriceScenarios(c,{},new Date(),years)
 for(const method of ['cash','earnings'])if(model.evidence[method])for(const i of [0,1,2]){
  const x=targetExplanation(c,model,i,method),r=model.scenarios[i][method+'Target']
  assert(Math.abs(model.inputs.price+x.fundamentalEffect+x.multipleEffect-r.value)<1e-7)
  assert(!/NaN|undefined|Infinity/.test(JSON.stringify(x)))
  assert.equal(x.context.relative,x.multiple/model.evidence[method].historical-1)
  if(method==='earnings'&&c.targetForecast.points.filter(p=>p.kind==='observed-adjusted').length<3)assert.equal(x.context.history,null)
  checked++
 }
}
console.log(`${checked} scenario explanations: additive price bridge, comparable history, signed inverse comparisons verified.`)
// Each lazy dossier must carry only its own forecast groups, with metadata intact.
const {splitCompanyRecords}=await import('./split-company-records.mjs')
const {readFileSync}=await import('node:fs')
const evaluation=JSON.parse(readFileSync('src/data/company-forecast-evaluation.json','utf8'))
const plugin=splitCompanyRecords().plugin
const source=plugin.load('\0company-dossier:apple')
const dossier=JSON.parse(source.slice('export default '.length))
assert.deepEqual(dossier.forecastEvaluation,{...evaluation,groups:evaluation.groups.filter(g=>g.company==='apple')})
assert(dossier.forecastEvaluation.groups.every(g=>g.company==='apple'))
console.log('Forecast history: exact per-company projection and shared dates verified.')
