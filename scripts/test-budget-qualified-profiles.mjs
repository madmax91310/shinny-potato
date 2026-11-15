import assert from 'node:assert/strict'
import entries from '../src/pages/budget-profiles/editorial-profiles-qualified-2026-11-15.json' with { type: 'json' }
import candidates from '../docs/budget-qualified-bank-2026-11-15/candidates.json' with { type: 'json' }
import authors from '../docs/budget-qualified-bank-2026-11-15/source-author-check.json' with { type: 'json' }
import browserCommands from './ci-browser-checks.json' with { type: 'json' }
import { BUDGET_PROFILES, BUDGET_NEW_EDITORIAL_PROFILES, BUDGET_QUALIFIED_EDITORIAL_PROFILES, BUDGET_EDITORIAL, BUDGET_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, budgetImageExpenses, validBudget, matchesBudgetFilters, refreshBudgetDraft } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'

// Independent ledgers, including the source tax rounded from 4,000/year.
const ledgers = [
  [37535,250000,167000,50000,33000], [22913,275000,208000,60000,7000],
  [31536,550000,215000,250000,85000], [37301,130000,65000,54500,10500],
  [40616,140000,80000,50000,10000], [38815,510000,350000,100000,60000],
  [36821,440000,219500,190000,30500], [36268,258000,193000,40000,25000],
  [39814,230000,158500,40000,31500], [36724,180000,125000,30000,25000],
  [39547,300000,179000,40000,81000], [30825,360000,355000,0,5000],
  [28041,310000,232000,50000,28000], [26933,285000,173833,100000,11167],
]
assert.equal(entries.length,ledgers.length)
assert.deepEqual(candidates.filter(c=>c.decision==='retained').map(c=>c.profileId).sort(),entries.map(e=>e.profile.id).sort())
const additions = new Set(BUDGET_QUALIFIED_EDITORIAL_PROFILES.map(p=>p.id))
const priorSources = new Set(BUDGET_PROFILES.filter(p=>!additions.has(p.id)).map(p=>p.source.url.match(/community\.finary\.com\/t\/(?:[^/]+\/)?(\d+)/)?.[1] || p.source.url))
assert.equal(new Set(BUDGET_PROFILES.map(p=>p.id)).size,BUDGET_PROFILES.length)
assert(!BUDGET_PROFILES.some(p=>p.name==='Hélène'&&p.age===76))
for(const entry of entries) {
  const p=entry.profile, a=analyzeBudget(p), topic=p.provenance.sourceSnapshot.topicId
  const [,income,expenses,savings,balance]=ledgers.find(row=>row[0]===topic)
  assert(validBudget(p),p.id);assert.deepEqual(a.errors,[])
  assert.equal(p.mainImage,'complete')
  const author=authors.find(row=>row.profileId===p.id)
  assert(author?.authorHash)
  assert.equal(authors.filter(row=>row.authorHash===author.authorHash).length,1,p.name+' source author already represented')
  for(const [key,value] of Object.entries({income,expenses,savings,balance})) assert.equal(Math.round(a[key]*100),value,`${p.name}/${key}`)
  assert.deepEqual(entry.expectedCents,{income,expenses,savings,available:income-expenses,balance})
  assert.equal(a.expenseShare,100*expenses/income)
  assert(!priorSources.has(String(topic)),p.name+' must have a distinct source')
  assert.equal(p.provenance.nature,'editorial-character')
  assert(p.provenance.sourceSnapshot.posts.length)
  assert(p.provenance.sourceFacts.length&&p.provenance.createdFields.length)
  assert(p.provenance.sourceSnapshot.posts.every(post=>post.postId&&post.contentSha256.length===64))
  assert(p.expenses.every(row=>['source','source-calculated','source-envelope-allocation','editorial-created'].includes(row.origin)))
  assert(p.income.every(row=>['source','source-calculated'].includes(row.origin)))
  for(const row of p.income.filter(row=>row.sourceAmounts))assert.equal(row.sourceAmounts.reduce((sum,value)=>sum+Math.round(value*100),0),Math.round(row.amount*100))
  for(const row of p.expenses.filter(row=>row.sourceAnnualAmount))assert.equal(Math.round(row.sourceAnnualAmount*100/12),Math.round(row.amount*100))
  const text=buildBudgetText(p),c=BUDGET_PUBLICATION_CONTEXT[p.id]
  assert(!/exemple|ficti[fv]|reconstitu|version éditoriale|scénario|simulation|hypothèse|préparé le|vérifié le|abonné|m’a confié|nous a envoyé|\.json|PR #/i.test(text),p.name)
  assert(!/20\d\d/.test(text.split('\n')[0]))
  assert(c.questions.length>=1&&c.questions.length<=2)
  assert.equal(c.budgetQuestion,'')
  assert.equal((text.match(/\?/g)||[]).length,c.questions.length)
  for(const q of c.questions){assert.equal(q.origin,'editorial');assert(text.includes(q.text));assert(q.evidence.every(i=>c.evidence[i]))}
  assert.equal(BUDGET_EDITORIAL[p.id].alias,p.name)
  for(const mode of ['detailed','summary']) assert.equal(budgetImageExpenses(p,mode).reduce((sum,row)=>sum+Math.round(row.amount*100),0),expenses)
  assert(matchesBudgetFilters(p,{country:p.country||'unknown',family:p.family||'unknown',housing:p.housing,income:'EUR:0:10000'}))
  assert(!matchesBudgetFilters(p,{income:'CHF:0:10000'}))
  const custom={profile:p,text:'Mon texte personnalisé.',edited:true,textFinance:budgetFinancialReference(p)}
  assert.equal(refreshBudgetDraft(custom).text,custom.text)
}
// The source amount is annual. Rounding does not create a second income tax.
const esteban=BUDGET_QUALIFIED_EDITORIAL_PROFILES.find(p=>p.provenance.sourceSnapshot.topicId===26933)
assert.equal(esteban.expenses.filter(r=>/impôt/i.test(r.label)).length,1)
assert.equal(esteban.expenses.find(r=>/impôt/i.test(r.label)).amount,333.33)
const alban=BUDGET_QUALIFIED_EDITORIAL_PROFILES.find(p=>p.provenance.sourceSnapshot.topicId===40616)
assert.equal(analyzeBudget(alban).savings,450+50)
const aude=BUDGET_QUALIFIED_EDITORIAL_PROFILES.find(p=>p.provenance.sourceSnapshot.topicId===38815)
assert.equal(5100-400-analyzeBudget(aude).expenses-analyzeBudget(aude).savings,200)
assert(!BUDGET_QUALIFIED_EDITORIAL_PROFILES.some(p=>[36553,34052].includes(p.provenance.sourceSnapshot.topicId)),'Cross-topic authors are already represented; aliases do not create new people')
console.log('Qualified profiles: independent cent ledgers, source/creation separation, duplicate exclusions, currency filters, questions and custom drafts verified.')

// The CI split must keep every old/new admission exactly once at each viewport.
for(const width of [1440,390,320]) {
  const covered=[]
  for(const command of browserCommands.filter(c=>c.endsWith(`playwright-budget-new-profiles.mjs ${width}`))) {
    const batch=command.match(/BUDGET_BATCH=(\w+)/)?.[1]
    const partition=command.match(/BUDGET_PART=(\d+)\/(\d+)/)
    const part=Number(partition?.[1]||0),count=Number(partition?.[2]||1)
    const profiles={previous:BUDGET_NEW_EDITORIAL_PROFILES,qualified:BUDGET_QUALIFIED_EDITORIAL_PROFILES}[batch]
    assert(profiles&&count>0&&part<count,'Known complete budget CI batch')
    covered.push(...profiles.filter((_,index)=>index%count===part).map(p=>p.id))
  }
  assert.deepEqual(covered.sort(),[...BUDGET_NEW_EDITORIAL_PROFILES,...BUDGET_QUALIFIED_EDITORIAL_PROFILES].map(p=>p.id).sort())
}
