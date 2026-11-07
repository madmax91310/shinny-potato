import './test-budget-presentation.mjs'
import './test-budget-completeness.mjs'
import assert from 'node:assert/strict'
import './test-budget-editorial-context.mjs'
import { createHash } from 'node:crypto'
import { BUDGET_EDITORIAL, BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_COMPLETENESS } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, blankBudget, budgetDisplayName, budgetExpenseSections, budgetImageExpenses, budgetPublicIncomeRows, budgetPublicPresentation, buildBudgetText, compareBudgetRecency, euro, refreshBudgetDraft, sourceReply, validBudget } from '../src/pages/budget-profiles/lib.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'

assert(BUDGET_PROFILES.length > 0)
assert.equal(new Set(BUDGET_PROFILES.map(p => p.id)).size, BUDGET_PROFILES.length)
for (const p of BUDGET_PROFILES) {
  assert(validBudget(p), p.id)
  assert.deepEqual(analyzeBudget(p).errors, [], p.id)
  assert(p.source.url.startsWith('https://'))
  assert(!p.publishedAt || p.publishedAt <= p.checkedAt)
  const text = buildBudgetText(p)
  assert(text.includes(budgetDisplayName(p)))
  assert(!/prénoms? fictifs?/.test(text))
  assert(!text.split('\n')[0].includes(' — '), 'Dates stay in verification, outside the public title')
  assert(!text.includes(p.source.publisher), 'Sources remain available in the separate source reply')
  assert(!text.includes('Situation familiale non précisée'))
  assert(!/prénoms? fictifs?|scénario mensuel préparé|données de 2025|l’auteur|sa femme|la personne|à confirmer|placeholder|\.json|PR #/i.test(text), p.id)
  assert.equal(typeof BUDGET_EDITORIAL[p.id]?.publicIncomeNote, 'string', `Every profile needs a contextual editorial review: ${p.id}`)
  for (const row of budgetPublicIncomeRows(p)) assert(text.includes(`${row.label} : ${euro(row.amount, p.currency)}`), 'Even a single resource is detailed')
  assert(!/budget personnel/i.test(text), p.id)
  const a = analyzeBudget(p)
  const sumCents = key => p[key].reduce((n, r) => n + Math.round(r.amount * 100), 0)
  assert.equal(Math.round(a.balance * 100), sumCents('income') - sumCents('expenses') - sumCents('savings'))
  assert(Math.abs(a.expenseShare - 100 * sumCents('expenses') / sumCents('income')) < 1e-10)

  for (const row of p.expenses) assert(text.includes(`${row.label} : ${euro(row.amount, p.currency)}`), row.label)
  const sections = budgetExpenseSections(p)
  assert.deepEqual(sections.flatMap(s => s.rows).map(r => r.label).sort(), p.expenses.map(r => r.label).sort(), 'Every expense appears once')
  if (p.kind === 'planned') assert.match(text, /budget prévu/i)
  if (p.age === null) assert(!/\d+ ans/.test(text.split('\n')[0]))
  assert(sourceReply(p).includes(p.source.url))
  assert(!/prépar|compléments|arrondis|prénoms? fictifs?|l’auteur|sa femme|vérification|\.json|PR\s*#/i.test(sourceReply(p)), `${p.id}: source replies must also be ready to publish`)
  assert(!buildBudgetText(p).includes('abonné'), 'A public witness must not become a received subscriber testimony')
}
assert.equal(new Set(BUDGET_PROFILES.map(budgetDisplayName)).size, BUDGET_PROFILES.length)
for (const id of Object.keys(BUDGET_EDITORIAL)) assert(BUDGET_PROFILES.some(p => p.id === id), id)
const grouped = BUDGET_PROFILES.find(p => p.id === 'finary-alternant-22-2025-05-15')
assert.equal(budgetExpenseSections(grouped).length, 1)
assert.match(buildBudgetText(grouped), /livret|Livret/, 'The earlier capital withdrawal stays distinct from newly funded transfers')
const detailed = BUDGET_PROFILES.find(p => p.id === 'finary-alternant-19-2025-09-27')
assert.equal(budgetExpenseSections(detailed).length, 2)
assert.equal(budgetExpenseSections({ ...detailed, expenses: [...detailed.expenses, { label: 'Poste non ventilé', amount: 10 }] }).length, 1)
assert(buildBudgetText(detailed).includes(`Reste avant épargne et investissements : ${euro(analyzeBudget(detailed).available)}`))
assert(buildBudgetText(detailed).includes(`Reste après épargne et investissements : ${euro(analyzeBudget(detailed).balance)}`))
assert.match(buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'finary-ingenieur-aero-2025-11-30')), /net avant impôt/i)
assert(BUDGET_PROFILES.find(p => p.id === 'finary-fonctionnaire-30-2025-05-21').expenses.some(r=>/vacances/i.test(r.label)), 'Previously unfinanced holidays now have an explicit provision')
const techText = buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'reddit-tech-26-2026-02-06'))
assert(techText.includes(`Reste avant épargne : ${euro(830)}`))
assert(techText.includes(`Reste après épargne : ${euro(230)}`))
assert(techText.includes('2 400 €'), 'The created starting reserve is explicit in the editorial story')
const generatedDraft = { profile: structuredClone(BUDGET_PROFILES[0]), text: 'Ancien texte généré', edited: false }
assert.equal(refreshBudgetDraft(generatedDraft).text, buildBudgetText(BUDGET_PROFILES[0]))
assert.equal(refreshBudgetDraft({ ...generatedDraft, text: 'Mon texte personnel', edited: true }).text, 'Mon texte personnel')
// Independent reconciliation of the three retained source ledgers.
assert.equal(analyzeBudget(BUDGET_ORIGINAL_PROFILES.find(p => p.id === 'reddit-actif-2026-09-27')).available, 307)
const couple = BUDGET_ORIGINAL_PROFILES.find(p => p.id === 'reddit-couple-nord-2026-07-09')
assert.equal(analyzeBudget(couple).expenses, 2017)
assert.equal(analyzeBudget(couple).available, 447)
assert.equal(analyzeBudget(couple).balance, 347)
assert.equal(analyzeBudget(BUDGET_ORIGINAL_PROFILES.find(p => p.id === 'reddit-salarie-26-2026-01-04')).available, 1205)

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
  const profile = BUDGET_ORIGINAL_PROFILES.find(p => p.id === id)
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
  const profile = BUDGET_ORIGINAL_PROFILES.find(p => p.id === id)
  assert(profile, id)
  const actual = analyzeBudget(profile)
  assert.deepEqual([actual.income, actual.expenses, actual.savings, actual.balance], [income, expenses, savings, balance], id)
}
const swiss = BUDGET_PROFILES.find(p => p.currency === 'CHF')
assert.equal(swiss.capacity, 3750, 'The source rounded average savings must not become a fabricated transfer or be silently changed')
assert.match(buildBudgetText(swiss), /revenus exceptionnels inclus/)
assert.match(buildBudgetText(swiss), /3 749|3\u202f749/)
assert(!buildBudgetText(swiss).includes('€'), 'No euro label on the Swiss budget')
assert.equal(euro(100, 'CHF'), '100 CHF')
assert(validBudget({ ...swiss, kind: 'participant', source: null }), 'Swiss adaptations retain their currency')
assert(!validBudget({ ...swiss, currency: 'USD' }))
assert(!validBudget({ ...swiss, currency: null }))
const futureApprentice = BUDGET_PROFILES.find(p => p.id === 'finary-etudiant-20-2025-03-19')
assert.equal(BUDGET_ORIGINAL_PROFILES.find(p=>p.id===futureApprentice.id).kind, 'planned'); assert(futureApprentice.completion.forecast)
assert.match(futureApprentice.period, /septembre 2025/i)
assert.match(buildBudgetText(futureApprentice), /budget prévu/i)
assert.equal(analyzeBudget(BUDGET_PROFILES.find(p => p.id === 'finary-celibataire-31-2026-02-03')).expenses,1775, 'Detailed editorial expenses preserve the combined envelopes')

