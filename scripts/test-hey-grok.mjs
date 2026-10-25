import assert from 'node:assert/strict'
import { SUBJECTS, MECHANICS, QUESTIONS } from '../src/pages/hey-grok/data.js'
import { drawQuestion, filterQuestions, tweetStatus, readPreferences, savePreferences, STORAGE_KEY, emptyFilters, emptyPreferences, toggleId } from '../src/pages/hey-grok/lib.js'

assert(QUESTIONS.length >= 240)
assert.equal(new Set(QUESTIONS.map(q => q.id)).size, QUESTIONS.length)
assert.equal(new Set(QUESTIONS.map(q => q.text.toLowerCase())).size, QUESTIONS.length)
assert(QUESTIONS.filter(q => q.public).length / QUESTIONS.length >= .65)
assert.equal(SUBJECTS.length, 8)
assert.equal(MECHANICS.length, 20)
for (const subject of SUBJECTS) assert(QUESTIONS.filter(q => q.subject === subject.id).length >= 20)
for (const mechanic of MECHANICS) {
  const questions = QUESTIONS.filter(q => q.mechanic === mechanic.id)
  assert(questions.length >= 10, mechanic.id)
  assert(new Set(questions.map(q => q.subject)).size >= 3, mechanic.id)
}
const debate = QUESTIONS.filter(q => q.debate)
assert(debate.length >= 30)
assert(new Set(debate.map(q => q.subject)).size >= 6)
assert(new Set(debate.map(q => q.mechanic)).size >= 10)
// Existing IDs are the contract with v1 localStorage; none may be removed or reused.
for (const subject of SUBJECTS) for (let i = 1; i <= 20; i++) assert(QUESTIONS.some(q => q.id === `${subject.id}-${String(i).padStart(2, '0')}`))
for (const q of QUESTIONS) {
  assert(SUBJECTS.some(s => s.id === q.subject))
  assert(MECHANICS.some(m => m.id === q.mechanic))
  assert.equal(typeof q.debate, 'boolean')
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
const filters = emptyFilters()
let prefs = emptyPreferences()
assert.equal(filterQuestions(QUESTIONS, filters, prefs).length, QUESTIONS.length)
assert.equal(filterQuestions(QUESTIONS, { ...filters, publicOnly: true }, prefs).length, QUESTIONS.filter(q => q.public).length)
assert.equal(filterQuestions(QUESTIONS, { ...filters, subject: 'budget' }, prefs).length, QUESTIONS.filter(q => q.subject === 'budget').length)
assert(filterQuestions(QUESTIONS, { ...filters, search: 'epargne' }, prefs).length > 0)
prefs.favorites = [QUESTIONS[0].id]; prefs.used = [QUESTIONS[0].id]
assert.equal(filterQuestions(QUESTIONS, { ...filters, favoritesOnly: true }, prefs).length, 1)
assert.equal(filterQuestions(QUESTIONS, { ...filters, favoritesOnly: true, unusedOnly: true }, prefs).length, 0)
assert.equal(filterQuestions(QUESTIONS, { ...filters, unusedOnly: true }, prefs).length, QUESTIONS.length - 1)
assert.equal(filterQuestions(QUESTIONS, { ...filters, search: 'absentxyz' }, prefs).length, 0)
let seen = []
const selection = filterQuestions(QUESTIONS, { ...filters, subject: 'budget' }, prefs)
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
// Exhaustive metadata/filter intersection matrix, including impossible combinations.
for (const subject of ['', ...SUBJECTS.map(s => s.id)]) for (const mechanic of ['', ...MECHANICS.map(m => m.id)]) {
  for (const publicOnly of [false, true]) for (const debateOnly of [false, true]) {
    const actual = filterQuestions(QUESTIONS, { ...filters, subject, mechanic, publicOnly, debateOnly, unusedOnly: true }, prefs)
    const expected = QUESTIONS.filter(q => (!subject || q.subject === subject) && (!mechanic || q.mechanic === mechanic) && (!publicOnly || q.public) && (!debateOnly || q.debate) && !prefs.used.includes(q.id))
    assert.deepEqual(actual, expected)
    const history = actual.map(q => q.id)
    assert.equal(drawQuestion(actual, history), null)
  }
}
// The v1 key and shape remain unchanged: a seeded pre-upgrade record must round-trip.
assert.equal(STORAGE_KEY, 'el-hey-grok-v1')
const legacy = { favorites: ['immobilier-01', 'budget-14'], used: ['banques-19'], drafts: { 'banques-19': 'Hey @grok, mon brouillon historique reste intact.' } }
values.set(STORAGE_KEY, JSON.stringify(legacy))
const rawBefore = values.get(STORAGE_KEY)
assert.deepEqual(readPreferences(storage).value, legacy)
assert.equal(values.get(STORAGE_KEY), rawBefore)
assert(savePreferences(storage, readPreferences(storage).value))
assert.equal(values.get(STORAGE_KEY), rawBefore)
console.log(JSON.stringify({ questions: QUESTIONS.length,
  bySubject: Object.fromEntries(SUBJECTS.map(s => [s.label, QUESTIONS.filter(q => q.subject === s.id).length])),
  byMechanic: Object.fromEntries(MECHANICS.map(m => [m.label, { questions: QUESTIONS.filter(q => q.mechanic === m.id).length, subjects: new Set(QUESTIONS.filter(q => q.mechanic === m.id).map(q => q.subject)).size }])),
  public: QUESTIONS.filter(q => q.public).length, debate: { questions: debate.length, subjects: new Set(debate.map(q => q.subject)).size, mechanics: new Set(debate.map(q => q.mechanic)).size },
  maxWeightedLength: Math.max(...QUESTIONS.map(q => tweetStatus(q.text).length)) }, null, 2))
console.log('Hey @Grok: bank, axes, combined filters, X weighting, exhaustion and v1 persistence passed.')
