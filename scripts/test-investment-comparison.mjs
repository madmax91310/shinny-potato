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

// Same identity, two investment modes: a manual valuation belongs to the asset,
// regardless of its side or mode. Each month's purchases keep their observed price.
const { ASSETS } = await import('../src/data/calculator-history.js')
const { monthlyCurrencyFactor } = await import('../src/data/history-currency.js')
const { monthlyHistoryMethod, isNavTotalReturn } = await import('../src/lib/performance-conventions.js')
const { performanceBasis } = await import('../src/pages/tweet-midi/data/marketHistory.js')
const close = (a,b) => assert(Math.abs(a-b) < 1e-8, `${a} != ${b}`)
for (const currency of ['USD','EUR']) for (const pair of [['lump','dca'],['dca','lump']]) {
  const settings = { amount:100, mode:'dca', startYm:'2020-12', endYm:'2025-12', currency,
    overrideAssetId:'bitcoin', overridePriceRaw:'100000' }
  const result = computeComparison(settings,'bitcoin','bitcoin',...pair)
  const points = ASSETS.bitcoin.points.filter(p => p.date >= settings.startYm && p.date <= settings.endYm)
  const price = p => p.price * monthlyCurrencyFactor(p.date,'USD',currency)
  const finalPrice = 100000 * monthlyCurrencyFactor(settings.endYm,'USD',currency)
  for (const side of result.sides) {
    const units = side.mode === 'dca' ? points.reduce((sum,p) => sum+100/price(p),0) : 100*points.length/price(points[0])
    close(side.result.finalValue, units*finalPrice)
    assert.equal(side.override,true)
    assert.equal(side.result.totalInvested,100*points.length)
  }
  assert.equal(buildComparisonTweet(result).split('Valorisation au prix final saisi manuellement.').length-1,2)
}
// An override on the right must not leak to a different identity on the left.
const right = computeComparison({...inputs,overrideAssetId:'apple',overridePriceRaw:'1'},'microsoft','apple','lump','dca')
assert.equal(right.sides[0].override,false);assert.equal(right.sides[1].override,true)
let navCount=0
for(const [id,asset] of Object.entries(ASSETS)) if(isNavTotalReturn(asset)) {
  navCount++
  assert.match(monthlyHistoryMethod(asset),/liquidative/)
  assert.doesNotMatch(monthlyHistoryMethod(asset),/Cours|divisions/)
  assert.match(performanceBasis(id),/liquidative/)
}
assert(navCount>0)
assert.match(monthlyHistoryMethod(ASSETS.apple),/Cours ajustés.*dividendes/)
assert.match(monthlyHistoryMethod(ASSETS.etfVwce),/Cours ajustés de l’ETF.*frais du fonds inclus/)
console.log(`Financial regressions: same-asset overrides on both modes/sides, independent monthly FX and ${navCount} NAV method labels passed.`)