assert.match(buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'finary-batiment-21-2025-09-30')), /deux années suivant ce budget/)
assert.match(buildBudgetText(BUDGET_PROFILES.find(p => p.id === 'finary-ingenieur-aero-2025-11-30')), /50\/30\/20/)

const apprentice = BUDGET_PROFILES.find(p => p.id === 'reddit-alternant-20-2025-09-03')
assert(apprentice.completion.forecast)
assert.match(buildBudgetText(apprentice), /Logé et nourri chez ses parents/)
const couple35 = BUDGET_PROFILES.find(p => p.id === 'reddit-couple-35-2025-10-15')
assert.equal(couple35.capacity, null)
assert.equal(couple35.savings.length, 0)
assert.equal(BUDGET_ORIGINAL_PROFILES.find(p => p.id === 'finary-fonctionnaire-30-2025-05-21').capacity, 622.99)

// A capacity declaration is not a transfer and never reduces available cash.
const fixture = { ...blankBudget(), name: 'Test', income: [{ label: 'Revenu', amount: 1000 }], expenses: [{ label: 'Dépense', amount: 800 }], capacity: 150 }
assert.equal(analyzeBudget(fixture).balance, 200)
assert.match(buildBudgetText({ ...fixture, age: 32 }), /Budget de Test, 32 ans/)
assert.equal(analyzeBudget({ ...fixture, savings: [{ label: 'Virement prévu', amount: 100 }] }).balance, 100)
assert.equal(analyzeBudget({ ...fixture, income: [{ label: 'Revenu', amount: 0.30 }], expenses: [{ label: 'A', amount: 0.1 }, { label: 'B', amount: 0.2 }], capacity: null }).balance, 0)
const deficit = { ...fixture, expenses: [{ label: 'Dépense', amount: 1200 }] }
assert.equal(analyzeBudget(deficit).balance, -200)
assert.match(buildBudgetText(deficit), /Déficit[^\n]*200/)
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

