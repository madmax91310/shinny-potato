// Reproducible review receipt; original source photographs are never rewritten.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BUDGET_PROFILES, BUDGET_EDITORIAL_CREATIONS } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, publicationContextFor, budgetDisplayName, budgetImageExpenses } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
import { reviewBudget } from '../src/pages/budget-profiles/review.js'
const output=process.env.BUDGET_AUDIT_OUTPUT||'test-artifacts/budget-studio-audit';mkdirSync(output,{recursive:true})
const before=JSON.parse(readFileSync('docs/budget-studio-2026-11-16/financial-before.json','utf8'))
for(const entry of before){const p=BUDGET_PROFILES.find(p=>p.id===entry.id);assert(p);assert.equal(createHash('sha256').update(budgetFinancialReference(p)).digest('hex'),entry.referenceSha256,`${p.id}: old monthly rows and image finance must stay unchanged`)}
for(const entry of before)assert.equal(createHash('sha256').update(buildBudgetText(BUDGET_PROFILES.find(p=>p.id===entry.id))).digest('hex'),entry.textSha256,`${entry.id}: successful existing copy retained`)
const records=BUDGET_PROFILES.map(p=>{
 const a=analyzeBudget(p),r=reviewBudget(p),text=buildBudgetText(p),context=publicationContextFor(p)
 const cents=key=>p[key].reduce((sum,row)=>{ const [whole, fraction='']=String(row.amount).split('.'); assert(!/[eE]/.test(String(row.amount))); const decimals=fraction.padEnd(3,'0'); return sum+BigInt(whole)*100n+BigInt(decimals.slice(0,2))+(Number(decimals[2])>=5?1n:0n) },0n)
 const income=cents('income'),expenses=cents('expenses'),savings=cents('savings')
 assert.deepEqual(a.errors,[]);assert.equal(BigInt(Math.round(a.balance*100)),income-expenses-savings)
 assert(Math.abs(a.expenseShare-100*Number(expenses)/Number(income))<1e-10)
 for(const mode of ['detailed','summary'])assert.equal(budgetImageExpenses(p,mode).reduce((s,row)=>s+Math.round(row.amount*100),0),Number(expenses))
 assert(!/exemple de budget|profil fictif|budget reconstitué|version éditoriale|simulation|scénario|hypothèse|préparé le|vérifié le/i.test(text),p.id)
 assert(!/20\d\d/.test(text.split('\n')[0]));assert(context.questions.length>=1&&context.questions.length<=2);assert.equal(context.budgetQuestion,'')
 return {id:p.id,name:budgetDisplayName(p),country:p.country||null,currency:p.currency||'EUR',income:Number(income),expenses:Number(expenses),savings:Number(savings),balance:Number(income-expenses-savings),family:p.family||null,children:p.children||null,housing:p.housing||null,job:p.job,period:p.budgetAsOf||p.period,source:p.source,sourceConsultedAgain:!!BUDGET_EDITORIAL_CREATIONS[p.id]?.baseline?.startsWith('studio-'),financialChange:false,newProfile:!before.some(e=>e.id===p.id),coverage:r.coverage,projects:r.projects,questionOrigins:context.questions.map(q=>({text:q.text,origin:q.origin,evidence:q.evidence})),questionsChanged:false,publicationSha256:createHash('sha256').update(text).digest('hex'),review:'Récit et questions relus ; patrimoine et flux séparés. Les enveloppes, provisions et inconnues restent visibles dans la vérification interne.',limits:'Revue des preuves conservées ; pas de nouvelle consultation de la source sauf les deux admissions du lot studio. Absence de ligne ne prouve pas une dépense gratuite.'}
})
writeFileSync(`${output}/profiles.json`,JSON.stringify(records,null,2)+'\n')
writeFileSync(`${output}/publications.txt`,BUDGET_PROFILES.map(p=>`${p.id}\n${buildBudgetText(p)}`).join('\n\n\n')+'\n')
console.log(`${records.length} reviewed, ${before.length} old financial references unchanged, ${records.filter(r=>r.newProfile).length} admissions, ${records.filter(r=>r.balance<0).length} deficits preserved; cent/percentage and both image-mode ledgers reconciled.`)
