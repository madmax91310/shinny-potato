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

// Exercise ancestry and changed paths with a real isolated Git history.
const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs')
const {tmpdir}=await import('node:os')
const {join}=await import('node:path')
const {execFileSync}=await import('node:child_process')
const directory=mkdtempSync(join(tmpdir(),'published-prefix-'))
try{
 const git=(...args)=>execFileSync('git',['-C',directory,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 git('init');git('config','user.name','Isolated publication test');git('config','user.email','test@example.invalid')
 const commit=()=>{git('add','.');git('commit','-m','Isolated marker');return git('rev-parse','HEAD')}
 writeFileSync(join(directory,'consumer.js'),'export const convention="unchanged"\n');writeFileSync(join(directory,'active.json'),'{}\n');const code=commit()
 writeFileSync(join(directory,'active.json'),'{"marker":"collected"}\n');const data=commit()
 writeFileSync(join(directory,'collector.js'),'export const convention="new-code"\n');const unservedCode=commit()
 writeFileSync(join(directory,'active.json'),'{"marker":"later"}\n');const laterData=commit()
 const ancestry=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true}catch{return false}}
 const evidence={changed:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),allowed:['active.json']}
 assert.ok(alreadyPublished(data,{sha:code,dataSha:data},ancestry,evidence))
 assert.ok(!alreadyPublished(unservedCode,{sha:code,dataSha:laterData},ancestry,evidence),'a published data prefix never certifies its unserved collector code')
 assert.ok(!alreadyPublished(laterData,{sha:code,dataSha:data},ancestry,evidence))
 assert.deepEqual(planSnapshot({requested:data,master:laterData,info:{sha:code,dataSha:data},ancestor:ancestry,...evidence,fullGate:true}),{candidate:data,current:false})
}finally{rmSync(directory,{recursive:true,force:true})}
console.log('Real isolated Git: served data stops its duplicate gate; unserved code and missing data remain unqualified.')
