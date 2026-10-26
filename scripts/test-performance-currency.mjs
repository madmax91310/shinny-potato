import assert from 'node:assert/strict'
import { CALENDAR_FX_YEARS as calendarYears, calendarRate } from '../src/data/calendar-fx.js'
import official from '../src/data/official-performance-currencies.json' with { type: 'json' }
import engine from '../src/pages/tweet-midi/engines/performance.js'
import { convertPerformanceEntries } from '../src/pages/tweet-midi/performanceCurrency.js'
import { formatPerformancePct } from '../src/pages/tweet-midi/performanceFormat.js'
const item = { assetId: 'msciWorld', year: 2016 }
const [native] = engine.getPerformanceEntries(item)
const [eur] = engine.getPerformanceEntries({ ...item, currency: 'EUR' })
const compound = rows => rows.reduce((n, row) => n * (1 + row.pct / 100), 1)
// Year-end ECB rates as the engine reads them (December rows of the monthly series).
const usdPerEur = year => calendarRate(year, 'USD')
// Expectations follow the collected data: the last complete year moves every January and
// the official EUR series is used only once it covers the whole displayed period.
const years = native.returns.map(row => row.year)
const LAST = years.at(-1)
const officialFor = (assetId, period) => period.every(year => Number.isFinite(official[assetId]?.EUR?.annualReturns[year]))
const worldOfficial = officialFor('msciWorld', years)
assert.deepEqual(engine.getPerformanceCurrencies(item), ['EUR', 'USD'])
assert.deepEqual(engine.getPerformanceEntries({ ...item, currency: 'USD' })[0], native)
assert.deepEqual(eur.returns.map(row => row.year), years)
if (worldOfficial) {
  assert.equal(eur.asset.currencyMethod, 'official')
  assert.deepEqual(eur.returns.map(row => row.pct), years.map(year => official.msciWorld.EUR.annualReturns[year]))
  assert.ok(Math.abs(compound(eur.returns) - years.reduce((n, year) => n * (1 + official.msciWorld.EUR.annualReturns[year] / 100), 1)) < 1e-12)
} else {
  assert.notEqual(eur.asset.currencyMethod, 'official')
  assert.ok(Math.abs(compound(eur.returns) - compound(native.returns) * usdPerEur(2015) / usdPerEur(LAST)) < 1e-12)
}
for (const assetId of ['msciEmerging']) {
  const [entry] = engine.getPerformanceEntries({ assetId, year: 2016, currency: 'EUR' })
  const period = entry.returns.map(row => row.year)
  if (officialFor(assetId, period)) {
    assert.equal(entry.asset.currencyMethod, 'official')
    assert.equal(entry.returns.at(-1).pct, official[assetId].EUR.annualReturns[period.at(-1)])
  } else assert.notEqual(entry.asset.currencyMethod, 'official')
}
// Unregistered series still use BCE, without altering their return convention.
const [fallback] = engine.getPerformanceEntries({ assetId: 'sp500', year: 2016, currency: 'EUR' })
const [fallbackNative] = engine.getPerformanceEntries({ assetId: 'sp500', year: 2016 })
const fallbackLast = fallbackNative.returns.at(-1).year
assert.ok(Math.abs(compound(fallback.returns) - compound(fallbackNative.returns) * usdPerEur(2015) / usdPerEur(fallbackLast)) < 1e-12)
const roundtrip = convertPerformanceEntries([fallback], 'USD')[0]
assert.ok(Math.abs(compound(roundtrip.returns) - compound(fallbackNative.returns)) < 1e-12)
const tweet = engine.buildPerformanceDepuisText({ ...item, currency: 'EUR' })
assert.ok(tweet.includes(`de début 2016 à fin ${LAST}`), tweet)
assert.match(tweet, /Gross Return · EUR · dividendes bruts réinvestis/)
if (worldOfficial) {
  assert.match(tweet, /série officielle, sans couverture de change/)
  assert.doesNotMatch(tweet, /conversion BCE/)
  assert.ok(tweet.includes(`${LAST} : ${formatPerformancePct(official.msciWorld.EUR.annualReturns[LAST])}`), tweet)
} else assert.match(tweet, /conversion BCE, sans couverture de change/)
assert.equal(eur.asset.currency, 'EUR')
assert.equal(native.asset.currency, 'USD')
const missing = calendarYears[2018]
try {
  delete calendarYears[2018]
  // The official series bridges the BCE gap only while it covers the whole period.
  assert.deepEqual(engine.getPerformanceCurrencies(item), worldOfficial ? ['EUR', 'USD'] : ['USD'])
  assert.throws(() => engine.getPerformanceEntries({ assetId: 'sp500', year: 2016, currency: 'EUR' }), /change incomplet/)
} finally { calendarYears[2018] = missing }
// No mixing of official/BCE years within one history if official coverage is incomplete.
const saved = official.msciWorld.EUR.annualReturns[2018]
try {
  delete official.msciWorld.EUR.annualReturns[2018]
  const [entry] = engine.getPerformanceEntries({ ...item, currency: 'EUR' })
  assert.notEqual(entry.asset.currencyMethod, 'official')
  assert.ok(Math.abs(compound(entry.returns) - compound(native.returns) * usdPerEur(2015) / usdPerEur(LAST)) < 1e-12)
} finally { official.msciWorld.EUR.annualReturns[2018] = saved }
const [yen] = convertPerformanceEntries([{asset:{currency:'JPY'},returns:[{year:2025,pct:10}]}], 'EUR')
assert.ok(Math.abs(yen.returns[0].pct - ((1.1 * calendarYears[2024].rates.JPY / calendarYears[2025].rates.JPY - 1) * 100)) < 1e-12)
assert.throws(() => convertPerformanceEntries([{asset:{currency:'ZZZ'},returns:[{year:2025,pct:10}]}], 'EUR'), /change incomplet/)
// Real exact-share calendar: the collector checks Total return (JPY), distinct
// from the ETF's EUR quote. Reuse the existing ECB conversion exactly once.
const nikkei={assetId:'annual-LU2196470426',year:2025}
const [nikkeiNative]=engine.getPerformanceEntries(nikkei)
assert.equal(nikkeiNative.asset.currency,'JPY')
assert.equal(nikkeiNative.returns[0].pct,28.24)
assert.deepEqual(engine.getPerformanceCurrencies(nikkei),['EUR','USD'])
for(const target of ['EUR','USD']){
 const [converted]=engine.getPerformanceEntries({...nikkei,currency:target})
 const expected=((1+28.24/100)*calendarRate(2024,'JPY')/calendarRate(2025,'JPY')*calendarRate(2025,target)/calendarRate(2024,target)-1)*100
 assert(Math.abs(converted.returns[0].pct-expected)<1e-10)
 assert.equal(converted.asset.sourceCurrency,'JPY')
 assert.equal(converted.asset.currency,target)
 assert(engine.buildPerformanceDepuisText({...nikkei,currency:target}).includes(formatPerformancePct(expected)))
}
const missingYen=calendarYears[2024].rates.JPY
try{
 delete calendarYears[2024].rates.JPY
 assert.throws(()=>engine.getPerformanceEntries({...nikkei,currency:'EUR'}),/change incomplet/)
 assert.equal(engine.getPerformanceEntries(nikkei)[0].returns[0].pct,28.24,'Native year remains independently valid')
}finally{calendarYears[2024].rates.JPY=missingYen}
const nikkeiPair=engine.getPerformanceEntries({mode:'comparatif',assetIdA:nikkei.assetId,assetIdB:'annual-GB00B15KXQ89',year:2025,currency:'EUR'})
assert.equal(nikkeiPair.length,2)
assert(nikkeiPair.every(e=>e.asset.currency==='EUR'&&e.returns.length>=1&&e.returns[0].year===2025))
const pair = engine.getPerformanceEntries({ mode: 'comparatif', assetIdA: 'msciWorld', assetIdB: 'sp500', year: 2016, currency: 'USD' })
assert.equal(pair.length, 2)
assert.ok(pair.every(entry => entry.asset.currency === 'USD'))
assert.deepEqual(pair[0].returns.map(r => r.year), pair[1].returns.map(r => r.year))
assert.equal(formatPerformancePct(0.03693), '+0,04 %')
assert.equal(formatPerformancePct(-0.03693), '−0,04 %')
assert.equal(formatPerformancePct(0), '+0,0 %')
assert.match(engine.buildPerformanceDepuisText({assetId:'nasdaq100',year:2017}), /2018 : \+0,04 %/)
console.log('Performance currencies: identity, inverse, cumulative FX, missing data, shared comparison, labels and rounding OK')
