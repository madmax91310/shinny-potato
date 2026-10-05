import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { comparisonPct } from '../src/pages/etf-tweets/lib/comparisonDetails.js'
import assert from 'node:assert/strict'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { buildTweetText } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { COMPARISON_ETF_DETAILS } from '../src/data/comparison-etf-details.js'
import { readFileSync } from 'node:fs'
const emerging = DEFAULT_THEMES.find(t => t.etfs.some(f => f.isin === 'IE00BTJRMP35'))
const text = buildTweetText(emerging)
assert.match(text,/2025 : \+33,7 %/)
assert.match(text,/2025 : \+21,04 %/)
assert.ok(text.includes(`2025 : ${comparisonPct(getComparisonPerformance('IE00BKM4GZ66').rows.find(r => r.year === 2025).pct)}`))
assert.equal((text.match(/🏭 /g)||[]).length,3)
assert.equal((text.match(/🏢 /g)||[]).length,3)
assert.match(text,/Secteurs de l’indice suivi au 30\/06\/2026/)
assert.ok(text.includes(`Répartition sectorielle du fonds au ${COMPARISON_ETF_DETAILS['IE00BKM4GZ66'].sectorsAsOf.split('-').reverse().join('/')}`))
for (const fund of emerging.etfs) {
 const p=getComparisonPerformance(fund.isin)
 assert.equal(p.label,'ETF');assert.equal(p.referenceIsin,fund.isin)
 const details=COMPARISON_ETF_DETAILS[fund.isin]
 assert.ok(details.source && details.asOf && details.checkedAt)
 assert.ok(details.holdings.length >= 3)
 if (AUTOMATED_ETF[fund.isin]?.holdings) {
  assert.equal(details.holdingsAsOf, AUTOMATED_ETF[fund.isin].holdings.asOf)
  assert.deepEqual(details.holdings.slice(0,3), AUTOMATED_ETF[fund.isin].holdings.rows.slice(0,3).map(r => [r.name,r.weightPct]))
 }
 assert.ok(Math.abs(details.sectors.reduce((sum,[,pct])=>sum+pct,0)-100) <= (AUTOMATED_ETF[fund.isin] ? 1 : .1))
}
for (const theme of DEFAULT_THEMES) {
 assert.ok(buildTweetText(theme).length<=25000)
 for (const fund of theme.etfs) {
  const p=getComparisonPerformance(fund.isin)
  if(p) {assert.equal(p.label,'ETF');assert.equal(p.referenceIsin,fund.isin)}
 }
}
for(const isin of ['IE00BD4TXV59','IE000XZSV718','IE000DQLYVB9','FR001400U5Q4']) assert.equal(getComparisonPerformance(isin),null,'No reference ETF or index substituted')
const image=readFileSync('src/pages/tweet-midi/comparatifEtfImage.js','utf8')
assert.ok(!image.includes("'#ffd286'"))
assert.match(image,/color: row.pct < 0 \? RED : GREEN/)
console.log('Comparatif : parts exactes, aucune substitution, compositions datées et distinctes, secteurs complets, cohérence texte/image et couleurs vérifiés.')
