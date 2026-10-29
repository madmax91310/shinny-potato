import assert from 'node:assert/strict'
import { ALL_WEATHER_PRESETS, buildAllWeatherPortfolio } from '../src/pages/portfolio-generator/allWeather.js'
import { buildManualPortfolio, renderTweetText, getReplacementCandidates } from '../src/pages/portfolio-generator/engine.js'
import { assetReturn, annualizedReturn, performanceYears, computeYearlyPerf } from '../src/pages/portfolio-generator/performance.js'

const snapshots = JSON.stringify(ALL_WEATHER_PRESETS)
const portfolios = ALL_WEATHER_PRESETS.map(preset => {
  const p = buildAllWeatherPortfolio(preset.id)
  assert.equal(p.mode, 'preset')
  assert.equal(p.selection.reduce((sum, row) => sum + row.pct, 0), 100)
  assert.ok(p.selection.every(row => row.isin && Number.isFinite(row.pct) && row.pct > 0))
  assert.equal(new Set(p.selection.map(row => row.id)).size, p.selection.length)
  assert.equal(p.selection.find(row => row.id === 'or').pct, 7.5)
  assert.equal(p.selection.find(row => row.id === 'mp_large').pct, 7.5)
  assert.equal(p.selection.find(row => row.id === 'msci_world_ishares').pct, 30)
  assert.ok(Number.isFinite(annualizedReturn(p.perf)))
  assert.ok(performanceYears(p.perf).length >= 3)
  for (const year of performanceYears(p.perf)) {
    const expected = p.selection.reduce((sum, row) => sum + row.pct / 100 * assetReturn(row, year), 0)
    assert.ok(Math.abs(p.perf[year] - expected) < 1e-10)
  }
  assert.deepEqual(getReplacementCandidates(p, p.selection[0].id), [])
  const text = renderTweetText(p)
  assert.ok(text.includes(preset.label) && text.includes(preset.thesis))
  assert.ok(text.includes('EUR') && text.includes('Pas un conseil.'))
  const edited = buildManualPortfolio(p.selection.map(({ id, pct }) => ({ id, pct })), 'generaliste', [p])
  assert.deepEqual(edited.perf, p.perf)
  assert.equal(edited.strategyLabel, undefined)
  const same = buildAllWeatherPortfolio(preset.id, [p])
  assert.deepEqual(same.selection, p.selection)
  assert.deepEqual(computeYearlyPerf([...p.selection].reverse()), p.perf)
  return p
})
assert.equal(new Set(portfolios.map(p => p.sig)).size, 3)
assert.equal(JSON.stringify(ALL_WEATHER_PRESETS), snapshots)
assert.throws(() => buildAllWeatherPortfolio('missing'), /inconnue/)
console.log('All Weather : 3 allocations distinctes, poids fixes et décimaux, calcul EUR, texte et édition validés.')
