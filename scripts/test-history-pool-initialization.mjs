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
