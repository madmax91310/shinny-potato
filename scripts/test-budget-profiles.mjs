import assert from 'node:assert/strict'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, blankBudget, buildBudgetText, sourceReply, validBudget } from '../src/pages/budget-profiles/lib.js'
import { DRAFT_KEY, USAGE_KEY, loadDraft, loadUsage, saveDraft, saveUsage } from '../src/pages/budget-profiles/storage.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'

assert(BUDGET_PROFILES.length > 0)
assert.equal(new Set(BUDGET_PROFILES.map(p => p.id)).size, BUDGET_PROFILES.length)
for (const p of BUDGET_PROFILES) {
  assert(validBudget(p), p.id)
  assert.deepEqual(analyzeBudget(p).errors, [], p.id)
  assert(p.source.url.startsWith('https://'))
  assert(p.publishedAt <= p.checkedAt)
  assert(buildBudgetText(p).includes(p.source.publisher))
  assert(sourceReply(p).includes(p.source.url))
  assert(!buildBudgetText(p).includes('abonné'), 'A public witness must not become a received subscriber testimony')
}
// Independent reconciliation of the three retained source ledgers.
assert.equal(analyzeBudget(BUDGET_PROFILES.find(p => p.id === 'reddit-actif-2026-09-27')).available, 307)
const couple = BUDGET_PROFILES.find(p => p.id === 'reddit-couple-nord-2026-07-09')
assert.equal(analyzeBudget(couple).expenses, 2017)
assert.equal(analyzeBudget(couple).available, 447)
assert.equal(analyzeBudget(couple).balance, 347)
assert.equal(analyzeBudget(BUDGET_PROFILES.find(p => p.id === 'reddit-salarie-26-2026-01-04')).available, 1205)
// A capacity declaration is not a transfer and never reduces available cash.
const fixture = { ...blankBudget(), name: 'Test', income: [{ label: 'Revenu', amount: 1000 }], expenses: [{ label: 'Dépense', amount: 800 }], capacity: 150 }
assert.equal(analyzeBudget(fixture).balance, 200)
assert.match(buildBudgetText({ ...fixture, age: 32 }), /Test · 32 ans/)
assert.equal(analyzeBudget({ ...fixture, savings: [{ label: 'Virement prévu', amount: 100 }] }).balance, 100)
assert.equal(analyzeBudget({ ...fixture, income: [{ label: 'Revenu', amount: 0.30 }], expenses: [{ label: 'A', amount: 0.1 }, { label: 'B', amount: 0.2 }], capacity: null }).balance, 0)
const deficit = { ...fixture, expenses: [{ label: 'Dépense', amount: 1200 }] }
assert.equal(analyzeBudget(deficit).balance, -200)
assert.match(buildBudgetText(deficit), /Déficit avant épargne/)
for (const value of [null, NaN, Infinity, -1, '50']) {
  assert(analyzeBudget({ ...fixture, expenses: [{ label: 'Dépense', amount: value }] }).errors.length)
}
assert(analyzeBudget({ ...fixture, name: '' }).errors.length)
assert(analyzeBudget({ ...fixture, expenses: [] }).errors.length)
assert(!validBudget({ ...fixture, source: { publisher: 'Test', title: 'Source', url: 'javascript:alert(1)' } }))
assert(!validBudget({ ...couple, checkedAt: undefined }))
assert.equal(buildBudgetText(blankBudget()), '')
assert(TOOLS.find(t => t.to === '/le-budget-de' && t.title === 'Le budget de…'))
assert(HOME_TOOLS.some(t => t.to === '/le-budget-de'))

const previous = globalThis.localStorage
const memory = new Map()
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
try {
  const fallback = { profile: fixture, text: 'Brouillon', edited: true }
  assert(saveDraft(fallback)); assert.deepEqual(loadDraft(null).value, fallback)
  memory.set(DRAFT_KEY, '{broken')
  assert.equal(loadDraft(fallback).readable, false)
  assert.equal(saveDraft(fallback), false)
  assert.equal(memory.get(DRAFT_KEY), '{broken')
  memory.set(USAGE_KEY, JSON.stringify({ unknown: true }))
  assert.equal(loadUsage().readable, false); assert.equal(saveUsage(['x']), false)
  assert.equal(memory.get(USAGE_KEY), JSON.stringify({ unknown: true }))
  memory.delete(USAGE_KEY); assert(saveUsage(['x'])); assert.deepEqual(loadUsage().value, ['x'])
} finally { globalThis.localStorage = previous }
console.log(`Budget profiles: ${BUDGET_PROFILES.length} source ledgers, reconciliation, capacities, deficits, invalid inputs, discovery and storage verified.`)
