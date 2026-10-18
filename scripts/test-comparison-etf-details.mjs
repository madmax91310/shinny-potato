import { AUTOMATED_ETF, AUTOMATED_AUM, AUTOMATED_PERFORMANCE, refreshFundDetails } from '../src/data/automated-etf.js'
import { comparisonPct } from '../src/pages/etf-tweets/lib/comparisonDetails.js'
import assert from 'node:assert/strict'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { comparisonLayout, getComparisonImageComposition } from '../src/pages/tweet-midi/comparatifEtfImage.js'
import { getInstrumentPeaStatus } from '../src/data/instruments.js'
import { getPreferredInstrumentListing } from '../src/data/instrument-listings.js'
import { getComparisonPerformance, getComparisonYears } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { buildTweetText } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { ETF_EXPOSURE_COPY, COMPARISON_HOOKS, getEtfExposureCopy } from '../src/pages/etf-tweets/lib/exposureCopy.js'
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
 // Derived themes (same index, exposure selections) carry their own question and fall back on each
 // share's differenciateur when no editorial exposure copy exists for the ISIN.
 assert.equal(tweet.split('\n')[0], theme.derived ? theme.hook : `${theme.emoji} ${COMPARISON_HOOKS[theme.id]}`)
 for (const fund of theme.etfs) {
  const exposure = theme.derived ? getEtfExposureCopy(fund) : ETF_EXPOSURE_COPY[fund.isin]
  assert.ok(exposure, `Exposition manquante : ${fund.isin}`)
  const blockEnd = tweet.indexOf(`🆔 ISIN : ${fund.isin}`)
  const blockStart = tweet.lastIndexOf('\n\n', tweet.indexOf(exposure))
  assert.ok(tweet.indexOf(exposure) > tweet.indexOf('👇'), 'Explication après le hook')
  assert.ok(blockEnd > tweet.indexOf(exposure), 'Explication avant les caractéristiques de sa part')
  assert.ok(tweet.slice(blockStart, blockEnd).includes(exposure))
 }
 assert.ok(tweet.length<=25000)
 assert.doesNotMatch(tweet, /Répartition sectorielle : non disponible|Principales positions : non disponibles/)
 assert.doesNotMatch(tweet.split('\n').slice(1).join('\n'), /🏭|🏢|📊 Performances|⚙️ Réplication|Répartition sectorielle|classement à monnaie égale|Ce qui change pour toi|—/)
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
assert.match(image,/renderComparisonPaper/)
assert.doesNotMatch(image,/PERFORMANCES ANNUELLES|Historique annuel non disponible/)
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
 assert(text.includes(`Matières premières de l’indice suivi au ${allocation.asOf.split('-').reverse().join('/')}`));
 for (const row of allocation.rows) assert(text.includes(`${row.label} : ${row.weightPct.toLocaleString('fr-FR', {maximumFractionDigits:2})} %`));
 assert.doesNotMatch(text, /🏭|🏢/);
}

// Le texte court et l'image détaillée conservent les mêmes parts exactes.
const pea = DEFAULT_THEMES.filter(theme => theme.peaOnly)
assert.equal(pea.length, 6)
assert.deepEqual(pea.map(theme => theme.id), ['world-meme-indice-pea', 'sp500-meme-indice-pea', 'world-pea', 'usa-pea', 'emergents-pea', 'europe-pea'])
assert(pea.find(theme => theme.id === 'world-pea').etfs.some(fund => fund.isin === 'FR0014017NX3'))
assert(pea.find(theme => theme.id === 'usa-pea').etfs.some(fund => fund.isin === 'FR0011871110'))
assert.equal(pea.find(theme => theme.id === 'europe-pea').etfs.length, 3)
assert(!DEFAULT_THEMES.some(theme => ['japon-pea', 'sp500-pea'].includes(theme.id)))
const peaEmerging = pea.find(theme => theme.id === 'emergents-pea')
assert.deepEqual(peaEmerging.etfs.map(fund => fund.isin), ['FR0013412020', 'FR0013412012', 'FR0013412004', 'FR0011440478'])
assert.match(buildTweetText(peaEmerging), /critères ESG et de transition climatique/)
assert.equal(getComparisonPerformance('FR001400ZGO4'), null, 'Pas de performance PAEEM copiée sur PEMS')
assert.throws(() => buildTweetText({ ...peaEmerging, etfs: [emerging.etfs.find(fund => fund.isin === 'IE00BKM4GZ66')] }), /part non éligible ou non vérifiée/)
for (const theme of DEFAULT_THEMES) for (const fund of theme.etfs) for (const field of ['sectors', 'countries']) {
 const image = getComparisonImageComposition(fund.isin, field)
 const expected = [...(COMPARISON_ETF_DETAILS[fund.isin]?.[field] ?? [])].filter(([label,value]) => Number.isFinite(value) && value > 0 && !/^(other|others|autres)$/i.test(label)).sort((a,b) => b[1]-a[1]).slice(0,3)
 assert.deepEqual(image.rows, expected)
 assert.equal(image.asOf, COMPARISON_ETF_DETAILS[fund.isin]?.[`${field}AsOf`] ?? COMPARISON_ETF_DETAILS[fund.isin]?.asOf)
}
assert.equal(getComparisonImageComposition('FR001400ZGO4', 'countries').isIndex, true)
assert.match(buildTweetText(DEFAULT_THEMES.find(theme => theme.id === 'etc-metaux')), /Taux de swap annuel : 0,45 % en supplément/)
console.log('Six sélections PEA, compositions partagées avec les images et historique propre de PEMS vérifiés.')

