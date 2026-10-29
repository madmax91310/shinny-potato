import FX from '../src/data/monthly-fx.json' with { type: 'json' }
import { convertAsset, buildPortfolio } from '../src/pages/performance-rankings/series.js'
import { ALL_CATEGORIES, ANNUAL_ASSETS, ANNUAL_CATEGORIES } from '../src/pages/performance-rankings/data.js'
import assert from 'node:assert/strict'
import { isStock } from '../src/lib/is-stock.js'
import { CATEGORIES, EXPOSURE_CATEGORIES, ANNUAL_PEA_CATEGORIES, RANKING_ASSETS, buildRankingAssets, derivedGroup } from '../src/pages/performance-rankings/data.js'
import { lastCompleteYear } from '../src/data/annual-window.js'
import {qualifyHistoryWindow}from '../src/data/history-window-quality.js'
import { ETFS } from '../src/data/etf-cards.js'
import { annualColumns, buildRanking, buildTweet, commonCoverage, monthAt, monthIndex, periodReturn, publicationRanking, rankRows, rollingRegularity } from '../src/pages/performance-rankings/engine.js'

const make = (id, rate = .01, start = '2019-12', count = 85) => ({ id, label: id, currency: 'EUR', basis: 'adjusted', points: Array.from({ length: count }, (_, i) => ({ date: monthAt(monthIndex(start) + i), price: 100 * (1 + rate) ** i })) })
const a = make('a'), b = make('b', -.005)
assert(Math.abs(periodReturn(a, '2019-12', '2020-12') - ((1.01 ** 12 - 1) * 100)) < 1e-10)
assert(Math.abs(periodReturn(a, '2019-12', '2022-12', true) - ((1.01 ** 12 - 1) * 100)) < 1e-10)
const coverage = commonCoverage([a, b]); assert.deepEqual(coverage.years, [2020, 2021, 2022, 2023, 2024, 2025, 2026])
const partial = make('partial', .01, '2020-01', 24)
assert.deepEqual(commonCoverage([a, partial]).years, [2021])
assert.throws(() => buildRanking([a, partial], { mode: 'year', startYear: 2020 }), /entièrement couvertes/)
assert.throws(() => commonCoverage([a, { ...b, currency: 'USD' }]), /même devise/)
assert.throws(() => commonCoverage([{ ...a, basis: 'index-gross' }, { ...b, basis: 'index-net' }]), /conventions/)
assert.throws(() => commonCoverage([a, a]), /une seule fois/)
assert.throws(() => commonCoverage([a, { ...b, points: b.points.filter((_, i) => i !== 2) }]), /discontinu/)
assert.throws(() => commonCoverage([a, { ...b, points: [{ date: '2019-12', price: 0 }] }]), /invalide/)
assert.throws(() => buildRanking([a, b], { mode: 'period', start: '2019-11', end: '2020-12' }), /dépasse/)
assert.throws(() => buildRanking([a, b], { mode: 'period', start: '2020-12', end: '2020-12' }), /doit suivre/)
const ranked = rankRows([{ id: 'a', value: 5, order: 0 }, { id: 'b', value: 5, order: 1 }, { id: 'c', value: 3, order: 2 }])
assert.deepEqual(ranked.map(r => r.rank), [1, 1, 3])
assert.deepEqual(rollingRegularity([a, b], 60).stats.map(s => s.wins), [25, 0])
assert.equal(rollingRegularity([a, b], 60).count, 25)
assert.equal(rollingRegularity([make('x', .01, '2020-01', 61), make('y', .01, '2020-01', 61)], 60), null)
assert.deepEqual(rollingRegularity([a, { ...a, id: 'tie' }], 60).stats.map(s => s.wins), [25, 25])
assert.throws(() => rollingRegularity([a, b], 24), /Durée/)
assert(!buildRankingAssets({ mystery: { label: 'Unknown', points: a.points, currency: 'EUR' } }).mystery)

