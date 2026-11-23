// This dated audit protects the original source-backed collection. The live bank, including new editorial characters, is checked by test-budget-profiles and test-budget-new-profiles.
import assert from 'node:assert/strict'
import previous from '../src/pages/budget-profiles/editorial-lives-2026-11-06.json' with { type: 'json' }
import patches from '../src/pages/budget-profiles/editorial-copy-2026-11-14.json' with { type: 'json' }
import { reviseEditorialCopy } from '../src/pages/budget-profiles/editorial-copy.js'
import { BUDGET_REFERENCE_PROFILES as BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText, publicationContextFor } from '../src/pages/budget-profiles/lib.js'

assert.deepEqual(Object.keys(patches).sort(), BUDGET_PROFILES.map(p => p.id).sort(), 'The review covers exactly the complete current collection')
for (const profile of BUDGET_PROFILES) {
  const original = previous[profile.id], snapshot = JSON.stringify(original)
  const revised = reviseEditorialCopy(original, patches[profile.id])
  assert.equal(JSON.stringify(original), snapshot, 'A copy review must not mutate prior evidence')
  for (const field of ['income', 'expenses', 'savings', 'capacity']) {
    if (profile.id === 'prepared-justbob-2026-10-30' && field === 'savings') assert.deepEqual(revised.publicProfile[field], [], 'Chantier 4: a calculated remainder is not a transfer')
    else assert.deepEqual(revised.publicProfile[field], original.publicProfile[field], 'Other ledgers stay unchanged')
  }
  const context = publicationContextFor(profile)
  assert.equal(context.budgetQuestion, '')
  assert(context.questions.length >= 1 && context.questions.length <= 2)
  assert.equal(new Set(context.questions.map(q => q.text)).size, context.questions.length)
  assert(!/Que pensez-vous de (?:ce|son|leur) budget/.test(buildBudgetText(profile)))
  assert.equal(context.evidence.findLast(item => item.editorialReview).editorialReview.monthlyAmountsChanged, false)
  assert.equal(context.evidence.findLast(item => item.editorialReview).editorialReview.sourceConsultedAgain, false)
}
const emilie = BUDGET_PROFILES.find(p => p.name === 'Émilie')
assert.match(buildBudgetText(emilie), /commencer à investir en Bourse/)
assert.match(buildBudgetText(emilie), /Avec 65 € de marge/)
assert.match(buildBudgetText(emilie), /attendriez-vous l’achat immobilier/)
assert.equal(reviseEditorialCopy(previous[emilie.id], null), previous[emilie.id])
console.log('Budget editorial copy: 70 reviewed profiles, immutable prior evidence, unchanged financial ledgers and one or two distinct questions verified.')
