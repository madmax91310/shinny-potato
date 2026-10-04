import assert from 'node:assert/strict'
import { HOUSEHOLD_STATISTICS as records, HOUSEHOLD_SOURCES as sources, buildHouseholdTweet, getHouseholdVisual } from '../src/data/household-statistics.js'
import { DATA_CATALOG, searchData } from '../src/data/catalog.js'
assert.equal(records.length, 29)
assert.equal(new Set(records.map(r => r.id)).size, records.length)
for (const record of records) {
  assert(record.table && record.note && record.question)
  assert.equal(new URL(sources[record.source].url).hostname, 'www.insee.fr')
  assert.equal(record.metadata.asOf, null, 'Début 2024 ne justifie pas un jour précis')
  assert(['Début 2024', 'Début 2025', '2024'].includes(record.referencePeriod))
  assert(record.metadata.scope && record.population)
  assert(record.metadata.checkedAt && sources[record.source].publishedAt)
  assert(Number.isFinite(record.value) && record.value >= 0)
  if (record.unit === '%') assert(record.value <= 100)
  const tweet = buildHouseholdTweet(record)
  assert(!/\{\w+\}/.test(tweet), 'Variable non remplacée')
  assert(!tweet.includes('https://') && !tweet.includes('Source :'), 'Source retirée du texte publié')
  assert(tweet.endsWith(record.question), 'Question finale conservée')
  assert(sources[record.source].url && record.referencePeriod, 'Provenance et période conservées dans les données')
  for (const grid of getHouseholdVisual(record)) assert(Number.isInteger(grid.count) && grid.count >= 0 && grid.count <= 100)
  const entry = DATA_CATALOG.find(r => r.id === `household:${record.id}`)
  assert(entry && entry.fields[0].value === record)
  assert(searchData(record.title, 'household').some(r => r === entry))
}
const byId = Object.fromEntries(records.map(r => [r.id, r]))
// Éviter de confondre part du patrimoine (7) avec part des ménages (50).
assert.equal(getHouseholdVisual(byId['wealth-share'])[0].count, 50)
assert.equal(byId['wealth-share'].value, 7)
// Ne pas additionner des taux de détention qui peuvent se recouper.
assert.deepEqual(getHouseholdVisual(byId['livret-assurance']).map(g => g.count), [78, 42])
assert.equal(byId['wealth-top10'].value, 750400)
assert.equal(byId['wealth-median'].value, 148100)
assert.equal(byId.debt.value, 45.6)
assert.match(byId.debt.table, /corrigé/)
console.log('29 sujets financiers : sources Insee, populations, unités, dates, arrondis, tweets et catalogue OK.')

assert.equal(byId['unexpected-expense'].population, 'personnes')
assert.equal(byId.holidays.provisional, true)
assert.equal(byId['salary-top10'].value, 4334)
assert.match(byId['salary-median'].note, /Avant impôt/)
assert.match(byId['young-wealth'].note, /avant déduction/)
assert.deepEqual(getHouseholdVisual(byId['securities-workers']).map(g => g.count), [32, 8])
