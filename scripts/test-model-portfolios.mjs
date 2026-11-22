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
    assert.ok(text.startsWith(family.emoji))
    assert.ok(text.includes('Et voici ce que ce type de portefeuille aurait donné'))
    assert.ok(text.endsWith('Pas un conseil financier.'))
    assert.equal(text.split('\n').filter(line => /^\S+ \d+(?:,\d+)? % /.test(line)).length, p.selection.length)
    if (family.id === 'all-weather' && preset.id === 'euro') {
      assert.match(text, /Voici un exemple de portefeuille All Weather avec des obligations en euros/)
      assert.match(text, /7,5 % Invesco Bloomberg Commodity\nUn panier de matières premières/)
      assert.match(text, /En 2022|en 2022/)
    }
    assert.deepEqual(getReplacementCandidates(p, p.selection[0].id), [])
    const manual = buildManualPortfolio(p.selection, 'generaliste', [p])
    assert.deepEqual(manual.perf, p.perf)
    assert.equal(manual.strategyLabel, undefined, 'Edited portfolios must not retain an official model label')
    assert.deepEqual(buildModelPortfolio(family.id, preset.id, [p]).selection, p.selection)
  }
}
assert.equal(signatures.size, MODEL_FAMILIES.reduce((count, family) => count + family.presets.length, 0))
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
console.log(`Modèles : ${MODEL_FAMILIES.length} familles, ${signatures.size} allocations, calcul EUR et édition validés.`)

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


const newModels = [
  ['larry', 'euro', [['IE00B4WXJG34',70],['IE00BSPLC298',15],['IE00BSPLC413',8],['IE00B469F816',7]]],
  ['merriman', 'ucits', [['IE00B5BMR087',25],['IE00BD1F4M44',25],['IE00BJ38QD84',25],['IE00BSPLC413',25]]],
  ['pinwheel', 'euro', [['IE00B4K48X80',15],['IE00B5BMR087',15],['IE00BSPLC298',10],['IE00B469F816',10],['IE00B4WXJG34',15],['LU0290358497',10],['IE00B1FZSF77',15],['IE00B579F325',10]]],
]
for (const [id, preset, expectedSupports] of newModels) {
  const family = getModelFamily(id)
  const portfolio = buildModelPortfolio(id, preset)
  assert.deepEqual(portfolio.selection.map(row => [row.isin, row.pct]), expectedSupports)
  assert.deepEqual(family.reference.map(row => row.pct), expectedSupports.map(([, weight]) => weight))
  assert.ok(portfolio.selection.every(row => !SIMULATION_PROXIES[row.isin]))
  assert.ok(renderTweetText(portfolio).includes(family.label.split(' · ')[0]))
}
const pinwheel = buildModelPortfolio('pinwheel', 'euro')
const property = pinwheel.selection.find(row => row.isin === 'IE00B1FZSF77')
const propertySource = getInstrumentAnnualPerformance(property.isin)
assert.equal(propertySource.basis, 'fund')
assert.equal(propertySource.currency, 'USD')
assert.match(propertySource.source, /ishares/)
for (const year of performanceYears(pinwheel.perf)) {
  const native = getAsset(property.id).calendarReturns[year]
  const expected = ((1 + native / 100) * fx.months[`${year - 1}-12`].rates.USD / fx.months[`${year}-12`].rates.USD - 1) * 100
  assert.ok(Math.abs(expected - assetReturn(property, year)) < 1e-10)
}
console.log('Larry, Merriman et Pinwheel : allocations, supports et conversion de la poche immobilière validés.')
