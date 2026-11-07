import assert from 'node:assert/strict'
import records from '../src/data/automated-indices.json' with { type: 'json' }
import config from './index-automation.json' with { type: 'json' }
import { buildAutomatedIndexSheets, AUTOMATED_SHEET_DEFINITIONS } from '../src/data/automated-index-sheets.js'
import { SHEETS } from '../src/data/index-factsheets.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
import { getIndexArt } from '../src/pages/factsheet-tweets/visualIdentity.js'

assert.equal(new Set(SHEETS.map(sheet => sheet.id)).size, SHEETS.length, 'Duplicate index sheet')
for (const definition of AUTOMATED_SHEET_DEFINITIONS) {
  const id = definition.id, source = config.indices.find(row => row.id === id)
  assert(source.enabled && source.requiredFields.includes('composition') && source.requiredFields.includes('returns'))
  const sheet = SHEETS.find(row => row.id === id), observation = records[id]
  for (const field of ['constituents', 'countries', 'sectors', 'holdings']) assert.deepEqual(sheet[field], observation.facts[field])
  assert.equal(sheet.indexFacts.asOf, observation.facts.asOf)
  assert.equal(sheet.performance.date, observation.returns.performance.date)
  assert.equal(sheet.returns.length, 5)
  getIndexArt(sheet)
  assert.match(buildFactsheetTweet(sheet), /dividendes.*réinvestis/)

  // A future monthly document and new complete year propagate through the
  // same consumer to the tweet, rather than leaving the launch snapshot fixed.
  const future = structuredClone(records), updated = future[id]
  Object.assign(updated.facts, { asOf: '2027-01-31', constituents: 1234,
    countries: [['🇫🇷 France', 70], ['🇯🇵 Japon', 30]],
    sectors: [['🏭 Industrie', 80], ['🏦 Finance', 20]],
    holdings: [['Nouvelle entreprise', 12], ['Autre entreprise', 8]], topWeight: 20 })
  updated.returns.values.push([2026, 42.12])
  updated.returns.asOf = '2027-01-31'
  updated.returns.performance.date = '2027-01-31'
  const current = buildAutomatedIndexSheets(future, new Date('2027-02-01')) .find(row => row.id === id)
  assert.deepEqual(current.returns.map(([year]) => year), [2026, 2025, 2024, 2023, 2022])
  assert.equal(current.snapshot, '31 janvier 2027')
  const tweet = buildFactsheetTweet(current)
  assert.match(tweet, /1\s234 titres/)
  assert.match(tweet, /Nouvelle entreprise : 12 %/)
  assert.match(tweet, /2026 : \+42,12 %/)
  for (const field of ['countries', 'sectors', 'holdings']) {
    const incomplete = structuredClone(records); delete incomplete[id].facts[field]
    assert.throws(() => buildAutomatedIndexSheets(incomplete), /complètes exigées/)
  }
  const price = structuredClone(records); price[id].returns.variant = 'PRICE'
  assert.throws(() => buildAutomatedIndexSheets(price), /complètes exigées/)
  const missing = structuredClone(records); delete missing[id].returns
  assert.throws(() => buildAutomatedIndexSheets(missing), /complètes exigées/)
}
console.log(`${AUTOMATED_SHEET_DEFINITIONS.length} fully automated index sheets: exact observations, future composition/year propagation, incomplete and Price Return data refused.`)

// Exact-index quarterly weights may be presented only with same-date sectors;
// the more recent monthly observation remains untouched and available elsewhere.
{
  const { readFileSync } = await import('node:fs')
  const { factsForIndexSheet, derivedSheetDefinitions } = await import('../src/data/automated-index-sheets.js')
  const observations = structuredClone(records), id = 'russell-1000', now = new Date('2026-11-07T12:00:00Z')
  const originalMonthly = structuredClone(observations[id].facts)
  const quarterly = JSON.parse(readFileSync('scripts/fixtures/russell-composition/coherent-quarter-2026-06-30.json'))
  observations[id].quarterlyFacts = quarterly
  const definitions = derivedSheetDefinitions([], observations, now)
  const definition = definitions.find(r => r.id === id)
  assert(definition, 'Qualified quarterly composition restores the existing index format')
  const sheet = buildAutomatedIndexSheets(observations, now, [definition])[0]
  assert.equal(sheet.indexFacts.asOf, '2026-06-30')
  assert.equal(sheet.snapshot, '30 juin 2026')
  assert.equal(sheet.constituents, 1023)
  assert.deepEqual(sheet.sectors, quarterly.sectors)
  assert.deepEqual(sheet.holdings, quarterly.holdings)
  assert.equal(sheet.topWeight, quarterly.holdings.reduce((s,[,w]) => s+w, 0))
  assert(sheet.topWeight < 100)
  assert(sheet.source.some(s => s.url === quarterly.holdingsSource.url))
  assert.deepEqual(observations[id].facts, originalMonthly, 'Monthly sectors/count keep their own date')
  assert.equal(factsForIndexSheet(id, records[id], now), null)
  const text = buildFactsheetTweet(sheet)
  assert.match(text, /Nvidia : 6,73 %/)
  assert.match(text, /1\s023 titres/)
  assert(!/NaN|undefined/.test(text))
  for (const mutation of [q => {q.holdingsSource.asOf='2026-09-30'}, q => {q.holdingsSource.sha256=''},
    q => {q.asOf='2026-06-29'}, q => {q.collectionBasis='fund'}, q => {q.holdings=[]}]) {
    const bad = structuredClone(observations); mutation(bad[id].quarterlyFacts)
    assert.equal(factsForIndexSheet(id,bad[id],now),null)
    assert(!derivedSheetDefinitions([],bad,now).some(d=>d.id===id))
  }
  assert.equal(factsForIndexSheet(id,observations[id],new Date('2026-06-29')),null)
  assert.equal(factsForIndexSheet(id,observations[id],new Date('2027-01-01')),null)
  assert.equal(factsForIndexSheet('other-index',observations[id],now),null)
  assert.throws(()=>buildAutomatedIndexSheets(observations,new Date('2027-01-01'),[definition]),/complètes exigées/)
  console.log('Russell: coherent dated quarter restores the sheet; mixed dates, absent weights, stale quarters and substitute funds remain refused.')
}
