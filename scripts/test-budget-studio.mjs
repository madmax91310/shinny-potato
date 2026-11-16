import assert from 'node:assert/strict'
import presets from '../src/pages/budget-profiles/manual-presets.json' with { type:'json' }
import { EXPENSE_CATEGORIES } from '../src/pages/budget-profiles/data.js'
import { BUDGET_PROFILES, BUDGET_STUDIO_EDITORIAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, validBudget, blankBudget, refreshBudgetDraft, budgetImageExpenses } from '../src/pages/budget-profiles/lib.js'
import { duplicateBudget } from '../src/pages/budget-profiles/manual.js'
import { annualRow, monthlyRow, monthlyProvision, moveBudgetRow } from '../src/pages/budget-profiles/row-input.js'
import { suggestBudgetPublications, moveQueuedProfile } from '../src/pages/budget-profiles/queue.js'
import { reviewBudget } from '../src/pages/budget-profiles/review.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { WORKSPACE_KEY, loadWorkspace, saveDraft, saveQueued, loadQueued, exportBudgetBackup, parseBudgetBackup, previewBudgetImport, restoreBudgetBackup, budgetStorageSnapshot, validWorkspace } from '../src/pages/budget-profiles/storage.js'
import entries from '../src/pages/budget-profiles/editorial-profiles-studio-2026-11-16.json' with { type:'json' }

assert(presets.every(p=>EXPENSE_CATEGORIES.some(c=>c.id===p.category)))
assert.equal(monthlyProvision(100),8.33); assert.equal(monthlyProvision(120),10); assert.equal(monthlyProvision(null),null)
const manual={...blankBudget(),id:'manual-annual',name:'Alice',income:[{label:'Salaire',amount:1000}],expenses:[annualRow({label:'Cadeaux',category:'other'},100)],question:'Quel budget pour les cadeaux ?'}
assert(!validBudget({...manual,income:[annualRow({label:'Salaire'},12000)]}),'This version supports annual expenses only; income stays editable monthly')
assert(validBudget(manual));assert.equal(analyzeBudget(manual).expenses,8.33)
assert.match(buildBudgetText(manual),/Provision Cadeaux/)
const combined={...manual,expenses:[annualRow({label:'Électricité',category:'bills'},120),{label:'Téléphone',category:'bills',amount:20}]}
assert.equal(budgetImageExpenses(combined,'summary').length,2,'A manually entered annual provision remains identifiable in the summary')
assert(!validBudget({...manual,expenses:[{...manual.expenses[0],amount:100}]}),'An annual amount cannot silently become a monthly expense')
assert(!validBudget({...manual,expenses:[{...manual.expenses[0],annualProvision:{amount:100,secret:true}}]}))
assert(validBudget({...manual,expenses:[{label:'Ancienne provision',amount:20,annualAmount:240,periodicity:'annual-provision'}]}),'Existing provision schema is still accepted unchanged')
assert(!('annualProvision' in monthlyRow(manual.expenses[0])))
assert(!('annualAmount' in annualRow({label:'Entretien',amount:20,annualAmount:240,periodicity:'annual-provision'},360)))
assert.deepEqual(moveBudgetRow([1,2,3],1,-1),[2,1,3]);assert.deepEqual(moveBudgetRow([1,2],0,-1),[1,2])
const custom={profile:manual,text:'Mes mots et mes questions.',edited:true,textFinance:budgetFinancialReference(manual)}
const sourceWithAnnualBonus={...custom,profile:{...manual,income:[{label:'Salaire',amount:1000},{label:'Prime mensualisée',amount:100,annualAmount:1200}]}}
assert(!duplicateBudget(sourceWithAnnualBonus,'bonus-copy').profile.income[1].annualProvision,'Legacy annual bonus metadata does not make a monthly income input readonly')
const copy=duplicateBudget(custom,'copy','2026-11-16T00:00:00Z')
assert.equal(copy.text,custom.text);assert.equal(copy.profile.question,manual.question);assert.equal(copy.profile.kind,'participant');assert.equal(copy.profile.source,null);assert(!copy.profile.editorialCreation)
assert(staleBudgetText({...copy,profile:{...copy.profile,expenses:[annualRow(manual.expenses[0],120)]}}))
const bank=BUDGET_PROFILES.find(p=>p.name==='Guillaume'),adapted=duplicateBudget({profile:bank,text:'custom',edited:true},'new-person')
assert(validBudget(adapted.profile));assert.equal(adapted.profile.question,'');assert.equal(adapted.profile.context,'');assert.equal(adapted.edited,false);assert.equal(adapted.profile.source,null);assert(!adapted.profile.editorialCreation);assert(!adapted.profile.provenance.sourceFacts);assert(adapted.profile.expenses.every(r=>EXPENSE_CATEGORIES.some(c=>c.id===r.category)))
assert.equal(adapted.profile.savings.find(r=>/PEL/.test(r.label)).amount,45)
for(const p of BUDGET_PROFILES){
 const template=duplicateBudget({profile:p,text:buildBudgetText(p),edited:false},'template')
 assert(validBudget(template.profile),p.id)
 assert.equal(template.profile.question,'');assert.equal(template.profile.context,'')
 assert(!/exemple de budget|profil fictif|budget reconstitué|version éditoriale|hypothèse|impôt non précisé/i.test(template.text))
 if(p.kind==='planned'||p.completion?.forecast)assert.match(template.text,/budget prévu/i,'Adapting a forecast does not turn it into an observed month')
}
const suggested=suggestBudgetPublications(BUDGET_PROFILES,{published:[bank.id],queued:[BUDGET_PROFILES[0].id]})
assert(suggested.length);assert(!suggested.some(p=>[bank.id,BUDGET_PROFILES[0].id].includes(p.id)));assert.deepEqual(suggested,suggestBudgetPublications(BUDGET_PROFILES,{published:[bank.id],queued:[BUDGET_PROFILES[0].id]}));assert.equal(new Set(suggested.map(p=>p.id)).size,suggested.length)
assert.deepEqual(moveQueuedProfile(['a','b'],'b',-1),['b','a'])
const leo=reviewBudget(BUDGET_PROFILES.find(p=>p.name==='Léo'));assert.notEqual(leo.coverage.find(c=>c.id==='telecoms').status,'unknown')
const vague=reviewBudget({...manual,expenses:[{label:'Autres dépenses',amount:100}]});assert(vague.coverage.every(item=>item.status==='unknown'))
const health=reviewBudget({...manual,expenses:[{label:'Assurance automobile',amount:100}]});assert.equal(health.coverage.find(c=>c.id==='assurances_sante').status,'unknown')

