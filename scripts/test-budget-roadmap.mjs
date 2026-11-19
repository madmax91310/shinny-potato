import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import entries from '../src/pages/budget-profiles/editorial-profiles-roadmap-2026-11-16.json' with { type: 'json' }
import before from '../docs/budget-roadmap-2026-11-16/financial-before.json' with { type: 'json' }
import { BUDGET_PROFILES, BUDGET_NOEMIE_PREVIOUS, BUDGET_BEFORE_COHERENCE, BUDGET_PUBLICATION_SELECTION, BUDGET_PUBLICATION_CONTEXT, BUDGET_STUDIO_EDITORIAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetImageExpenses, refreshBudgetDraft, validBudget, matchesBudgetFilters } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
import { parseBudgetBackup } from '../src/pages/budget-profiles/storage.js'
const ids=new Set(entries.map(e=>e.profile.id))
assert.equal(BUDGET_PROFILES.length,before.length+entries.length+BUDGET_STUDIO_EDITORIAL_PROFILES.length)
for(const old of before){const p=old.id===BUDGET_NOEMIE_PREVIOUS.id ? BUDGET_NOEMIE_PREVIOUS : BUDGET_BEFORE_COHERENCE.find(p=>p.id===old.id),a=analyzeBudget(p);assert(p);for(const key of ['income','expenses','savings','balance'])assert.equal(Math.round(a[key]*100),old[key],p.id+'/'+key)}
const sums=[['Iris',288000,116500,153700,17800],['Laurent et Eva',385000,312000,40000,33000]]
assert.equal(entries.length,sums.length)
for(const [i,e]of entries.entries()){
 const p=e.profile,a=analyzeBudget(p),[name,income,expenses,savings,balance]=sums[i]
 assert.equal(name,p.name);assert(validBudget(p));assert.deepEqual(a.errors,[])
 for(const [key,value]of Object.entries({income,expenses,savings,balance}))assert.equal(Math.round(a[key]*100),value,name+'/'+key)
 assert.deepEqual(e.expectedCents,{income,expenses,savings,available:income-expenses,balance});assert(Math.abs(a.expenseShare-100*expenses/income)<1e-10)
 assert(!BUDGET_PROFILES.filter(p=>!ids.has(p.id)).some(q=>q.source?.url===p.source.url))
 assert(p.income.every(r=>r.origin==='source'));assert(p.expenses.every(r=>['source','editorial-created'].includes(r.origin)))
 assert.equal(p.provenance.sourceSnapshot.transport,'public-web-reader');assert.equal(p.provenance.sourceSnapshot.authorHash.length,64)
 assert.deepEqual(p.provenance.sourceFacts,e.creation.sourceFacts);assert(p.provenance.createdFields.length)
 const text=buildBudgetText(p),c=BUDGET_PUBLICATION_CONTEXT[p.id]
 assert(!/exemple|ficti[fv]|reconstitu|version éditoriale|scénario|simulation|hypothèse|préparé le|vérifié le|budget personnel|abonné|m’a confié/i.test(text))
 assert(!/20\d\d/.test(text.split('\n')[0]));assert(c.questions.length>=1&&c.questions.length<=2);assert.equal(c.budgetQuestion,'')
 assert.equal((text.match(/\?/g)||[]).length,c.questions.length)
 for(const q of c.questions){assert.equal(q.origin,p.name==='Iris'&&q===c.questions[0]?'expressed':'editorial');assert(q.evidence.every(n=>c.evidence[n]))}
 for(const mode of ['detailed','summary'])assert.equal(budgetImageExpenses(p,mode).reduce((sum,r)=>sum+Math.round(r.amount*100),0),expenses)
 assert(matchesBudgetFilters(p,{country:p.country||'unknown',family:p.family,children:'unknown',housing:p.housing,income:'EUR:0:10000'}));assert(!matchesBudgetFilters(p,{income:'CHF:0:10000'}))
 const custom={profile:p,text:'Mes propres questions.',edited:true,textFinance:budgetFinancialReference(p)};assert.equal(refreshBudgetDraft(custom).text,custom.text)
}
const iris=entries.find(e=>e.profile.name==='Iris').profile
assert.equal(150000+2*75000,300000);assert.equal(2*60000+58*100000,5920000)
assert.equal(288000-(116500+12500)-(100000+10000+8700),40300)
assert.equal(iris.housing,'other');assert.equal(iris.income.length,1);assert(!iris.expenses.some(r=>/voiture|carburant|crédit/i.test(r.label)))
const lux=entries.find(e=>e.profile.country==='Luxembourg').profile
assert.equal(lux.age,null);assert.equal(lux.job,'');assert.equal(lux.publishedAt,null);assert.equal(lux.budgetAsOf,'2026');assert.equal(lux.income[0].amount,3850);assert(lux.provenance.sourceSnapshot.scope.includes('NOT the thread starter'))
const ingrid=BUDGET_PROFILES.find(p=>p.name==='Ingrid et Joël');assert.equal(ingrid.incomeNote,'Salaires seuls');const energy=ingrid.expenses.find(r=>r.label==='Énergie et eau');assert.deepEqual(energy.sourceAmounts,[220,40]);assert.equal(energy.amount,260)
const prepared=parseBudgetBackup(readFileSync(new URL('../docs/budget-roadmap-2026-11-16/selection-a-publier.json',import.meta.url),'utf8'))
assert.deepEqual(prepared.queued,BUDGET_PUBLICATION_SELECTION.map(p=>p.id));assert.deepEqual(prepared.published,[]);assert.deepEqual(prepared.drafts,[]);assert.deepEqual(prepared.publicationDates,{})
assert.equal(new Set(prepared.queued).size,prepared.queued.length);assert(prepared.queued.every(id=>BUDGET_PROFILES.some(p=>p.id===id)))
console.log('Budget roadmap: existing financial ledgers preserved, two qualified sources, separate source/creations, two-stage project arithmetic, salary-only image scope, backup selection and custom drafts passed.')
