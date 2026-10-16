import assert from 'node:assert/strict'
import { MODEL_FAMILIES, MODEL_ASSET_ROLES, getModelFamily, buildModelPortfolio } from '../src/pages/portfolio-generator/modelPortfolios.js'
import { buildManualPortfolio, renderTweetText, getReplacementCandidates } from '../src/pages/portfolio-generator/engine.js'
import { annualizedReturn, performanceYears, assetReturn } from '../src/pages/portfolio-generator/performance.js'

const before = JSON.stringify(MODEL_FAMILIES), signatures = new Set()
for (const family of MODEL_FAMILIES) {
  assert.ok(family.explanation.length > 80 && family.adaptation.length > 60)
  for (const preset of family.presets) {
    const p = buildModelPortfolio(family.id, preset.id)
    signatures.add(p.sig)
    assert.equal(p.mode, 'preset')
    assert.equal(p.familyId, family.id)
    assert.equal(p.selection.reduce((sum, row) => sum + row.pct, 0), 100)
    assert.equal(new Set(p.selection.map(row => row.id)).size, p.selection.length)
    assert.ok(p.selection.every(row => row.isin && row.pct > 0 && MODEL_ASSET_ROLES[row.id]))
    assert.ok(performanceYears(p.perf).length >= 3 && Number.isFinite(annualizedReturn(p.perf)))
    for (const year of performanceYears(p.perf)) {
      const expected = p.selection.reduce((sum, row) => sum + assetReturn(row, year) * row.pct / 100, 0)
      assert.ok(Math.abs(expected - p.perf[year]) < 1e-10)
    }
    const text = renderTweetText(p)
    assert.ok(text.includes(`${family.emoji} ${preset.label}`))
    assert.ok(text.includes(preset.thesis), 'The explanation must be present in the copied post')
    assert.deepEqual(getReplacementCandidates(p, p.selection[0].id), [])
    const manual = buildManualPortfolio(p.selection, 'generaliste', [p])
    assert.deepEqual(manual.perf, p.perf)
    assert.equal(manual.strategyLabel, undefined, 'Edited portfolios must not retain an official model label')
    assert.deepEqual(buildModelPortfolio(family.id, preset.id, [p]).selection, p.selection)
  }
}
assert.equal(signatures.size, 8)
assert.equal(JSON.stringify(MODEL_FAMILIES), before)
const permanent = buildModelPortfolio('permanent', 'euro')
assert.deepEqual(permanent.selection.map(row => row.pct), [25,25,25,25])
assert.ok(permanent.selection.some(row => row.id === 'monetaire_xeon'))
const golden = buildModelPortfolio('golden-butterfly', 'euro-bonds')
assert.deepEqual(golden.selection.map(row => row.pct), [20,20,20,20,20])
assert.ok(golden.selection.some(row => row.id === 'small-value-usa'))
for (const equity of [40,60,80]) {
  const p = buildModelPortfolio('stock-bond', `${equity}-${100-equity}`)
  assert.deepEqual(p.selection.map(row => row.pct), [equity,100-equity])
}
assert.throws(() => getModelFamily('missing'), /inconnue/)
assert.throws(() => buildModelPortfolio('permanent', '60-40'), /inconnue/)
console.log('Modèles : 4 familles, 8 allocations, explications publiées, calcul EUR et édition validés.')
