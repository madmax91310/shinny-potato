import assert from 'node:assert/strict'
import { FAMILIES } from '../src/data/index-comparisons.js'
import { getIndexComparisonPerformance } from '../src/data/index-comparison-performance.js'
import { completeIndexAllocation, getIndexComparisonComposition, summarizeIndexAllocation } from '../src/data/index-comparison-composition.js'
import { buildTweetText } from '../src/pages/index-comparator/lib.js'
const seen = new Set()
for (const family of FAMILIES) {
  const rows = getIndexComparisonPerformance(family), tweet = buildTweetText(family)
  for (const [i, index] of family.indices.entries()) {
    const perf = rows[i]
    assert.equal(perf.years.length, 3)
    for (const y of perf.years) assert(Number.isFinite(perf[`y${y}`]), `${family.id}/${index.name}: ${y} absent`)
    assert(perf.currency && perf.source.url && perf.method, `${index.name}: base de rendement absente`)
    const facts = index.indexFacts
    if (!facts || seen.has(facts.index)) continue
    seen.add(facts.index)
    const composition = getIndexComparisonComposition(index)
    const missing = ['countries', 'sectors'].filter(field => !composition?.[field]?.length)
    assert.equal(missing.length, 0, `${facts.index}: ${missing.join(', ')} non documentés`)
    assert(facts.asOf && Number.isInteger(facts.constituents) && facts.constituents > 0)
    for (const field of ['countries', 'sectors']) {
      assert(facts[field].every(([label, value]) => label && Number.isFinite(value) && value >= 0 && value <= 100))
      const sum = facts[field].reduce((s, [, v]) => s + v, 0)
      assert(sum <= 100.6 && sum > 50, `${facts.index}/${field}: total invalide ${sum}`)
      const summarySum = composition[field].reduce((s, [, v]) => s + v, 0)
      assert(Math.abs(summarySum - 100) < 0.06)
    }
    assert(tweet.includes(facts.asOf.split('-').reverse().join('/')))
  }
}
assert.deepEqual(summarizeIndexAllocation([['Autres', 40], ['France', 20], ['USA', 30], ['Japon', 10]]), [['USA', 30], ['France', 20], ['Japon', 10], ['Autres', 40]])
assert.deepEqual(summarizeIndexAllocation([['USA', 100]]), [['USA', 100]])
assert.deepEqual(summarizeIndexAllocation(undefined), [])
assert.deepEqual(completeIndexAllocation([['Finance', 40], ['Industrie', 30]], 'Autres secteurs'), [['Finance', 40], ['Industrie', 30], ['Autres secteurs', 30]])
const euro = FAMILIES.find(f => f.id === 'dividendes-pea').indices[1]
assert.equal(euro.indexFacts.index, 'S&P Euro High Yield Dividend Aristocrats')
assert(euro.indexFacts.constituents > 0)
assert(euro.indexFacts.asOf >= '2026-09-30')
assert(euro.indexFacts.countries.length > 0 && euro.indexFacts.sectors.length > 0)
assert(euro.indexFacts.source.url.includes('indexId=5475610'))
const euroComposition = getIndexComparisonComposition(euro)
for (const field of ['countries', 'sectors']) {
  assert.deepEqual(euroComposition[field], summarizeIndexAllocation(euro.indexFacts[field], 3, field === 'countries' ? 'Autres pays' : 'Autres secteurs'))
}
assert.equal(seen.size, 40)
console.log(`${FAMILIES.length} familles ; ${seen.size}/${seen.size} indices avec pays, secteurs, date et comptage ; trois années communes complètes pour chaque indice/actif.`)
