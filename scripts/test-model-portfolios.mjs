import assert from 'node:assert/strict'
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js'
import market from '../src/data/monthly-duel-returns.json' with { type: 'json' }
import fx from '../src/data/monthly-fx.json' with { type: 'json' }
import { getAsset } from '../src/data/portfolio-assets.js'
import { SIMULATION_PROXIES } from '../src/data/simulation-proxies.js'
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
assert.equal(signatures.size, 10)
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
console.log('Modèles : 6 familles, 10 allocations, explications publiées, calcul EUR et édition validés.')

// Pin identities and sleeve weights, not refreshed market values or observation dates.
const referenceSupports = {
  ivy: [['IE00B5BMR087',20],['IE00B4K48X80',10],['IE00B4L5YX21',6],['IE00B52MJY50',4],['IE00B4WXJG34',20],['IE00B1FZS350',20],['IE00BD6FTQ80',20]],
  swensen: [['IE00B5BMR087',30],['IE00B4K48X80',7.5],['IE00B4L5YX21',4.5],['IE00B52MJY50',3],['IE00B469F816',5],['IE00B1FZS350',20],['IE00B4WXJG34',15],['IE00B0M62X26',15]],
}
for (const [id, expectedSupports] of Object.entries(referenceSupports)) {
  const family = getModelFamily(id), p = buildModelPortfolio(id, 'euro-regions')
  assert.deepEqual(p.selection.map(a => [a.isin, a.pct]), expectedSupports)
  assert.equal(family.reference.reduce((sum, row) => sum + row.pct, 0), 100)
  assert.ok(family.sources.every(s => new URL(s.url).protocol === 'https:'))
  assert.match(family.adaptation, /50\/30\/20/)
  assert.match(family.performanceNote, /cours de marché ajustés/)
  assert.ok(p.selection.every(a => !SIMULATION_PROXIES[a.isin]), 'No pre-inception index backfill in new models')
  // Recalculate from the source registries and raw December fixings, independently
  // of assetReturn/computeYearlyPerf. Market prices remain distinct from NAV.
  let capital = 1
  for (const year of performanceYears(p.perf)) {
    let expected = 0
    for (const a of p.selection) {
      const source = a.isin === 'IE00B52MJY50' ? market[a.isin] : getInstrumentAnnualPerformance(a.isin)
      assert.ok(source.source && source.checkedAt)
      assert.equal(source.basis, a.isin === 'IE00B52MJY50' ? 'market-price' : 'fund')
      assert.match(source.method, /réinvest|reinvest|ajustés/)
      const native = source.years[year]
      assert.ok(Number.isFinite(native))
      assert.ok(['EUR', 'USD'].includes(source.currency))
      const eur = source.currency === 'EUR' ? native
        : ((1 + native / 100) * fx.months[`${year - 1}-12`].rates.USD / fx.months[`${year}-12`].rates.USD - 1) * 100
      expected += a.pct * eur / 100
    }
    assert.ok(Math.abs(expected - p.perf[year]) < 1e-10, `${id}/${year}: source and FX reconciliation`)
    capital *= 1 + expected / 100
  }
  assert.ok(Math.abs((capital ** (1 / performanceYears(p.perf).length) - 1) * 100 - annualizedReturn(p.perf)) < 1e-10)
  // Removing one sleeve's history must not manufacture a model performance.
  const asset = getAsset(p.selection[0].id), original = asset.calendarReturns
  try {
    asset.calendarReturns = {}
    assert.throws(() => buildModelPortfolio(id, 'euro-regions'), /Historique commun insuffisant/)
  } finally { asset.calendarReturns = original }
}
assert.deepEqual(getModelFamily('ivy').reference.map(r => r.pct), [20,20,20,20,20])
assert.deepEqual(getModelFamily('swensen').reference.map(r => r.pct), [30,15,5,20,15,15])
console.log('Ivy et Swensen : identités exactes, sources NAV/cours distinctes, absence de proxy, fixings BCE et capitalisation indépendante validés.')
