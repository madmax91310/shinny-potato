import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BUDGET_PROFILES, BUDGET_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { budgetTransfers } from '../src/pages/budget-profiles/presentation.js'
import { analyzeBudget, budgetExpenseSections, budgetPublicIncomeRows, buildBudgetText, euro, hasSeparateBudgetCapacity, publicationContextFor, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
const before = JSON.parse(readFileSync(new URL('./fixtures/budget-editorial/before-2026-11-02.json', import.meta.url)))
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const original = before.profiles.map(({ id }) => BUDGET_PROFILES.find(p => p.id === id))
assert(original.every(Boolean), 'Every original identity remains available')
assert.equal(hash(original), before.profileHash, 'Editorial work must not change any original profile field or amount')
assert.equal(BUDGET_PROFILES.length, before.profiles.length, 'A copy pass neither adds nor removes profiles')
const proofs = BUDGET_PROFILES.map(p => {
  const c = publicationContextFor(p)
  return { id: p.id, evidence: c.evidence, review: c.review, questions: c.questions.map(({ origin, evidence }) => ({ origin, evidence })) }
})
assert.equal(hash(proofs), before.provenanceHash, 'Copy editing preserves every source, qualification and question origin')
assert.deepEqual(Object.keys(BUDGET_PUBLICATION_CONTEXT).sort(), BUDGET_PROFILES.map(p => p.id).sort(), 'Every bank profile has a reviewed narrative, no orphan record')
for (const profile of BUDGET_PROFILES) {
  const c = publicationContextFor(profile), text = buildBudgetText(profile)
  assert(['consulted', 'inaccessible'].includes(c.review.access), profile.id)
  assert(c.paragraphs.length <= 3, 'A budget that already says everything needs no repetitive narrative')
  assert(c.questions.length >= 1 && c.questions.length <= 2)
  assert(c.budgetQuestion.endsWith('🤔💬'))
  if (/budget personnel/i.test([profile.household, profile.incomeNote, BUDGET_PUBLICATION_CONTEXT[profile.id].review.limit].join(' '))) {
    assert(!c.budgetQuestion.includes('budget de ce foyer'), 'Living with a partner does not make a personal ledger a household budget')
  }
  assert.equal(text, buildBudgetText(structuredClone(profile)), 'Copy is reproducible')
  assert(!/année non précisée|du scénario|retenu pour l’exemple|dimensionneriez|sur quels critères de disponibilité|l’enjeu/i.test(text), profile.id)
  assert(!/prévu|exemple|20\d{2}/i.test(text.split('\n')[0]), 'Public headings stay neutral and undated')
  const a = analyzeBudget(profile), sections = budgetExpenseSections(profile)
  assert.equal((text.match(/Total des dépenses :/g) || []).length, sections.length > 1 ? 1 : 0, 'A general total is useful only for split expenses')
  if (a.savings === 0) assert(!/avant versements|après versements/.test(text), 'No pair of identical before/after remainders when nothing is transferred')
  else {
    assert(text.includes(`${budgetTransfers(profile, c.budget?.transfersHeading).before} : ${euro(a.available, profile.currency)}`))
    assert(text.includes(euro(Math.abs(a.balance), profile.currency)))
  }
  assert(!text.includes('Épargne, investissements et autres affectations'))
  const withoutLabel = rows => rows.map(({ label: _label, ...row }) => row)
  assert.deepEqual(withoutLabel(budgetPublicIncomeRows(profile)), withoutLabel(profile.income), 'Public wording never changes resource amounts, order or scope')
  for (const row of budgetPublicIncomeRows(profile)) assert(text.includes(`${row.label} : ${euro(row.amount, profile.currency)}`))
  if (profile.capacity !== null && profile.capacity === a.available) assert(!hasSeparateBudgetCapacity(profile), 'A capacity identical to the remainder is not printed twice')
  for (const element of [...c.paragraphs, ...c.questions]) {
    assert(element.text.trim() && text.includes(element.text), profile.id)
    assert(element.evidence.length && element.evidence.every(i => Number.isInteger(i) && c.evidence[i]), 'Every public addition retains its evidence')
    assert(!/prénoms? fictifs?|données de 2025|préparé le|collecté le|\.json|placeholder|l’auteur|sa femme|la personne/i.test(element.text), profile.id)
  }
  for (const question of c.questions) {
    assert(question.text.endsWith('?'))
    assert(['expressed', 'editorial'].includes(question.origin))
    if (question.origin === 'expressed') {
      assert.equal(c.review.access, 'consulted', 'A blocked source cannot establish a new attributed question')
      assert(c.review.expressedQuestion && c.review.selectedPosts.length)
      for (const index of question.evidence) assert.equal(c.evidence[index].author, c.review.author, 'A reply by another contributor cannot become this profile’s question')
    }
  }
  if (c.review.access === 'inaccessible') {
    assert(c.review.limit)
    assert(c.evidence.every(e => e.basis === 'verified-repository-record'))
    assert(c.questions.every(q => q.origin === 'editorial'))
  }
  const auto = { profile: structuredClone(profile), text: 'Ancien texte automatique', edited: false }
  assert.equal(refreshBudgetDraft(auto).text, text)
  assert.equal(refreshBudgetDraft({ ...auto, text: 'Mon texte personnel\nAvec mes questions.', edited: true }).text, 'Mon texte personnel\nAvec mes questions.')
}
const participant = { ...BUDGET_PROFILES[0], kind: 'participant', context: 'Mon propre récit', question: 'Ma propre question ?' }
assert.equal(publicationContextFor(participant), null, 'Even an inherited bank identity cannot apply the bank narrative to a personal contribution')
assert.deepEqual(budgetPublicIncomeRows(participant), participant.income, 'Personal resource labels are untouched')
const customLabel = { ...participant, income: [{ label: 'constructor', amount: 1000 }] }
assert.deepEqual(budgetPublicIncomeRows(customLabel), customLabel.income)
assert(buildBudgetText(participant).includes('Mon propre récit'))
assert(buildBudgetText(participant).includes('Ma propre question ?'))
for (const id of BUDGET_PROFILES.filter(p => p.source.publisher.includes('Budget')).map(p => p.id)) {
  assert(BUDGET_PUBLICATION_CONTEXT[id].questions.every(q => q.origin === 'editorial'), 'Reference budgets have no invented personal interrogations')
}
console.log(`Budget editorial: ${BUDGET_PROFILES.length} complete copies reviewed; profiles, amounts and source provenance preserved; useful totals, distinct transfers, attributed/editorial questions and personal texts protected.`)
