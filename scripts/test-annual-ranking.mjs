import assert from 'node:assert/strict'
import { annualColumns, buildRanking, buildTweet, commonCoverage, rankRows } from '../src/pages/performance-rankings/engine.js'
import { annualImagePercent, annualRankingColumns, annualRankingError, annualRankingLayout, contrastText } from '../src/pages/performance-rankings/annualRanking.js'
import { COLORS } from '../src/pages/performance-rankings/palette.js'

// Synthetic calendars only: financial refreshes must never change these expectations.
const make = (id, years, shortLabel = id) => ({ id, label: id, shortLabel, frequency: 'annual', currency: 'EUR', basis: 'fund-nav', years })
const assets = [make('a', { 2018: 10.001, 2019: -4 }), make('b', { 2018: 10.002, 2019: -4 }), make('c', { 2018: 10.001, 2019: 2 })]
const result = buildRanking(assets, { mode: 'years', startYear: 2018, endYear: 2019 })
const columns = annualRankingColumns(result)
assert.deepEqual(columns[0].rows.map(r => r.id), ['b', 'a', 'c'])
assert.deepEqual(columns[0].rows.map(r => r.rank), [1, 2, 2])
assert.deepEqual(columns[0].rows.map(r => r.tied), [false, true, true])
assert.deepEqual(columns[1].rows.map(r => r.id), ['c', 'a', 'b'])
assert.deepEqual(columns[1].rows.map(r => r.rank), [1, 2, 2])
assert.equal(annualImagePercent(10.001), annualImagePercent(10.002))
assert.deepEqual(rankRows([{ value: 1, order: 0 }, { value: 1 + 1e-10, order: 1 }]).map(r => r.rank), [1, 2])
for (const column of columns) for (const row of column.rows) {
  assert.equal(row.value, annualColumns(result).find(c => c.label === column.label).rows.find(r => r.id === row.id).value)
  assert.equal(row.color, COLORS[assets.findIndex(a => a.id === row.id)])
  assert.equal(contrastText(row.color), '#101c29')
}
assert.match(annualImagePercent(0), /^\+/)
assert.match(annualImagePercent(-2), /^−/)
assert.equal(contrastText('#000000'), '#ffffff')
assert.equal(contrastText('#ffffff'), '#101c29')
const before = JSON.stringify(result)
annualRankingColumns(result)
assert.equal(JSON.stringify(result), before)
assert.match(buildTweet(result, 'Ma sélection'), /%\/an/)
const missing = [assets[0], make('gap', { 2019: 1 })]
assert.deepEqual(commonCoverage(missing).years, [2019])
assert.throws(() => buildRanking(missing, { mode: 'years', startYear: 2018, endYear: 2019 }), /couvertes/)
assert.throws(() => commonCoverage([assets[0], { ...assets[1], currency: 'USD' }]), /même devise/)
assert.throws(() => annualRankingColumns({ ...result, columns: [{ ...result.columns[0], rows: result.columns[0].rows.slice(1) }, result.columns[1]] }), /absente/)
assert.throws(() => annualRankingColumns({ ...result, columns: [{ ...result.columns[0], partial: true }] }), /partielle/)
const manyYears = { ...result, columns: Array.from({ length: 8 }, (_, i) => ({ ...result.columns[0], label: String(2010 + i) })) }
assert.match(annualRankingError(manyYears), /maximum 7/)
assert.throws(() => annualRankingColumns(manyYears), /maximum 7/)
const duplicates = buildRanking([make('one', { 2018: 1, 2019: 1 }, 'Même nom'), make('two', { 2018: 2, 2019: 2 }, 'Même nom')], { mode: 'years', startYear: 2018, endYear: 2019 })
assert.deepEqual(annualRankingColumns(duplicates)[0].rows.map(r => r.label), ['two', 'one'])
for (let count = 2; count <= 6; count++) for (let years = 2; years <= 7; years++) {
  const l = annualRankingLayout(count, years)
  assert(l.cellWidth - l.gap >= 226)
  assert(l.height < 1300)
  assert(l.height - (l.tableY + l.headerHeight + count * l.rowHeight) <= 52)
}
assert.throws(() => annualRankingLayout(7, 2))
assert.throws(() => annualRankingLayout(2, 8))
console.log('Annual ranking: exact stable ties, precision, shared values, colours, missing data, currency, full years, names and 30 layouts passed.')


// A working selection never changes its source or reassigns surviving colours.
const { publicationDraft, selectionFilename, workingColors } = await import('../src/pages/performance-rankings/workingSelection.js')
const profile = Object.freeze({ ids: Object.freeze(['a', 'b', 'c']) })
const initialColors = workingColors(profile.ids)
const adjustedColors = workingColors(['b', 'c', 'd'], initialColors)
assert.deepEqual(profile.ids, ['a', 'b', 'c'])
assert.equal(adjustedColors.b, initialColors.b)
assert.equal(adjustedColors.c, initialColors.c)
assert.equal(new Set(Object.values(adjustedColors)).size, 3)
const coloured = { ...result, assets: result.assets.map(a => ({ ...a, rankingColor: adjustedColors[a.id] ?? initialColors[a.id] })) }
for (const column of annualRankingColumns(coloured)) for (const row of column.rows) assert.equal(row.color, coloured.assets.find(a => a.id === row.id).rankingColor)
const handEdited = 'Mes retouches\navec des espaces  et une fin\n'
assert.deepEqual(publicationDraft('nouveau', 'selection-2', { owner: 'selection-1', value: handEdited }), { text: handEdited, stale: true })
assert.deepEqual(publicationDraft('nouveau', 'selection-2', null), { text: 'nouveau', stale: false })
assert.equal(publicationDraft('identique', 'EUR', { owner: 'USD', value: handEdited }).stale, true)
assert.match(selectionFilename({ ...result, assets: [assets[1], assets[2]] }, 'annual'), /^classement-annual-b-c-EUR-/)
assert(!selectionFilename({ ...result, assets: [assets[1], assets[2]] }, 'annual').includes('annual-a-'))
assert.match(annualRankingError({ ...result, columns: [result.columns[0]] }), /au moins 2/)
const reference = { ...assets[0], benchmark: true, shortLabel: 'ETF Référence' }
assert.match(buildTweet({ ...result, assets: [reference, { ...assets[1], instrumentType: 'EQUITY' }, { ...assets[2], instrumentType: 'EQUITY' }] }, 'Ma sélection'), /ces deux actions/)
assert.match(buildTweet(result, 'Ma sélection'), /en EUR/)
assert(!buildTweet({ ...result, assets: [assets[1], assets[2]] }, 'Ma sélection').includes('ETF Référence'))
console.log('Temporary selections: source immutability, stable colours, exact drafts, stale snapshots, selected filenames, dynamic hooks and currency passed.')
