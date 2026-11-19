import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import audit from '../docs/budget-chantier4-2026-11-15/matrice.json' with { type: 'json' }
import { BUDGET_PROFILES, BUDGET_NOEMIE_PREVIOUS, BUDGET_BEFORE_COHERENCE, BUDGET_REFERENCE_PROFILES, BUDGET_ORIGINAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetPublicIncomeRows, budgetPublicPresentation, publicationContextFor, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetPublicBasis, budgetSalaryLabel } from '../src/pages/budget-profiles/presentation.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { budgetBeforeChantier4 } from './budget-audit-history.mjs'
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const forbidden=/\bexemples?\b|ficti[fv]|scénario|simulation|version éditoriale|témoignage vérifié|m’a confié|nous a envoyé/i
// This dated matrix protects the profiles it actually reviewed. Later additions
// have their own independent ledgers and still pass the full-bank checks.
const auditedIds = new Set(audit.profiles.map(p=>p.id))
const auditedProfiles = BUDGET_PROFILES.filter(p=>auditedIds.has(p.id))
assert.deepEqual(auditedProfiles.map(p=>p.id),audit.profiles.map(p=>p.id))
for (const [i,p] of auditedProfiles.entries()) {
 const expected=audit.profiles[i],text=buildBudgetText(p),context=publicationContextFor(p),view=budgetPublicPresentation(p)
 const historical = p.id === BUDGET_NOEMIE_PREVIOUS.id ? BUDGET_NOEMIE_PREVIOUS : BUDGET_BEFORE_COHERENCE.find(profile => profile.id === p.id)
 const cents=k=>historical[k].reduce((s,r)=>s+Math.round(r.amount*100),0)
 const [income,expenses,savings]=['income','expenses','savings'].map(cents)
 assert.deepEqual({income,expenses,savings,available:income-expenses,balance:income-expenses-savings},expected.expectedCents,p.id)
 assert.equal(Math.round(analyzeBudget(historical).expenseShare),expected.expensePercent,p.id)
 assert.equal(hash(['income','expenses','savings'].map(k=>(BUDGET_REFERENCE_PROFILES.find(profile=>profile.id===p.id) || historical)[k])),expected.monthlyLedgerHash,p.id)
 assert.equal(hash(p.source),expected.sourceHash,p.id)
 assert(!forbidden.test(text),p.id)
 const opening=context.paragraphs[0].text
 assert(text.indexOf(opening)>text.indexOf('💰'),p.id+' narrative after ledger')
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
 const old=budgetBeforeChantier4(historical),custom={profile:old,text:'Mon texte\n\n123 € — ma question ?',edited:true,textFinance:budgetFinancialReference(old)}
 const refreshed=refreshBudgetDraft(custom)
 assert.equal(refreshed.text,custom.text)
 assert.equal(staleBudgetText(refreshed),budgetFinancialReference(old)!==budgetFinancialReference(p))
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
