import assert from 'node:assert/strict'
import historicalEntries from '../src/pages/budget-profiles/editorial-profiles-2026-11-15.json' with { type: 'json' }
import { BUDGET_PROFILES, BUDGET_REFERENCE_PROFILES, BUDGET_NEW_EDITORIAL_PROFILES, BUDGET_QUALIFIED_EDITORIAL_PROFILES, BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES, BUDGET_ROADMAP_EDITORIAL_PROFILES, BUDGET_STUDIO_EDITORIAL_PROFILES, BUDGET_EDITORIAL, BUDGET_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetImageExpenses, budgetPublicPresentation, validBudget, sourceReply, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
import { validDraft, validWorkspace, parseBudgetBackup } from '../src/pages/budget-profiles/storage.js'

import noemieReference from '../src/pages/budget-profiles/noemie-reference.json' with { type: 'json' }
const entries = historicalEntries.map(entry => entry.profile.id === noemieReference.profile.id
  ? { ...entry, profile: BUDGET_NEW_EDITORIAL_PROFILES.find(profile => profile.id === entry.profile.id), expectedCents: noemieReference.expectedCents }
  : entry)

const expected = [
  ['Morgane',240000,165000,50000,25000],
  ['Lison et Dorian',235000,179000,30000,26000],
  ['Solène',360000,205000,110000,45000],
  ['Delphine',250000,223000,22000,5000],
  ['Patrice',320000,330000,0,-10000],
  ['Noémie',350000,267000,75000,8000],
  ['Cédric',280000,100000,100000,80000],
]
assert.equal(entries.length,7)
assert.deepEqual(BUDGET_PROFILES.map(p=>p.id), [...BUDGET_REFERENCE_PROFILES,...BUDGET_NEW_EDITORIAL_PROFILES,...BUDGET_QUALIFIED_EDITORIAL_PROFILES,...BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES,...BUDGET_ROADMAP_EDITORIAL_PROFILES,...BUDGET_STUDIO_EDITORIAL_PROFILES].map(p=>p.id))
assert.equal(BUDGET_PROFILES.length,BUDGET_REFERENCE_PROFILES.length+entries.length+BUDGET_QUALIFIED_EDITORIAL_PROFILES.length+BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES.length+BUDGET_ROADMAP_EDITORIAL_PROFILES.length+BUDGET_STUDIO_EDITORIAL_PROFILES.length)
assert(!BUDGET_NEW_EDITORIAL_PROFILES.some(p=>p.name==='Hélène'||p.age===76))
assert.equal(new Set(BUDGET_PROFILES.map(p=>p.id)).size,BUDGET_PROFILES.length)
assert.deepEqual(Object.keys(BUDGET_PUBLICATION_CONTEXT).sort(),BUDGET_PROFILES.map(p=>p.id).sort())
const priorSources=new Set(BUDGET_REFERENCE_PROFILES.map(p=>p.source.url))
for(const [i,entry] of entries.entries()) {
  const p=entry.profile,a=analyzeBudget(p),[name,income,expenses,savings,balance]=expected[i]
  assert.equal(p.name,name);assert(validBudget(p));assert.deepEqual(a.errors,[])
  for(const [k,v] of Object.entries({income,expenses,savings,balance})) assert.equal(Math.round(a[k]*100),v,`${name}: independent ${k}`)
  assert.deepEqual(entry.expectedCents,{income,expenses,savings,available:income-expenses,balance})
  assert.equal(Math.round(a.expenseShare),Math.round(expenses/income*100))
  assert(!priorSources.has(p.source.url),'Do not rename a source already present in the bank')
  assert(p.provenance.sourceFacts.length && p.provenance.createdFields.length && p.provenance.coverage)
  assert.equal(p.provenance.nature,'editorial-character')
  assert.equal(BUDGET_EDITORIAL[p.id].alias,name)
  const text=buildBudgetText(p),c=BUDGET_PUBLICATION_CONTEXT[p.id],view=budgetPublicPresentation(p)
  assert(text.startsWith('💰 Budget '));assert(text.includes(name))
  assert(!/exemple|ficti[fv]|reconstitu|version éditoriale|personnage éditorial|abonné|m’a confié|nous a envoyé|données de 20\d\d|impôt non précisé/i.test(text))
  assert(!/20\d\d/.test(text.split('\n')[0]))
  assert(!/exemple|ficti[fv]|reconstitu|20\d\d/i.test([view.name,view.job,view.household,view.basis,view.incomeNote].join(' ')))
  assert(c.paragraphs.length>=1&&c.paragraphs.length<=3)
  assert.equal(c.questions.length,2);assert.equal(c.budgetQuestion,'')
  assert.equal(new Set(c.questions.map(q=>q.text)).size,2)
  for(const e of [...c.paragraphs,...c.questions]) assert(e.evidence.length && e.evidence.every(n=>c.evidence[n]))
  for(const q of c.questions) {assert.equal(q.origin,'editorial');assert(q.text.endsWith('?'));assert(text.includes(q.text))}
  for(const mode of ['summary','detailed']) assert.equal(budgetImageExpenses(p,mode).reduce((s,r)=>s+Math.round(r.amount*100),0),expenses)
  assert.match(sourceReply(p),/^Source d’inspiration : /)
  const custom={profile:p,text:'Mon texte personnel conservé',edited:true,textFinance:budgetFinancialReference(p)}
  assert(validDraft(custom));assert.equal(refreshBudgetDraft(custom).text,custom.text)
  assert.equal(refreshBudgetDraft({...custom,edited:false}).text,buildBudgetText(BUDGET_PROFILES.find(profile => profile.id === p.id)))
  const workspace={version:5,scheduledDates:{},drafts:[custom],activeId:p.id,used:[p.id],published:[p.id],queued:[p.id],publicationDates:{[p.id]:'2026-11-15'}}
  assert(validWorkspace(workspace));assert.deepEqual(parseBudgetBackup(JSON.stringify({format:'le-budget-de',version:5,readable:true,workspace})),workspace)
  for(const f of entry.creation.finance.filter(f=>f.type==='project')) assert.equal(f.initialFunding+f.monthlyFunding*f.horizonMonths,f.targetAmount)
}

// A yearly average must be funded over the actual sequence of receipts.
for(const [name,high,nHigh,low,nLow,reserve,expectedDraw] of [
  ['Morgane',5760,4,720,8,12000,11920],
  ['Lison et Dorian',4700,6,0,6,14000,12540],
]) {
  const p=BUDGET_PROFILES.find(p=>p.name===name),a=analyzeBudget(p)
  assert.equal(high*nHigh+low*nLow,a.income*12)
  assert.equal((a.expenses+a.savings-low)*nLow,expectedDraw)
  assert(reserve>=expectedDraw)
  assert.equal(high*nHigh+low*nLow-(a.expenses+a.savings)*12,a.balance*12)
}
const morgane = BUDGET_PROFILES.find(profile => profile.name === 'Morgane')
assert.equal(analyzeBudget(morgane).balance, 190)
assert.match(buildBudgetText(morgane), /60 € pour les révisions, les pneus et le contrôle technique/)
const cedric=analyzeBudget(BUDGET_NEW_EDITORIAL_PROFILES.find(p=>p.name==='Cédric'))
assert.equal(cedric.expenses-350+800+120+20+250,1840,'Future food and home insurance replace the parents’ contribution')
assert.equal(2000-1840-cedric.savings,-840)
assert.equal(6000+600*10,12000)
const noemie=BUDGET_NEW_EDITORIAL_PROFILES.find(p=>p.name==='Noémie')
assert.equal(noemie.country,'Belgique');assert(!/PEA|Livret A/.test(buildBudgetText(noemie)))
assert.equal(noemie.income.find(r=>r.inKind)?.amount,200,'Meal vouchers are tracked outside spendable cash')
assert(!noemie.income.some(r=>/bonus/i.test(r.label)))
assert(!BUDGET_NEW_EDITORIAL_PROFILES.find(p=>p.name==='Patrice').income.some(r=>r.amount===180000||/SCPI|vente/.test(r.label)))
console.log('Seven new budgets: independent cent ledgers, sources vs creations, seasonal funding, housing changes, two questions and draft/status backups verified; 76-year-old profile excluded.')
