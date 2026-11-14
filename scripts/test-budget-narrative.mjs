import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { BUDGET_PROFILES, BUDGET_EDITORIAL_CREATIONS } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, publicationContextFor, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { budgetBeforePelCorrection } from './budget-audit-history.mjs'

const baseline = JSON.parse(readFileSync(new URL('./fixtures/budget-narrative-2026-11-06.json', import.meta.url)))
const monthly = BUDGET_PROFILES.map(budgetBeforePelCorrection).map(p => [p.id, p.currency || 'EUR', ...['income', 'expenses', 'savings'].map(k => p[k].map(r => Math.round(r.amount * 100))), p.capacity])
assert.equal(BUDGET_PROFILES.length, baseline.count)
assert.equal(createHash('sha256').update(JSON.stringify(monthly)).digest('hex'), baseline.monthlyAmountsHash, 'Every monthly amount and its perimeter is unchanged')
for (const p of BUDGET_PROFILES) {
  const review = BUDGET_EDITORIAL_CREATIONS[p.id].narrativeReview, c = publicationContextFor(p)
  assert.equal(review.baseline, baseline.baseline)
  assert.equal(review.sourceConsultedAgain, false)
  assert.equal(review.monthlyAmountsChanged, false)
  assert(review.note.length > 40)
  assert(c.questions.length + Number(Boolean(c.budgetQuestion)) <= 2)
  assert.deepEqual(c.evidence.at(-1).narrativeReview.limits, review.limits)
  const custom = { profile: p, text: 'Mon brouillon personnalisé\nMes chiffres et mes questions.', edited: true, textFinance: baseline.beforeFinance[p.id] }
  const refreshed = refreshBudgetDraft(custom)
  assert.equal(refreshed.text, custom.text)
  assert.equal(staleBudgetText(refreshed), baseline.beforeFinance[p.id] !== budgetFinancialReference(p))
  assert.equal(refreshBudgetDraft({ ...custom, edited: false }).text, buildBudgetText(p))
  for (const goal of review.projectChecks) {
    if (goal.monthlyFunding && goal.target !== undefined) {
      assert.equal(goal.monthsToMinimum, Math.max(0, Math.ceil((goal.target - goal.initialFunding) / goal.monthlyFunding)))
      if (goal.horizonMonths) assert.equal(goal.fundingAtHorizon, goal.initialFunding + goal.monthlyFunding * goal.horizonMonths)
    }
  }
}
const byName = name => BUDGET_PROFILES.find(p => p.name === name)
const entry = name => BUDGET_EDITORIAL_CREATIONS[byName(name).id]
const facts = name => entry(name).narrativeReview.calculations
const plain = text => text.replace(/\s/g, ' ')
const story = name => plain(entry(name).paragraphs.join('\n'))

const thomas = entry('Thomas'), departure = thomas.created.find(p => p.type === 'project' && p.horizonMonths === 24)
assert.equal(departure.monthlyFunding * departure.horizonMonths, departure.targetAmount)
assert.equal(departure.components.reduce((s, p) => s + p.amount, 0), departure.targetAmount)
assert.equal(facts('Thomas').installation + facts('Thomas').autonomyBuffer, departure.targetAmount)
assert(story('Thomas').includes('7 200 €') && story('Thomas').includes('4 700 €'))

for (const [salary, key] of [[3200, 'lowMonth'], [3350, 'averageMonth'], [3500, 'highMonth']]) {
  const a = analyzeBudget(byName('Aïcha'))
  assert.equal(salary - a.expenses - a.savings, facts('Aïcha')[key])
}
assert(story('Aïcha').includes('20 €'))
const pauline = byName('Pauline'), pt = buildBudgetText(pauline)
assert(pt.indexOf('sa part du budget du foyer') < pt.indexOf('💰 Revenus'))
assert.equal(analyzeBudget(pauline).available * 24, facts('Pauline').maximum24MonthFundingWithoutStock)
assert(facts('Pauline').maximum24MonthFundingWithoutStock < 2500)

assert.equal(350 * 36, facts('Maud').worksFundAt36Months)
assert.equal(entry('Maud').created.find(e => e.type === 'project').requiresReallocation, false)
assert.equal(100 * 6, facts('Céline').applianceFundAt6Months)
assert.equal(Math.round((2155 - 1667.01 - 100 - 24.99) * 100), facts('Nicolas').futureBeforePea * 100)

const michel = byName('Michel'), mf = facts('Michel')
assert.equal(analyzeBudget(michel).balance, mf.currentBudgetBalance)
assert.equal(michel.expenses.filter(e => e.amount === mf.monthlyEnvelopeAlreadyInExpenses).length, 1)
assert.equal(mf.reserve - mf.repair, mf.reserveAfterRepairEntirelyFromLivret)
assert.equal(mf.reserve - (mf.repair - mf.monthlyEnvelopeAlreadyInExpenses), mf.reserveAfterRepairWithUnusedCurrentEnvelope)
assert.equal(mf.reserve + 2 * mf.monthlyEnvelopeAlreadyInExpenses - mf.replacement, mf.reserveAfterReplacementWithTwoUnusedEnvelopes)

const sf = facts('Samuel'), sa = analyzeBudget(byName('Samuel'))
assert.equal(sa.expenses * 6, sf.sixMonthsExpenses)
assert.equal((sa.expenses + 605) * 6, sf.sixMonthsIncludingPillar)
assert(sf.sixMonthsIncludingPillar > sf.fundingAt36Months)
assert(entry('Samuel').narrativeReview.limits.length)
assert.equal(facts('Émilien').withinTotalForTrip + facts('Émilien').withinTotalForPea, facts('Émilien').consideredTotalTransfers)
assert.equal(facts('Émilien').withinTotalForTrip * 24, facts('Émilien').tripAt24Months)
assert.equal(analyzeBudget(byName('Émilien')).available - 750, facts('Émilien').futureAvailable)

const elise = byName('Élise et Karim')
assert.equal(facts('Élise et Karim').futureCreditReductionEstablished, false)
assert.equal(Math.round(elise.expenses.filter(e => /Assurance (première|seconde) voiture/.test(e.label)).reduce((n, e) => n + e.amount, 0) * 100), 25684)
assert(entry('Élise et Karim').narrativeReview.limits.length)
const metals = publicationContextFor(byName('Adrien et Léa')).questions[1]
assert.equal(metals.origin, 'expressed')
assert(metals.adaptedFrom && metals.evidence.every(i => publicationContextFor(byName('Adrien et Léa')).evidence[i].author === 'Abar4'))
console.log(`Budget narrative: ${BUDGET_PROFILES.length} reviewed; monthly figures, project funding, salary variations, question origins and customized drafts verified.`)
