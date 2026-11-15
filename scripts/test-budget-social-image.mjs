import assert from 'node:assert/strict'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText } from '../src/pages/budget-profiles/lib.js'
import { planSocialBudget, socialBudgetLabel, SOCIAL_SIZE, SOCIAL_BODY_SIZE } from '../src/pages/budget-profiles/socialImage.js'
// Flow/ledger unit checks only. Actual measurements, glyph bounds, downloaded
// images and every phone capture are checked by playwright-budget-social-image.
const ctx={font:'',measureText(value){return{width:[...String(value)].length*Number(this.font.match(/([\d.]+)px/)[1])*.5}}}
assert.deepEqual(SOCIAL_SIZE,{width:1080,height:1350});assert(SOCIAL_BODY_SIZE>=36)
for(const p of BUDGET_PROFILES){
 const before=JSON.stringify(p),text=buildBudgetText(p),plan=planSocialBudget(ctx,p)
 assert.equal(JSON.stringify(p),before);assert.equal(buildBudgetText(p),text);assert.deepEqual(plan.a,analyzeBudget(p))
 const rows=plan.pages.flatMap(page=>page.columns.flatMap(c=>c.cards.flatMap(card=>card.rows)))
 const expected=plan.sections.flatMap(s=>s.rows)
 for(const r of expected){const parts=rows.filter(x=>x.id===r.id||x.id.startsWith(r.id+':part:'));assert(parts.length,p.id+' '+r.id);assert.equal(parts.map(r=>r.label).join(' ').replace(/\s/g,''),r.label.replace(/\s/g,''));if(r.amount!==undefined)assert.deepEqual(parts.filter(r=>r.amount!==undefined).map(r=>r.amount),[r.amount])}
 for(const page of plan.pages)assert(plan.header+page.height<=(page.kind==='primary'?1050:1186),p.id)
 if(!plan.single)assert.equal(plan.pages[0].kind,'primary')
}
const emilie=BUDGET_PROFILES.find(p=>p.name==='Émilie'),p=planSocialBudget(ctx,emilie)
assert.deepEqual([p.a.income,p.a.expenses,p.a.savings,p.a.balance],[2300,1735,500,65])
assert.equal(p.sections.find(s=>s.id==='expenses').rows.length,11)
const highlights=p.sections.find(s=>s.id==='projects').rows.map(r=>r.label).join(' ')
assert(/2 000 € → 20 000 €/.test(highlights));assert(/5 000 €/.test(highlights))
assert(socialBudgetLabel('Part des courses').includes('Part'),'Never turn a contribution into the full household expense')
const dense={...structuredClone(emilie),kind:'participant',id:'dense-social-fixture',context:'Projet de 2 000 € avec une réserve séparée.'}
for(const key of ['income','expenses','savings'])dense[key]=Array.from({length:24},(_,i)=>({label:`Poste ${i+1} avec tous les détails utiles, conservés sans aucune ellipse`,amount:i+1}))
const plan=planSocialBudget(ctx,dense);assert(plan.pages.length>1)
const originalDocument=globalThis.document,originalPath=globalThis.Path2D
try{
 const drawContext={...ctx,fillText(){},fillRect(){},beginPath(){},roundRect(){},fill(){},save(){},translate(){},scale(){},stroke(){},restore(){}}
 globalThis.Path2D=class{};globalThis.document={createElement(){return{width:0,height:0,getContext:()=>drawContext}}}
 const {renderBudgetImages,renderBudgetImage}=await import('../src/pages/budget-profiles/image.js')
 const pages=await renderBudgetImages(dense,'social');assert.equal(pages.length,plan.pages.length)
 for(const [i,c]of pages.entries()){assert.deepEqual([c.width,c.height],[1080,1350]);assert.equal(c.budgetFormat,'social');assert.equal(c.budgetPage,i+1);assert.equal(c.budgetPageCount,pages.length)}
 const first=await renderBudgetImage(dense);assert.equal(first.width,1080);assert(first.budgetPages.length>1)
 for(const mode of ['detailed','summary']){const c=await renderBudgetImage(emilie,mode);assert.equal(c.width,1080);assert.equal(c.height,1350);assert(c.budgetPages.length>1)}
 await assert.rejects(()=>renderBudgetImages({...emilie,expenses:[{label:'Invalid',amount:-1}]}),/invalides/)
}finally{globalThis.document=originalDocument;globalThis.Path2D=originalPath}
console.log('Budget X: bounded 1080×1350 pages, stable readable type, every source row once, exact ledgers, planned projects/reserves, 72-row drafts, explicit legacy formats; no long-image fallback.')
