import assert from 'node:assert/strict'
import { CATEGORIES, RANKING_ASSETS, buildRankingAssets } from '../src/pages/performance-rankings/data.js'
import { buildRanking, buildTweet, commonCoverage, monthAt, monthIndex, periodReturn, rankRows, rollingRegularity } from '../src/pages/performance-rankings/engine.js'

const make = (id, rate = .01, start = '2019-12', count = 85) => ({ id, label: id, currency: 'EUR', basis: 'adjusted', points: Array.from({ length: count }, (_, i) => ({ date: monthAt(monthIndex(start) + i), price: 100 * (1 + rate) ** i })) })
const a = make('a'), b = make('b', -.005)
assert(Math.abs(periodReturn(a, '2019-12', '2020-12') - ((1.01 ** 12 - 1) * 100)) < 1e-10)
assert(Math.abs(periodReturn(a, '2019-12', '2022-12', true) - ((1.01 ** 12 - 1) * 100)) < 1e-10)
const coverage = commonCoverage([a, b]); assert.deepEqual(coverage.years, [2020, 2021, 2022, 2023, 2024, 2025, 2026])
const partial = make('partial', .01, '2020-01', 24)
assert.deepEqual(commonCoverage([a, partial]).years, [2021])
assert.throws(() => buildRanking([a, partial], { mode: 'year', startYear: 2020 }), /entièrement couvertes/)
assert.throws(() => commonCoverage([a, { ...b, currency: 'USD' }]), /même devise/)
assert.throws(() => commonCoverage([a, { ...b, basis: 'index-net' }]), /conventions/)
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

for (const category of CATEGORIES) {
  assert(category.ids.length >= 2 && category.ids.length <= 6)
  const assets = category.ids.map(id => { assert(RANKING_ASSETS[id], id); return RANKING_ASSETS[id] })
  const c = commonCoverage(assets)
  for (const year of c.years) {
    const result = buildRanking(assets, { mode: 'year', startYear: year })
    assert.equal(result.columns[0].rows.length, assets.length)
    for (const row of result.columns[0].rows) {
      const asset = RANKING_ASSETS[row.id]
      const dec = asset.points.find(p => p.date === `${year}-12`).price
      const prev = asset.points.find(p => p.date === `${year - 1}-12`).price
      assert(Math.abs(row.value - (dec / prev - 1) * 100) < 1e-10)
    }
  }
  for (const mode of ['years', 'period']) {
    const result = buildRanking(assets, { mode, startYear: c.years.at(-6) ?? c.years[0], endYear: c.years.at(-1), start: c.start, end: c.end })
    const text = buildTweet(result, category.label, rollingRegularity(assets, 60))
    assert(!/undefined|NaN|Infinity/.test(text), text)
    assert(text.includes(c.currency))
  }
}
// A newly refreshed month automatically extends selectable dates and rolling windows.
const next = [a, b].map(s => ({ ...s, points: [...s.points, { date: '2027-01', price: s.points.at(-1).price * 1.02 }] }))
assert.equal(commonCoverage(next).end, '2027-01')
assert.equal(rollingRegularity(next, 60).count, 26)
assert.equal(buildRanking(next, { mode: 'period', start: '2026-12', end: '2027-01' }).columns[0].rows[0].rank, 1)
console.log(`${CATEGORIES.length} categories: all complete calendar years, custom returns, annualization, shared boundaries, currency/basis validation, ties, rolling counts and automatic month propagation passed.`)