console.log(`Budget profiles: ${BUDGET_PROFILES.length} source ledgers and editorial outputs verified.`)

// Prepared budgets preserve source statements and may show a deficit; the independent new ledgers are tested separately.
for (const p of BUDGET_PROFILES.filter(p => p.kind === 'prepared')) {
  const source = BUDGET_ORIGINAL_PROFILES.find(q=>q.id===p.id)
  if (source.kind==='prepared') assert.equal(analyzeBudget(source).balance, source.provenance?.expectedBalance ?? 0, p.id)
  assert.match(sourceReply(p), /^Source du budget d’origine : /)
  assert.match(buildBudgetText(p), /^Budget /)
  assert(!sourceReply(p).includes('Montants déclarés par la personne'))
  assert(p.provenance?.method || p.completion && BUDGET_COMPLETENESS[p.id].conclusion)
}
const preparedThomas = BUDGET_PROFILES.find(p => p.id === 'prepared-tom281-2026-10-30')
assert.equal(preparedThomas.savings.find(r => r.label === 'Épargne de précaution').amount, 350)
assert.equal(analyzeBudget(preparedThomas).income, 2350)

// Independently reconciled user-approved lot: income / expenses / transfers / balance.
for (const [n, income, expenses, savings, balance] of [
  [1,2400,1755,645,0], [2,3350,2300,1050,0], [3,1672,1300,372,0],
  [4,4600,3800,800,0], [5,2750,2750,0,0], [6,4700,3200,1500,0],
  [7,4000,3000,1000,0], [8,2300,1630,670,0], [9,1400,1150,250,0],
  [10,2100,1760,340,0], [11,904,497.97,406.03,0], [12,3500,2500,1000,0],
  [13,2650,2450,200,0], [14,3650,2850,800,0], [15,3600,1211.58,2388.42,0],
  [16,2300,1550,750,0], [17,8600,4800,2850,950], [18,7708.33,4350,3358.33,0],
  [19,3300,2500,800,0], [20,5600,3000,2600,0],
]) {
  const p = BUDGET_ORIGINAL_PROFILES.find(p => p.id === `prepared-lot2-${String(n).padStart(2,'0')}-2026-10-30`)
  assert(p, `Missing approved profile ${n}`)
  const a = analyzeBudget(p)
  assert.deepEqual([a.income,a.expenses,a.savings,a.balance], [income,expenses,savings,balance],p.id)
  assert.notEqual(p.name,p.provenance.original.name,'Rename source identities')
  assert.equal(p.source.url,p.provenance.original.sourceUrl)
}
const lot2 = n => BUDGET_ORIGINAL_PROFILES.find(p => p.id === `prepared-lot2-${String(n).padStart(2,'0')}-2026-10-30`)
assert(!lot2(14).expenses.some(r => r.amount === 1117 || r.amount === 1220), 'No future housing mixed into current budget')
assert(!lot2(18).income.some(r => r.amount === 6000 || r.amount === 50000), 'No duplicated bonus or future PEE')
assert(!lot2(19).income.some(r => r.amount >= 9000), 'No post-internship projection treated as current salary')
assert(!lot2(20).expenses.some(r => /crédit.*locatif/i.test(r.label)), 'Rental cash flow is already net; do not deduct mortgages twice')

