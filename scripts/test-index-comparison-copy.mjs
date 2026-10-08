import assert from 'node:assert/strict'
import { FAMILIES } from '../src/data/index-comparisons.js'
import { getIndexComparisonPairs } from '../src/data/index-comparison-pairs.js'
import { INDEX_RETURNS } from '../src/data/index-returns.js'
import { getIndexComparisonPerformance } from '../src/data/index-comparison-performance.js'
import { buildTweetText, fmtPct } from '../src/pages/index-comparator/lib.js'
const world = getIndexComparisonPairs(FAMILIES.find(f => f.id === 'monde'))[0]
for (const base of FAMILIES) {
  const pairs = getIndexComparisonPairs(base)
  assert.equal(pairs.length, base.indices.length * (base.indices.length - 1) / 2)
  assert.equal(new Set(pairs.map(pair => pair.pairId)).size, pairs.length)
  if (base.indices.length === 3) assert.deepEqual(pairs.map(pair => pair.pairPositions), [[0, 1], [0, 2], [1, 2]])
  for (const pair of pairs) {
    assert.equal(pair.indices.length, 2)
    const rows = getIndexComparisonPerformance(pair)
    const originalRows = getIndexComparisonPerformance(base)
    assert.deepEqual(rows.map(row => row.key), pair.pairPositions.map(position => originalRows[position].key))
    const tweet = buildTweetText(pair)
    assert.equal((tweet.match(/^🔹 /gm) ?? []).length, 2)
    assert.equal((tweet.match(/^[🟢🔵] /gmu) ?? []).length, 2)
    if (base.indices.length > 2) assert.deepEqual(pair.etfGroups, pair.pairPositions.map(position => base.etfGroups[position]))
    for (const group of base.etfGroups.filter(group => !pair.etfGroups.includes(group))) {
      for (const fund of group.funds ?? []) assert(!tweet.includes(fund.isin), `${pair.pairId}: fonds hors duel`)
    }
  }
  assert.equal(buildTweetText(base), buildTweetText(pairs[0]), `${base.id}: duel par défaut`)
}
const text = buildTweetText(world)
assert(text.startsWith('MSCI World ou MSCI ACWI :'))
assert(!text.includes('FTSE All-World'))
for (const index of world.indices) assert(text.includes(`${index.name} : ${index.indexFacts.constituents.toLocaleString('fr-FR').replaceAll('\u202f', ' ')} valeurs`))
assert(text.includes('📈 Les performances des deux indices, en dollars et dividendes réinvestis :'))
assert(text.includes('🔵 MSCI ACWI\n2023 : +22,81 % · 2024 : +18,02 % · 2025 : +22,87 %'))
assert(text.endsWith('💬 Entre ces deux indices, lequel correspond le mieux à ton portefeuille ?'))
assert(!/GPEA, lancé|Fonds trop récent|performances en euros|frais du fonds inclus|parts ou actifs/.test(text))
// Le changement d’un rendement de part ne doit jamais changer celui de l’indice.
assert.equal(buildTweetText({ ...world, perfFunds: [{ key: 'fake', label: 'FAUX ETF', y2023: 999 }] }), text)
for (const family of FAMILIES.flatMap(getIndexComparisonPairs)) {
  assert.equal(buildTweetText({ ...family, perfFunds: [] }), buildTweetText(family), `${family.id}: dépendance aux parts ETF`);
  const rows = getIndexComparisonPerformance(family)
  assert.equal(rows.length, family.indices.length)
  const tweet = buildTweetText(family)
  assert(!tweet.includes('📍'), `${family.id}: pas de place de cotation dans le tweet`)
  assert(!tweet.includes('Statut PEA non établi'), `${family.id}: les statuts inconnus sont omis, jamais inventés`)
  const markers = ['🔹', '📊', '🔎', '📈', '💬'].map(marker => tweet.indexOf(`\n\n${marker}`))
  assert(markers.every((position, i) => position >= 0 && (i === 0 || position > markers[i - 1])), family.id)
  assert(!/undefined|NaN|LES ETF|LE VERDICT|frais des fonds déduits/.test(tweet), family.id)
  rows.forEach(row => {
    assert(row.source.url.startsWith('https://'), row.key)
    assert(!/UCITS|Amundi|iShares|Vanguard|Xtrackers/.test(row.label), row.key)
    for (const year of [2023, 2024, 2025]) assert(tweet.includes(`${year} : ${fmtPct(row[`y${year}`]) ?? 'Non disponible'}`))
  })
  const key = rows[0].key
  assert(!buildTweetText(family, { [key]: { ytdEnabled: true, ytd: '' } }).includes('YTD saisi'))
  assert(buildTweetText(family, { [key]: { ytdEnabled: true, ytd: 0 } }).includes('YTD saisi : +0,00 %'))
}
const segments = buildTweetText(FAMILIES.find(f => f.id === 'monde-segments'))
assert(segments.startsWith('MSCI World ou MSCI World ex USA :'))
assert(!segments.includes('World Small Cap'))
assert.equal((segments.match(/CTO · Non éligible au PEA/g) ?? []).length, 1)
// Version prix EUR explicite, sans écraser la version nette utilisée par les fiches.
assert.equal(INDEX_RETURNS.mscieurope['2026-08-31'].values.find(([year]) => year === 2025)[1], 19.39)
assert.equal(getIndexComparisonPerformance(FAMILIES.find(f => f.id === 'europe'))[2].y2025, 16.34)
assert.equal(getIndexComparisonPerformance(FAMILIES.find(f => f.id === 'or-argent'))[1].y2025, 149.06)
const emerging = getIndexComparisonPerformance(FAMILIES.find(f => f.id === 'emergents-pea'))
assert(emerging.every(row => row.currency === 'USD' && [row.y2023, row.y2024, row.y2025].every(Number.isFinite)))
assert.deepEqual(emerging.find(row => row.key === 'msci-em-latin-america-selection').y2023, 27.39)
assert.deepEqual(emerging.find(row => row.key === 'msci-em-latin-america-selection').y2024, -29.40)
assert.deepEqual(emerging.find(row => row.key === 'msci-em-latin-america-selection').y2025, 54.75)
assert.deepEqual(emerging.find(row => row.key === 'msci-em-emea-esg').y2023, 8.80)
assert.deepEqual(emerging.find(row => row.key === 'msci-em-emea-esg').y2024, 6.96)
assert.deepEqual(emerging.find(row => row.key === 'msci-em-emea-esg').y2025, 31.92)
assert(!buildTweetText(FAMILIES.find(f => f.id === 'emergents-pea')).includes('Non disponible'))
for (const row of emerging.filter(row => ['msci-em-latin-america-selection', 'msci-em-emea-esg'].includes(row.key))) {
  assert(row.metadata.sourceUrls.length >= 2)
  assert(row.metadata.sourceUrls.every(url => url.startsWith('https://www.msci.com/')))
}
console.log(`Comparateur : squelette approuvé, ${FAMILIES.length} familles, séries d’indices, devises, absences et YTD vérifiés.`)
