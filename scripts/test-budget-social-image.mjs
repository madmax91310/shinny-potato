import { projectBudgetScenario } from '../src/pages/budget-profiles/closure-scenarios.js'
import assert from 'node:assert/strict'
import { BUDGET_PROFILES, BUDGET_NOEMIE_PREVIOUS, BUDGET_PUBLICATION_REVIEW, BUDGET_BEFORE_CLOSURE, BUDGET_PUBLICATION_CLOSURE, BUDGET_BEFORE_COHERENCE } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, blankBudget, budgetExpenseColumns, budgetTransferLabel, budgetTransferPlan, buildBudgetText, publicationContextFor, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
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
  assert.equal(plan.showAllocation, !plan.presentation.averageBeforeInvestments && plan.totals.income > 0 && plan.totals.balance >= 0)
  assert.equal(JSON.stringify(profile), before)
  const text = buildBudgetText(profile)
  assert(text.includes(plan.presentation.averageBeforeInvestments ? 'Solde moyen avant placements' : plan.totals.available < 0 ? 'Déficit avant versements' : 'Capacité d’épargne'), profile.id)
  assert((text.match(/^💬 /gm) || []).length <= 2, profile.id)
  assert.doesNotMatch(text, /(?:sa|leur) part du budget|mensuel · sa part|—/i, profile.id)
  assert.doesNotMatch(text, /Versements mixtes|prévu(?:e|s)? \(prévu|effectué(?:e|s)? \(effectué|provision prévue|budget reconstitué|budget fictif|exemple de budget|profil adapté/i, profile.id)
}

assert.equal(planSocialBudget(dense).totals.income, 8000)
assert.equal(budgetTransferLabel(dense), 'Plan d’épargne')
assert.match(buildBudgetText(dense), /hors revenus encaissés/)
assert.match(buildBudgetText(dense), /Livret : 1\s200\sCHF déjà versés/)
assert.match(buildBudgetText(dense), /ETF : 2\s000\sCHF prévus/)
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


for (const [id, changes] of Object.entries(BUDGET_PUBLICATION_REVIEW)) {
  const profile = BUDGET_PROFILES.find(item => item.id === id)
  const context = BUDGET_BEFORE_CLOSURE[id]
  for (const change of changes) {
    assert.notEqual(change.before, change.after)
    const current = change.index === null ? context.budget[change.field] : context[change.field][change.index].text
    assert.equal(current, change.after, id)
    if (!BUDGET_PUBLICATION_CLOSURE[id]) assert(buildBudgetText(profile).includes(current), id)
    if (change.basis === 'assumption') {
      assert.equal(profile.provenance.nature, 'editorial-character', id)
      assert(context[change.field][change.index].evidence.some(index => context.evidence[index].reviewKind === 'assumption'))
    }
  }
}
const julieAndAlex = BUDGET_PROFILES.find(item => item.id === 'reddit-couple-nord-2026-07-09')
const gifts = planSocialBudget(julieAndAlex).expenses[1][0].rows.find(row => row.label === 'Cadeaux, remplac.')
assert.deepEqual(gifts.members.map(row => [row.label, row.amount]), [['Provision cadeaux et remplacements', 80]])
assert.match(buildBudgetText(julieAndAlex), /Provision cadeaux et remplacements : 80\s€/)
const personalJulie = { profile: julieAndAlex, edited: true, text: 'Mon introduction.\nBudget reconstitué · Dépenses ventilées à titre éditorial.\nMon texte à 80 €.' }
assert.equal(refreshBudgetDraft(personalJulie).text, 'Mon introduction.\nMon texte à 80 €.')


const closed = Object.keys(BUDGET_PUBLICATION_CLOSURE).map(id => BUDGET_PROFILES.find(profile => profile.id === id))
assert.equal(closed.length, 5)
assert.equal(BUDGET_PROFILES.filter(profile => analyzeBudget(profile).balance < 0).length, 11)
for (const profile of closed) {
  const context = publicationContextFor(profile)
  assert.equal(context.questions.length, 1)
  assert(context.questions[0].text.endsWith('?'))
  if (context.scenario) assert(context.evidence.some(entry => entry.scenario === context.scenario && entry.basis === 'editorial-preparation'))
  else assert(context.evidence.some(entry => entry.basis === 'verified-repository-record'))
  const text = 'Brouillon personnalisé à conserver, même après la clôture'
  const old = { profile, text, edited: true, textFinance: budgetFinancialReference(profile) }
  assert.equal(refreshBudgetDraft(old).text, text)
}
const [hugo, romain, elise, djamila, david] = closed
assert.match(buildBudgetText(hugo), /^💰 Budget d’Hugo, 19 ans · mois avec bonus/)
assert.doesNotMatch(buildBudgetText(hugo), /1\s221\s€ \/ mois/)
assert.match(buildBudgetText(hugo), /il manquerait 4,99 € avant versements, ou 124,99 €/)
assert.match(buildBudgetText(romain), /Solde moyen avant placements : 3\s749\sCHF/)
assert.doesNotMatch(buildBudgetText(romain), /Capacité d’épargne|Versements retenus : 0/)
assert.equal(planSocialBudget(romain).showAllocation, false)
assert.equal(romain.currency, 'CHF')
assert.match(buildBudgetText(elise), /Crédits regroupés en juillet : 922,03\s€/)
assert.match(buildBudgetText(elise), /Les 291,98 € de marge présentés sont ceux du budget de juillet/)
assert.equal(analyzeBudget(djamila).balance, -890)
assert.equal(publicationContextFor(djamila).scenario.monthlyPension, 0)
assert.deepEqual(projectBudgetScenario(publicationContextFor(djamila).scenario, analyzeBudget(djamila)), { monthlyWithdrawal: 890, remainingReserve: 0 })
assert.equal(analyzeBudget(david).balance, 260)
const davidProjection = projectBudgetScenario(publicationContextFor(david).scenario, analyzeBudget(david))
assert.equal(Math.round(davidProjection.payment * 100), 26953)
assert.equal(davidProjection.monthlyPayment, 270)
assert.deepEqual(davidProjection.rents, [{ rent: 550, beforeLoan: 160, afterLoan: -110 }, { rent: 700, beforeLoan: 10, afterLoan: -260 }])
assert.match(buildBudgetText(david), /il lui manquerait 110\s€/)
assert.match(buildBudgetText(david), /il lui manquerait 260\s€/)


const adrien = BUDGET_PROFILES.find(profile => profile.id === 'finary-cyber-24-2026-08-27')
const adrienBefore = BUDGET_BEFORE_COHERENCE.find(profile => profile.id === adrien.id)
const adrienPlan = planSocialBudget(adrien)
assert.deepEqual(budgetExpenseColumns(adrien).map(section => section.amount), [990, 230])
assert.equal(adrienPlan.totals.expenses, 1220)
assert.equal(adrienPlan.totals.available, 1580)
assert.equal(adrienPlan.totals.savings, 1450)
assert.equal(adrienPlan.totals.balance, 130)
assert.deepEqual(adrienPlan.plan.rows.map(row => [row.label, row.amount, row.status]), [
  ['Prêt étudiant', 450, 'paid'], ['Réserve de sécurité', 500, 'planned'], ['Futur PEA', 500, 'planned'],
])
assert(adrienPlan.expenses[1][0].rows.some(row => row.label === 'Vêtements et cadeaux' && row.amount === 90))
assert.deepEqual(adrienPlan.transferRows.map(row => row.label), ['Prêt étudiant · mis de côté', 'Réserve prévue', 'Futur PEA'])
assert.match(buildBudgetText(adrien), /Reste si le plan est suivi : 130\s€/)
assert.match(buildBudgetText(adrien), /450 € par mois sur un livret/)
assert.doesNotMatch(buildBudgetText(adrien), /trois ans|16[\s ]200/)
const previousAdrien = { profile: adrienBefore, text: 'Texte personnel à 160 €', edited: true, textFinance: budgetFinancialReference(adrienBefore) }
assert.equal(refreshBudgetDraft(previousAdrien).text, previousAdrien.text)
assert(staleBudgetText(refreshBudgetDraft(previousAdrien)))

const plannedDeficit = { ...dense, savings: [row('Livret prévu (prévu)', 8000, { transferStatus: 'planned' })] }
assert.equal(budgetTransferPlan(plannedDeficit).label, 'Versements prévus')
assert.match(buildBudgetText(plannedDeficit), /Déficit si le plan est suivi : -[0-9]/)
assert.doesNotMatch(buildBudgetText(plannedDeficit), /prévu \(prévu\)/)
assert.equal(planSocialBudget(plannedDeficit).showAllocation, false)

const adrienCopy = duplicateBudget({ profile: adrien, edited: false }, 'participation-adrien-test')
assert.deepEqual(adrienCopy.profile.savings.map(row => row.transferStatus), ['paid', 'planned', 'planned'])
assert.match(adrienCopy.text, /Livret pour le prêt étudiant : 450\s€ déjà versés/)
assert.match(adrienCopy.text, /Reste si le plan est suivi : 130\s€/)

const publicProfile = name => BUDGET_PROFILES.find(profile => profile.name === name)
const apollineScope = publicProfile('Apolline')
assert.equal(analyzeBudget(apollineScope).balance, 24.78)
assert.match(buildBudgetText(apollineScope), /Si elle reçoit cette aide, le reste prévu passe de 24,78 à 124,78 €/)
assert.equal(planSocialBudget(apollineScope).incomeLabel, 'Alternance prévue · Hors aide')
const patriceScope = publicProfile('Patrice')
assert.equal(analyzeBudget(patriceScope).balance, -170)
assert.match(buildBudgetText(patriceScope), /Provision entretien de la maison : 70/)
assert.match(buildBudgetText(publicProfile('Thomas à Paris')), /seuls les 57 € de location du parking seraient économisés/)
assert.match(buildBudgetText(publicProfile('Enzo')), /Reste si le plan est suivi/)
assert.equal(planSocialBudget(publicProfile('Enzo')).presentation.projected, true)
assert.equal(planSocialBudget(publicProfile('Morgane')).incomeLabel, 'Moyenne annuelle · Activité saisonnière')
const zoeScope = publicProfile('Zoé')
assert.equal(analyzeBudget(zoeScope).balance, 219.03)
assert.equal(planSocialBudget(zoeScope).incomeLabel, 'Mois de stage · Octobre 2025')
assert.match(buildBudgetText(zoeScope), /Loyer CROUS après APL : 287/)
assert.match(buildBudgetText(zoeScope), /Courses alimentaires : 130/)
