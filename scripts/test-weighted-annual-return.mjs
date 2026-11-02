import assert from 'node:assert/strict'
import { weightedAnnualReturn } from '../src/lib/weighted-annual-return.js'
import { computeYearlyPerf, formatPerformance } from '../src/pages/portfolio-generator/performance.js'
import { buildCustomDuel, formatPercent } from '../src/pages/portfolio-duels/lib.js'
import { ITEM_BY_ID } from '../src/pages/portfolio-duels/catalog.js'

// Captured arithmetic of a qualified three-line EUR portfolio on master 414bd67:
// DE000A0H08P6 25% x 11.29%; DE000A0H08F7 20% x 7%; IE00BCRY6557 55% x 4.05%.
// Immutable mathematical fixture, not an assertion freezing these live returns.
const fixture=[{value:11.29,weight:25},{value:7,weight:20},{value:4.05,weight:55}]
const permutations=rows=>rows.length?rows.flatMap((row,i)=>permutations(rows.filter((_,j)=>i!==j)).map(rest=>[row,...rest])):[[]]
assert.equal(2.8225+1.4+2.2275,6.45)
assert.notEqual(1.4+2.2275+2.8225,6.45,'Reproduce the floating-point defect')
for(const terms of permutations(fixture)){
 assert.equal(weightedAnnualReturn(terms),6.45)
 assert.equal(weightedAnnualReturn(terms.map(t=>({...t,value:-t.value}))),-6.45)
}
assert.equal(weightedAnnualReturn([{value:20,weight:60},{value:-10,weight:40}]),8)
assert.equal(weightedAnnualReturn([{value:-100,weight:100}]),-100)
assert.equal(weightedAnnualReturn([{value:5e-324,weight:100}]),5e-324)
assert.equal(weightedAnnualReturn([{value:1e308,weight:50}]),5e307)
const precise=Number('12.123456789012345')
assert.equal(weightedAnnualReturn([{value:precise,weight:100}]),precise)
assert.equal(weightedAnnualReturn([{value:NaN,weight:100}]),null)
assert.equal(weightedAnnualReturn([{value:10,weight:Infinity}]),null)
assert.equal(weightedAnnualReturn([]),null)
// Exercise both actual engines with isolated fixture identities. They retain all
// validation of weights and dates; production registries and observations stay intact.
const ids=fixture.map((_,i)=>`arithmetic-fixture-${i}`)
try{
 for(const [i,term] of fixture.entries())ITEM_BY_ID.set(ids[i],{id:ids[i],name:ids[i],label:ids[i],exposure:'arithmetic-fixture',role:'complement',currency:'EUR',basis:'fund',source:'https://example.test/math',calendarReturns:Object.fromEntries([2020,2021,2022,2023,2024,2025].map(y=>[y,term.value]))})
 for(const order of permutations([0,1,2])){
  const selection=order.map(i=>({...ITEM_BY_ID.get(ids[i]),returnCurrency:'EUR',pct:fixture[i].weight})),perf=computeYearlyPerf(selection)
  const duel=buildCustomDuel({left:order.map(i=>({id:ids[i],pct:fixture[i].weight})),right:[{id:ids[0],pct:100}]})
  assert.equal(perf[2024],6.45);assert.equal(duel.a.annual[2024],6.45)
  assert.equal(formatPerformance(perf[2024]),'+6,5 %');assert.equal(formatPercent(duel.a.annual[2024]),'+6,5 %')
 }
}finally{for(const id of ids)ITEM_BY_ID.delete(id)}
console.log('Weighted annual returns: exact decimal tie, all permutations, negative/total loss, scientific notation, invalid inputs and both actual engines passed.')
