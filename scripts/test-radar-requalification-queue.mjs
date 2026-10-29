import assert from 'node:assert/strict'
import {planPublicationQueue} from './lib/radar-queue.mjs'
const now=new Date('2026-10-29T14:02:11.719Z'),old='2026-10-24T10:00:00Z'
const sources=[{id:'old-a'},{id:'old-b'},{id:'news'},{id:'bdf-debt'}]
const background=Array.from({length:80},(_,i)=>[`old-${i}`,{source:i%2?'old-a':'old-b',title:'Archive de test',discoveredAt:old,firstAttemptAt:old,lastQueueServiceAt:old,status:'error',attempts:7}])
const repairs=Array.from({length:10},(_,i)=>[`repair-${i}`,{source:'bdf-debt',title:'Publication statistique à requalifier',publishedAt:`2025-${String(12-i).padStart(2,'0')}-01`,discoveredAt:'2026-10-25T10:00:00Z',firstAttemptAt:'2026-10-25T10:00:00Z',status:'error',attempts:7}])
const ids=new Set(repairs.map(([u])=>u)),documents=[...background,...repairs],snapshot=JSON.stringify(documents),cost={documentDurationsMs:[13842]}
const legacy=planPublicationQueue(documents,sources,now,cost)
assert.equal(legacy.chosen.filter(([u])=>ids.has(u)).length,0,'Reproduce older work filling the measured four-document envelope')
const fixed=planPublicationQueue(documents,sources,now,cost,undefined,{requalificationIds:ids})
assert.equal(fixed.limit,4);assert.equal(fixed.chosen.length,4);assert.equal(fixed.admittedRequalifications,2)
assert.deepEqual(fixed.chosen.slice(0,2).map(([u])=>u),['repair-0','repair-1'],'Latest documents of the repaired source restore current use first')
assert.equal(fixed.chosen.filter(([u])=>!ids.has(u)).length,2,'Half of remaining slots keep aging background progress')
assert.equal(JSON.stringify(documents),snapshot,'Selection cannot change attempt, check or financial dates')
assert.equal(new Set(fixed.chosen.map(([u])=>u)).size,4)
for(const count of[0,1,2,3,4,6,24]){
 const p=planPublicationQueue(documents,sources,now,{},count,{requalificationIds:ids})
 assert.equal(p.chosen.length,count)
 assert(p.admittedRequalifications<=Math.floor(count/2));assert.equal(new Set(p.chosen.map(([u])=>u)).size,count)
}
const fresh=Array.from({length:10},(_,i)=>[`fresh-${i}`,{source:'news',title:'Les salaires des Français augmentent',publishedAt:'2026-10-29',discoveredAt:now.toISOString(),status:'pending',attempts:0}])
const concurrent=planPublicationQueue([...fresh,...documents],sources,now,{},6,{requalificationIds:ids})
assert.equal(concurrent.reservedRecent,4);assert.equal(concurrent.chosen.filter(([u])=>u.startsWith('fresh-')).length,4)
assert.equal(concurrent.admittedRequalifications,1)
assert.equal(concurrent.chosen.filter(([u])=>u.startsWith('old-')).length,1)
const remaining=new Map(documents),finished=new Set()
for(let pass=0;pass<100&&remaining.size;pass++){
 const burst=fresh.map(([u,d])=>[u+'-'+pass,{...d}])
 const p=planPublicationQueue([...burst,...remaining],sources,now,{queuePass:pass,nextSourceIndex:pass%sources.length},6,{requalificationIds:ids})
 for(const[url]of p.chosen)if(remaining.delete(url))finished.add(url)
}
assert.equal(remaining.size,0,'Continuous fresh arrivals and finite repairs must not starve the old archives')
assert.equal(finished.size,90)
const ignored=planPublicationQueue(background,sources,now,{},4,{requalificationIds:new Set(['not-in-the-selected-scope'])})
assert.equal(ignored.admittedRequalifications,0)
console.log('Measured four-document queue: bounded latest-parser recovery, unchanged fresh reserve/time/traffic ceilings, background fairness, 0/1/2/3/4/6/24 budgets, scope and immutable dates verified.')
