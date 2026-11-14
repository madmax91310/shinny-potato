import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetImageExpenses, budgetPublicPresentation, blankBudget, sourceReply } from '../src/pages/budget-profiles/lib.js'
import { budgetQualification } from '../src/pages/budget-profiles/presentation.js'
const ledger=JSON.parse(readFileSync(new URL('../docs/audit-budget-2026-11-13/calculs-verifies.json',import.meta.url)))
assert.equal(BUDGET_PROFILES.length,70)
assert.equal(new Set(BUDGET_PROFILES.map(p=>p.id)).size,70)
for(const p of BUDGET_PROFILES){
 const a=analyzeBudget(p),old=ledger[p.id]
 assert.deepEqual(a.errors,[])
 for(const k of ['income','expenses','savings','available','balance'])assert.equal(Math.round(a[k]*100),old[k],`${p.id}: original financial totals preserved`)
 const text=buildBudgetText(p)
 assert(!/\bexemples?\b|ficti[fv]|reconstitu|version éditoriale|personnage éditorial/i.test(text),p.id)
 assert(!text.includes('Période du budget :'), 'Periods belong in the profile, not an automatic tweet line')
 assert.match(sourceReply(p),/^Source : /)
 assert(!/solde à confirmer|traitement.*non précisé/i.test(budgetPublicPresentation(p).incomeNote),'No automatic tax disclaimer')
 for(const mode of ['summary','detailed'])assert.equal(budgetImageExpenses(p,mode).reduce((s,r)=>s+Math.round(r.amount*100),0),old.expenses)
 assert.equal(budgetQualification({...p,kind:'participant',source:null}),'','An adapted budget retains a neutral public presentation')
 assert.equal(BUDGET_ORIGINAL_PROFILES.find(o=>o.id===p.id).id,p.id)
}
assert.equal(budgetQualification(blankBudget()),'','A genuinely blank participation is not automatically fictional')
console.log('Audit 2026-11-13 : 70 profils, calculs inchangés, périodes, fiscalité et présentation neutre et provenance interne conservée.')
