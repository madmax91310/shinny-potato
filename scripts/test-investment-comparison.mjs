import assert from 'node:assert/strict'
import { computeComparison, buildComparisonTweet } from '../src/pages/investment-calculator/comparison.js'
import { fmtEUR } from '../src/pages/investment-calculator/lib.js'

const inputs = { amount: 1000, startYm: '2020-01', endYm: '2025-12', mode: 'lump' }
const mixed = computeComparison(inputs, 'schneider', 'apple', 'lump', 'dca')
assert.ok(Math.abs(mixed.sides[0].result.totalInvested - mixed.sides[1].result.totalInvested) < 1e-8)
const text = buildComparisonTweet(mixed)
for (const side of mixed.sides) assert.ok(text.includes(fmtEUR(side.result.finalValue, side.asset.currency)))
assert.ok(text.includes('ne sont pas directement comparables'))
assert.ok(!text.includes('de plus pour'))

const modes = computeComparison({ ...inputs, mode: 'dca', amount: 100 }, 'bitcoin', 'bitcoin', 'lump', 'dca')
assert.equal(modes.sides[0].result.totalInvested, 7200)
assert.equal(modes.sides[1].result.totalInvested, 7200)
assert.ok(buildComparisonTweet(modes).includes('de plus pour'))

const overridden = computeComparison({ ...inputs, overrideAssetId: 'apple', overridePriceRaw: '1' }, 'apple', 'microsoft', 'lump', 'lump')
assert.ok(overridden.sides[0].result.finalValue < 1000)
assert.ok(buildComparisonTweet(overridden).includes('📉 Perte'))
assert.ok(buildComparisonTweet(overridden).includes('saisi manuellement'))
assert.equal(overridden.sides[1].override, false)
console.log('Investment comparison: budgets, DCA/lump, result values, currencies, loss and override OK.')