// Independently read first-column PDF ledgers and the pension article (02/11).
for (const [id, income, expenses, transfers, balance] of [
  ['budget-conseil-couple-2025-2026',3750,3720,30,0],
  ['budget-conseil-couple_1enfant-2025-2026',4400,4360,40,0],
  ['budget-conseil-couple_2enfants-2025-2026',5000,4920,80,0],
  ['budget-conseil-couple_3enfants-2025-2026',5500,5440,60,0],
  ['budget-conseil-monoparent_3enfants-2025-2026',4500,4420,80,0],
  ['budget-conseil-apprenties_majeures-2025-2026',1400,1105,210,85],
  ['websourd-retraite-normandie-2026-10-02',1100,1100,0,0],
]) {
  const p = BUDGET_ORIGINAL_PROFILES.find(p => p.id === id), a = analyzeBudget(p)
  assert.deepEqual([a.income,a.expenses,a.savings,a.balance],[income,expenses,transfers,balance],id)
  assert.equal(BUDGET_ORIGINAL_PROFILES.filter(q=>q.source.url===p.source.url).length,1,'No renamed source duplicate')
}
const apprenticeReference = BUDGET_ORIGINAL_PROFILES.find(p=>p.id==='budget-conseil-apprenties_majeures-2025-2026')
assert.equal(apprenticeReference.housing,'');assert.equal(apprenticeReference.family,'');assert.equal(apprenticeReference.children,'')
const pension = BUDGET_ORIGINAL_PROFILES.find(p=>p.id==='websourd-retraite-normandie-2026-10-02')
assert.deepEqual(pension.savings,[]);assert.equal(pension.income[0].label,'Pension de retraite');assert.equal(pension.family,'')

