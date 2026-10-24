import assert from 'node:assert/strict'
import {chooseSnapshot,alreadyPublished,planSnapshot} from './resolve-pages-snapshot.mjs'
const old='a'.repeat(40), newer='b'.repeat(40), next='c'.repeat(40)
const ancestor=(a,b)=>[old,newer,next].indexOf(a)<= [old,newer,next].indexOf(b)
const base={requested:old,master:newer,ancestor,allowed:['src/data/active.json']}
assert.equal(chooseSnapshot({...base,changed:()=>['src/data/active.json']}),newer)
assert.equal(chooseSnapshot({...base,changed:()=>['src/pages/App.jsx']}),old)
assert.equal(chooseSnapshot({...base,ancestor:()=>false,changed:()=>[]}),old)
assert.ok(alreadyPublished(old,{sha:newer},ancestor))
assert.ok(!alreadyPublished(newer,{sha:old,dataSha:newer},ancestor),'fallback code does not certify new code')
assert.ok(!alreadyPublished(newer,{sha:newer,dataSha:old},ancestor))
assert.ok(!alreadyPublished(old,{},ancestor))
console.log('Queued data coalesced; code boundaries and fallback publication identities preserved.')

assert.equal(chooseSnapshot({...base,fullGate:true,changed:()=>['src/pages/App.jsx']}),newer)
assert.equal(chooseSnapshot({...base,fullGate:true,changed:()=>['.github/workflows/deploy-pages.yml','src/pages/App.jsx']}),old)
assert.equal(chooseSnapshot({...base,fullGate:true,ancestor:()=>false,changed:()=>[]}),old)


assert.deepEqual(planSnapshot({...base,master:next,info:{sha:newer,dataSha:newer},changed:()=>['src/data/active.json']}),{candidate:old,current:false},'An already fulfilled request must not chase unrelated later data')

// Data already served over unchanged code must not start another full gate.
const composed={requested:newer,master:next,info:{sha:old,dataSha:newer},ancestor,allowed:base.allowed}
assert.deepEqual(planSnapshot({...composed,changed:()=>['src/data/active.json']}),{candidate:newer,current:false})
for(const path of ['src/pages/App.jsx','scripts/collector.py','.github/workflows/deploy-pages.yml','src/data/semantics.js']){
 assert.ok(!alreadyPublished(newer,composed.info,ancestor,{changed:()=>[path],allowed:base.allowed}),path+' still requires its code gate')
}
assert.ok(!alreadyPublished(newer,{sha:old,dataSha:old},ancestor,{changed:()=>['src/data/active.json'],allowed:base.allowed}),'unpublished observations cannot be skipped')
assert.ok(!alreadyPublished(newer,composed.info,()=>false,{changed:()=>['src/data/active.json'],allowed:base.allowed}),'unrelated code is not a proof')
assert.ok(!alreadyPublished(newer,composed.info,ancestor,{changed:()=>{throw new Error('missing object')},allowed:base.allowed}))
assert.ok(!alreadyPublished('invalid',composed.info,ancestor,{changed:()=>[],allowed:base.allowed}))
console.log('Composed code/data publications recognized only with an included data prefix and proven unchanged code.')
