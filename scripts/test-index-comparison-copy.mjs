import assert from 'node:assert/strict'
import { FAMILIES } from '../src/data/index-comparisons.js'
import { INDEX_RETURNS } from '../src/data/index-returns.js'
import { getIndexComparisonPerformance } from '../src/data/index-comparison-performance.js'
import { buildTweetText, fmtPct } from '../src/pages/index-comparator/lib.js'
const world = FAMILIES.find(f => f.id === 'monde')
const text = buildTweetText(world)
assert(text.startsWith('🌍 Quand tu as un ETF « World », tu as l’impression de couvrir toute la planète.'))
assert(text.includes('On décrypte les trois 👇'))
assert(text.includes('MSCI World : 1 280 valeurs\nMSCI ACWI : 2 458 valeurs\nFTSE All-World : 4 264 valeurs'))
assert(text.includes('📈 Les performances des trois indices, en dollars et dividendes réinvestis :'))
assert(text.includes('🔵 MSCI ACWI\n2023 : +22,81 % · 2024 : +18,02 % · 2025 : +22,87 %'))
assert(text.endsWith('💬 Tu as une préférence entre ces indices ?'))
assert(!/GPEA, lancé|Fonds trop récent|performances en euros|frais du fonds inclus|parts ou actifs/.test(text))
// Le changement d’un rendement de part ne doit jamais changer celui de l’indice.
assert.equal(buildTweetText({ ...world, perfFunds: [{ key: 'fake', label: 'FAUX ETF', y2023: 999 }] }), text)
for (const family of FAMILIES) {
  assert.equal(buildTweetText({ ...family, perfFunds: [] }), buildTweetText(family), `${family.id}: dépendance aux parts ETF`);
  const rows = getIndexComparisonPerformance(family)
  assert.equal(rows.length, family.indices.length)
  const tweet = buildTweetText(family)
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
// Version prix EUR explicite, sans écraser la version nette utilisée par les fiches.
assert.equal(INDEX_RETURNS.mscieurope['2026-08-31'].values.find(([year]) => year === 2025)[1], 19.39)
assert.equal(getIndexComparisonPerformance(FAMILIES.find(f => f.id === 'europe'))[2].y2025, 16.34)
assert.equal(getIndexComparisonPerformance(FAMILIES.find(f => f.id === 'or-argent'))[1].y2025, 149.06)
const missing = getIndexComparisonPerformance(FAMILIES.find(f => f.id === 'emergents-pea')).filter(row => !row.currency)
assert.equal(missing.length, 2)
missing.forEach(row => assert.equal(row.y2025, null))
console.log(`Comparateur : squelette approuvé, ${FAMILIES.length} familles, séries d’indices, devises, absences et YTD vérifiés.`)
