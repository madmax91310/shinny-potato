import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_EDITORIAL_CREATIONS } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetImageExpenses, budgetPublicIncomeRows, budgetPublicPresentation, buildBudgetText, publicationContextFor, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { budgetPublicBasis, budgetQualification } from '../src/pages/budget-profiles/presentation.js'
import { budgetBeforePelCorrection } from './budget-audit-history.mjs'

const audit = JSON.parse(readFileSync(new URL('../docs/budget-final-copy/2026-11-07.json', import.meta.url)))
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
assert.equal(hash(BUDGET_ORIGINAL_PROFILES), audit.originalProfilesHash, 'Copy edits never rewrite a source photograph')
assert.deepEqual(BUDGET_PROFILES.map(p => p.id).sort(), Object.keys(audit.profiles).sort())
const forbidden = /exemple de budget|profil fictif|budget reconstitu|version éditoriale|scénario|simulation|hypothèse|préparé le|vérifié le|impôt non précisé|traitement de l’impôt n’est pas précisé|dépenses moyennes d’une autre période/i
for (const p of BUDGET_PROFILES) {
  const expected = audit.profiles[p.id], review = BUDGET_EDITORIAL_CREATIONS[p.id].polishReview
  const text = buildBudgetText(p), context = publicationContextFor(p), view = budgetPublicPresentation(p)
  assert.equal(review.baseline, audit.baseline)
  assert.equal(review.sourceConsultedAgain, false)
  assert.equal(review.monthlyAmountsChanged, false)
  assert.deepEqual(context.evidence.at(-1).polishReview.notes, review.notes)
  assert.equal(budgetFinancialReference(budgetBeforePelCorrection(p)), expected.financialReference, `${p.id}: preserve historical rows except the documented PEL correction`)
  const cents = key => p[key].reduce((sum, row) => sum + Math.round(row.amount * 100), 0)
  const income = cents('income'), expenses = cents('expenses'), savings = cents('savings'), balance = income - expenses - savings
  const expectedCurrent = p.id === 'prepared-gritz-2026-10-30' ? { ...expected.before, savings:39500, balance:2900 } : expected.before
  assert.deepEqual({ income, expenses, savings, balance }, expectedCurrent, p.id)
  const calculated = analyzeBudget(p)
  for (const [key, value] of Object.entries({ income, expenses, savings, balance })) assert.equal(Math.round(calculated[key] * 100), value)
  assert(Math.abs(calculated.expenseShare - expenses / income * 100) < 1e-10)
  for (const mode of ['detailed', 'summary']) assert.equal(budgetImageExpenses(p, mode).reduce((sum, row) => sum + Math.round(row.amount * 100), 0), expenses)
  for (const [key, value] of Object.entries(expected.sourcePeriod)) assert.deepEqual(p[key], value)
  assert(!forbidden.test(text), p.id)
  assert(!/20\d{2}| — /.test(text.split('\n')[0]))
  assert(!forbidden.test([view.name, view.job, view.household, budgetPublicBasis(p, view.basis), ...budgetPublicIncomeRows(p).map(row => row.label), ...p.expenses.map(row => row.label), ...p.savings.map(row => row.label)].join(' ')))
  if (expected.tax) {
    assert(!/après (?:l’)?imp[oô]t/i.test(budgetPublicIncomeRows(p).map(row => row.label).join(' ')), 'Removing a fiscal note does not invent an after-tax wage')
    assert(review.tax)
  }
  const custom = { profile: p, text: 'Mon ancien texte personnalisé\nMes propres phrases et chiffres.', edited: true, textFinance: expected.financialReference }
  assert.equal(refreshBudgetDraft(custom).text, custom.text)
  assert.equal(staleBudgetText(refreshBudgetDraft(custom)), p.id === 'prepared-gritz-2026-10-30', 'Only the PEL correction marks the old custom financial text as stale')
  assert.equal(refreshBudgetDraft({ ...custom, edited: false }).text, text)
  assert(context.questions.length + Number(Boolean(context.budgetQuestion)) <= 2)
}
const profile = name => BUDGET_PROFILES.find(p => p.name === name)
const story = name => publicationContextFor(profile(name)).paragraphs.map(p => p.text).join(' ')
const hadrien = profile('Hadrien')
assert.equal(budgetQualification(hadrien), 'Budget prévu')
assert.equal(BUDGET_EDITORIAL_CREATIONS[hadrien.id].polishReview.chronology.expensesReobserved, false)
assert.equal(hadrien.period, 'Salaire 2026 · dépenses moyennes 2025')
assert(/moyenne de 2025/.test(buildBudgetText(hadrien)))
assert(/avait/.test(story('Simon')) && /réfléchissait/.test(story('Simon')))
assert(/avant l’arrivée/i.test(story('Adrien et Léa')) && /gardait/.test(story('Adrien et Léa')))
assert(/préparait la fin/.test(story('Élodie')) && !/septembre 2026/.test(buildBudgetText(profile('Élodie'))))
assert(/30 000 €/.test(story('Florian')) && /15 000 €/.test(story('Florian')))
assert(!/ne peuvent pas être réservés|ne s’ajoutent pas/.test(story('Florian') + story('Émilien')))
// Necessary fiscal conditions and explicit tax expenses remain public.
for (const name of ['Mathieu', 'Samuel', 'Adrien et Léa']) { const p=profile(name); assert(p.expenses.some(row => /imp[oô]ts?/i.test(row.label)), 'Taxes remain in the expense ledger'); assert(/avant imp[oô]t/i.test(p.income.map(row=>row.label).join(' ')), 'The private fiscal basis remains available') }
assert(/régulariser/.test(buildBudgetText(profile('Lucie'))))
assert(/revenus locatifs sont nets de charges, de crédits et d’impôt/.test(buildBudgetText(profile('Vincent et Sarah'))))
console.log(`Budget final copy: ${BUDGET_PROFILES.length} independent cent ledgers, unchanged financial references, fiscal scope, chronology and customized drafts verified.`)
