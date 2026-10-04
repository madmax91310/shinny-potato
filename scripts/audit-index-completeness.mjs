import assert from 'node:assert/strict'
import { FAMILIES } from '../src/data/index-comparisons.js'
import { getIndexComparisonPerformance } from '../src/data/index-comparison-performance.js'
import { completeIndexAllocation, getIndexComparisonComposition, summarizeIndexAllocation } from '../src/data/index-comparison-composition.js'
import { buildTweetText } from '../src/pages/index-comparator/lib.js'
const seen = new Set(), gaps = []
for (const family of FAMILIES) {
  const rows = getIndexComparisonPerformance(family), tweet = buildTweetText(family)
  for (const [i, index] of family.indices.entries()) {
    const perf = rows[i]
    for (const y of [2023, 2024, 2025]) assert(Number.isFinite(perf[`y${y}`]), `${family.id}/${index.name}: ${y} absent`)
    assert(perf.currency && perf.source.url && perf.method, `${index.name}: base de rendement absente`)
    const facts = index.indexFacts
    if (!facts || seen.has(facts.index)) continue
    seen.add(facts.index)
    const composition = getIndexComparisonComposition(index)
    const missing = ['countries', 'sectors'].filter(field => !composition?.[field]?.length)
    if (missing.length) {
      gaps.push(`${facts.index}: ${missing.join(', ')}`)
      // Lacune explicite, jamais remplacée par la variante Screened ni par le portefeuille SPYW.
      assert.equal(facts.index, 'S&P Euro Dividend Aristocrats')
      assert(tweet.includes('non documentée'))
      continue
    }
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
console.log(`${FAMILIES.length} familles ; ${seen.size - gaps.length}/${seen.size} indices avec pays, secteurs, date et comptage ; 2023–2025 complets pour chaque indice/actif.`)
for (const gap of gaps) console.warn(`À sourcer : ${gap}`)
if (process.argv.includes('--strict') && gaps.length) process.exitCode = 1