// A price month collected before its ECB rate shortens the converted period; an interior gap still fails.
{
  const fxMonths = Object.keys(FX.months).sort()
  const latest = fxMonths.at(-1)
  const chf = { ...make('chf', .01, fxMonths.at(-25), 26), currency: 'CHF' }
  assert.equal(chf.points.at(-1).date, monthAt(monthIndex(latest) + 1))
  const converted = convertAsset(chf, 'EUR', FX)
  assert.equal(converted.points.at(-1).date, latest)
  assert.equal(converted.points.length, 25)
  const gap = { ...FX, months: { ...FX.months } }
  delete gap.months[fxMonths.at(-5)]
  assert.throws(() => convertAsset(chf, 'EUR', gap), /Change BCE absent/)
}

for (const category of CATEGORIES) {
  assert(category.ids.length >= 2 && category.ids.length <= 6)
  const assets = category.ids.map(id => { assert(RANKING_ASSETS[id], id); return convertAsset(RANKING_ASSETS[id], category.currency, FX) })
  const c = commonCoverage(assets)
  for (const year of c.years) {
    const result = buildRanking(assets, { mode: 'year', startYear: year })
    assert.equal(result.columns[0].rows.length, assets.length)
    for (const row of result.columns[0].rows) {
      const asset = assets.find(a => a.id === row.id)
      const dec = asset.points.find(p => p.date === `${year}-12`).price
      const prev = asset.points.find(p => p.date === `${year - 1}-12`).price
      assert(Math.abs(row.value - (dec / prev - 1) * 100) < 1e-10)
    }
  }
  // Recent funds remain usable for their exact common period, before a full calendar year exists.
  for (const mode of c.years.length ? ['years', 'period'] : ['period']) {
    const options={ mode, startYear: c.years.at(-6) ?? c.years[0], endYear: c.years.at(-1), start: c.start, end: c.end }
    const missing=mode==='period'?assets.map(a=>qualifyHistoryWindow(a,c.start,c.end)).find(q=>!q.qualified):null
    if(missing){assert.throws(()=>buildRanking(assets,options),e=>e.message===missing.reason);continue}
    if(mode==='years'&&Array.from({length:options.endYear-options.startYear+1},(_,i)=>options.startYear+i).some(y=>!c.years.includes(y))){
      assert.throws(()=>buildRanking(assets,options),/entièrement couvertes/);continue
    }
    const result = buildRanking(assets, options)
    const text = buildTweet(result, category.label, rollingRegularity(assets, 60))
    assert(!/undefined|NaN|Infinity/.test(text), text)
    assert(text.includes('Le détail année par année dans l’image 👇'))
    assert(!text.includes('périodes glissantes'))
    assert(text.includes('💬 Tu es exposé à l’un d’entre eux ?'))
  }
}
// A newly refreshed month automatically extends selectable dates and rolling windows.
const next = [a, b].map(s => ({ ...s, points: [...s.points, { date: '2027-01', price: s.points.at(-1).price * 1.02 }] }))
assert.equal(commonCoverage(next).end, '2027-01')
assert.equal(rollingRegularity(next, 60).count, 26)
assert.equal(buildRanking(next, { mode: 'period', start: '2026-12', end: '2027-01' }).columns[0].rows[0].rank, 1)
console.log(`${CATEGORIES.length} categories: all complete calendar years, custom returns, annualization, shared boundaries, currency/basis validation, ties, rolling counts and automatic month propagation passed.`)

