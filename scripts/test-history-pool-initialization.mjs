import assert from 'node:assert/strict'
import { createFormatEngine } from '../src/pages/tweet-midi/engine.js'

// A growing catalogue must not re-read each history for every possible pair.
const assets = Array.from({ length: 80 }, (_, i) => ({ id: `asset-${i}`, label: `Asset ${i}` }))
const annualCalls = [], anniversaryCalls = []
const engine = createFormatEngine({
  MARKET_ASSETS: assets,
  ANNIVERSAIRE_ELIGIBLE_ASSETS: assets,
  historyOptionLabel: id => id,
  getAnnualReturnStartYears: id => { annualCalls.push(id); return [2020, 2021] },
  getValidYearsBackOptions: id => { anniversaryCalls.push(id); return [1, 2] },
})
assert.deepEqual(annualCalls, assets.map(a => a.id))
assert.deepEqual(anniversaryCalls, assets.map(a => a.id))
for (const format of ['performance-depuis', 'anniversaire']) {
  assert.equal(engine.poolForFormat(format).length, assets.length * 2)
  const pairs = engine.poolForFormat(format, 'comparatif')
  assert.equal(pairs.length, assets.length * (assets.length - 1))
  assert.equal(new Set(pairs.map(item => item.id)).size, pairs.length)
  assert(pairs.every(item => item.assetIdA !== item.assetIdB))
}
console.log('Each history evaluated once; all simple and comparative choices preserved.')

// Pair compatibility must not be evaluated during simple-mode construction.
// The same NETR/GRTR rule must still apply when the pair mode is first requested.
let pairReads=0
const probeAssets=['NETR','GRTR','NETR'].map((basis,i)=>({id:`probe-${i}`,label:`Probe ${i}`,basis,get priceUnit(){pairReads++;return 'points'}}))
const probe=createFormatEngine({MARKET_ASSETS:probeAssets,historyOptionLabel:id=>id,getAnnualReturnStartYears:()=>[2020,2021]})
assert.equal(pairReads,0,'simple-route construction must not allocate or qualify pairs')
assert.equal(probe.poolForFormat('performance-depuis').length,6)
assert.equal(pairReads,0)
const compatible=probe.poolForFormat('performance-depuis','comparatif')
assert.deepEqual(compatible.map(item=>item.id),['perf-depuis-cmp:probe-0:probe-2:2020','perf-depuis-cmp:probe-0:probe-2:2021'])
assert(pairReads>0)
const qualifiedReads=pairReads
assert.strictEqual(probe.poolForFormat('performance-depuis','comparatif'),compatible)
assert.equal(probe.ALL_ITEMS.length,8,'explicit audit inventory remains exhaustive')
assert.strictEqual(probe.ALL_ITEMS,probe.ALL_ITEMS,'the complete inventory is memoized too')
assert.equal(pairReads,qualifiedReads,'pair qualification never repeats for the same engine snapshot')
console.log('Comparisons deferred, memoized, exhaustive and NETR/GRTR qualification preserved.')
