import assert from 'node:assert/strict'
import { BUDGET_EDITORIAL, BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, blankBudget, budgetDisplayName, budgetExpenseSections, buildBudgetText, euro, refreshBudgetDraft, sourceReply, validBudget } from '../src/pages/budget-profiles/lib.js'
import { DRAFT_KEY, PUBLISHED_KEY, USAGE_KEY, loadDraft, loadPublished, loadUsage, saveDraft, savePublished, saveUsage } from '../src/pages/budget-profiles/storage.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'

assert(BUDGET_PROFILES.length > 0)
assert.equal(new Set(BUDGET_PROFILES.map(p => p.id)).size, BUDGET_PROFILES.length)
for (const p of BUDGET_PROFILES) {
  assert(validBudget(p), p.id)
  assert.deepEqual(analyzeBudget(p).errors, [], p.id)
  assert(p.source.url.startsWith('https://'))
  assert(p.publishedAt <= p.checkedAt)
  const text = buildBudgetText(p)
  assert(text.includes(budgetDisplayName(p)))
  assert.match(text, /prénoms? fictifs?/)
  assert(!text.includes(p.period), 'Publication dates stay in the source panel, not the tweet')
  assert(!text.includes(p.source.publisher), 'Sources remain available in the separate source reply')
  assert(!text.includes('Situation familiale non précisée'))
  for (const row of p.expenses) assert(text.includes(`${row.label} : ${euro(row.amount, p.currency)}`), row.label)
  const sections = budgetExpenseSections(p)
  assert.deepEqual(sections.flatMap(s => s.rows).map(r => r.label).sort(), p.expenses.map(r => r.label).sort(), 'Every expense appears once')
  if (p.kind === 'planned') assert(text.includes('Budget prévu'))
  if (p.age === null) assert(!/\d+ ans/.test(text.split('\n')[0]))
  assert(sourceReply(p).includes(p.source.url))
  assert(!buildBudgetText(p).includes('abonné'), 'A public witness must not become a received subscriber testimony')
}
assert.equal(new Set(BUDGET_PROFILES.map(budgetDisplayName)).size, BUDGET_PROFILES.length)
for (const id of Object.keys(BUDGET_EDITORIAL)) assert(BUDGET_PROFILES.some(p => p.id === id), id)
const grouped = BUDGET_PROFILES.find(p => p.id === 'finary-alternant-22-2025-05-15')
assert.equal(budgetExpenseSections(grouped).length, 1)
assert.match(buildBudgetText(grouped), /pas intégralement une épargne nouvelle/)
const detailed = BUDGET_PROFILES.find(p => p.id === 'finary-alternant-19-2025-09-27')
assert.equal(budgetExpenseSections(detailed).length, 2)
assert.equal(budgetExpenseSections({ ...detailed, expenses: [...detailed.expenses, { label: 'Poste non ventilé', amount: 10 }] }).length, 1)
assert(buildBudgetText(detailed).includes(`Reste avant épargne : ${euro(200.01)}`))
assert(buildBudgetText(detailed).includes(`Solde après ces versements : ${euro(50.01)}`))
assert.match(buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'finary-ingenieur-aero-2025-11-30')), /Net avant impôt/)
assert.match(buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'finary-fonctionnaire-30-2025-05-21')), /vacances ne sont pas comprises/)
const techText = buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'reddit-tech-26-2026-02-06'))
assert(techText.includes(`Reste avant épargne : ${euro(830)}`))
assert(techText.includes(`Solde après ces versements : ${euro(230)}`))
assert(!techText.includes('Épargne déjà constituée'), 'Missing assets are not invented')
const generatedDraft = { profile: structuredClone(BUDGET_PROFILES[0]), text: 'Ancien texte généré', edited: false }
assert.equal(refreshBudgetDraft(generatedDraft).text, buildBudgetText(BUDGET_PROFILES[0]))
assert.equal(refreshBudgetDraft({ ...generatedDraft, text: 'Mon texte personnel', edited: true }).text, 'Mon texte personnel')
// Independent reconciliation of the three retained source ledgers.
assert.equal(analyzeBudget(BUDGET_PROFILES.find(p => p.id === 'reddit-actif-2026-09-27')).available, 307)
const couple = BUDGET_PROFILES.find(p => p.id === 'reddit-couple-nord-2026-07-09')
assert.equal(analyzeBudget(couple).expenses, 2017)
assert.equal(analyzeBudget(couple).available, 447)
assert.equal(analyzeBudget(couple).balance, 347)
assert.equal(analyzeBudget(BUDGET_PROFILES.find(p => p.id === 'reddit-salarie-26-2026-01-04')).available, 1205)