// Currency changes alter returns using the same month-end reference convention.
const toyFX = { sourceUrl: 'https://www.ecb.europa.eu/', months: {
  '2019-12': { rates: { EUR: 1, USD: 2 } }, '2020-01': { rates: { EUR: 1, USD: 4 } }, '2020-02': { rates: { EUR: 1, USD: 2 } },
} }
const toy = (id, prices) => ({ id, label: id, shortLabel: id, currency: 'EUR', basis: 'adjusted', points: prices.map((price, i) => ({ date: monthAt(monthIndex('2019-12') + i), price })) })
const flat = toy('flat', [100, 100, 100]), zig = toy('zig', [100, 200, 100])
assert.equal(periodReturn(convertAsset(flat, 'USD', toyFX), '2019-12', '2020-01'), 100)
assert.equal(periodReturn(convertAsset(flat, 'USD', toyFX), '2019-12', '2020-02'), 0)
assert.throws(() => convertAsset(flat, 'GBP', toyFX), /Change BCE absent/)
const definition = { id: 'p', label: '50/50', lines: [{ id: 'flat', pct: 50 }, { id: 'zig', pct: 50 }] }
const portfolio = rebalance => buildPortfolio({ ...definition, rebalance }, { flat, zig }, 'EUR', toyFX)
assert.equal(periodReturn(portfolio('none'), '2019-12', '2020-02'), 0)
assert.equal(periodReturn(portfolio('annual'), '2019-12', '2020-02'), 0)
assert(Math.abs(periodReturn(portfolio('monthly'), '2019-12', '2020-02') - 12.5) < 1e-10)
assert.throws(() => buildPortfolio({ ...definition, lines: [{ id: 'flat', pct: 99 }] }, { flat }, 'EUR', toyFX), /100 %/)
assert.throws(() => buildPortfolio({ ...definition, lines: [{ id: 'flat', pct: 50 }, { id: 'flat', pct: 50 }] }, { flat }, 'EUR', toyFX), /distincts/)
// Drift must carry through annual columns rather than resetting weights each January.
const slow = make('slow', 0, '2019-12', 25), fast = make('fast', .05, '2019-12', 25)
const drift = buildPortfolio({ ...definition, rebalance: 'none', lines: [{ id: 'slow', pct: 50 }, { id: 'fast', pct: 50 }] }, { slow, fast }, 'EUR', FX)
const reset = { ...drift, id: 'reset', portfolio: { ...drift.portfolio, rebalance: 'annual' } }
const grid = buildRanking([drift, reset], { mode: 'years', startYear: 2020, endYear: 2021 })
assert(grid.columns[1].rows.find(r => r.id === 'p').value > grid.columns[0].rows.find(r => r.id === 'p').value)
assert(Math.abs(grid.columns[1].rows.find(r => r.id === 'reset').value - grid.columns[0].rows.find(r => r.id === 'reset').value) < 1e-10)
const annual = { id: 'annual', label: 'NAV', currency: 'EUR', basis: 'fund-nav', frequency: 'annual', years: { 2020: 10, 2021: -10 } }
assert(Math.abs(periodReturn(annual, '2019-12', '2021-12') + 1) < 1e-10)
assert.throws(() => periodReturn(annual, '2020-01', '2021-12'), /décembre/)
assert.throws(() => periodReturn(annual, '2018-12', '2021-12'), /absente/)
assert.throws(() => commonCoverage([annual, flat]), /sélections distinctes/)
assert.equal(rollingRegularity([annual, { ...annual, id: 'other' }], 12), null)
for (const c of ANNUAL_CATEGORIES) {
  const members = c.ids.map(id => convertAsset(ANNUAL_ASSETS[id], c.currency, FX))
  const coverage = commonCoverage(members)
  for (const year of coverage.years) assert(buildRanking(members, { mode: 'year', startYear: year }).columns[0].rows.every(r => Number.isFinite(r.value)))
}
for (const id of ['world-net', 'msciAcwi', 'japan-net', 'msciEurope', 'msciUsa', 'msciWorld', 'apple', 'microsoft']) {
  assert.equal(RANKING_ASSETS[id].points[0].date, '2005-12')
  assert(commonCoverage([RANKING_ASSETS[id], { ...RANKING_ASSETS[id], id: 'copy' }]).years.includes(2006))
}
console.log('Annual NAV, ECB conversion, cross-asset conventions, portfolio weights, rebalancing and multi-year drift passed.')

