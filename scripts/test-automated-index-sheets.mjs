import assert from 'node:assert/strict'
import records from '../src/data/automated-indices.json' with { type: 'json' }
import config from './index-automation.json' with { type: 'json' }
import { buildAutomatedIndexSheets, AUTOMATED_SHEET_DEFINITIONS } from '../src/data/automated-index-sheets.js'
import { SHEETS } from '../src/data/index-factsheets.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
import { getIndexArt } from '../src/pages/factsheet-tweets/visualIdentity.js'

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
console.log('Four fully automated index sheets: exact observations, future composition/year propagation, incomplete and Price Return data refused.')
