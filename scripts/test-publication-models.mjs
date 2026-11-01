import { fieldQualification } from './lib/data-qualification.mjs'
import { filterAssetOptions } from '../src/lib/asset-picker-preferences.js'
import { COMPARATIF_ETF_SUBJECTS } from '../src/pages/tweet-midi/data/comparatifEtf.js'
import assert from 'node:assert/strict'
import { INVESTOR_MODELS, MODEL_ASSET_CLASSES, modelNatureLabel } from '../src/data/investor-models.js'
import { modelPortfolio, normalizeModel } from '../src/pages/investor-portfolio/models.js'
import { buildTweet, normalizePortfolio } from '../src/pages/investor-portfolio/data.js'
import { PUBLICATION_SELECTIONS } from '../src/data/publication-selections.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { ETFS } from '../src/data/etf-cards.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { getInstrumentFacts } from '../src/data/instrument-facts.js'
import { buildTweetText } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { buildSheet, buildTweet as practicalTweet } from '../src/pages/practical-sheets/lib.js'
import { getComparisonYears } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { DATA_CATALOG as CATALOG } from '../src/data/catalog.js'
const signatures = new Set()
for (const model of INVESTOR_MODELS) {
  const before = JSON.stringify(model), portfolio = modelPortfolio(model.id), tweet = buildTweet(portfolio)
  assert.equal(JSON.stringify(model), before)
  assert.equal(portfolio.kind, 'model')
  assert.equal(portfolio.snapshot.periodEnd, null, 'A model does not fabricate a position date')
  assert.equal(portfolio.fetchedAt, null)
  assert.equal(model.asOf, null)
  assert.equal(model.performance, null)
  assert.equal(portfolio.holdings.length, model.rows.length, 'No top-five truncation')
  assert(Math.abs(portfolio.holdings.reduce((sum, row) => sum + row.weight, 0) - 1) < 1e-12)
  assert(tweet.includes(modelNatureLabel(model)) && tweet.includes(model.scope) && tweet.includes(model.publication))
  assert(!/undefined|NaN|Positions au|13F|\$[A-Z]|rendement annualisé/.test(tweet))
  assert(tweet.includes('Pas un conseil financier.'))
  for (const row of model.rows) assert(tweet.includes(MODEL_ASSET_CLASSES[row.classId]))
  assert.throws(() => normalizePortfolio({ data: { identity: portfolio.identity, snapshot: { periodEnd: '2026-06-30', holdings: portfolio.holdings } } }), /13F/)
  assert(buildTweet(portfolio, 'Présentation personnalisée.').includes('Présentation personnalisée.'))
  signatures.add(JSON.stringify(Object.fromEntries(model.rows.map(row => [row.classId, row.units / model.denominator]))))
  const catalog = CATALOG.find(row => row.id === `investor-model:${model.id}`)
  assert(catalog && catalog.consumers.some(c => c.path === '/portefeuilles-investisseurs'))
  assert.equal(catalog.fields[0].value, model, 'JSON export shares the canonical model')
  assert.equal(catalog.fields[0].metadata.asOf, null)
  assert.equal(fieldQualification(catalog.fields[0], catalog).kind, 'reference')
}
assert.equal(signatures.size, INVESTOR_MODELS.length)
// Invalid or incomplete targets never get scaled to 100%.
for (const bad of [
  { rows: [{ classId: 'sp500', units: 90 }] },
  { rows: [{ classId: 'sp500', units: 50 }, { classId: 'sp500', units: 50 }] },
  { rows: [{ classId: 'unknown', units: 100 }] },
  { rows: [{ classId: 'sp500', units: NaN }] },
  { sourceUrls: [] }, { sourceUrls: ['http://unsafe.test'] }, { nature: 'personal' }, { locator: '' },
]) assert.throws(() => normalizeModel({ ...INVESTOR_MODELS[0], ...bad }))
assert.deepEqual(modelPortfolio('buffett-90-10').holdings.map(row => row.weight), [.9, .1])
assert(modelPortfolio('israelsen-7twelve').holdings.every(row => row.weight === 1 / 12))
assert(buildTweet(modelPortfolio('israelsen-7twelve')).includes('exactement 1/12'))
assert(buildTweet(modelPortfolio('faber-global-market-2015')).includes('ne représentent pas les poids actuels'))
const isins = new Set()
for (const selection of PUBLICATION_SELECTIONS) {
  const theme = DEFAULT_THEMES.find(row => row.id === selection.id)
  assert(theme && theme.includeComparisonNote)
  const tweet = buildTweetText(theme), sheet = buildSheet(selection.id), practical = practicalTweet(sheet)
  assert(!sheet.blocked, selection.id)
  assert(tweet.includes(selection.cloture) && practical.includes(selection.cloture))
  assert(!/NaN|undefined|non renseign|à confirmer/.test(tweet + practical))
  assert.equal(theme.etfs.length, selection.funds.length)
  for (const isin of selection.funds) {
    isins.add(isin)
    assert(filterAssetOptions(COMPARATIF_ETF_SUBJECTS, { query: isin }).some(row => row.id === selection.id))
    assert(ETFS.some(row => row.isin === isin), `Existing presentation ${isin}`)
    assert(AUTOMATED_ETF[isin]?.characteristics, `Automated source ${isin}`)
    assert(tweet.includes(isin) && practical.includes(isin))
  }
  // An unavailable calendar stays unavailable, without dropping the new fund.
  const years = getComparisonYears(selection.funds)
  assert(years.every(year => year < new Date().getUTCFullYear()))
}
assert.equal(isins.size, 23)
assert.equal(getInstrumentFacts('IE00B4NCWG09').instrumentType, 'ETC')
assert(buildTweetText(DEFAULT_THEMES.find(t => t.id === 'silver-metal-miners')).includes('Un ETC n’est pas un ETF UCITS'))
assert(buildTweetText(DEFAULT_THEMES.find(t => t.id === 'nasdaq-income-growth')).includes('limitent la participation'))
assert(getComparisonYears(['IE000L6ZMMC4', 'IE00B3YLTY66']).every(year => year >= 2027), 'No complete calendar before the new share; future valid observations stay admissible')
console.log(`${INVESTOR_MODELS.length} model allocations, ${PUBLICATION_SELECTIONS.length} selections / ${isins.size} assets: source scopes, exact weights, incomplete cases, shared exports and periods verified.`)

// Benchmark evidence survives downstream projection; a TER check cannot renew it.
for (const isin of ['IE00BLCHJB90', 'IE000NDWFGA5', 'IE00BMH5Y871', 'IE000UL6CLP7']) {
  const record = AUTOMATED_ETF[isin], facts = getInstrumentFacts(isin)
  assert.equal(facts.benchmark, record.characteristics.index)
  assert.deepEqual(facts.automatedFields.benchmark, record.characteristicChecks.index)
  const field = CATALOG.find(row => row.id === isin).fields.find(row => row.label === 'Indice suivi')
  assert.equal(field.value, facts.benchmark)
  assert.equal(field.metadata.checkedAt, record.characteristicChecks.index.checkedAt)
  assert.equal(field.metadata.asOf, record.characteristicChecks.index.asOf ?? null)
}
