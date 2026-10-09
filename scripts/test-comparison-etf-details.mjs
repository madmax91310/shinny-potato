import { AUTOMATED_ETF, AUTOMATED_AUM, AUTOMATED_PERFORMANCE, refreshFundDetails } from '../src/data/automated-etf.js'
import { comparisonPct } from '../src/pages/etf-tweets/lib/comparisonDetails.js'
import assert from 'node:assert/strict'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { comparisonLayout, getComparisonImageComposition } from '../src/pages/tweet-midi/comparatifEtfImage.js'
import { getInstrumentPeaStatus } from '../src/data/instruments.js'
import { getPreferredInstrumentListing } from '../src/data/instrument-listings.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { buildTweetText } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { COMPARISON_ETF_DETAILS } from '../src/data/comparison-etf-details.js'
import { readFileSync } from 'node:fs'
import { getComparisonPolicy } from '../src/pages/etf-tweets/lib/comparisonPolicy.js'
import { buildComparisonEtfDetails } from '../src/pages/etf-tweets/lib/comparisonDetails.js'
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
 if (record.countries) {
  assert.equal(details.countriesAsOf, record.countries.asOf)
  assert.equal(details.countriesSource, record.countries.sourceUrl ?? record.sourceUrl)
  assert.equal(details.countriesBasis, record.countries.basis === 'index' ? 'tracked-index' : (record.countries.basis ?? 'fund'))
 }
}
const text = emerging.etfs.flatMap(fund => buildComparisonEtfDetails(fund)).join('\n')
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
 const tweet = buildTweetText(theme)
 assert.ok(tweet.length<=25000)
 assert.doesNotMatch(tweet, /Répartition sectorielle : non disponible|Principales positions : non disponibles/)
 assert.doesNotMatch(tweet, /🏭|🏢|📊 Performances|⚙️ Réplication|Répartition sectorielle|classement à monnaie égale|Ce qui change pour toi|—/)
 assert.equal((tweet.match(/🆔 ISIN : /g) ?? []).length, theme.etfs.length)
 if (theme.peaOnly) assert(theme.etfs.every(fund => getInstrumentPeaStatus(fund.isin) === true))
 for (const fund of theme.etfs) {
  assert(tweet.includes(fund.isin))
  assert(tweet.includes(`${fund.frais} %`))
  const listing = getPreferredInstrumentListing(fund.isin)
  if (listing) assert(tweet.includes(`(${listing.ticker})`))
 }
 for (const fund of theme.etfs) {
  const p=getComparisonPerformance(fund.isin)
  if(p) {assert.equal(p.label,'ETF');assert.equal(p.referenceIsin,fund.isin)}
  const detailText = buildComparisonEtfDetails(fund).join('\n')
  if (!getComparisonPolicy(fund).showSectors) assert.doesNotMatch(detailText, /🏭/)
  if (!getComparisonPolicy(fund).showHoldings) assert.doesNotMatch(detailText, /🏢/)
 }
}
for (const id of ['tech-europe', 'sante', 'ressources-naturelles', 'financieres', 'semiconducteurs-tech', 'innovation-medicale', 'jeux-video']) {
 assert.doesNotMatch(buildTweetText(DEFAULT_THEMES.find(t => t.id === id)), /🏭/, `${id}: activités et entreprises, sans bloc sectoriel redondant`)
}
for (const id of ['monde', 'emergents', 'ia-robotique', 'renouvelables']) {
 assert.doesNotMatch(buildTweetText(DEFAULT_THEMES.find(t => t.id === id)), /🏭/, `${id}: les secteurs restent sur l’image`)
}
const resources = buildTweetText(DEFAULT_THEMES.find(t => t.id === 'ressources-naturelles'))
assert.doesNotMatch(resources, /⚙️|chimie et les gaz industriels|📊 Performances/)
assert.match(resources, /💸 Frais annuels/)
const synthetic = buildComparisonEtfDetails({ isin: 'LU1834983634', nom: 'ETF' }).join('\n')
assert.match(synthetic, /Principales entreprises de l’indice suivi/)
assert.doesNotMatch(synthetic, /Principales positions du fonds/)
const noHistory = buildComparisonEtfDetails({ isin: 'UNKNOWN', nom: 'ETF' }, []).join('\n')
assert.match(noHistory, /Historique annuel non disponible/)
assert.doesNotMatch(noHistory, /🏢|🏭/)
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
assert.match(image,/color: observation\?\.pct < 0 \? RED : GREEN/)
console.log('Comparatif : parts exactes, aucune substitution, compositions datées et distinctes, secteurs complets, cohérence texte/image et couleurs vérifiés.')