// Source-ledger regressions: keep transfers, computed capacity and unallocated cash distinct.
for (const [id, income, expenses, savings, balance] of [
  ['finary-ingenieur-aero-2025-11-30', 3050, 2642, 408, 0],
  ['finary-alternant-22-2025-05-15', 1500, 500, 1000, 0],
  ['finary-fonctionnaire-30-2025-05-21', 2155, 1532.01, 0, 622.99],
  ['finary-alternant-19-2025-09-27', 1221, 1020.99, 150, 50.01],
  ['reddit-couple-35-2025-10-15', 5050, 4439, 0, 611],
  ['reddit-tech-26-2026-02-06', 1900, 1070, 600, 230],
  ['reddit-alternant-20-2025-09-03', 900, 400, 500, 0],
]) {
  const profile = BUDGET_PROFILES.find(p => p.id === id)
  assert(profile, id)
  const actual = analyzeBudget(profile)
  assert.deepEqual([actual.income, actual.expenses, actual.savings, actual.balance], [income, expenses, savings, balance], id)
}
// Independent source ledgers for the ten added testimonies (no generated totals as expectations).
for (const [id, income, expenses, savings, balance] of [
  ['finary-cyber-24-2026-08-27', 2800, 900, 0, 1900],
  ['finary-ingenieur-21-2025-03-08', 2550, 852, 300, 1398],
  ['finary-alternant-21-2025-05-08', 1090, 210, 750, 130],
  ['finary-locataire-25-2025-11-08', 2900, 2160, 0, 740],
  ['finary-batiment-21-2025-09-30', 1500, 300, 1200, 0],
  ['finary-etudiant-20-2025-03-19', 1200, 400, 0, 800],
  ['finary-celibataire-31-2026-02-03', 2400, 1775, 625, 0],
  ['finary-frontalier-37-2025-06-30', 6700, 3320, 1572, 1808],
  ['finary-bois-18-2025-10-16', 2200, 1373, 0, 827],
  ['mustachian-ingenieur-28-2025-08-16', 7393, 3644, 0, 3749],
]) {
  const profile = BUDGET_PROFILES.find(p => p.id === id)
  assert(profile, id)
  const actual = analyzeBudget(profile)
  assert.deepEqual([actual.income, actual.expenses, actual.savings, actual.balance], [income, expenses, savings, balance], id)
}
const swiss = BUDGET_PROFILES.find(p => p.currency === 'CHF')
assert.equal(swiss.capacity, 3750, 'The source rounded average savings must not become a fabricated transfer or be silently changed')
assert.match(buildBudgetText(swiss), /revenus exceptionnels inclus/)
assert.match(buildBudgetText(swiss), /écart de 1 CHF/)
assert(!buildBudgetText(swiss).includes('€'), 'No euro label on the Swiss budget')
assert.equal(euro(100, 'CHF'), '100 CHF')
assert(validBudget({ ...swiss, kind: 'participant', source: null }), 'Swiss adaptations retain their currency')
assert(!validBudget({ ...swiss, currency: 'USD' }))
assert(!validBudget({ ...swiss, currency: null }))
const futureApprentice = BUDGET_PROFILES.find(p => p.id === 'finary-etudiant-20-2025-03-19')
assert.equal(futureApprentice.kind, 'planned')
assert.match(buildBudgetText(futureApprentice), /septembre 2025/)
assert.match(buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'finary-celibataire-31-2026-02-03')), /enveloppe calculée/)

const apprentice = BUDGET_PROFILES.find(p => p.id === 'reddit-alternant-20-2025-09-03')
assert.equal(apprentice.kind, 'planned')
assert.match(buildBudgetText(apprentice), /Logé et nourri chez ses parents/)
const couple35 = BUDGET_PROFILES.find(p => p.id === 'reddit-couple-35-2025-10-15')
assert.equal(couple35.capacity, null)
assert.equal(couple35.savings.length, 0)
assert.equal(BUDGET_PROFILES.find(p => p.id === 'finary-fonctionnaire-30-2025-05-21').capacity, 622.99)

// A capacity declaration is not a transfer and never reduces available cash.
const fixture = { ...blankBudget(), name: 'Test', income: [{ label: 'Revenu', amount: 1000 }], expenses: [{ label: 'Dépense', amount: 800 }], capacity: 150 }
assert.equal(analyzeBudget(fixture).balance, 200)
assert.match(buildBudgetText({ ...fixture, age: 32 }), /Budget de Test, 32 ans/)
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
  assert.deepEqual(loadPublished().value, [], 'Historical usage never declares publication')
  assert(savePublished(['published-profile'])); assert.deepEqual(loadPublished().value, ['published-profile'])
  assert.deepEqual(loadUsage().value, ['x'], 'Publication never overwrites historical usage')
  assert(savePublished([])); assert.deepEqual(loadPublished().value, [])
  memory.set(PUBLISHED_KEY, '{broken')
  assert.equal(loadPublished().readable, false); assert.equal(savePublished(['x']), false)
  assert.equal(memory.get(PUBLISHED_KEY), '{broken')
  memory.set(PUBLISHED_KEY, JSON.stringify({ unexpected: true }))
  assert.equal(loadPublished().readable, false); assert.equal(savePublished([]), false)
  memory.delete(PUBLISHED_KEY)
  globalThis.localStorage.setItem = () => { throw new Error('Storage blocked') }
  assert.equal(savePublished(['x']), false)
} finally { globalThis.localStorage = previous }
console.log(`Budget profiles: ${BUDGET_PROFILES.length} source ledgers, adaptive texts, expense coverage, reconciliation, draft migration and independent publication storage verified.`)
