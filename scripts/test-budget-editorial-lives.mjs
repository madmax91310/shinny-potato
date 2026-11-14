import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BUDGET_PROFILES, BUDGET_RELIABLE_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_EDITORIAL_CREATIONS, BUDGET_RELIABLE_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetPublicPresentation, budgetImageExpenses, publicationContextFor, refreshBudgetDraft, budgetPublicIncomeRows } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { budgetQualification } from '../src/pages/budget-profiles/presentation.js'
const expected=JSON.parse(readFileSync(new URL('./fixtures/budget-editorial-lives-2026-11-06.json',import.meta.url))).profiles
const forbidden=/exemple|ficti[fv]|version éditoriale|reconstitu|scénario|simulation|hypothèse|modèle|préparé le|vérifié le/i
for(const [i,p]of BUDGET_PROFILES.entries()){
 const old=BUDGET_RELIABLE_PROFILES[i],r=BUDGET_EDITORIAL_CREATIONS[p.id],c=publicationContextFor(p),text=buildBudgetText(p)
 assert.deepEqual(p.expenses,[...old.expenses.flatMap(row=>(r.expenseExpansions||[]).find(e=>e.label===row.label)?.rows||[row]),...(r.expenseAdditions||[])],p.id+' projection agrees with expense provenance');
 assert.equal(p.context,r.paragraphs.join('\n\n'));assert.equal(p.question,r.questions.join('\n'));
 assert.deepEqual(p.editorialCreation.finance,r.created.filter(e=>['financial-stock','project'].includes(e.type)));
 assert.equal(p.id,old.id);assert.equal(r.nature,'editorial-character');assert.equal(r.sourceConsultationClaim,false);assert(r.reason&&r.coherence)
 assert.equal(c.editorialCreation,r)
 assert.deepEqual(c.paragraphs.map(e=>e.text),r.paragraphs,'Publication and editorial audit must agree')
 assert.deepEqual(c.questions.map(e=>e.text),r.questions,'Questions and their reviewed provenance must agree')
 assert.deepEqual(c.evidence.at(-1).created,r.created,'The evidence panel must retain the current creation inventory')
 assert(!forbidden.test(text),p.id)
 assert(!/abonné|m’a confié|nous a envoyé|témoignage/.test(text),p.id)
 const view=budgetPublicPresentation(p)
 assert(!forbidden.test([view.name,view.job,view.household,view.basis,view.incomeNote,...budgetPublicIncomeRows(p).map(r=>r.label)].join(' ')),p.id)
 assert(c.paragraphs.length>=1&&c.paragraphs.length<=3,p.id)
 assert(c.questions.length>=1&&c.questions.length<=2)
 for(const [profile,ledger]of [[old,expected[p.id].before],[p,expected[p.id].after]]){
  const a=analyzeBudget(profile);assert.deepEqual(a.errors,[],p.id)
  for(const k of['income','expenses','savings','available','balance'])assert.equal(Math.round(a[k]*100),ledger[k],`${p.id}: independent ${k}`)
  assert.equal(Math.round(a.expenseShare),ledger.expensePercent)
 }
 assert.equal(analyzeBudget(p).income,analyzeBudget(old).income,'Never add receipts to erase deficits')
 if(analyzeBudget(old).balance<0)assert.equal(analyzeBudget(p).balance,analyzeBudget(old).balance,'Existing deficits are not balanced by creations')
 for(const mode of['summary','detailed'])assert.equal(budgetImageExpenses(p,mode).reduce((s,r)=>s+Math.round(r.amount*100),0),expected[p.id].after.expenses)
 for(const replacement of r.expenseExpansions||[])assert.equal(replacement.rows.reduce((s,x)=>s+Math.round(x.amount*100),0),Math.round(old.expenses.find(x=>x.label===replacement.label).amount*100))
 for(const key of['publishedAt','checkedAt','period','budgetAsOf'])assert.deepEqual(p[key],old[key],'Creation date does not replace the budget/source period')
 assert.deepEqual(p.source,old.source)
 for(const item of [...c.paragraphs,...c.questions])assert(item.evidence.every(n=>c.evidence[n]))
 assert.deepEqual(c.review,BUDGET_RELIABLE_PUBLICATION_CONTEXT[p.id].review,'No fictional source consultation')
 const custom={profile:old,text:'Ma version à conserver',edited:true,textFinance:budgetFinancialReference(old)},fresh=refreshBudgetDraft(custom)
 assert.equal(fresh.text,custom.text)
 assert.equal(staleBudgetText(fresh),budgetFinancialReference(old)!==budgetFinancialReference(p))
 assert.equal(refreshBudgetDraft({...custom,edited:false}).text,text)
 const personal={...p,kind:'participant'};assert.equal(publicationContextFor(personal),null);assert.equal(budgetQualification(personal),'');assert(!forbidden.test(buildBudgetText(personal)),`${p.id}: adapted participation`)
 assert.equal(BUDGET_ORIGINAL_PROFILES[i].id,p.id)
}
const adrien=BUDGET_PROFILES.find(p=>p.id==='finary-cyber-24-2026-08-27')
assert.equal(analyzeBudget(adrien).expenses,1190);assert.equal(analyzeBudget(adrien).savings,1450);assert.equal(analyzeBudget(adrien).balance,160)
console.log(`Editorial lives: ${BUDGET_PROFILES.length} reviewed, neutral public copy and internal provenance, separate creations, independent ledgers and customized drafts verified.`)

const michel=BUDGET_EDITORIAL_CREATIONS['websourd-retraite-normandie-2026-10-02'].created.find(e=>e.type==='calculated')
assert(michel.reserve<michel.newAppliance,'Replacing the appliance is not immediately affordable from the reserve')
assert.equal(michel.reserve+michel.monthlyProvision*michel.months-michel.newAppliance,michel.afterReplacement)
assert.equal(michel.reserve-michel.repair,michel.afterRepair)