const usa = DEFAULT_THEMES.find(t => t.id === 'usa');
assert.deepEqual(usa.etfs.map(f => f.isin), ['FR0011871128', 'FR0011871110', 'FR0007056841']);
assert.equal(getComparisonPerformance('FR0007056841').referenceIsin, 'FR0007056841');
const dowCalendars = getComparisonPerformance('FR0007056841').calendarReturns;
assert.deepEqual(Object.fromEntries(Object.entries(dowCalendars).filter(([year]) => Number(year) >= 2023 && Number(year) <= 2025)), {2023:11.66,2024:22.07,2025:.70});
assert.deepEqual(Object.fromEntries(Object.entries(dowCalendars).filter(([year]) => Number(year) < 2023)), {2020:-.01,2021:29.46,2022:-1.31});
assert.match(buildTweetText(usa), /Dow Jones/);
for (const id of ['world-minvol','monde-toutes-tailles','world-avec-sans-usa','grandes-petites-monde']) {
 assert(DEFAULT_THEMES.find(t => t.id === id).etfs.some(f => f.isin === 'IE0002XZSHO1'));
 assert(!DEFAULT_THEMES.find(t => t.id === id).etfs.some(f => f.isin === 'IE00B4L5Y983'));
}

// Commodity groups retain their own classification and signed published rounding.
for (const isin of ['IE00BD6FTQ80','IE00BDFL4P12']) {
 const allocation = AUTOMATED_ETF[isin].commodityAllocation;
 assert.equal(allocation.basis, 'index');
 assert.equal(allocation.classification, 'commodity-groups');
 const text = buildComparisonEtfDetails({ isin, nom: 'ETF' }).join('\n');
 assert.match(text, /Matières premières de l’indice suivi au 31\/08\/2026/);
 assert.match(text, /Métaux précieux : 15,3 %/);
 assert.match(text, /Autres : -0,01 %/);
 assert.doesNotMatch(text, /🏭|🏢/);
}

// Le texte court et l'image détaillée conservent les mêmes parts exactes.
const pea = DEFAULT_THEMES.filter(theme => theme.peaOnly)
assert.equal(pea.length, 4)
assert.deepEqual(pea.map(theme => theme.id), ['world-pea', 'usa-pea', 'emergents-pea', 'europe-pea'])
assert(pea.find(theme => theme.id === 'world-pea').etfs.some(fund => fund.isin === 'FR0014017NX3'))
assert(pea.find(theme => theme.id === 'usa-pea').etfs.some(fund => fund.isin === 'FR0011871110'))
assert.equal(pea.find(theme => theme.id === 'europe-pea').etfs.length, 3)
assert(!DEFAULT_THEMES.some(theme => ['japon-pea', 'sp500-pea'].includes(theme.id)))
const peaEmerging = pea.find(theme => theme.id === 'emergents-pea')
assert.deepEqual(peaEmerging.etfs.map(fund => fund.isin), ['FR0013412020', 'FR001400ZGO4', 'FR0013412012', 'FR0013412004', 'FR0011440478'])
assert.match(buildTweetText(peaEmerging), /PAEEM et PEMS sont deux parts du même fonds/)
assert.equal(getComparisonPerformance('FR001400ZGO4'), null, 'Pas de performance PAEEM copiée sur PEMS')
assert.throws(() => buildTweetText({ ...peaEmerging, etfs: [emerging.etfs.find(fund => fund.isin === 'IE00BKM4GZ66')] }), /part non éligible ou non vérifiée/)
for (const theme of DEFAULT_THEMES) for (const fund of theme.etfs) for (const field of ['sectors', 'countries']) {
 const image = getComparisonImageComposition(fund.isin, field)
 const expected = [...(COMPARISON_ETF_DETAILS[fund.isin]?.[field] ?? [])].filter(([,value]) => Number.isFinite(value) && value > 0).sort((a,b) => b[1]-a[1]).slice(0,3)
 assert.deepEqual(image.rows, expected)
 assert.equal(image.asOf, COMPARISON_ETF_DETAILS[fund.isin]?.[`${field}AsOf`] ?? COMPARISON_ETF_DETAILS[fund.isin]?.asOf)
}
assert.equal(getComparisonImageComposition('FR001400ZGO4', 'countries').isIndex, true)
assert.match(buildTweetText(DEFAULT_THEMES.find(theme => theme.id === 'etc-metaux')), /Taux de swap annuel : 0,45 % en supplément/)
console.log('Texte compact, quatre sélections PEA, compositions réservées aux images et historique propre de PEMS vérifiés.')

for (const count of [1,2,3,4,5,6,7,10]) {
 const layout = comparisonLayout(count)
 assert(layout.columns * layout.rows >= count)
 assert.equal(layout.compact, count >= 4)
 if (count === 4 || count === 5) assert.equal(layout.rows, 2)
}
