import assert from 'node:assert/strict'
import { HOUSEHOLD_STATISTICS as records, HOUSEHOLD_SOURCES as sources, buildHouseholdTweet, getHouseholdVisual } from '../src/data/household-statistics.js'
import { DATA_CATALOG, searchData } from '../src/data/catalog.js'
import { HOUSEHOLD_EDITORIAL } from '../src/data/household-editorial.js'
assert.equal(records.length, 29)
assert.equal(new Set(records.map(r => r.id)).size, records.length)
assert.deepEqual(Object.keys(HOUSEHOLD_EDITORIAL).sort(), records.map(r => r.id).sort())
for (const record of records) {
  assert(record.table && record.note && record.question)
  assert.equal(new URL(sources[record.source].url).hostname, 'www.insee.fr')
  assert.equal(record.metadata.asOf, null, 'Début 2024 ne justifie pas un jour précis')
  assert(/^(Début )?20\d{2}$/.test(record.referencePeriod))
  assert(record.metadata.scope && record.population)
  assert(record.metadata.checkedAt && sources[record.source].publishedAt)
  assert(Number.isFinite(record.value) && record.value >= 0)
  if (record.unit === '%') assert(record.value <= 100)
  const tweet = buildHouseholdTweet(record)
  assert(!/\{\w+\}/.test(tweet), 'Variable non remplacée')
  assert(!/https?:\/\/|Source\s*:/i.test(tweet), 'La source reste dans l’application, pas dans le tweet')
  assert(tweet.endsWith(record.question), 'Question finale conservée')
  assert.match(tweet, /\bje\b|\bj’ai\b|\bmoi\b/i, `${record.id} : regard personnel`)
  assert(tweet.includes(record.referencePeriod), `${record.id} : période conservée`)
  assert(tweet.includes(record.value.toLocaleString('fr-FR')), `${record.id} : valeur exacte conservée`)
  if (record.population === 'personnes') {
    assert.match(tweet, /personnes, pas de ménages/)
    assert.match(tweet, /France métropolitaine/)
    assert.equal(tweet.includes('données provisoires') || tweet.includes('Données provisoires'), record.provisional)
  }
  assert(record.metadata.sourceUrls.includes(sources[record.source].url))
  assert(record.metadata.note.includes(record.referencePeriod))
  assert(!buildHouseholdTweet(record, { includeUrl: false }).includes('https://'))
  for (const grid of getHouseholdVisual(record)) assert(Number.isInteger(grid.count) && grid.count >= 0 && grid.count <= 100)
  const entry = DATA_CATALOG.find(r => r.id === `household:${record.id}`)
  assert(entry && entry.fields[0].value === record)
  assert(searchData(record.title, 'household').some(r => r === entry))
}
const byId = Object.fromEntries(records.map(r => [r.id, r]))
// Une mise à jour Insee doit se refléter dans le texte sans figer les exemples approuvés.
const updatedPea = buildHouseholdTweet({ ...byId.pea, value: 12.3, referencePeriod: 'Début 2027' })
assert.match(updatedPea, /environ 12 détiennent/)
assert.match(updatedPea, /12,3 %/)
assert.match(updatedPea, /Début 2027/)
assert(!updatedPea.includes('9,8') && !updatedPea.includes('2024'))
const updatedExpense = buildHouseholdTweet({ ...byId['unexpected-expense'], value: 24.6, referencePeriod: 'Début 2027', provisional: false })
assert.match(updatedExpense, /25 personnes/)
assert.match(updatedExpense, /24,6 %/)
assert.match(updatedExpense, /Début 2027/)
assert(!updatedExpense.includes('provisoires') && !updatedExpense.includes('28,1'))
for (const id of ['wealth-share', 'livret-assurance', 'securities-workers', 'debt-types']) {
  const changed = buildHouseholdTweet({ ...byId[id], value: 33.3, secondValue: 22.2 })
  assert.match(changed, /33,3/)
  assert(changed.includes(id === 'wealth-share' ? '66,7' : '22,2'))
}
// Éviter de confondre part du patrimoine (7) avec part des ménages (50).
assert.equal(getHouseholdVisual(byId['wealth-share'])[0].count, 50)
assert.equal(getHouseholdVisual(byId['wealth-share'])[0].exact, `${byId['wealth-share'].value.toLocaleString('fr-FR')} % du patrimoine brut`)
// Ne pas additionner des taux de détention qui peuvent se recouper.
assert.deepEqual(getHouseholdVisual(byId['livret-assurance']).map(g => g.count), [byId['livret-assurance'].value, byId['livret-assurance'].secondValue].map(Math.round))
assert(byId['wealth-top10'].value >= byId['wealth-median'].value)
assert(byId.debt.automatedEvidence?.sha256 && byId.debt.automatedEvidence?.sourceKey === 'holdings')
console.log('29 sujets financiers : sources Insee, populations, unités, dates, arrondis, tweets et catalogue OK.')

assert.equal(byId['unexpected-expense'].population, 'personnes')
assert.equal(typeof byId.holidays.provisional, 'boolean')
assert(byId['salary-top10'].value >= byId['salary-median'].value)
assert.match(byId['salary-median'].note, /Avant impôt/)
assert.match(byId['young-wealth'].note, /avant déduction/)
assert.deepEqual(getHouseholdVisual(byId['securities-workers']).map(g => g.count), [byId['securities-workers'].value, byId['securities-workers'].secondValue].map(Math.round))
