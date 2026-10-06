import { AUTOMATED_ETF, AUTOMATED_AUM, AUTOMATED_PERFORMANCE, refreshFundDetails } from '../src/data/automated-etf.js'
import { comparisonPct } from '../src/pages/etf-tweets/lib/comparisonDetails.js'
import assert from 'node:assert/strict'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { buildTweetText } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { COMPARISON_ETF_DETAILS } from '../src/data/comparison-etf-details.js'
import { readFileSync } from 'node:fs'
const emerging = DEFAULT_THEMES.find(t => t.etfs.some(f => f.isin === 'IE00BTJRMP35'))
// Each issuer field keeps its own document and date through the shared adapter.
for (const [isin, record] of Object.entries(AUTOMATED_ETF)) {
 if (record.aum) {
  assert.equal(AUTOMATED_AUM[isin].source.url, record.aum.sourceUrl ?? record.sourceUrl)
  assert.equal(AUTOMATED_AUM[isin].source.scope, record.aum.scope === 'fund' ? 'Actif net du fonds' : 'Actif net de la part exacte')
  if (record.aum.currency === 'JPY') assert.match(AUTOMATED_AUM[isin].sheet, /M¥/)
 }
 if (record.performance) assert.equal(AUTOMATED_PERFORMANCE[isin].source, record.performance.sourceUrl ?? record.sourceUrl)
 const details = refreshFundDetails(isin)
 if (record.performance) assert.equal(details.performance.source, AUTOMATED_PERFORMANCE[isin].source)
 if (record.countries) assert.equal(details.countriesAsOf, record.countries.asOf)
}
const text = buildTweetText(emerging)
for (const isin of ['IE00BTJRMP35', 'FR0013412020']) assert.ok(text.includes(`2025 : ${comparisonPct(getComparisonPerformance(isin).rows.find(r => r.year === 2025).pct)}`))
assert.ok(text.includes(`2025 : ${comparisonPct(getComparisonPerformance('IE00BKM4GZ66').rows.find(r => r.year === 2025).pct)}`))
assert.equal((text.match(/🏭 /g)||[]).length,3)
assert.equal((text.match(/🏢 /g)||[]).length,3)
assert.equal(COMPARISON_ETF_DETAILS.FR0013412020.basis, 'tracked-index')
assert.ok(text.includes(`Secteurs de l’indice suivi au ${(COMPARISON_ETF_DETAILS.FR0013412020.sectorsAsOf ?? COMPARISON_ETF_DETAILS.FR0013412020.asOf).split('-').reverse().join('/')}`))
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
for (const isin of ['IE00BD4TXV59','IE000XZSV718','IE000DQLYVB9','FR001400U5Q4']) {
 const p = getComparisonPerformance(isin), actual = AUTOMATED_ETF[isin]?.performance
 if (p) {
  assert.equal(actual?.basis, 'fund', 'Only collected returns of the actual share may replace an unavailable history')
  assert.equal(p.referenceIsin, isin)
  assert.equal(p.currency, actual.currency)
  for (const row of p.rows) assert.equal(row.pct, actual.years[row.year], 'No reference ETF or index substituted')
 } else assert.equal(p, null)
}
const image=readFileSync('src/pages/tweet-midi/comparatifEtfImage.js','utf8')
assert.ok(!image.includes("'#ffd286'"))
assert.match(image,/color: row.pct < 0 \? RED : GREEN/)
console.log('Comparatif : parts exactes, aucune substitution, compositions datées et distinctes, secteurs complets, cohérence texte/image et couleurs vérifiés.')