for (const count of [1,2,3,4,5,6,7,10]) {
 const layout = comparisonLayout(count)
 assert(layout.columns * layout.rows >= count)
 assert.equal(layout.compact, count >= 4)
 if (count === 4) assert.equal(layout.rows, 2)
 if (count === 5) assert.equal(layout.rows, 2)
}

// Exposure comparisons have one representative for each deliberate choice.
for (const [id, isins] of Object.entries({
 'world-pea': ['IE0002XZSHO1', 'FR0014017NX3'],
 'usa-pea': ['FR0011871128', 'FR0011871110'],
 'emergents-pea': ['FR0013412020', 'FR0013412012', 'FR0013412004', 'FR0011440478'],
 'etc-metaux': ['IE00B4ND3602', 'IE00B4NCWG09', 'GB00B15KXQ89'],
})) assert.deepEqual(DEFAULT_THEMES.find(theme => theme.id === id).etfs.map(fund => fund.isin), isins)
for (const theme of DEFAULT_THEMES) {
 assert.equal(new Set(theme.etfs.map(fund => fund.isin)).size, theme.etfs.length)
 const tweet = buildTweetText(theme)
 if (theme.etfs.length === 1) assert.match(tweet, /à découvrir/)
 else assert.match(tweet, /à comparer/)
}
assert.match(buildTweetText(pea.find(theme => theme.id === 'world-pea')), /grandes et moyennes entreprises des pays développés/)
assert.doesNotMatch(buildTweetText(pea.find(theme => theme.id === 'world-pea')), /trois ETF World/)
assert.doesNotMatch(buildTweetText(peaEmerging), /PEMS/)
assert.equal(DEFAULT_THEMES.find(theme => theme.id === 'tech-europe').etfs.length, 2, 'Two products following one index remain a deliberate product comparison')
console.log('Comparaisons d’exposition équilibrées, comparaison de produits et découvertes unitaires distinguées.')

assert.ok(getComparisonImageComposition('IE0002XZSHO1', 'countries').rows.every(([label]) => !/^(other|others|autres)$/i.test(label)), 'Une catégorie résiduelle ne constitue pas un pays parmi les principaux pays')

// Le squelette publié reprend les chiffres et la sélection de l'image, sans positions.
for (const theme of DEFAULT_THEMES) {
 const tweet = buildTweetText(theme)
 for (const [index, fund] of theme.etfs.entries()) {
  const start = tweet.indexOf(`🆔 ISIN : ${fund.isin}`)
  const next = theme.etfs[index + 1]
  const end = next ? tweet.indexOf(`🆔 ISIN : ${next.isin}`) : tweet.length
  const block = tweet.slice(start, end)
  const performance = getComparisonPerformance(fund.isin, getComparisonYears(theme.etfs.map(f => f.isin)))
  if (performance) for (const row of performance.rows) assert(block.includes(`${row.year} : ${comparisonPct(row.pct)}`))
  for (const [field, label] of [['countries', '🌍 Principaux pays'], ['sectors', '🧩 Principaux secteurs']]) {
   const composition = getComparisonImageComposition(fund.isin, field)
   if (composition.rows.length) {
    assert(block.includes(label))
    for (const [,value] of composition.rows) assert(block.includes(`${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`))
   }
  }
  if (block.includes('🌍 Principaux pays') && block.includes('🧩 Principaux secteurs')) assert(block.indexOf('🌍 Principaux pays') < block.indexOf('🧩 Principaux secteurs'))
  assert.doesNotMatch(block, /non disponible|non renseigné|🏢/)
 }
}
const momentumTweet = buildTweetText(DEFAULT_THEMES.find(t => t.id === 'world-momentum'))
assert.match(momentumTweet, /📈 Performances annuelles en dollars/)
assert.match(momentumTweet, /2025 : \+21,23 %/)
assert.match(momentumTweet, /🇺🇸 États-Unis/)
assert.equal((momentumTweet.match(/🌍 Principaux pays/g) ?? []).length, 2)
assert.equal((momentumTweet.match(/🧩 Principaux secteurs/g) ?? []).length, 2)
console.log('Squelette comparatif ETF : performances, pays puis secteurs cohérents avec les images.')

// Reviewed DWS publications must date both compositions and identify the country
// classification. A registry country is not a revenue exposure or a transaction.
const reviewedDws = new Set(['IE00BGV5VN51','IE00BM67HK77','IE00BM67HS53','IE00BM67HV82','IE00BM67HQ30','IE00BLNMYC90'])
let reviewedThemes = 0
for (const theme of DEFAULT_THEMES.filter(t => t.etfs.some(f => reviewedDws.has(f.isin)))) {
 const tweet = buildTweetText(theme)
 for (const fund of theme.etfs.filter(f => reviewedDws.has(f.isin))) {
  for (const field of ['countries','sectors']) {
   const source = AUTOMATED_ETF[fund.isin][field]
   const view = getComparisonImageComposition(fund.isin, field)
   assert.equal(view.asOf, source.asOf)
   for (const [label, value] of view.rows) assert(source.rows.some(row => (row.label ?? row.name) === label && row.weightPct === value))
   assert(tweet.includes(`au ${source.asOf.split('-').reverse().join('/')}`))
  }
  assert.equal(getComparisonImageComposition(fund.isin, 'countries').classification, 'classification DWS')
  assert(tweet.includes('(classification DWS)'))
 }
 reviewedThemes++
}
assert(reviewedThemes >= 6)
assert.equal(getComparisonImageComposition('FR001400ZGO4', 'countries').classification, null)
console.log(`${reviewedThemes} comparatifs DWS : dates, chiffres et classification géographique vérifiés.`)