assert.throws(() => periodReturn(RANKING_ASSETS.etfIE00B579F325, '2021-12', '2022-12'), /cours reportés/)
assert(Number.isFinite(periodReturn(RANKING_ASSETS.etfIE00B579F325, '2024-12', '2025-12')), 'Independent valid windows remain available')
for (const asset of Object.values(RANKING_ASSETS).filter(a => a.symbol === 'SGLD.L' || a.id === 'euroGov13')) {
  for (let i = 2; i < asset.points.length; i++) assert(!(asset.points[i].price === asset.points[i - 1].price && asset.points[i].price === asset.points[i - 2].price), asset.id)
}
const annualFX = { months: { '2019-12': { rates: { EUR: 1, USD: 2 } }, '2020-12': { rates: { EUR: 1, USD: 4 } } } }
const annualUSD = convertAsset({ ...annual, years: { 2020: 10 } }, 'USD', annualFX)
assert(Math.abs(annualUSD.years[2020] - 120) < 1e-10)

// The tweet compounds the exact full period, independently of the annual table.
const years = buildRanking([a, b], { mode: 'years', startYear: 2020, endYear: 2025 })
assert(publicationRanking(years).annualized)
assert(Math.abs(publicationRanking(years).rows[0].value - ((1.01 ** 12 - 1) * 100)) < 1e-10)
assert.match(buildTweet(years, 'Ma sélection'), /entre 2020 et 2025/)
assert.match(buildTweet(years, 'Ma sélection'), /🥇 a : .*%\/an/)
const oneYear = buildRanking([a, b], { mode: 'year', startYear: 2020 })
assert(!publicationRanking(oneYear).annualized)
assert(!buildTweet(oneYear, 'Ma sélection').includes('/an'))
assert.match(buildTweet(oneYear, 'Ma sélection'), /en 2020/)
const custom = buildRanking([a, b], { mode: 'period', start: '2020-05', end: '2022-08' })
const table = annualColumns(custom)
assert.deepEqual(table.map(c => [c.label, c.partial, c.start, c.end]), [
  ['2020', true, '2020-05', '2020-12'], ['2021', false, '2020-12', '2021-12'], ['2022', true, '2021-12', '2022-08']
])
assert(Math.abs(table.reduce((ratio, c) => ratio * (1 + c.rows.find(r => r.id === a.id).value / 100), 1) - (1 + periodReturn(a, custom.start, custom.end) / 100)) < 1e-10)
const tied = buildRanking([a, { ...a, id: 'tie' }], { mode: 'year', startYear: 2020 })
assert.equal(buildTweet(tied, 'Ma sélection').split('🥇').length - 1, 2)
const { rankingImageLayout } = await import('../src/pages/performance-rankings/image.js')
for (let assets = 2; assets <= 6; assets++) {
  for (let years = 1; years <= 10; years++) {
    const layout = rankingImageLayout(assets, years)
    assert.equal(layout.width, 1200)
    assert(layout.height >= 550 && layout.height <= 1230)
    assert(layout.cellWidth >= 160)
    assert.equal(layout.gridRows * layout.gridColumns, assets * years)
  }
}
assert.equal(rankingImageLayout(2, 3).transposed, true)
assert.equal(rankingImageLayout(3, 7).transposed, true)
assert.equal(rankingImageLayout(6, 5).transposed, true)
assert.equal(rankingImageLayout(3, 6).tableBottom + 28, rankingImageLayout(3, 6).height)
console.log('Publication: exact compound annualization, single-year returns, tied medals, partial boundaries and compact three-asset canvas passed.')

// A custom multi-year portfolio table keeps drifting weights from the selection start.
const driftCustom = buildRanking([drift, reset], { mode: 'period', start: '2019-12', end: '2021-12' })
const driftColumns = annualColumns(driftCustom)
assert(driftColumns[1].rows.find(r => r.id === 'p').value > driftColumns[0].rows.find(r => r.id === 'p').value)
const annualGrid = buildRanking([annual, { ...annual, id: 'copy' }], { mode: 'period', start: '2019-12', end: '2021-12' })
assert.equal(annualColumns(annualGrid).length, 2)
assert(Number.isFinite(publicationRanking(annualGrid).rows[0].value))

