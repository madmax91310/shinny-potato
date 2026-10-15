import assert from 'node:assert/strict'
import { discountedCash, reverseCashGrowth, requiredTargetGrowth, sensitivityGrid } from '../src/pages/company-analysis/valuationExplorer.js'
import { priceTarget } from '../src/pages/company-analysis/priceTargets.js'
const close=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`)
const a={base:10,growth:0,years:3,multiple:10}
// Perpetuity identity: a 10-unit annual payout and resale at 100, discounted
// at 10%, is worth exactly 100 regardless of a three-year resale horizon.
close(discountedCash(a,.1).value,100)
close(reverseCashGrowth(a,100,.1),0)
close(requiredTargetGrowth(a,100),0)
close(requiredTargetGrowth(a,100,.1),.1)
close(requiredTargetGrowth(a,100,-.1),-.1)
assert.equal(reverseCashGrowth(a,1e30,.1),null)
const path={...a,path:[11,14,18],growth:(1.8)**(1/3)-1}
close(discountedCash(path,.1).value,11/1.1+14/1.1**2+(18+180)/1.1**3)
close(sensitivityGrid(path,100).rows[1][1].value,180)
assert(sensitivityGrid(a,100).rows[2][2].value>sensitivityGrid(a,100).rows[0][0].value)
for(const years of [1,3,5])for(const growth of [-.2,0,.1,.4]){
  const input={...a,years,growth}
  close(priceTarget({...input,growth:requiredTargetGrowth(input,100,.08)},100).annualised,.08)
  close(reverseCashGrowth(input,discountedCash(input,.12).value,.12),growth)
}
for(const bad of [0,-.1,NaN,Infinity])assert.throws(()=>discountedCash(a,bad))
assert.throws(()=>discountedCash({...a,path:[10,-1,10]},.1))
assert.throws(()=>requiredTargetGrowth(a,100,-1))
assert.throws(()=>reverseCashGrowth(a,0,.1))
console.log('Inverse targets, reverse DCF and sensitivity: independent benchmarks passed.')
