import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import entries from '../src/pages/budget-profiles/editorial-profiles-complementary-2026-11-16.json' with { type: 'json' }
import preserved from '../docs/budget-complementary-bank-2026-11-16/existing-profiles-preserved.json' with { type: 'json' }
import candidates from '../docs/budget-complementary-bank-2026-11-16/candidates.json' with { type: 'json' }
import priorAuthors from '../docs/budget-qualified-bank-2026-11-15/source-author-check.json' with { type: 'json' }
import { BUDGET_PROFILES, BUDGET_PUBLICATION_CONTEXT, BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetImageExpenses, validBudget, refreshBudgetDraft, matchesBudgetFilters } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
import { parseBudgetBackup, validWorkspace, loadWorkspace, previewBudgetImport, restoreBudgetBackup, WORKSPACE_KEY, budgetStorageSnapshot } from '../src/pages/budget-profiles/storage.js'
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v
for (const record of preserved) {
  const p=BUDGET_PROFILES.find(p=>p.id===record.id)
  assert(p)
  assert.equal(createHash('sha256').update(JSON.stringify(stable(p))).digest('hex'),record.sha256,`${p.name}: existing complete object preserved`)
}
assert.equal(BUDGET_PROFILES.length,preserved.length+entries.length)
assert(!BUDGET_PROFILES.some(p=>p.age===76))
assert.equal(new Set(BUDGET_PROFILES.map(p=>p.id)).size,BUDGET_PROFILES.length)
const canonical = url => url.match(/community\.finary\.com\/t\/(?:[^/]+\/)?(\d+)/)?.[1] || url
const additions=new Set(entries.map(e=>e.profile.id)),previous=BUDGET_PROFILES.filter(p=>!additions.has(p.id))
const ledgers=[['Valentin',363400,191275,120000,52125],['Monique',116000,97000,10000,9000],['Djamila',114600,197600,2000,-85000],['Séverine',450000,319900,130000,100],['Ingrid et Joël',480000,411000,40000,29000],['Tristan',190000,120000,60000,10000]]
assert.equal(entries.length,ledgers.length)
assert.deepEqual(candidates.filter(c=>c.decision==='retained').map(c=>c.profileId).sort(),[...additions].sort())
for(const [index,e] of entries.entries()){
  const p=e.profile,a=analyzeBudget(p),[name,income,expenses,savings,balance]=ledgers[index]
  assert.equal(p.name,name);assert(validBudget(p));assert.deepEqual(a.errors,[]);assert.equal(p.mainImage,'complete')
  for(const [k,value] of Object.entries({income,expenses,savings,balance}))assert.equal(Math.round(a[k]*100),value,name+'/'+k)
  assert.deepEqual(e.expectedCents,{income,expenses,savings,available:income-expenses,balance})
  assert(Math.abs(a.expenseShare-100*expenses/income)<1e-10)
  assert(!previous.some(q=>canonical(q.source.url)===canonical(p.source.url)))
  if(p.provenance.sourceSnapshot.authorHash)assert(!priorAuthors.some(q=>q.authorHash===p.provenance.sourceSnapshot.authorHash),'No renamed source author duplicate')
  assert(p.provenance.originalSourcePreserved);assert(p.provenance.sourceFacts.length&&p.provenance.createdFields.length)
  assert(p.income.every(r=>['source','source-calculated'].includes(r.origin)))
  assert(p.expenses.every(r=>['source','source-calculated','editorial-created'].includes(r.origin)))
  for(const row of p.expenses.filter(r=>r.createdProvision!==undefined)){
    assert.equal(row.origin,'editorial-created')
    assert.equal(Math.round(row.amount*100),Math.round(row.sourceAmount*100)+Math.round(row.createdProvision*100))
  }
  const text=buildBudgetText(p),c=BUDGET_PUBLICATION_CONTEXT[p.id]
  assert(!/exemple|ficti[fv]|reconstitu|scénario|simulation|hypothèse|version éditoriale|préparé le|vérifié le|budget personnel|abonné|m’a confié|nous a envoyé|\.json|PR #/i.test(text))
  assert(!/20\d\d/.test(text.split('\n')[0]));assert.equal(c.budgetQuestion,'');assert(c.questions.length>=1&&c.questions.length<=2)
  assert.equal((text.match(/\?/g)||[]).length,c.questions.length)
  for(const q of c.questions){assert.equal(q.origin,'editorial');assert(text.includes(q.text));assert(q.evidence.every(n=>c.evidence[n]))}
  for(const mode of ['detailed','summary'])assert.equal(budgetImageExpenses(p,mode).reduce((s,r)=>s+Math.round(r.amount*100),0),expenses)
  const custom={profile:p,text:'Mon texte personnel.',edited:true,textFinance:budgetFinancialReference(p)}
  assert.equal(refreshBudgetDraft(custom).text,custom.text)
  assert.equal(refreshBudgetDraft({...custom,edited:false}).text,text)
  assert(matchesBudgetFilters(p,{country:p.country||'unknown',family:p.family||'unknown',housing:p.housing,income:'EUR:0:10000'}))
  assert(!matchesBudgetFilters(p,{income:'CHF:0:10000'}))
}
// Low/high wages keep identical expenses and transfers; employer car is not charged twice.
const tristan=BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES.find(p=>p.name==='Tristan')
for(const [salary,balance] of [[1800,0],[1900,100],[2000,200]])assert.equal(analyzeBudget({...tristan,income:[{label:'Salaire',amount:salary}]}).balance,balance)
assert(!tristan.expenses.some(r=>/carburant|auto|crédit/.test(r.label)))
const monique=BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES.find(p=>p.name==='Monique')
assert(!monique.expenses.some(r=>/loyer|téléphone|mutuelle|assurance auto/i.test(r.label)))
const solo=BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES.find(p=>p.name==='Djamila')
assert(!solo.income.some(r=>/pension/i.test(r.label)));assert.equal(solo.income.reduce((s,r)=>s+r.amount,0),970+(130+150)/2+36)
const valentin=BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES.find(p=>p.name==='Valentin')
assert.equal(valentin.income.length,1);assert.equal(valentin.income[0].amount,3634)
const selection=parseBudgetBackup(readFileSync(new URL('../docs/budget-complementary-bank-2026-11-16/selection-a-publier.json',import.meta.url),'utf8'))
assert(validWorkspace(selection));assert.equal(selection.drafts.length,0);assert.equal(selection.published.length,0);assert.equal(selection.used.length,0);assert.deepEqual(selection.publicationDates,{})
assert(selection.queued.every(id=>BUDGET_PROFILES.some(p=>p.id===id)))
for(const id of additions)assert(selection.queued.includes(id))
// Real additive import contract: local drafts, publication dates and other statuses survive conflicts.
const oldStorage=globalThis.localStorage,map=new Map()
globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),get length(){return map.size},key:i=>[...map.keys()][i]}
try {
  const id=selection.queued[0],p=BUDGET_PROFILES.find(p=>p.id===id)
  const local={version:4,drafts:[{profile:p,text:'Ma personnalisation.',edited:true,textFinance:budgetFinancialReference(p)}],activeId:id,used:[id],published:[id],queued:[],publicationDates:{[id]:'2026-11-01'}}
  localStorage.setItem(WORKSPACE_KEY,JSON.stringify(local));loadWorkspace()
  const preview=previewBudgetImport(selection);assert(preview.conflicts.includes(id))
  assert(restoreBudgetBackup(selection,'keep-local',budgetStorageSnapshot()))
  const result=loadWorkspace().value
  assert.deepEqual(result.drafts,local.drafts);assert.deepEqual(result.published,local.published);assert.deepEqual(result.publicationDates,local.publicationDates);assert.deepEqual(result.used,local.used)
  assert(!result.queued.includes(id));assert.deepEqual(result.queued,selection.queued.filter(q=>q!==id))
  assert([...map.keys()].some(k=>k.startsWith('el-budget-recovery-')))
}finally{if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage}
console.log('Complementary budgets: preserved historical objects, independent cents, source scopes, deficits, explicit creations, variable wages, filters, personal texts and additive queue import passed.')
