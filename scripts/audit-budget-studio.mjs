// Reproducible review receipt; original source photographs are never rewritten.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BUDGET_PROFILES, BUDGET_NOEMIE_PREVIOUS, BUDGET_PUBLICATION_REVIEW, BUDGET_REFERENCE_PROFILES, BUDGET_EDITORIAL_CREATIONS } from '../src/pages/budget-profiles/data.js'
import { budgetCompletions } from '../src/pages/budget-profiles/budget-completions.js'
import { analyzeBudget, buildBudgetText, publicationContextFor, budgetDisplayName, budgetExpenseColumns, euro } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
import { planSocialBudget } from '../src/pages/budget-profiles/socialImage.js'
import { reviewBudget } from '../src/pages/budget-profiles/review.js'
const output=process.env.BUDGET_AUDIT_OUTPUT||'test-artifacts/budget-studio-audit';mkdirSync(output,{recursive:true})
const before=JSON.parse(readFileSync('docs/budget-studio-2026-11-16/financial-before.json','utf8'))
for (const entry of before) {
 const published = BUDGET_PROFILES.find(p => p.id === entry.id)
 const original = entry.id === BUDGET_NOEMIE_PREVIOUS.id ? BUDGET_NOEMIE_PREVIOUS : budgetCompletions[entry.id] ? BUDGET_REFERENCE_PROFILES.find(p => p.id === entry.id) : published
 assert(original)
 assert.equal(createHash('sha256').update(budgetFinancialReference(original)).digest('hex'), entry.referenceSha256, entry.id)
 if (budgetCompletions[entry.id]) {
   const audit = budgetCompletions[entry.id]
   const sourceRow = original.expenses.find(row => row.label === audit.replace)
   assert(sourceRow, entry.id)
   assert.equal(audit.rows.reduce((total, row) => total + Math.round(row.amount * 100), 0), Math.round(sourceRow.amount * 100), entry.id)
   assert.deepEqual(analyzeBudget(published), analyzeBudget(original), entry.id)
 }
}
const records=BUDGET_PROFILES.map(p=>{
 const a=analyzeBudget(p),r=reviewBudget(p),text=buildBudgetText(p),context=publicationContextFor(p)
 const rowCents=rows=>rows.reduce((sum,row)=>{ const [whole, fraction='']=String(row.amount).split('.'); assert(!/[eE]/.test(String(row.amount))); const decimals=fraction.padEnd(3,'0'); return sum+BigInt(whole)*100n+BigInt(decimals.slice(0,2))+(Number(decimals[2])>=5?1n:0n) },0n)
 const income=rowCents(p.income.filter(row=>!row.inKind)),expenses=rowCents(p.expenses),savings=rowCents(p.savings)
 assert.deepEqual(a.errors,[]);assert.equal(BigInt(Math.round(a.balance*100)),income-expenses-savings)
 assert(Math.abs(a.expenseShare-100*Number(expenses)/Number(income))<1e-10)
 const groups=budgetExpenseColumns(p)
 const image=planSocialBudget(p)
 const percentage=amount=>Number((amount*200n+income)/(income*2n))
 assert.equal(groups.reduce((total,group)=>total+rowCents(group.rows),0n),expenses)
 for (const group of groups) {
   const amount=rowCents(group.rows)
   assert(text.includes(`${group.title} : ${euro(Number(amount)/100,p.currency)} (${percentage(amount)} %)`),p.id)
 }
 assert(text.includes(`/ mois (${percentage(income>=expenses?income-expenses:expenses-income)} %)`),p.id)
 assert.equal(rowCents(image.expenses.flatMap(column=>column.flatMap(group=>group.rows))),expenses)
 assert(!/exemple de budget|profil fictif|version éditoriale|simulation|scénario|hypothèse|préparé le|vérifié le/i.test(text),p.id)
 assert(!/20\d\d/.test(text.split('\n')[0]));assert(context.questions.length>=1&&context.questions.length<=2);assert.equal(context.budgetQuestion,'')
 return {id:p.id,name:budgetDisplayName(p),country:p.country||null,currency:p.currency||'EUR',income:Number(income),expenses:Number(expenses),savings:Number(savings),available:Number(income-expenses),balance:Number(income-expenses-savings),expenseSections:groups.map(group=>({type:group.id,cents:Number(rowCents(group.rows)),percent:percentage(rowCents(group.rows))})),family:p.family||null,children:p.children||null,housing:p.housing||null,job:p.job,period:p.budgetAsOf||p.period,source:p.source,sourceConsultedAgain:!!BUDGET_EDITORIAL_CREATIONS[p.id]?.baseline?.startsWith('studio-'),financialChange:p.id===BUDGET_NOEMIE_PREVIOUS.id||!!budgetCompletions[p.id],newProfile:!before.some(e=>e.id===p.id),coverage:r.coverage,projects:r.projects,questionOrigins:context.questions.map(q=>({text:q.text,origin:q.origin,evidence:q.evidence})),questionsChanged:p.id===BUDGET_NOEMIE_PREVIOUS.id||!!BUDGET_PUBLICATION_REVIEW[p.id]?.some(change=>change.field==='questions'),publicationSha256:createHash('sha256').update(text).digest('hex'),review:'Récit et questions relus ; patrimoine et flux séparés. Les enveloppes, provisions et inconnues restent visibles dans la vérification interne.',limits:'Revue des preuves conservées ; pas de nouvelle consultation de la source sauf les deux admissions du lot studio. Absence de ligne ne prouve pas une dépense gratuite.'}
})
writeFileSync(`${output}/profiles.json`,JSON.stringify(records,null,2)+'\n')
writeFileSync(`${output}/publications.txt`,BUDGET_PROFILES.map(p=>`${p.id}\n${buildBudgetText(p)}`).join('\n\n\n')+'\n')
console.log(`${records.length} reviewed, ${before.length} historical financial references reconciled, ${records.filter(r=>r.newProfile).length} admissions, ${records.filter(r=>r.balance<0).length} deficits preserved; cent/percentage and single-image groups reconciled.`)
