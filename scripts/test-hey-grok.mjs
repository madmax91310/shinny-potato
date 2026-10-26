import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BANK, BANK_BY_ID, THEMES, ALL_MECHANICS, SUBJECTS } from '../src/pages/hey-grok/catalog.js'
import { QUESTIONS } from '../src/pages/hey-grok/data.js'
import { NEW_SELECTION, SELECTION_EDITS } from '../src/pages/hey-grok/selection.js'
import { ARCHIVE_REASONS, TEMPLATES } from '../src/pages/hey-grok/taxonomy.js'
import { filterQuestions, emptyFilters, drawBatch, tweetStatus, newEditor, renderTemplate, templateDefaults, switchPersonalWorkspace } from '../src/pages/hey-grok/lib.js'
import { STORAGE_KEY, emptyState, readState, saveState, markUsed, saveEditor, deletePersonal, validRecord } from '../src/pages/hey-grok/storage.js'
const annex = JSON.parse(readFileSync(new URL('./fixtures/hey-grok/annex-20261026.json', import.meta.url)))
assert.equal(annex.length, 80)
assert.equal(NEW_SELECTION.length, 80)
assert.equal(new Set(BANK.map(q => q.id)).size, BANK.length)
assert.equal(new Set(BANK.map(q => q.text.toLowerCase())).size, BANK.length)
assert.equal(new Set(NEW_SELECTION.map(q => q.reference)).size, 80)
assert.deepEqual(NEW_SELECTION.map(q => q.reference), Array.from({ length: 80 }, (_, i) => i + 1))
assert.equal(BANK.filter(q => q.collection === 'new-selection').length, 80)
for (const original of QUESTIONS) {
  const current = BANK_BY_ID.get(original.id)
  assert(current, `Legacy ID removed: ${original.id}`)
  assert(current.text === original.text || current.previousText === original.text, original.id)
  assert.equal(current.archived, Object.hasOwn(ARCHIVE_REASONS, original.id))
}
for (const source of annex) {
  const entry = NEW_SELECTION.find(q => q.reference === source.reference)
  assert.equal(entry.text, source.text, `Validated source changed: ${source.reference}`)
  const q = BANK_BY_ID.get(entry.id)
  assert.equal(q.text, SELECTION_EDITS[source.reference] ?? source.text)
  assert.deepEqual(q.text.match(/\d+/g), source.text.match(/\d+/g), 'Amounts/ages/durations must remain identical')
}
assert.deepEqual(Object.keys(SELECTION_EDITS), ['61'])
for (const definitions of [THEMES, ALL_MECHANICS, SUBJECTS]) assert.equal(new Set(definitions.map(item => item.id)).size, definitions.length)
for (const q of BANK) {
  assert(THEMES.some(theme => theme.id === q.theme), q.id)
  assert(ALL_MECHANICS.some(m => m.id === q.mechanic), q.id)
  assert(SUBJECTS.some(s => s.id === q.subject), q.id)
  assert(tweetStatus(q.text).canCopy, q.id)
  assert(!/imp[oô]ts?|prestations? sociales?|aides? au logement|fiscalit/iu.test(q.text), q.id)
}
assert.equal(NEW_SELECTION.find(q => q.reference === 46).id, 'marques-11')
// X counts the actual copied string, including optional natural punctuation.
for (const prefix of ['Hey @grok, ', 'Hey @grok\n\n']) {
  const available = 280 - tweetStatus(prefix).length
  assert(tweetStatus(prefix + 'a'.repeat(available)).canCopy)
  assert.equal(tweetStatus(prefix + 'a'.repeat(available + 1)).over, 1)
}
assert.equal(tweetStatus('Hey @grok, 👨‍👩‍👧‍👦').length, 13)
assert.equal(tweetStatus('Hey @grok, 漢字').length, 15)
assert.equal(tweetStatus('Hey @grok, e\u0301').length, 12)
assert.equal(tweetStatus('Hey @grok\n\nQuestion ?').length, 21)
assert.equal(tweetStatus('Hey @grok, https://example.com/long-path').length, 34)
for (const text of ['', ' ', 'Hey @grok', 'Hey @grok\n\n', 'Hey @grokX question', 'Hey @grok, \uffff']) assert(!tweetStatus(text).canCopy, text)
let prefs = emptyState(), filters = emptyFilters()
const active = BANK.filter(q => !q.archived)
assert.deepEqual(filterQuestions(BANK, filters, prefs), active)
assert.equal(filterQuestions(BANK, { ...filters, newOnly: true }, prefs).length, 80)
assert(filterQuestions(BANK, { ...filters, search: 'immobilier' }, prefs).some(q => q.reference === 6))
prefs.favorites = ['bourse-14']; prefs.used = ['bourse-14']
prefs.history['bourse-14'] = { markedAt: null, text: 'Hey @grok, texte historique gelé.', theme: 'retraite', legacy: true }
assert.equal(filterQuestions(BANK, filters, prefs, 'favoris')[0].id, 'bourse-14')
assert.equal(filterQuestions(BANK, { ...filters, search: 'gelé', theme: 'retraite' }, prefs, 'historique')[0].id, 'bourse-14')
assert.equal(filterQuestions(BANK, { ...filters, unusedOnly: true }, prefs, 'historique').length, 0)
assert.equal(filterQuestions(BANK, { ...filters, archivedOnly: true }, prefs).length, Object.keys(ARCHIVE_REASONS).length)
for (const theme of ['', ...THEMES.map(t => t.id)]) for (const newOnly of [false, true]) for (const publicOnly of [false, true]) for (const debateOnly of [false, true]) {
  const actual = filterQuestions(BANK, { ...filters, theme, newOnly, publicOnly, debateOnly, unusedOnly: true }, prefs)
  assert.deepEqual(actual, active.filter(q => (!theme || q.theme === theme) && (!newOnly || q.collection === 'new-selection') && (!publicOnly || q.public) && (!debateOnly || q.debate) && !prefs.used.includes(q.id)))
  const seen = []
  while (seen.length < actual.length) {
    const batch = drawBatch(actual, seen, prefs.used, 6, () => .4)
    assert(batch.length > 0 && batch.length <= 6)
    for (const q of batch) { assert(!seen.includes(q.id)); assert(actual.includes(q)); seen.push(q.id) }
  }
  assert.deepEqual(drawBatch(actual, seen, prefs.used), [])
}
const workspace = { view: 'explorer', editor: null, filters: { ...emptyFilters(), newOnly: true, search: 'actions' } }
const privateWorkspace = switchPersonalWorkspace(workspace)
assert(privateWorkspace.filters.personalOnly && !privateWorkspace.filters.newOnly && !privateWorkspace.filters.search)
assert.deepEqual(switchPersonalWorkspace(privateWorkspace).filters, workspace.filters)
assert.deepEqual(privateWorkspace.bankFilters, workspace.filters)
const sample = BANK.slice(0, 10), used = sample.slice(0, 5).map(q => q.id)
assert(drawBatch(sample, [], used, 5, () => .9).every(q => !used.includes(q.id)))
assert.deepEqual(drawBatch([], [], []), [])
const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
const legacy = { favorites: ['marques-11', 'bourse-14'], used: ['marques-11', 'bourse-14'], drafts: { 'marques-11': 'Hey @grok, mon texte personnalisé.', 'bourse-14': 'Hey @grok, brouillon archivé.' }, otherPreference: { keep: true } }
values.set(STORAGE_KEY, JSON.stringify(legacy))
const originalRaw = values.get(STORAGE_KEY), loaded = readState(storage)
assert.equal(loaded.error, '')
assert.equal(values.get(STORAGE_KEY), originalRaw, 'Read must not write a migration')
assert.equal(loaded.value.version, 2)
assert(filterQuestions(BANK, { ...emptyFilters(), draftsOnly: true }, loaded.value).some(q => q.id === 'bourse-14'), 'Archived drafts must remain discoverable without the Archives filter')
assert.deepEqual(loaded.value.favorites, legacy.favorites)
assert.deepEqual(loaded.value.drafts, legacy.drafts)
assert.deepEqual(loaded.value.otherPreference, legacy.otherPreference)
assert.equal(loaded.value.history['marques-11'].markedAt, null)
assert.equal(loaded.value.history['marques-11'].text, legacy.drafts['marques-11'])
let saved = saveState(loaded.value, loaded.raw, storage)
assert.equal(saved.error, '')
assert.equal(JSON.parse(values.get(STORAGE_KEY)).version, 2)
assert.deepEqual(readState(storage).value, loaded.value)
const draft = newEditor(BANK_BY_ID.get('marques-11'), legacy.drafts['marques-11'])
let editing = { ...loaded.value, workspace: { ...loaded.value.workspace, editor: { ...draft, text: 'Hey @grok, ' + 'a'.repeat(400) } } }
assert.equal(saveState(editing, saved.raw, storage).error, '', 'Overlong drafts remain saveable')
assert.equal(readState(storage).value.workspace.editor.text, editing.workspace.editor.text)
const bankBefore = BANK_BY_ID.get('marques-11').text
let personalState = saveEditor(editing, 'personal-test', '2026-10-26T12:00:00.000Z')
assert.equal(BANK_BY_ID.get('marques-11').text, bankBefore)
assert.equal(personalState.personal[0].originId, 'marques-11')
assert.deepEqual(personalState.favorites, legacy.favorites)
assert.deepEqual(personalState.used, legacy.used)
assert.equal(personalState.workspace.editor, null)
assert(!Object.hasOwn(personalState.drafts, 'marques-11'))
const question = personalState.personal[0]
personalState = markUsed(personalState, question, question.text, '2026-10-26T12:00:00.000Z')
assert.equal(personalState.history['personal-test'].text, question.text)
personalState = { ...personalState, workspace: { ...personalState.workspace, editor: { ...newEditor(question), text: 'Hey @grok, nouveau texte.' } } }
personalState = saveEditor(personalState, 'ignored-new-id')
assert.equal(personalState.personal.length, 1)
assert.equal(personalState.personal[0].id, 'personal-test')
assert.equal(personalState.history['personal-test'].text, question.text, 'History is an immutable marked-text snapshot')
personalState = deletePersonal(personalState, 'personal-test')
assert(personalState.personal[0].deleted)
assert(personalState.history['personal-test'])
assert.equal(filterQuestions([...BANK, ...personalState.personal], { ...filters, personalOnly: true }, personalState).length, 0)
assert.equal(filterQuestions([...BANK, ...personalState.personal], filters, personalState, 'historique').some(q => q.id === 'personal-test'), true)
personalState = markUsed(personalState, question, 'unused')
assert(!personalState.used.includes('personal-test')); assert(!personalState.history['personal-test'])
// Missing, corrupt, unavailable, newly corrupt and cross-tab writes preserve bytes.
assert.equal(STORAGE_KEY, 'el-hey-grok-v1')
for (const raw of ['broken', 'null', '3', '[]', '{"favorites":[],"used":[],"drafts":{},"personal":[null]}', JSON.stringify({ ...emptyState(), version: 3 })]) {
  values.set(STORAGE_KEY, raw)
  assert(readState(storage).error)
  assert(saveState(emptyState(), raw, storage).error)
  assert.equal(values.get(STORAGE_KEY), raw)
}
values.set(STORAGE_KEY, JSON.stringify(emptyState()))
const first = readState(storage)
values.set(STORAGE_KEY, JSON.stringify({ ...emptyState(), favorites: ['immobilier-01'] }))
const otherRaw = values.get(STORAGE_KEY)
assert.match(saveState(first.value, first.raw, storage).error, /autre onglet/)
assert.equal(values.get(STORAGE_KEY), otherRaw)
values.set(STORAGE_KEY, '{broken-after-read')
assert(saveState(first.value, first.raw, storage).error)
assert.equal(values.get(STORAGE_KEY), '{broken-after-read')
assert(saveState(emptyState(), null, { getItem() { throw Error('denied') } }).error)
assert(saveState(emptyState(), null, { getItem: () => null, setItem() { throw Error('quota') } }).error)
assert(!validRecord({ ...emptyState(), personal: [null] }))
for (const model of TEMPLATES) {
  const params = templateDefaults(model.id)
  assert.equal(Object.keys(params).length, model.fields.length)
  const text = renderTemplate(model.id, params)
  if (model.id !== 'libre') assert(tweetStatus(text).canCopy)
  assert.equal(text, renderTemplate(model.id, params), 'Templates must be deterministic')
}
assert.deepEqual(templateDefaults('libre'), {})
assert(renderTemplate('objectif', { objectif: '1 000 000 €', duree: '30 ans' }).includes('1 000 000 € en 30 ans'))
console.log(JSON.stringify({ total: BANK.length, active: active.length, legacyIds: QUESTIONS.length, added: BANK.length - QUESTIONS.length, reused: NEW_SELECTION.filter(q => QUESTIONS.some(old => old.id === q.id)).length, archived: BANK.filter(q => q.archived).length, newSelection: NEW_SELECTION.length, edits: Object.keys(SELECTION_EDITS), maxWeightedLength: Math.max(...BANK.map(q => tweetStatus(q.text).length)) }, null, 2))
console.log('Hey @Grok: all 80 intentions, themes, archive retention, X counts, batch cycles, templates and guarded v1→v2 migration passed.')
