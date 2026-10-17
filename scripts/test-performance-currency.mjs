import assert from 'node:assert/strict'
import fx from '../src/data/annual-fx.json' with { type: 'json' }
import { CALENDAR_FX_YEARS as calendarYears } from '../src/data/calendar-fx.js'
import official from '../src/data/official-performance-currencies.json' with { type: 'json' }
import engine from '../src/pages/tweet-midi/engines/performance.js'
import { convertPerformanceEntries } from '../src/pages/tweet-midi/performanceCurrency.js'
import { formatPerformancePct } from '../src/pages/tweet-midi/performanceFormat.js'
const item = { assetId: 'msciWorld', year: 2016 }
const [native] = engine.getPerformanceEntries(item)
const [eur] = engine.getPerformanceEntries({ ...item, currency: 'EUR' })
const compound = rows => rows.reduce((n, row) => n * (1 + row.pct / 100), 1)
assert.deepEqual(engine.getPerformanceCurrencies(item), ['EUR', 'USD'])
assert.deepEqual(engine.getPerformanceEntries({ ...item, currency: 'USD' })[0], native)
assert.deepEqual(eur.returns.map(row => row.pct), [11.39, 8.10, -3.58, 30.76, 6.88, 31.64, -12.34, 20.20, 27.15, 7.21])
assert.ok(Math.abs((compound(eur.returns) - 1) * 100 - 206.80035) < 0.00001)
for (const assetId of ['msciEmerging', 'msciAcwi']) {
  const [entry] = engine.getPerformanceEntries({ assetId, year: 2016, currency: 'EUR' })
  assert.equal(entry.asset.currencyMethod, 'official')
  assert.equal(entry.returns.at(-1).pct, official[assetId].EUR.annualReturns[2025])
}
// Unregistered series still use BCE, without altering their return convention.
const [fallback] = engine.getPerformanceEntries({ assetId: 'sp500', year: 2016, currency: 'EUR' })
const [fallbackNative] = engine.getPerformanceEntries({ assetId: 'sp500', year: 2016 })
assert.ok(Math.abs(compound(fallback.returns) - compound(fallbackNative.returns) * fx.years[2015].value / fx.years[2025].value) < 1e-12)
const roundtrip = convertPerformanceEntries([fallback], 'USD')[0]
assert.ok(Math.abs(compound(roundtrip.returns) - compound(fallbackNative.returns)) < 1e-12)
const tweet = engine.buildPerformanceDepuisText({ ...item, currency: 'EUR' })
assert.match(tweet, /de début 2016 à fin 2025/)
assert.match(tweet, /Gross Return · EUR · dividendes bruts réinvestis/)
assert.match(tweet, /série officielle, sans couverture de change/)
assert.doesNotMatch(tweet, /conversion BCE/)
assert.match(tweet, /2025 : \+7,2 %/)
assert.equal(eur.asset.currency, 'EUR')
assert.equal(native.asset.currency, 'USD')
const missing = calendarYears[2018]
try {
  delete calendarYears[2018]
  assert.deepEqual(engine.getPerformanceCurrencies(item), ['EUR', 'USD'])
  assert.throws(() => engine.getPerformanceEntries({ assetId: 'sp500', year: 2016, currency: 'EUR' }), /change incomplet/)
} finally { calendarYears[2018] = missing }
// No mixing of official/BCE years within one history if official coverage is incomplete.
const saved = official.msciWorld.EUR.annualReturns[2018]
try {
  delete official.msciWorld.EUR.annualReturns[2018]
  const [entry] = engine.getPerformanceEntries({ ...item, currency: 'EUR' })
  assert.notEqual(entry.asset.currencyMethod, 'official')
  assert.ok(Math.abs(compound(entry.returns) - compound(native.returns) * fx.years[2015].value / fx.years[2025].value) < 1e-12)
} finally { official.msciWorld.EUR.annualReturns[2018] = saved }
const [yen] = convertPerformanceEntries([{asset:{currency:'JPY'},returns:[{year:2025,pct:10}]}], 'EUR')
assert.ok(Math.abs(yen.returns[0].pct - ((1.1 * calendarYears[2024].rates.JPY / calendarYears[2025].rates.JPY - 1) * 100)) < 1e-12)
assert.throws(() => convertPerformanceEntries([{asset:{currency:'ZZZ'},returns:[{year:2025,pct:10}]}], 'EUR'), /change incomplet/)
const pair = engine.getPerformanceEntries({ mode: 'comparatif', assetIdA: 'msciWorld', assetIdB: 'stoxx600', year: 2016, currency: 'USD' })
assert.equal(pair.length, 2)
assert.ok(pair.every(entry => entry.asset.currency === 'USD'))
assert.deepEqual(pair[0].returns.map(r => r.year), pair[1].returns.map(r => r.year))
assert.equal(formatPerformancePct(0.03693), '+0,04 %')
assert.equal(formatPerformancePct(-0.03693), '−0,04 %')
assert.equal(formatPerformancePct(0), '+0,0 %')
assert.match(engine.buildPerformanceDepuisText({assetId:'nasdaq100',year:2017}), /2018 : \+0,04 %/)
console.log('Performance currencies: identity, inverse, cumulative FX, missing data, shared comparison, labels and rounding OK')
