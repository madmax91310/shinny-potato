import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BUDGET_PROFILES, BUDGET_RELIABLE_PROFILES, BUDGET_RELIABLE_PUBLICATION_CONTEXT, BUDGET_PREVIOUS_PROFILES, BUDGET_COMPLETENESS, BUDGET_PREVIOUS_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, publicationContextFor, budgetImageExpenses, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
const expected = JSON.parse(readFileSync(new URL('./fixtures/budget-reliability-2026-11-06.json', import.meta.url))).profiles
for (const [i,p] of BUDGET_RELIABLE_PROFILES.entries()) {
 const review=BUDGET_COMPLETENESS[p.id].reliability, ctx=BUDGET_RELIABLE_PUBLICATION_CONTEXT[p.id]
 assert(review && review.conclusion && review.remainingSummary)
 assert.deepEqual(Object.keys(review.coverage).sort(),Object.keys(review.coverageEvidence).sort())
 for (const [key,e] of Object.entries(review.coverageEvidence)) {
  assert(e.basis,`${p.id}: ${key} needs evidence`)
  assert(e.rows.every(label=>p.expenses.some(row=>row.label===label)),`${p.id}: ${key} references current rows`)
 }
 assert.deepEqual(review.expenseEvidence.map(e=>e.label).sort(),p.expenses.map(e=>e.label).sort())
 assert(review.expenseEvidence.every(e=>e.origin && e.role && e.necessity))
 for (const [profile,ledger] of [[BUDGET_PREVIOUS_PROFILES[i],expected[p.id].before],[p,expected[p.id].after]]) {
  const a=analyzeBudget(profile);assert.deepEqual(a.errors,[])
  for(const key of ['income','expenses','savings','available','balance'])assert.equal(Math.round(a[key]*100),ledger[key],`${p.id}: independent ledger ${key}`)
  assert.equal(Math.round(a.expenseShare),ledger.expensePercent)
 }
 assert.equal(budgetImageExpenses(p,'summary').reduce((n,r)=>n+Math.round(r.amount*100),0),expected[p.id].after.expenses)
 const old=BUDGET_PREVIOUS_PROFILES[i], custom={profile:old,text:'Texte écrit à la main',edited:true,textFinance:budgetFinancialReference(old)}
 const refreshed=refreshBudgetDraft(custom)
 assert.equal(refreshed.text,custom.text)
 assert.equal(staleBudgetText(refreshed),budgetFinancialReference(old)!==budgetFinancialReference(BUDGET_PROFILES[i]))
 assert.equal(refreshBudgetDraft({...custom,edited:false}).text,buildBudgetText(BUDGET_PROFILES[i]))
 for(const item of [...ctx.paragraphs,...ctx.questions])assert(item.evidence.every(n=>n>=0 && n<ctx.evidence.length))
 if(review.public?.budgetQuestion) {
  assert.equal(ctx.budgetQuestion,review.public.budgetQuestion)
  if(ctx.budgetQuestion!==BUDGET_PREVIOUS_PUBLICATION_CONTEXT[p.id].budgetQuestion)assert(ctx.budgetQuestionHistory.some(h=>h.after===ctx.budgetQuestion && h.origin==='editorial'))
 }
}
const find=id=>BUDGET_PROFILES.find(p=>p.id===id), rev=id=>BUDGET_COMPLETENESS[id].reliability
const leo=find('reddit-alternant-20-2025-09-03')
assert.equal(rev(leo.id).coverage.telecoms,'grouped')
assert(rev(leo.id).coverageEvidence.telecoms.rows.some(label=>/téléphone/i.test(label)))
assert.equal(leo.expenses.filter(r=>/téléphone/i.test(r.label)).length,1)
assert.equal(analyzeBudget(leo).expenses,470)
const apprentice=find('budget-conseil-apprenties_majeures-2025-2026')
assert.equal(apprentice.expenses.filter(r=>/logement|nourriture/i.test(r.label)).length,1)
assert.equal(analyzeBudget(apprentice).balance,-5)
const paris=find('prepared-tom281-2026-10-30')
assert.equal(analyzeBudget(paris).income,2350)
assert(!paris.income.some(r=>r.amount===180))
const hugo=find('finary-alternant-19-2025-09-27')
assert.match(buildBudgetText(hugo),/bonus/)
assert.match(buildBudgetText(hugo),/5 €|4,99/)
assert.equal(analyzeBudget(hugo).savings,120)
const julie=find('reddit-couple-nord-2026-07-09')
assert(!publicationContextFor(julie).paragraphs.some(r=>/347/.test(r.text)))
assert.equal(analyzeBudget(julie).balance,107)
console.log(`Budget reliability: ${BUDGET_PROFILES.length} independent ledgers, matrix proofs, previous drafts and layered provenance verified.`)
