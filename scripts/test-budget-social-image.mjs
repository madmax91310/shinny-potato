import assert from 'node:assert/strict'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetPublicIncomeRows, budgetPublicSavingsRows, budgetImageExpenses } from '../src/pages/budget-profiles/lib.js'
import { planSocialBudget, socialBudgetLabel, SOCIAL_SIZE } from '../src/pages/budget-profiles/socialImage.js'
// Layout invariants use deterministic metrics; visual QA also uses a real canvas.
const ctx = { font: '', measureText(value) { return { width: [...String(value)].length * Number(this.font.match(/(\d+)px/)[1]) * 0.5 } } }
assert.deepEqual(SOCIAL_SIZE, {width:1080,height:1350})
const emilie = BUDGET_PROFILES.find(p => p.id === 'prepared-lot2-08-2026-10-30')
const before = JSON.stringify(emilie), plan = planSocialBudget(ctx, emilie)
assert.equal(JSON.stringify(emilie), before)
assert.equal(plan.a.expenses, 1735)
assert.equal(plan.a.balance, 65)
assert(plan.used <= 1166)
const cards = plan.columns.flatMap(c=>c.cards), rows = cards.flatMap(c=>c.rows)
assert.equal(rows.filter(r=>r.section===1).length, 11)
const drawn = rows.flatMap(r=>r.label).join(' ')
assert.match(drawn, /20 000/)
assert.match(drawn, /5 000/)
assert(!/undefined|NaN/.test(drawn))
assert.equal(socialBudgetLabel('Part des courses'), 'Courses')
assert.equal(socialBudgetLabel('Sa part de l’énergie et de l’eau'), 'Énergie et eau')
assert.equal(socialBudgetLabel('Provision personnelle pour cadeaux et vacances'), 'Provision : cadeaux et vacances')
for(const p of BUDGET_PROFILES) {
  let result
  try { result=planSocialBudget(ctx,p) } catch(error) { assert.match(error.message,/version détaillée/); continue }
  const sections=result.columns.flatMap(c=>c.cards)
  for(const [section, expected] of [[0,budgetPublicIncomeRows(p)],[1,budgetImageExpenses(p)],[2,budgetPublicSavingsRows(p)]]) {
    if(!expected.length) continue
    const actual=sections.filter(c=>c.section===section).flatMap(c=>c.rows)
    assert.equal(actual.length,expected.length,p.id)
    assert.deepEqual(actual.map(r=>r.amount),expected.map(r=>result.money(r.amount)),p.id)
  }
  assert(result.used<=1166,p.id)
  assert.deepEqual(result.a,analyzeBudget(p))
  assert(!/undefined|NaN/.test(sections.flatMap(c=>c.rows).flatMap(r=>r.label).join(' ')),p.id)
}
const dense=structuredClone(emilie)
for(const key of ['income','expenses','savings']) dense[key]=Array.from({length:24},()=>({label:'Un poste très détaillé qui nécessite plusieurs lignes de présentation dans le budget',amount:1}))
assert.throws(()=>planSocialBudget(ctx,dense),/version détaillée/)
console.log('Social budget: fixed 4:5, 11 Emilie expenses, exact row amounts, project and reserve, immutable data, overflow guard verified.')
// Regression: default export remains downloadable for dense restored drafts.
const previousDocument=globalThis.document, previousPath=globalThis.Path2D
try {
  const drawContext={...ctx,fillText(){},fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},translate(){},scale(){},stroke(){},restore(){}}
  globalThis.Path2D=class {}
  globalThis.document={createElement(){return {width:0,height:0,getContext:()=>drawContext}}}
  const {renderBudgetImage}=await import('../src/pages/budget-profiles/image.js')
  const compact=await renderBudgetImage(emilie)
  assert.deepEqual([compact.width,compact.height],[1080,1350])
  const full=await renderBudgetImage(dense)
  assert.equal(full.width,1200)
  assert(full.height>1350)
  assert.equal(full.budgetFormat,'detailed')
  assert.match(full.budgetNotice,/tous les postes/)
  await assert.rejects(()=>renderBudgetImage({...emilie,expenses:[{label:'Invalid',amount:-1}]}),/invalides/)
} finally { globalThis.document=previousDocument;globalThis.Path2D=previousPath }
console.log('Dense draft regression: automatic complete-image fallback, explicit notice, real data errors preserved.')
