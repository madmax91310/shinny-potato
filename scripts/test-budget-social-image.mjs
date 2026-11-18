import assert from 'node:assert/strict'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { budgetCompletions } from '../src/pages/budget-profiles/budget-completions.js'
import { analyzeBudget, blankBudget, budgetExpenseSections, budgetTransferLabel, buildBudgetText } from '../src/pages/budget-profiles/lib.js'
import { planSocialBudget, SOCIAL_SIZE, SOCIAL_BODY_SIZE } from '../src/pages/budget-profiles/socialImage.js'
import { duplicateBudget } from '../src/pages/budget-profiles/manual.js'
import { staleBudgetText, budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'

assert.deepEqual(SOCIAL_SIZE, { width: 1080, height: 1350 })
assert.equal(SOCIAL_BODY_SIZE, 40)

const cents = value => Math.round(value * 100)
const sum = rows => rows.reduce((total, row) => total + cents(row.amount), 0)
const row = (label, amount, extra) => ({ label, amount, ...extra })
const dense = { ...blankBudget(), name: 'Budget manuel', currency: 'CHF',
  income: [row('Salaire', 8000), row('Titres-restaurant', 100, { inKind: true })],
  expenses: Array.from({ length: 24 }, (_, i) => row(`Poste ${i}`, 120.13 + i, { constraint: ['fixed', 'flexible', 'mixed'][i % 3] })),
  savings: [row('Livret', 1200, { transferStatus: 'paid' }), row('ETF', 2000, { transferStatus: 'planned' })],
}

for (const profile of [...BUDGET_PROFILES, dense]) {
  const before = JSON.stringify(profile)
  const plan = planSocialBudget(profile)
  const sections = budgetExpenseSections(profile)
  assert.equal(sum(plan.expenses.flat()), cents(plan.totals.expenses), profile.id)
  for (const group of plan.expenses.flat()) {
    const source = sections.find(section => section.id === group.id).rows
    assert.deepEqual(group.rows.flatMap(row => row.members).sort((a, b) => a - b), source.map((_, i) => i), profile.id)
    assert.equal(sum(group.rows), sum(source))
    for (const row of group.rows) assert.equal(cents(row.amount), sum(row.members.map(i => source[i])))
  }
  assert.equal(JSON.stringify(profile), before)
  const text = buildBudgetText(profile)
  assert(text.includes(plan.totals.available < 0 ? 'Déficit avant versements' : 'Capacité d’épargne'), profile.id)
  assert((text.match(/^💬 /gm) || []).length <= 2, profile.id)
  if (budgetCompletions[profile.id]) assert(text.includes('Budget reconstitué'), profile.id)
}

assert.equal(planSocialBudget(dense).totals.income, 8000)
assert.equal(planSocialBudget(dense).perks[0].amount, 100)
assert.equal(budgetTransferLabel(dense), 'Versements mixtes')
assert.match(buildBudgetText(dense), /avantage hors total disponible/)
assert.match(buildBudgetText(dense), /Livret \(effectué\)/)
assert.match(buildBudgetText(dense), /ETF \(prévu\)/)
assert.equal(analyzeBudget(dense).balance, 1640.88)
assert(staleBudgetText({ edited: true, profile: dense, textFinance: budgetFinancialReference({ ...dense, income: [dense.income[0], row('Titres-restaurant', 100)] }) }))
assert.throws(() => planSocialBudget({ ...dense, expenses: [] }), /Ajoute les dépenses/)

const noCash = { ...dense, income: [row('Titres-restaurant', 100, { inKind: true })] }
assert.equal(planSocialBudget(noCash).totals.income, 0)
assert.doesNotMatch(buildBudgetText(noCash), /Infinity|NaN/)
assert.match(buildBudgetText(noCash), /Déficit avant versements/)
const duplicate = duplicateBudget({ profile: dense, edited: false }, 'copie-budget').profile
assert.deepEqual(analyzeBudget(duplicate), analyzeBudget(dense))
assert.deepEqual(duplicate.expenses.map(row => row.constraint), dense.expenses.map(row => row.constraint))
assert.deepEqual(duplicate.savings.map(row => row.transferStatus), dense.savings.map(row => row.transferStatus))
