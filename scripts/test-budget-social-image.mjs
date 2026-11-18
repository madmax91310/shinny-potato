import assert from 'node:assert/strict'
import { BUDGET_PROFILES, BUDGET_NOEMIE_PREVIOUS } from '../src/pages/budget-profiles/data.js'
import { budgetCompletions } from '../src/pages/budget-profiles/budget-completions.js'
import { analyzeBudget, blankBudget, budgetExpenseColumns, budgetTransferLabel, buildBudgetText, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { planSocialBudget, SOCIAL_SIZE, SOCIAL_BODY_SIZE } from '../src/pages/budget-profiles/socialImage.js'
import { duplicateBudget } from '../src/pages/budget-profiles/manual.js'
import { staleBudgetText, budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'

assert.deepEqual(SOCIAL_SIZE, { width: 1080, height: 1350 })
assert.equal(SOCIAL_BODY_SIZE, 31)

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
  const sections = budgetExpenseColumns(profile)
  assert.equal(sum(plan.expenses.flat()), cents(plan.totals.expenses), profile.id)
  for (const group of plan.expenses.flat()) {
    const source = sections.find(section => section.id === group.id).rows
    const keys = rows => rows.map(row => JSON.stringify(row)).sort()
    assert.deepEqual(keys(group.rows.flatMap(row => row.members)), keys(source), profile.id)
    assert.equal(sum(group.rows), sum(source))
    for (const row of group.rows) assert.equal(cents(row.amount), sum(row.members))
  }
  assert.equal(sum(plan.transferRows), cents(plan.totals.savings))
  assert.equal(plan.showAllocation, plan.totals.income > 0 && plan.totals.balance >= 0)
  assert.equal(JSON.stringify(profile), before)
  const text = buildBudgetText(profile)
  assert(text.includes(plan.totals.available < 0 ? 'Déficit avant versements' : 'Capacité d’épargne'), profile.id)
  assert((text.match(/^💬 /gm) || []).length <= 2, profile.id)
  assert.doesNotMatch(text, /(?:sa|leur) part du budget|mensuel · sa part|—/i, profile.id)
  if (budgetCompletions[profile.id]) assert(text.includes('Budget reconstitué'), profile.id)
}

assert.equal(planSocialBudget(dense).totals.income, 8000)
assert.equal(budgetTransferLabel(dense), 'Versements mixtes')
assert.match(buildBudgetText(dense), /hors revenus encaissés/)
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


const noemie = BUDGET_PROFILES.find(profile => profile.id === BUDGET_NOEMIE_PREVIOUS.id)
const totals = analyzeBudget(noemie)
assert.deepEqual([totals.income, totals.expenses, totals.savings, totals.balance, totals.available], [3500, 2670, 750, 80, 830])
assert.deepEqual(budgetExpenseColumns(noemie).map(section => section.amount), [2350, 320])
const noemieText = buildBudgetText(noemie)
assert.match(noemieText, /^💰 Budget de Noémie, 24 ans/)
assert.equal((noemieText.match(/Salaire net/g) || []).length, 1)
assert.match(noemieText, /2\s350\s€ \(67 %\)/)
assert.match(noemieText, /320\s€ \(9 %\)/)
assert.match(noemieText, /830\s€ \/ mois \(24 %\)/)
assert.match(noemieText, /environ 21 mois/)
assert.doesNotMatch(noemieText, /bonus|épargne retraite|\b4 %/i)
assert.equal(planSocialBudget(noemie).transferRows.length, 4)
assert.equal(planSocialBudget(noemie).netSalary.amount, 3500)

const personal = {
  profile: BUDGET_NOEMIE_PREVIOUS, edited: true,
  textFinance: budgetFinancialReference(BUDGET_NOEMIE_PREVIOUS),
  text: 'Mon introduction.\n💰 Salaire net : 4 400 € / mois\n🧾 Total des dépenses : 2 600 € / mois\n• Épargne retraite : 267 €\nJe vise un autre objectif à 7 200 €.\nMon commentaire.',
}
const revised = refreshBudgetDraft(personal)
assert.match(revised.text, /Mon introduction\.\n💰 Salaire net : 3\s500\s€ \/ mois/)
assert.match(revised.text, /Total des dépenses : 2\s670\s€ \/ mois/)
assert.doesNotMatch(revised.text, /267|Épargne retraite/)
assert(revised.text.endsWith('Je vise un autre objectif à 7 200 €.\nMon commentaire.'))
assert.equal(revised.textCorrections.length, 3)
assert(staleBudgetText(revised), 'Un chiffre en prose libre ne peut pas être attesté automatiquement')
assert.deepEqual(refreshBudgetDraft(revised).textCorrections, revised.textCorrections)
const labelled = refreshBudgetDraft({ ...personal, text: 'Salaire net : 4 400 € / mois' })
assert(!staleBudgetText(labelled))
const personalCopy = refreshBudgetDraft({ ...personal, profile: { ...BUDGET_NOEMIE_PREVIOUS, kind: 'participant' } })
assert.equal(personalCopy.text, personal.text)
