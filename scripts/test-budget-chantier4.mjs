import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import audit from '../docs/budget-chantier4-2026-11-15/matrice.json' with { type: 'json' }
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetPublicIncomeRows, budgetPublicPresentation, publicationContextFor, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetPublicBasis, budgetSalaryLabel } from '../src/pages/budget-profiles/presentation.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { budgetBeforeChantier4 } from './budget-audit-history.mjs'
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const forbidden=/\bexemples?\b|ficti[fv]|reconstitu|scénario|simulation|version éditoriale|témoignage vérifié|m’a confié|nous a envoyé/i
assert.deepEqual(BUDGET_PROFILES.map(p=>p.id),audit.profiles.map(p=>p.id))
for (const [i,p] of BUDGET_PROFILES.entries()) {
 const expected=audit.profiles[i],text=buildBudgetText(p),context=publicationContextFor(p),view=budgetPublicPresentation(p)
 const cents=k=>p[k].reduce((s,r)=>s+Math.round(r.amount*100),0)
 const [income,expenses,savings]=['income','expenses','savings'].map(cents)
 assert.deepEqual({income,expenses,savings,available:income-expenses,balance:income-expenses-savings},expected.expectedCents,p.id)
 assert.equal(Math.round(analyzeBudget(p).expenseShare),expected.expensePercent,p.id)
 assert.equal(hash(['income','expenses','savings'].map(k=>p[k])),expected.monthlyLedgerHash,p.id)
 assert.equal(hash(p.source),expected.sourceHash,p.id)
 assert.equal(hash(text),expected.textHash,p.id)
 assert(!forbidden.test(text),p.id)
 const opening=context.paragraphs[0].text
 assert(text.indexOf(opening)<text.indexOf('💰'),p.id+' concrete opening before ledger')
 assert.equal(text.split(opening).length-1,1,p.id+' opening once')
 assert(context.questions.length>=1&&context.questions.length<=2)
 assert.equal(new Set(context.questions.map(q=>q.text)).size,context.questions.length)
 for(const [j,row] of budgetPublicIncomeRows(p).entries()) {
  const qualifier=p.income[j].label.match(/(?:avant|après)\s+(?:impôts?|prélèvement à la source)|d[’']impôts?/i)?.[0]
  if(qualifier)assert(row.label.includes(qualifier),p.id+' explicit tax scope retained')
  if(/\bnets?\b/.test(p.income[j].label))assert(/\bnets?\b/.test(row.label),p.id+' net retained without inventing tax status')
 }
 const qualifier=view.basis.match(/(?:avant|après) impôts?/i)?.[0]
 if(qualifier)assert(budgetPublicBasis(p,view.basis).includes(qualifier),p.id)
 const old=budgetBeforeChantier4(p),custom={profile:old,text:'Mon texte\n\n123 € — ma question ?',edited:true,textFinance:budgetFinancialReference(old)}
 const refreshed=refreshBudgetDraft(custom)
 assert.equal(refreshed.text,custom.text)
 assert.equal(staleBudgetText(refreshed),p.name==='Marc')
 assert.equal(refreshBudgetDraft({...custom,edited:false}).text,text)
}
const marc=BUDGET_PROFILES.find(p=>p.name==='Marc')
assert.deepEqual(marc.savings,[])
assert.equal(analyzeBudget(marc).balance,16167)
assert(!/Épargne et investissements :/.test(buildBudgetText(marc)))
assert(BUDGET_ORIGINAL_PROFILES.find(p=>p.id===marc.id).provenance.original.notes.some(n=>n.includes('pas un montant de versements')))
assert.equal(budgetSalaryLabel('Salaire','Salaire net'), 'Salaire · net')
assert.equal(budgetSalaryLabel('Salaire','Salaire'), 'Salaire')
assert.equal(budgetSalaryLabel('Salaire de Nathan','Salaire de Nathan après impôt'),'Salaire de Nathan · après impôt')
assert.equal(BUDGET_PROFILES.find(p=>p.name==='Guillaume').savings.find(r=>r.label==='PEL').amount*12,540)
console.log(`Chantier 4: ${audit.profiles.length} reviewed profiles, independent cents, explicit income scope, concrete openings, questions and protected custom drafts passed.`)