const memory=new Map(),previous=globalThis.localStorage
try{
 globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),key:i=>[...memory.keys()][i],get length(){return memory.size}}
 const legacy={version:4,drafts:[custom],activeId:manual.id,used:[manual.id],queued:['a','b'],published:[manual.id],publicationDates:{[manual.id]:null}}
 const bytes=JSON.stringify(legacy);memory.set(WORKSPACE_KEY,bytes)
 const loaded=loadWorkspace();assert(validWorkspace(loaded.value));assert.deepEqual(loaded.value.scheduledDates,{});assert.equal(memory.get(WORKSPACE_KEY),bytes)
 assert(saveQueued(['a','b'],{a:'2026-12-01'}));assert.deepEqual(loadQueued().dates,{a:'2026-12-01'});assert.equal(exportBudgetBackup().workspace.publicationDates[manual.id],null)
 const incoming=parseBudgetBackup(JSON.stringify(exportBudgetBackup()));incoming.queued=['b','a'];incoming.scheduledDates.a='2026-12-02'
 assert.deepEqual(previewBudgetImport(incoming).conflicts.sort(),['a','b'])
 assert(restoreBudgetBackup(incoming,'keep-local',budgetStorageSnapshot()));assert.deepEqual(loadQueued().value,['a','b']);assert.equal(loadQueued().dates.a,'2026-12-01')
 assert(restoreBudgetBackup(incoming,'use-imported',budgetStorageSnapshot()));assert.deepEqual(loadQueued().value,['b','a']);assert.equal(loadQueued().dates.a,'2026-12-02')
 assert.equal(loadWorkspace().value.drafts[0].text,custom.text)
 assert(!saveQueued(['a'],{a:'2026-02-30'}));assert(saveQueued(['b']));assert.deepEqual(loadQueued().dates,{})
 const other=JSON.parse(memory.get(WORKSPACE_KEY));other.queued.push('other');memory.set(WORKSPACE_KEY,JSON.stringify(other));assert(!saveQueued(['a']));assert(!saveDraft(custom))
 memory.set(WORKSPACE_KEY,'{broken');loadWorkspace();assert(!saveQueued(['a']));assert.equal(memory.get(WORKSPACE_KEY),'{broken');assert.equal(exportBudgetBackup().recovery[WORKSPACE_KEY],'{broken')
}finally{globalThis.localStorage=previous}

const canonical=url=>url.match(/reddit\.com\/r\/[^/]+\/comments\/([^/]+)/)?.[1] || url.replace(/[?#].*$/,'').replace(/\/$/,'')
const old=BUDGET_PROFILES.filter(p=>!BUDGET_STUDIO_EDITORIAL_PROFILES.some(n=>n.id===p.id))
for(const entry of entries){const p=entry.profile,a=analyzeBudget(p);assert(validBudget(p));assert.deepEqual(a.errors,[]);assert(!old.some(q=>canonical(q.source.url)===canonical(p.source.url)));assert(!old.some(q=>q.income.map(r=>r.amount).join()===p.income.map(r=>r.amount).join()&&q.expenses.map(r=>r.amount).join()===p.expenses.map(r=>r.amount).join()))
 for(const key of ['income','expenses','savings','available','balance'])assert.equal(Math.round(a[key]*100),entry.expectedCents[key])
 for(const mode of ['detailed','summary'])assert.equal(budgetImageExpenses(p,mode).reduce((n,r)=>n+Math.round(r.amount*100),0),entry.expectedCents.expenses)
 assert(!/exemple|fictif|reconstitu|simulation|scénario|hypothèse|préparé le|après impôt/i.test(buildBudgetText(p)));assert(entry.publication.questions.length<=2);assert(!entry.publication.budgetQuestion)
 assert(p.provenance.createdFields.length);assert.equal(p.provenance.sourceSnapshot.transport,'public-web-reader');assert.equal(refreshBudgetDraft({...custom,profile:p}).text,custom.text)
}
assert.equal(175000-(119000+25000)-30000,1000)
assert.equal(117000-73000-30000-7000-3000,4000)
console.log('Budget studio: annual cent rounding, row moves, safe duplication, manual questions, source/creation separation, queue order/date conflicts, v4 migration, stale tabs and corrupt storage verified.')
