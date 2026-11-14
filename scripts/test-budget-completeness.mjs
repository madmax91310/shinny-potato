import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BUDGET_PROFILES, BUDGET_RELIABLE_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_COMPLETENESS, BUDGET_PREVIOUS_PROFILES, BUDGET_ORIGINAL_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetImageExpenses, budgetPublicExpenseRows, buildBudgetText, publicationContextFor, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
const expected = JSON.parse(readFileSync(new URL('./fixtures/budget-completeness-2026-11-03.json', import.meta.url)))
const currentExpected = JSON.parse(readFileSync(new URL('./fixtures/budget-reliability-2026-11-06.json', import.meta.url))).profiles
const baseline = JSON.parse(readFileSync(new URL('./fixtures/budget-editorial/presentation-2026-11-02.json', import.meta.url)))
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
assert.equal(hash(BUDGET_ORIGINAL_PROFILES), baseline.profilesHash, 'Every original profile and source photograph stays byte-equivalent')
assert.equal(hash(Object.values(BUDGET_ORIGINAL_PUBLICATION_CONTEXT)), baseline.contextsHash, 'Original paragraphs, questions and all evidence stay intact')
assert.deepEqual(BUDGET_PROFILES.map(p=>p.id), BUDGET_ORIGINAL_PROFILES.map(p=>p.id))
assert.deepEqual(Object.keys(BUDGET_COMPLETENESS).sort(), BUDGET_PROFILES.map(p=>p.id).sort())
let modified=0,completed=0
for (const [i,p] of BUDGET_RELIABLE_PROFILES.entries()) {
  const original=BUDGET_ORIGINAL_PROFILES[i], review=BUDGET_COMPLETENESS[p.id]
  assert.deepEqual(Object.keys(review.coverage).sort(),Object.keys(review.reliability.coverageEvidence).sort())
  assert(Object.values(review.coverage).every(s=>['listed','grouped','external','not_applicable','unknown','prepared_assumption','provisioned'].includes(s)))
  assert(review.conclusion && review.questionsReview && review.resourcesReview)
  for (const [profile,ledger] of [[original,expected[p.id].before],[BUDGET_PREVIOUS_PROFILES[i],expected[p.id].after],[p,currentExpected[p.id].after]]) {
    const a=analyzeBudget(profile);assert.deepEqual(a.errors,[])
    for(const key of ['income','expenses','savings','available','balance'])assert.equal(Math.round(a[key]*100),ledger[key],`${p.id}: independent Decimal ${key}`)
    assert.equal(Math.round(a.expenseShare),ledger.expensePercent)
    assert(Math.abs(a.expenseShare-ledger.expenses/ledger.income*100)<1e-10)
  }
  for(const key of ['id','currency','country','family','children','period','budgetAsOf','publishedAt','checkedAt','preparedAt'])assert.deepEqual(p[key],original[key],`${p.id}: preserve ${key}`)
  assert.deepEqual(p.source,original.source)
  assert(p.income.every(row=>original.income.some(r=>JSON.stringify(r)===JSON.stringify(row))),'Never invent a new resource')
  if(review.financialChange){modified++;assert.equal(p.kind,'prepared');assert.equal(p.capacity,null)}else assert.deepEqual(p,original)
  if(review.additions.length)completed++
  for(const row of review.additions){
    assert(Number.isInteger(row.amount)&&row.amount>0 && row.origin==='editorial-assumption')
    assert(row.reason && row.covers.length)
    assert(!original.expenses.some(x=>x.label===row.label),'No duplicate expense line')
    if(row.periodicity==='annual-provision'){assert.equal(row.annualAmount,row.amount*12);assert(/^Provision/i.test(row.label))}
  }
  if(review.savingsPlan){assert(review.savingsReason);assert(review.savingsPlan.every(row=>original.savings.some(r=>r.label===(row.sourceLabel??row.label) && row.amount<=r.amount)),'No new instrument or funded project invented')}
  if(!review.profileOverrides?.expenses){
    for(const row of original.expenses){if(review.expenseReplacements?.some(x=>x.label===row.label))continue;const next=p.expenses.find(x=>x.label===row.label);assert(next);assert.equal(next.amount,review.expenseCorrections?.find(x=>x.label===row.label)?.amount??row.amount)}
  }else assert(review.scopeChange && review.replacementExpensesReason)
  for(const mode of ['detailed','summary'])assert.equal(budgetImageExpenses(p,mode).reduce((s,r)=>s+Math.round(r.amount*100),0),currentExpected[p.id].after.expenses)
  for(const [i,row] of p.expenses.entries())if(/^Provision\b|mensualis|^Enveloppe.*vacances/i.test(row.label))assert(budgetImageExpenses(p,'summary').some(x=>x.label===budgetPublicExpenseRows(p)[i].label && x.amount===row.amount),'A summary cannot disguise an annual provision as ordinary monthly spending')
  const c=publicationContextFor(p), old=BUDGET_ORIGINAL_PUBLICATION_CONTEXT[p.id]
  assert.deepEqual(c.review,old.review,'An editorial review is not a new source consultation')
  for(const q of c.questions)if(!old.questions.some(x=>x.text===q.text)){
    if(q.origin==='editorial')assert(q.adaptedFrom.length)
    else {
      assert.equal(q.origin,'expressed')
      assert(old.questions.some(x=>x.origin==='expressed' && x.text===q.adaptedFrom?.text),'A faithful rewording retains an existing sourced question, never invents its origin')
    }
  }
  const personal={profile:structuredClone(original),text:'Mon texte personnel avec mes anciens chiffres.',edited:true}
  const refreshed=refreshBudgetDraft(personal), current=BUDGET_PROFILES.find(x=>x.id===p.id)
  assert.equal(refreshed.text,personal.text)
  assert.equal(staleBudgetText(refreshed),budgetFinancialReference(original)!==budgetFinancialReference(current))
  assert.equal(staleBudgetText(refreshBudgetDraft(refreshed)),staleBudgetText(refreshed),'Warning survives repeated reloads')
  assert(!staleBudgetText({...refreshed,textFinance:budgetFinancialReference(current)}),'Only an explicit review acknowledges new amounts')
  const automatic=refreshBudgetDraft({...personal,edited:false});assert.equal(automatic.text,buildBudgetText(current));assert(!staleBudgetText(automatic))
}
assert.equal(modified,Object.values(BUDGET_COMPLETENESS).filter(r=>r.financialChange).length)
assert.equal(completed,Object.values(BUDGET_COMPLETENESS).filter(r=>r.additions.length).length)
const elodie=BUDGET_PROFILES.find(p=>p.name==='Élodie')
assert(elodie);assert.equal(analyzeBudget(elodie).income,2000);assert.equal(elodie.income.length,1)
assert(!/crédit|taxe foncière/i.test(JSON.stringify(elodie.expenses)),'Unknown spouse income cannot establish a mortgage or property tax')
assert.equal(elodie.housing,'');assert.equal(elodie.age,BUDGET_ORIGINAL_PROFILES.find(p=>p.id===elodie.id).provenance.original.age)
const zoe=BUDGET_PROFILES.find(p=>p.name==='Zoé');assert.equal(zoe.housing,'');assert.equal(analyzeBudget(zoe).balance,-163.97);assert.equal(zoe.income.length,3)
const apolline=BUDGET_PROFILES.find(p=>p.name==='Apolline');assert(!apolline.expenses.some(r=>/loyer/i.test(r.label)),'Do not bill a rent that parents actually pay')
const engineer=BUDGET_PROFILES.find(p=>p.name==='Émilien');assert.deepEqual(engineer.savings,[],'750 euros discussed is still not a decided transfer')
assert(BUDGET_PROFILES.some(p=>p.currency==='CHF'&&analyzeBudget(p).balance<0));assert(BUDGET_PROFILES.some(p=>p.expenses.length===24))
assert.equal(hash(BUDGET_ORIGINAL_PROFILES),baseline.profilesHash)
console.log(`Budget completeness: ${BUDGET_PROFILES.length} audited; ${completed} completed; ${modified} financial revisions; independent cent/percentage ledgers, immutable photographs and stale personal drafts verified.`)