// Curated suggestions must remain publishable as data and FX coverage evolve.
const { BENCHMARK_CATEGORIES } = await import('../src/pages/performance-rankings/data.js')
const { markBenchmark, randomSuggestion, suggestionPool } = await import('../src/pages/performance-rankings/suggestions.js')
assert.deepEqual(CATEGORIES.find(c => c.id === 'luxury-stocks').ids, ['hermes', 'lvmh'])
for (const category of BENCHMARK_CATEGORIES) {
  const assets = markBenchmark(category.ids.map(id => convertAsset(RANKING_ASSETS[id], category.currency, FX)), category.benchmarkId)
  assert.equal(assets.filter(isStock).length, 5)
  assert.equal(assets.filter(a => a.benchmark && a.isin).length, 1)
  const coverage = commonCoverage(assets)
  const result = buildRanking(assets, { mode: 'years', startYear: coverage.years.at(-Math.min(5, coverage.years.length)), endYear: coverage.years.at(-1) })
  const tweet = buildTweet(result, category.label)
  assert.match(tweet, /^Parmi ces cinq actions, lesquelles ont battu l’ETF (MSCI World|S&P 500)/)
  assert.match(tweet, /\(réf\.\)/)
  assert.equal(publicationRanking(result).rows.length, 6)
  assert.equal(markBenchmark(assets.filter(a => !a.benchmark), category.benchmarkId).filter(a => a.benchmark).length, 0)
}
const pool = suggestionPool()
assert(pool.length > 10)
assert(!pool.some(s => ['bonds', 'lifestrategy', 'multi-asset', 'crypto', 'commodities'].includes(s.category.id)))
// Equity categories such as technology and small caps become eligible once three
// common calendar years are collected; the coverage assertions below govern them.
assert.equal(suggestionPool([{id:'world', ids:['not-collected', 'apple']}]).length, 0)
for (let i = 0; i < pool.length; i++) {
  for (const random of [0, .5, .999999]) {
    const proposal = randomSuggestion('world', (() => { let first = true; return () => { if (first) { first = false; return i / pool.length } return random } })(), pool)
    assert.notEqual(proposal.category.id, 'world')
    const assets = proposal.category.ids.map(id => convertAsset(RANKING_ASSETS[id], proposal.currency, FX))
    const coverage = commonCoverage(assets)
    assert(coverage.years.length >= 3)
    assert(proposal.dates.startYear >= coverage.years[0])
    assert(proposal.dates.endYear <= coverage.years.at(-1))
    assert([3, 5, 10].includes(proposal.dates.endYear - proposal.dates.startYear + 1))
    const result = buildRanking(assets, { ...proposal.dates, mode: proposal.mode })
    assert(!/undefined|NaN|Infinity/.test(buildTweet(result, proposal.category.label)))
  }
}
console.log(`${BENCHMARK_CATEGORIES.length} five-stock/fund selections and ${pool.length} coherent equity draws: common years, EUR conversion, reference labels and tweet hooks passed.`)

