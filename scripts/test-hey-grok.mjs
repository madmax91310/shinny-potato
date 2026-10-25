import assert from 'node:assert/strict'
import { CATEGORIES, QUESTIONS } from '../src/pages/hey-grok/data.js'
import { drawQuestion, filterQuestions, tweetStatus, readPreferences, savePreferences, STORAGE_KEY, emptyPreferences, toggleId } from '../src/pages/hey-grok/lib.js'

assert(QUESTIONS.length >= 150)
assert.equal(new Set(QUESTIONS.map(q => q.id)).size, QUESTIONS.length)
assert.equal(new Set(QUESTIONS.map(q => q.text.toLowerCase())).size, QUESTIONS.length)
assert(QUESTIONS.filter(q => q.public).length / QUESTIONS.length >= .6)
for (const category of CATEGORIES) assert(QUESTIONS.some(q => q.category === category.id))
for (const q of QUESTIONS) {
  assert(CATEGORIES.some(c => c.id === q.category))
  assert.equal(typeof q.public, 'boolean')
  assert(tweetStatus(q.text).canCopy, `${q.id}: invalid tweet`)
  assert(!/imp[oô]ts?|prestations? sociales?|aides? au logement|fiscalit/iu.test(q.text), `${q.id}: excluded subject`)
}
// Similarity without the common salutation: catch copied sentences, not shared topic words.
const tokens = text => new Set(text.slice(11).toLowerCase().match(/[\p{L}\p{N}]+/gu))
for (let i = 0; i < QUESTIONS.length; i++) for (let j = i + 1; j < QUESTIONS.length; j++) {
  const a = tokens(QUESTIONS[i].text), b = tokens(QUESTIONS[j].text)
  const common = [...a].filter(token => b.has(token)).length
  assert(common / new Set([...a, ...b]).size < .72, `Review similar questions: ${QUESTIONS[i].id}, ${QUESTIONS[j].id}`)
}
assert.equal(tweetStatus('Hey @grok, ' + 'a'.repeat(269)).length, 280)
assert(tweetStatus('Hey @grok, ' + 'a'.repeat(269)).canCopy)
assert.equal(tweetStatus('Hey @grok, ' + 'a'.repeat(270)).over, 1)
assert(!tweetStatus('Hey @grok, ' + 'a'.repeat(270)).canCopy)
assert.equal(tweetStatus('Hey @grok, 👨‍👩‍👧‍👦').length, 13)
assert.equal(tweetStatus('Hey @grok, 漢字').length, 15)
assert.equal(tweetStatus('Hey @grok, e\u0301').length, 12)
assert.equal(tweetStatus('Hey @grok, \n').length, 12)
assert.equal(tweetStatus('Hey @grok, https://example.com/a-very-long-path').length, 34)
assert(!tweetStatus('Autre mention').canCopy)
assert(!tweetStatus('Hey @grok, ').canCopy)
assert(!tweetStatus('Hey @grok, \uffff').canCopy)
const filters = { category: '', search: '', publicOnly: false, unusedOnly: false, favoritesOnly: false }
let prefs = emptyPreferences()
assert.equal(filterQuestions(QUESTIONS, filters, prefs).length, 160)
assert.equal(filterQuestions(QUESTIONS, { ...filters, publicOnly: true }, prefs).length, 140)
assert.equal(filterQuestions(QUESTIONS, { ...filters, category: 'budget' }, prefs).length, 20)
assert(filterQuestions(QUESTIONS, { ...filters, search: 'epargne' }, prefs).length > 0)
prefs.favorites = [QUESTIONS[0].id]; prefs.used = [QUESTIONS[0].id]
assert.equal(filterQuestions(QUESTIONS, { ...filters, favoritesOnly: true }, prefs).length, 1)
assert.equal(filterQuestions(QUESTIONS, { ...filters, favoritesOnly: true, unusedOnly: true }, prefs).length, 0)
assert.equal(filterQuestions(QUESTIONS, { ...filters, unusedOnly: true }, prefs).length, 159)
assert.equal(filterQuestions(QUESTIONS, { ...filters, search: 'absentxyz' }, prefs).length, 0)
let seen = []
const selection = filterQuestions(QUESTIONS, { ...filters, category: 'budget' }, prefs)
for (let i = 0; i < selection.length; i++) {
  const q = drawQuestion(selection, seen, () => .5)
  assert(q && !seen.includes(q.id)); seen.push(q.id)
}
assert.equal(drawQuestion(selection, seen), null)
assert.equal(drawQuestion([], []), null)
assert(drawQuestion(QUESTIONS, seen, () => 0)) // Changing filters retains previous visits.
assert.deepEqual(toggleId(toggleId([], 'one'), 'one'), [])
const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
assert.deepEqual(readPreferences(storage).value, emptyPreferences())
prefs.drafts[QUESTIONS[0].id] = 'Hey @grok, modifié'
assert(savePreferences(storage, prefs)); assert.deepEqual(readPreferences(storage).value, prefs)
for (const raw of ['broken', 'null', '{"favorites":4}', '{"favorites":[],"used":[],"drafts":[]}']) {
  values.set(STORAGE_KEY, raw); assert(readPreferences(storage).error); assert.equal(values.get(STORAGE_KEY), raw)
}
const unavailable = { getItem: () => { throw Error('denied') }, setItem: () => { throw Error('full') } }
assert(readPreferences(unavailable).error); assert.equal(savePreferences(unavailable, prefs), false)
console.log(JSON.stringify({ questions: QUESTIONS.length, byCategory: Object.fromEntries(CATEGORIES.map(c => [c.label, QUESTIONS.filter(q => q.category === c.id).length])), public: QUESTIONS.filter(q => q.public).length, maxWeightedLength: Math.max(...QUESTIONS.map(q => tweetStatus(q.text).length)) }, null, 2))
console.log('Hey @Grok: bank, X weighting, combined filters, no-repeat draw, exhaustion and persistence passed.')
