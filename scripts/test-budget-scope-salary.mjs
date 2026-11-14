import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_ORIGINAL_PUBLICATION_CONTEXT, BUDGET_EDITORIAL_CREATIONS } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, blankBudget, budgetPublicIncomeRows, budgetPublicExpenseRows, budgetPublicSavingsRows, budgetImageExpenses, budgetExpenseSections, budgetPublicPresentation, buildBudgetText, publicationContextFor, refreshBudgetDraft, hasSeparateBudgetCapacity } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { budgetSalaryLabel, budgetPublicBasis } from '../src/pages/budget-profiles/presentation.js'

const baseline = JSON.parse(readFileSync(new URL('./fixtures/budget-scope/2026-11-14.json', import.meta.url)))
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
assert.deepEqual(BUDGET_PROFILES.map(p=>p.id), baseline.ids)
assert.equal(hash([BUDGET_ORIGINAL_PROFILES, BUDGET_ORIGINAL_PUBLICATION_CONTEXT]), baseline.sourceHash, 'Every original source field, period, hypothesis and question stays unchanged')
assert.equal(hash(BUDGET_PROFILES.map(p=>[p.id,p.currency||'EUR',...['income','expenses','savings'].map(k=>p[k]),p.capacity])), baseline.financeHash, 'No monthly amount, original label, order or allocation changes during public clarification')
for (const p of BUDGET_PROFILES) {
  const expected = baseline.profiles[p.id], c=publicationContextFor(p), r=BUDGET_EDITORIAL_CREATIONS[p.id], text=buildBudgetText(p)
  const cents = k=>p[k].reduce((s,row)=>s+Math.round(row.amount*100),0)
  const [income,expense,transfers]=['income','expenses','savings'].map(cents), cash=[income,expense,transfers,income-expense-transfers]
  assert.deepEqual(cash,expected.cash)
  const actual=analyzeBudget(p)
  assert.deepEqual(['income','expenses','savings','balance'].map(k=>Math.round(actual[k]*100)),cash)
  assert.equal(Math.round(actual.expenseShare),Math.round(expense*100/income))
  assert.deepEqual([p.period,p.budgetAsOf??null,p.publishedAt,p.checkedAt],expected.period)
  assert(r.scopeReview.scope.length>60 && r.scopeReview.definitions)
  assert.equal(r.scopeReview.sourceConsultedAgain,false)
  assert.equal(r.scopeReview.monthlyAmountsChanged,false)
  assert.equal(c.evidence.at(-1).scopeReview.scope,r.scopeReview.scope)
  const rows=budgetPublicExpenseRows(p)
  assert.deepEqual(rows.map(({label:_label,...row})=>row),p.expenses.map(({label:_label,...row})=>row))
  assert.deepEqual(budgetExpenseSections(p).flatMap(s=>s.rows).map(row=>[row.label,row.amount]).sort(),rows.map(row=>[row.label,row.amount]).sort())
  for(const row of rows)assert(text.includes(row.label))
  for(const mode of ['detailed','summary']) {
    const image=budgetImageExpenses(p,mode)
    if(mode==='summary')assert.deepEqual(image.map(row=>[Math.round(row.amount*100),row.category??null]),expected.summaryShape,'Existing financial groups, order and amounts stay unchanged')
    assert.equal(image.reduce((s,row)=>s+Math.round(row.amount*100),0),expense)
    for(const row of rows.filter(r=>/^Provision\b|mensualis/i.test(r.label)))assert(image.some(x=>x.label===row.label&&x.amount===row.amount),'Provisions stay visible despite label changes')
  }
  for(const row of budgetPublicIncomeRows(p))assert(!/salaire.*\bnet\b|après impôt|avant impôt/i.test(row.label))
  const view=budgetPublicPresentation(p)
  assert(!/après impôt|avant impôt/i.test(budgetPublicBasis(p,view.basis)))
  for(const q of expected.expressed)assert(c.questions.some(now=>now.text===q&&now.origin==='expressed'||now.origin==='editorial'&&now.adaptedFrom?.some(old=>old.text===q&&old.origin==='expressed')),'A source question keeps its origin or an explicit editorial adaptation')
  const custom={profile:p,text:'Mon texte personnalisé, avec mes chiffres et mes questions.',edited:true,textFinance:budgetFinancialReference(p)}
  assert.equal(refreshBudgetDraft(custom).text,custom.text);assert.equal(staleBudgetText(refreshBudgetDraft(custom)),false)
  assert.equal(refreshBudgetDraft({...custom,edited:false}).text,text)
}
for(const [input,output] of [['Salaire net après impôt','Salaire'],['Salaire net après prélèvement à la source','Salaire'],['Salaire net de Julie','Salaire de Julie'],['Salaire de Nathan après impôt','Salaire de Nathan'],['Salaire net moyen avec astreintes','Salaire moyen avec astreintes'],['Salaire net d’alternance prévu','Salaire d’alternance prévu'],['Salaire net hors primes','Salaire hors primes'],["Salaire net d’impôt",'Salaire'],['Salaire brut','Salaire brut'],['Pension nette après impôt','Pension nette après impôt'],['Indemnités chômage','Indemnités chômage']])assert.equal(budgetSalaryLabel(input),output)
const personal={...blankBudget(),id:'participation-scope-test',name:'Éva',income:[{label:'Salaire net après impôt',amount:2000}],expenses:[{label:'constructor',amount:1000}],question:'Ma propre question ?'}
for (const [label, expected] of [['Salaire déclaré','Salaire'],['Salaire déclaré de Julie','Salaire de Julie'],['Salaires déclarés','Salaires'],['Salaire déclaréprévu','Salaire déclaréprévu']]) assert.equal(budgetSalaryLabel(label),expected, 'Accented words use a Unicode boundary, without erasing a longer label')
for (const p of BUDGET_PROFILES) {
  assert(!/salaire[^\n]*déclaré|Versement PEA au budget|Les aides évoquées|Un crédit à la consommation plus court est aussi évoqué/i.test(buildBudgetText(p)), p.id)
  assert.deepEqual(budgetPublicSavingsRows(p).map(({label:_label,...row})=>row), p.savings.map(({label:_label,...row})=>row))
}
const romain=BUDGET_PROFILES.find(p=>p.name==='Romain')
assert.equal(romain.capacity,3750);assert.equal(analyzeBudget(romain).available,3749)
assert.equal(hasSeparateBudgetCapacity(romain),false,'The source rounded capacity stays internal, without a second public total')
assert.equal(hasSeparateBudgetCapacity({...personal,capacity:150}),true,'A genuinely different capacity remains visible for manual profiles')
assert.equal(hasSeparateBudgetCapacity({...romain,kind:'participant'}),true,'An adapted profile never inherits a bank-only visibility choice')
const mathieu=BUDGET_PROFILES.find(p=>p.name==='Mathieu')
assert.equal(budgetPublicSavingsRows(mathieu)[0].label,'Versement sur le PEA')
assert.equal(mathieu.savings[0].label,'Versement PEA au budget','The source and financial references retain their original wording')
assert.equal(budgetPublicExpenseRows(personal)[0].label,'constructor','Public maps never access inherited object properties')
assert.equal(personal.income[0].label,'Salaire net après impôt');assert.equal(budgetPublicIncomeRows(personal)[0].label,'Salaire')
assert(buildBudgetText(personal).includes('Ma propre question ?'))
const byName=name=>BUDGET_PROFILES.find(p=>p.name===name)
const emilie=byName('Émilie'), story=publicationContextFor(emilie).paragraphs.map(p=>p.text).join(' ')
assert(budgetPublicPresentation(emilie).household.includes('sa part'))
assert.equal(budgetPublicExpenseRows(emilie)[0].amount,900);assert.match(budgetPublicExpenseRows(emilie)[0].label,/Part.*hors énergie et eau/)
assert.equal(7000-5000+500*36,20000);assert(story.includes('2 000 €')&&story.includes('5 000 €'))
assert(publicationContextFor(emilie).questions.some(q=>q.text.includes('65 €')))
for(const name of ['Mathieu','Samuel','Adrien et Léa'])assert(byName(name).expenses.some(row=>/impôt/i.test(row.label)),'Removing a tax adjective never removes the actual tax expense')
const lucie=byName('Lucie');assert.equal(analyzeBudget(lucie).income,2650);assert.equal(lucie.income.find(row=>/Participation/.test(row.label)).amount,600)
console.log(`Budget scope/salary: ${BUDGET_PROFILES.length} independent ledgers, source snapshots, shared/personal expenses, project funds, question origins and custom drafts verified.`)