// Editing a reference keeps the five stocks and valid dates; saved comparisons
// retain only IDs/settings and are checked against current histories on restore.
const { BENCHMARK_OPTIONS } = await import('../src/pages/performance-rankings/data.js')
const { toggleAsset, replaceBenchmark } = await import('../src/pages/performance-rankings/selection.js')
const { FAVORITES_KEY, readFavorites, saveFavorite, deleteFavorite, validateFavoriteSelection } = await import('../src/pages/performance-rankings/favorites.js')
let selection = { ...BENCHMARK_CATEGORIES[0], categoryId: BENCHMARK_CATEGORIES[0].id, title: 'Mes cinq actions', bank: 'monthly', mode: 'years', dates: {start:'2017-12', end:'2025-12', startYear:2018, endYear:2025} }
for (const reference of BENCHMARK_OPTIONS) {
  const next = replaceBenchmark(selection, reference.id)
  assert.deepEqual(next.ids.slice(0,5), selection.ids.slice(0,5))
  const members = next.ids.map(id => convertAsset(RANKING_ASSETS[id], next.currency, FX))
  let previousWindowUsable = true
  try { buildRanking(members, {...selection.dates, mode: selection.mode}) } catch { previousWindowUsable = false }
  assert.equal(next.adjusted, !previousWindowUsable)
  if (previousWindowUsable) assert.deepEqual(next.dates, selection.dates)
  assert.doesNotThrow(() => buildRanking(members, {...next.dates, mode: next.mode}))
  assert.equal(next.ids[5], reference.id)
  selection = { ...selection, ...next }
  assert.equal(validateFavoriteSelection(selection).benchmarkId, reference.id)
}
const adjusted = replaceBenchmark({...selection, dates:{...selection.dates, startYear:1990}}, BENCHMARK_OPTIONS[0].id)
assert(adjusted.adjusted)
assert(adjusted.dates.startYear > 1990)
assert.throws(()=>replaceBenchmark(selection,'bitcoin'), /inconnu/)
assert.throws(()=>replaceBenchmark({...selection,ids:['apple','microsoft']},BENCHMARK_OPTIONS[0].id), /cinq actions/)
assert.deepEqual(toggleAsset(['apple'],'microsoft','original'), {ids:['apple','microsoft'],currency:'original'})
assert.equal(toggleAsset(['apple'],'lvmh','original').currency,'EUR')
assert.equal(toggleAsset(['apple','lvmh'],'apple','EUR').ids.length,1)
assert.throws(()=>toggleAsset(selection.ids,'tesla','EUR'), /Six actifs/)
assert.throws(()=>toggleAsset(['apple'],'missing','EUR'), /disponible/)
const memory = new Map()
const storage = {getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)}
assert.deepEqual(readFavorites(storage),[])
saveFavorite(storage,'Mon duel',selection,()=> 'favorite-1')
assert(!storage.getItem(FAVORITES_KEY).includes('points'))
assert.deepEqual(validateFavoriteSelection(readFavorites(storage)[0].selection).ids,selection.ids)
saveFavorite(storage,'Mon duel',{...selection,currency:'USD'},()=> 'unused')
assert.equal(readFavorites(storage).length,1)
assert.equal(readFavorites(storage)[0].selection.currency,'USD')
assert.equal(readFavorites(storage)[0].id,'favorite-1')
saveFavorite(storage,'Autre duel',selection,()=> 'favorite-2')
deleteFavorite(storage,'favorite-1')
assert.equal(readFavorites(storage)[0].id,'favorite-2')
assert.throws(()=>validateFavoriteSelection({...selection,ids:['apple','missing']}), /invalide/)
assert.throws(()=>validateFavoriteSelection({...selection,dates:{startYear:1990,endYear:1995}}), /couvertes/)
assert.throws(()=>validateFavoriteSelection({...selection,bank:'annual'}), /historique/)
const damaged = '{not-json'
storage.setItem(FAVORITES_KEY,damaged)
assert.throws(()=>saveFavorite(storage,'Ne pas écraser',selection))
assert.equal(storage.getItem(FAVORITES_KEY),damaged)
assert.throws(()=>saveFavorite({getItem:()=>null,setItem:()=>{throw Error('quota')}},'Quota',selection), /quota/)
console.log('Checkbox limits, mixed currencies, four replaceable ETF references, exact saved settings, updates, deletion and non-destructive storage failures passed.')

