import assert from 'node:assert/strict'
import { blankBudget, analyzeBudget, buildBudgetText, refreshBudgetDraft, budgetImageExpenses, MAX_BUDGET_LINES } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { loadWorkspace, saveDraft, findSavedDraft, exportBudgetBackup, parseBudgetBackup, previewBudgetImport, restoreBudgetBackup, budgetStorageSnapshot, savePublished, saveQueued, WORKSPACE_KEY } from '../src/pages/budget-profiles/storage.js'

const empty = blankBudget()
assert.equal(empty.question, '')
assert.equal(empty.incomeBasis, 'Montants mensuels', 'A new profile does not assume an after-tax salary')
assert.equal(buildBudgetText(empty), '')
const p = { ...empty, id: 'participation-subscriber-test', name: 'Éva', age: 38, job: 'Salariée',
  income: [{ label: 'Salaire net', amount: 2123.45 }, { label: 'Pension', amount: 250.50 }],
  expenses: [{ label: 'Logement', amount: 820, category: 'housing' }, { label: 'Courses', amount: 310.25, category: 'food' }, { label: 'Santé', amount: 42.50, category: 'health' }],
  savings: [{ label: 'Livret de précaution', amount: 300 }, { label: 'PEA', amount: 150 }] }
const questions = 'Quel budget courses avez-vous pour deux ?\n\n💬 Vous garderiez quelle somme sur le compte ?'
for (const currency of ['EUR', 'CHF']) {
  const profile = { ...p, currency }
  assert.deepEqual(analyzeBudget(profile).errors, [])
  assert.deepEqual(['income', 'expenses', 'savings', 'available', 'balance'].map(key => Math.round(analyzeBudget(profile)[key] * 100)), [237395, 117275, 45000, 120120, 75120])
  assert(!buildBudgetText(profile).includes('💬'), 'No generated default question')
  const withQuestions = { ...profile, question: questions }
  const before = buildBudgetText(withQuestions)
  assert(before.endsWith('💬 Quel budget courses avez-vous pour deux ?\n💬 Vous garderiez quelle somme sur le compte ?'))
  assert(!before.includes('💬 💬'))
  const changed = { ...withQuestions, expenses: [...withQuestions.expenses, { label: 'Téléphone', amount: 20, category: 'bills' }] }
  assert.equal(analyzeBudget(changed).balance, 731.20)
  assert.equal(changed.question, questions)
  assert(buildBudgetText(changed).endsWith(before.slice(before.indexOf('💬'))), 'Changing rows preserves manual questions')
  const removed = { ...changed, expenses: changed.expenses.filter(row => row.label !== 'Téléphone') }
  assert.equal(buildBudgetText(removed), before)
  for (const mode of ['detailed', 'summary']) assert.equal(budgetImageExpenses(changed, mode).reduce((sum, row) => sum + Math.round(row.amount * 100), 0), 119275)
  assert(!buildBudgetText({ ...withQuestions, question: '' }).includes('💬'), 'Removing questions never inserts another question')
}
const full = { ...p, ...Object.fromEntries(['income', 'expenses', 'savings'].map(key => [key, Array.from({ length: MAX_BUDGET_LINES }, (_, i) => ({ label: `${key} ${i + 1}`, amount: key === 'income' ? 100 : 80 }))])) }
assert.deepEqual(analyzeBudget(full).errors, [])
assert.equal(analyzeBudget(full).balance, -1440)
assert(analyzeBudget({ ...full, expenses: [...full.expenses, { label: 'Au-delà de la limite', amount: 1 }] }).errors.length)
assert(analyzeBudget({ ...p, expenses: [] }).errors.length)

const memory = new Map(), previous = globalThis.localStorage
const storage = { get length() { return memory.size }, key: i => [...memory.keys()][i], getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
globalThis.localStorage = storage
try {
  loadWorkspace()
  const first = { profile: { ...p, question: questions }, text: buildBudgetText({ ...p, question: questions }), edited: false }
  const second = { profile: { ...p, id: 'participation-second', name: 'Noé', currency: 'CHF', question: 'Quels frais aviez-vous oubliés ?' }, text: 'Mon texte personnalisé', edited: true, textFinance: budgetFinancialReference(p) }
  assert(saveDraft(first)); assert(saveDraft(second))
  assert(savePublished([p.id], { [p.id]: '2026-11-01' })); assert(saveQueued([second.profile.id]))
  const backup = parseBudgetBackup(JSON.stringify(exportBudgetBackup()))
  assert.equal(backup.drafts.length, 2)
  assert.equal(backup.drafts.find(d => d.profile.id === p.id).profile.question, questions)
  assert.equal(backup.publicationDates[p.id], '2026-11-01')
  backup.drafts[0].profile.question = 'Question de mon autre appareil ?'
  assert(previewBudgetImport(backup).conflicts.includes(p.id))
  assert(restoreBudgetBackup(backup, 'keep-local', budgetStorageSnapshot()))
  assert.equal(findSavedDraft(p.id).profile.question, questions)
  assert(restoreBudgetBackup(backup, 'use-imported', budgetStorageSnapshot()))
  assert.equal(findSavedDraft(p.id).profile.question, 'Question de mon autre appareil ?')
  assert.equal(findSavedDraft(second.profile.id).text, second.text)
  const changed = { ...p, expenses: [...p.expenses, { label: 'Téléphone', amount: 20 }] }
  const custom = refreshBudgetDraft({ profile: changed, text: second.text, edited: true, textFinance: budgetFinancialReference(p) })
  assert.equal(custom.text, second.text); assert(staleBudgetText(custom))
  const concurrent = JSON.parse(memory.get(WORKSPACE_KEY)); concurrent.queued.push('autre-onglet'); memory.set(WORKSPACE_KEY, JSON.stringify(concurrent))
  assert.equal(saveDraft(first), false)
  memory.set(WORKSPACE_KEY, '{broken'); loadWorkspace(); assert.equal(saveDraft(first), false); assert.equal(memory.get(WORKSPACE_KEY), '{broken')
} finally { globalThis.localStorage = previous }
console.log('Subscriber profiles: cent ledgers, add/remove rows, 72-row limit, manual questions, EUR/CHF, multiple saved profiles, backup conflicts and protected custom text passed.')
