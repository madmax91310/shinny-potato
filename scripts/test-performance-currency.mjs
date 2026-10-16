import assert from 'node:assert/strict'
import fx from '../src/data/annual-fx.json' with { type: 'json' }
import engine from '../src/pages/tweet-midi/engines/performance.js'
import { convertPerformanceEntries } from '../src/pages/tweet-midi/performanceCurrency.js'
import { formatPerformancePct } from '../src/pages/tweet-midi/performanceFormat.js'
const item = { assetId: 'msciWorld', year: 2016 }
const [native] = engine.getPerformanceEntries(item)
const [eur] = engine.getPerformanceEntries({ ...item, currency: 'EUR' })
const compound = rows => rows.reduce((n, row) => n * (1 + row.pct / 100), 1)
assert.deepEqual(engine.getPerformanceCurrencies(item), ['EUR', 'USD'])
assert.deepEqual(engine.getPerformanceEntries({ ...item, currency: 'USD' })[0], native)
// End-to-end annual conversion must telescope to the full-period FX ratio.
assert.ok(Math.abs(compound(eur.returns) - compound(native.returns) * fx.years[2015].value / fx.years[2025].value) < 1e-12)
const roundtrip = convertPerformanceEntries([eur], 'USD')[0]
assert.ok(Math.abs(compound(roundtrip.returns) - compound(native.returns)) < 1e-12)
const tweet = engine.buildPerformanceDepuisText({ ...item, currency: 'EUR' })
assert.match(tweet, /de début 2016 à fin 2025/)
assert.match(tweet, /Gross Return · EUR · dividendes bruts réinvestis/)
assert.match(tweet, /conversion BCE, sans couverture de change/)
assert.match(tweet, /2025 : \+7,5 %/)
assert.equal(eur.asset.currency, 'EUR')
assert.equal(native.asset.currency, 'USD')
const missing = fx.years[2018]
try {
  delete fx.years[2018]
  assert.deepEqual(engine.getPerformanceCurrencies(item), ['USD'])
  assert.throws(() => engine.getPerformanceEntries({ ...item, currency: 'EUR' }), /change incomplet/)
} finally { fx.years[2018] = missing }
assert.throws(() => convertPerformanceEntries([{asset:{currency:'JPY'},returns:[{year:2025,pct:10}]}], 'EUR'), /change incomplet/)
const pair = engine.getPerformanceEntries({ mode: 'comparatif', assetIdA: 'msciWorld', assetIdB: 'stoxx600', year: 2016, currency: 'USD' })
assert.equal(pair.length, 2)
assert.ok(pair.every(entry => entry.asset.currency === 'USD'))
assert.deepEqual(pair[0].returns.map(r => r.year), pair[1].returns.map(r => r.year))
assert.equal(formatPerformancePct(0.03693), '+0,04 %')
assert.equal(formatPerformancePct(-0.03693), '−0,04 %')
assert.equal(formatPerformancePct(0), '+0,0 %')
assert.match(engine.buildPerformanceDepuisText({assetId:'nasdaq100',year:2017}), /2018 : \+0,04 %/)
console.log('Performance currencies: identity, inverse, cumulative FX, missing data, shared comparison, labels and rounding OK')