// November bank enrichment: independent source totals, including unspent cash and planned flows.
const bankLedgers = [
  ['finary-freelance-lille-2025-03-02', 513000, 310000, 200000, 3000, 60],
  ['finary-installation-projet-2026-02-21', 250000, 150000, 100000, 0, 60],
  ['finary-alternante-projet-2026-10-06', 128478, 5000, 90000, 33478, 4],
  ['finary-ingenieur-colocation-projet-2026-08-18', 192500, 85000, 0, 107500, 44],
  ['reference-bordeaux-budget-2026-03', 228000, 196500, 25000, 6500, 86],
  ['reference-couple-lille-budget-2026-01', 455000, 292000, 145000, 18000, 64],
  ['reference-indexo-belgique-2026-11', 220000, 200000, 20000, 0, 91],
  ['reference-vendeuse-rennes-2026', 139800, 124800, 5000, 10000, 89],
  ['reference-famille-lyon-2026', 450000, 385000, 45000, 20000, 86],
]
for (const [id, income, expenses, transfers, balance, percent] of bankLedgers) {
  const p = BUDGET_ORIGINAL_PROFILES.find(p => p.id === id)
  assert(p, id)
  const a = analyzeBudget(p)
  assert.deepEqual([a.income, a.expenses, a.savings, a.balance].map(n => Math.round(n * 100)), [income, expenses, transfers, balance], id)
  assert.equal(Math.round(a.expenseShare), percent, `${id}: source-based percentage`)
  for (const mode of ['detailed', 'summary']) {
    assert.equal(budgetImageExpenses(p, mode).reduce((n, row) => n + Math.round(row.amount * 100), 0), expenses, `${id}: image expense ledger`)
  }
  assert.match(p.provenance.sourceSha256, /^[a-f0-9]{64}$/)
  assert(!JSON.stringify(p.income).includes('conjoint'), 'No inferred partner salary')
}
const bankProfile = id => BUDGET_PROFILES.find(p => p.id === id)
const futureStudent = bankProfile('finary-alternante-projet-2026-10-06')
assert.equal(futureStudent.country, ''); assert.equal(futureStudent.family, ''); assert.equal(futureStudent.housing, '')
assert.match(budgetPublicPresentation(futureStudent).balanceLabel, /Reste disponible après versements/, 'Living costs now appear in expenses, not hidden in a remainder label')
assert.equal(futureStudent.income.length, 2, 'Exclude salary increases and allowances belonging to future months')
const engineerPlan = bankProfile('finary-ingenieur-colocation-projet-2026-08-18')
assert.equal(engineerPlan.budgetAsOf, undefined, 'An ambiguous future school year cannot inherit the source publication date for sorting')
assert.deepEqual(engineerPlan.savings, [], 'An undecided 750-euro option is not an actual or agreed transfer')
assert.equal(engineerPlan.income.at(-1).amount, engineerPlan.expenses[0].amount, 'Count the aid and its reimbursement once each')
const bordeaux = bankProfile('reference-bordeaux-budget-2026-03')
assert.equal(budgetImageExpenses(bordeaux, 'summary').find(r => r.category === 'transport').amount, 327)
assert.equal(budgetImageExpenses(bordeaux, 'summary').find(r => r.category === 'housing').amount, 877)
assert.equal(bordeaux.income.length, 1, 'The excluded semestrial bonus is not recurring salary')
const belgianReference = bankProfile('reference-indexo-belgique-2026-11')
assert.equal(belgianReference.publishedAt, null, 'An update date is not an established original publication date')
assert.equal(belgianReference.provenance.sourceUpdatedAt, '2026-10-31')
const lille = bankProfile('reference-couple-lille-budget-2026-01')
assert.match(buildBudgetText(lille), /Salaire net d’Hugo/)
assert.match(buildBudgetText(lille), /32 ans et infirmière de 30 ans/)
assert.equal(BUDGET_PROFILES.filter(p => p.source.url === lille.source.url).length, 2, 'Two distinct reference cases share an article, not an identity or ledger')
const familyReference = bankProfile('reference-famille-lyon-2026')
assert.equal(familyReference.expenses.length, 24, 'Retain every source expense, including the two loans')
assert.equal(familyReference.expenses.slice(0, 12).reduce((n, row) => n + row.amount, 0), 2380, 'Published fixed subtotal is 200 euros too high; never add a fictitious expense to match it')
assert.equal(budgetImageExpenses(familyReference, 'summary').find(r => r.category === 'credit').amount, 430)
assert.equal(budgetImageExpenses(familyReference, 'summary').find(r => r.category === 'food').amount, 905)
assert(!buildBudgetText(bankProfile('reference-vendeuse-rennes-2026')).includes('SMIC'), 'Do not turn an outdated illustrative wage into a current statutory minimum')
assert(compareBudgetRecency(bordeaux, bankProfile('finary-freelance-lille-2025-03-02')) < 0, 'Preparation in November does not turn a March 2025 budget into a recent one')
const previousFinancials = BUDGET_ORIGINAL_PROFILES.slice(0, 61).map(p => ({ id: p.id, currency: p.currency || 'EUR', income: p.income.map(r => r.amount), expenses: p.expenses.map(r => r.amount), savings: p.savings.map(r => r.amount), capacity: p.capacity }))
assert.equal(createHash('sha256').update(JSON.stringify(previousFinancials)).digest('hex'), '65ca0d1444787d3aa231dcdcb308c75caef562aed116ec698c0ffe82bbf9ef4d', 'Preserve all 61 previous financial profiles and identifiers')

await import('./test-budget-reliability.mjs')

await import('./test-budget-editorial-lives.mjs')

await import('./test-budget-narrative.mjs')

await import('./test-budget-final-copy.mjs')
