import assert from 'node:assert/strict'
import{requiredDataGaps}from './required-data-gaps.mjs'
const c={type:'instrument',id:'A',name:'A',field:'completeHoldings',requiresAction:true,actionState:'unqualified',reason:'Poids inconnus',checkedAt:'2026-10-01',lastSuccessAt:'2026-10-01',lastAttemptAt:'2026-10-24',tools:['/le-dca-de']}
const r=requiredDataGaps({connections:[c,{...c,id:'waiting',requiresAction:false,actionState:'waiting-first-year'}],assets:[{id:'B',name:'B',fields:[{key:'live',label:'Live',kind:'live',state:'scheduled-evidence',checkedAt:'2026-10-01',consumers:['/performance-depuis']},{key:'archive',kind:'archive',state:'scheduled-evidence'}]}]})
assert.equal(r.length,2);assert(r.every(x=>x.kind==='review'));assert.equal(r[0].lastSuccessAt,'2026-10-01');assert.equal(r[0].attemptedAt,'2026-10-24');assert.equal(r[1].lastSuccessAt,null);assert(!r.some(x=>x.id.includes('waiting')||x.id.includes('archive')))
console.log('Required gaps: incomplete and unproved live data visible; archive, waiting and unknown-success dates preserved.')