// Registry-derived universes: every ETF and ETC outside the editorial categories is filed under an
// exposure group, each group ranking holds two to six members with a common coverage, and the PEA
// calendars are selected by rule (EUR, PEA, three latest complete years) rather than by position.
for (const asset of Object.values(RANKING_ASSETS)) {
  if (asset.isin && !isStock(asset)) assert.notEqual(asset.group, 'Autres ETF et ETC', asset.id)
  assert.equal(derivedGroup({ instrumentType: 'EQUITY' }), 'Actions individuelles')
}
assert(EXPOSURE_CATEGORIES.length >= 5)
for (const category of EXPOSURE_CATEGORIES) {
  assert(category.derived && category.ids.length >= 2 && category.ids.length <= 6 && category.universe >= category.ids.length, category.id)
  const members = category.ids.map(id => { assert(RANKING_ASSETS[id], id); assert.equal(RANKING_ASSETS[id].group, category.group, id); return convertAsset(RANKING_ASSETS[id], 'EUR', FX) })
  assert(commonCoverage(members).years.length >= 1, `${category.id} : aucune année commune`)
  const starts = category.ids.map(id => RANKING_ASSETS[id].points[0].date)
  assert.deepEqual(starts, [...starts].sort(), `${category.id} : les historiques les plus longs d’abord`)
}
const recent = [2, 1, 0].map(offset => lastCompleteYear() - offset)
assert(ANNUAL_PEA_CATEGORIES.length >= 2)
// The annual projection must retain the common registry's three-state tax status.
// Unknown shares stay out of PEA selections without being labelled ineligible.
const annualPeaSelection = new Set(ANNUAL_PEA_CATEGORIES.flatMap(category => category.ids))
for (const record of Object.values(ANNUAL_ASSETS)) {
  const share = ETFS.find(asset => asset.isin === record.isin)
  if (!share) continue
  assert.equal(record.pea, share.pea ?? null, `${record.isin}: retain the exact PEA qualification`)
  if (share.pea == null) assert(!annualPeaSelection.has(record.id), `${record.isin}: unknown is not admitted to PEA`)
}
for (const category of ANNUAL_PEA_CATEGORIES) {
  assert(category.ids.length >= 2 && category.ids.length <= 6 && category.frequency === 'annual', category.id)
  for (const id of category.ids) {
    const record = ANNUAL_ASSETS[id]
    assert(record?.pea === true && record.currency === 'EUR', id)
    for (const year of recent) assert(Number.isFinite(record.years[year]), `${id} : année ${year} absente`)
  }
}
console.log(`${EXPOSURE_CATEGORIES.length} exposure universes and ${ANNUAL_PEA_CATEGORIES.length} PEA calendar universes derived from the registries.`)


// Every prepared comparison remains reachable through exactly one family.
const { comparisonFamily, comparisonTags, filterComparisons } = await import('../src/pages/performance-rankings/comparisonCatalog.js')
const catalogSources = { ...RANKING_ASSETS, ...ANNUAL_ASSETS }
for (const [id, family] of [['world', 'etfs'], ['fr-stocks', 'stocks'], ['us-stocks-benchmark', 'mixed'], ['multi-asset', 'general'], ['regions-indices', 'general'], ['commodities', 'general']]) {
  const category = ALL_CATEGORIES.find(c => c.id === id)
  assert.equal(comparisonFamily(category, catalogSources), family)
}
assert.equal(comparisonFamily({ids:['bitcoin','ethereum']}, catalogSources), 'general')
const france = filterComparisons(ALL_CATEGORIES, catalogSources, { family: 'stocks', tag: 'France', query: 'hermes' })
assert(france.some(c => c.id === 'fr-stocks'))
assert(!france.some(c => c.id === 'us-stocks'))
assert(filterComparisons(ALL_CATEGORIES, catalogSources, { family: 'etfs', query: 'IE00B4L5Y983' }).some(c => c.id === 'world'))
assert(comparisonTags(ALL_CATEGORIES.find(c => c.id === 'multi-asset'), catalogSources).includes('Obligations'))
assert.equal(['etfs', 'stocks', 'mixed', 'general'].flatMap(family => filterComparisons(ALL_CATEGORIES, catalogSources, { family })).length, ALL_CATEGORIES.length)
console.log('Comparison families, country/type filters and asset/ISIN search passed.')
