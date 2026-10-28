import assert from 'node:assert/strict'
import {editorialTreatments,treatmentFor,processedIds,saveTreatment,EDITORIAL_EVENT} from '../src/lib/radar-workflow-state.js'
import {overviewUnread} from '../src/lib/radar-overview.js'
const descriptors=Object.fromEntries(['window','localStorage'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),data=new Map(),events=[]
try{
 Object.defineProperty(globalThis,'window',{configurable:true,value:{dispatchEvent:e=>events.push(e.type)}})
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}})
 data.set('epargnantlibre-radar-read-v1','["read"]');data.set('epargnant-libre:home-favorites','["/radar-editorial"]');data.set('draft','mon texte')
 assert(saveTreatment(['original','reprint'],'dismissed'));assert.equal(treatmentFor(['original']), 'dismissed')
 assert.equal(overviewUnread({groups:[['original','reprint'],['other']]},[],processedIds()),1)
 assert(saveTreatment(['original','reprint'],'used'));assert.equal(treatmentFor(['reprint']), 'used')
 assert(saveTreatment(['original','reprint'],'active'));assert.equal(treatmentFor(['original']), 'active')
 assert.equal(treatmentFor(['correction']), 'active','A substantial correction retains a separate treatment')
 assert.equal(data.get('epargnantlibre-radar-read-v1'),'["read"]');assert.equal(data.get('draft'),'mon texte')
 assert.equal(data.get('epargnant-libre:home-favorites'),'["/radar-editorial"]')
 assert(events.every(e=>e===EDITORIAL_EVENT));const saved=data.get('epargnantlibre-radar-editorial-v1')
 localStorage.setItem=()=>{throw Error('quota')};assert.equal(saveTreatment(['original'],'dismissed'),false);assert.equal(data.get('epargnantlibre-radar-editorial-v1'),saved)
 data.set('epargnantlibre-radar-editorial-v1','{corrupt');assert.deepEqual(editorialTreatments(),{});assert.equal(saveTreatment(['x'],'used'),false);assert.equal(data.get('epargnantlibre-radar-editorial-v1'),'{corrupt','Never overwrite unreadable local data')
 console.log('Radar editorial workflow: independent reading, discard/use/undo, grouped IDs, correction, badge, preserved favourites/drafts, events, corruption and save failure passed.')
}finally{for(const [key,d]of Object.entries(descriptors))if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key]}
