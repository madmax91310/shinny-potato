import assert from 'node:assert/strict'
import {chooseSnapshot,alreadyPublished} from './resolve-pages-snapshot.mjs'
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
