// Read-only real discovery, bounded extraction, disk persistence and cache passes.
// No producer import, GitHub API, credential or notification side effect.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { COVERAGE_SOURCES } from './lib/radar-coverage.mjs'
import { collectPublications } from './lib/radar-publications.mjs'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { editorialAssessment } from '../src/lib/radar-editorial.js'
import { planNotifications } from './lib/radar-notifications.mjs'
const output=resolve(process.argv[2]??'test-artifacts/radar-coverage'),started=Date.now(),results=[]
await mkdir(output,{recursive:true})
for(const source of COVERAGE_SOURCES){
 const path=join(output,source.id+'-state.json'),first=await collectPublications(new Date(),fetch,{},[source],4)
 await writeFile(path,JSON.stringify(first.state))
 const second=await collectPublications(new Date(),fetch,JSON.parse(await readFile(path)),[source],4)
 await writeFile(path,JSON.stringify(second.state))
 const cacheExpected=Date.parse(second.sources[0].nextCheckAt)>Date.now()
 const third=await collectPublications(new Date(),cacheExpected?()=>assert.fail('A cache-only pass must make no request'):fetch,JSON.parse(await readFile(path)),[source],0)
 if(cacheExpected)assert.equal(third.metrics.requests,0) // A failed initial inventory has no validated cache to reuse.
 for(const [url,item]of Object.entries(first.state.documents))if(item.status==='done'){
  assert.equal(third.state.documents[url].availableAt,item.availableAt)
  assert.equal(third.state.documents[url].observation.publishedAt,item.observation.publishedAt)
 }
 const now=new Date(),baseline=advanceRadar(null,[],{now}),published=advanceRadar(baseline.state,third.observations,{now})
 assert.ok(third.observations.every(o=>o.backfill),'New adapter starts silently')
 for(const mode of ['major','digest'])assert.equal(planNotifications(published.feed.events,{acknowledged:[]},now,mode).events.length,0)
 const unchanged=advanceRadar(published.state,third.observations,{now});assert.equal(unchanged.newEvents.length,0)
 const examples=third.observations.map(row=>({title:row.label,url:row.sourceUrl,publishedAt:row.publishedAt,checkedAt:row.checkedAt,topic:row.topic,summary:row.summary??row.evidence?.excerpt,evidenceLevel:row.evidenceLevel??'official',sourceHash:row.evidence?.sourceHash,products:row.products,announcedProductCount:row.announcedProductCount,conditions:row.conditions,housing:row.housing,backfill:row.backfill,assessment:editorialAssessment({...row,after:row.value,kind:'new'},+now)}))
 const result={...third.sources[0],cacheVerified:cacheExpected&&third.metrics.requests===0,qualification:examples.length?'discovery-extraction-persistence-verified':source.requireUcits?'partial-global-feed-no-qualified-ucits':'not-qualified',passes:[first,second,third].map(r=>({checkedAt:r.metrics.checkedAt,metrics:r.metrics,queue:r.sources[0].queue,observations:r.observations.length,errors:r.errors})),examples,documents:Object.values(third.state.documents).map(d=>({url:d.url,publishedAt:d.publishedAt,status:d.status,reason:d.reason,error:d.error,availableAt:d.availableAt})),initialNotifications:0}
 results.push(result);console.log(source.id,result.qualification,'documents',result.discovered,'extractions',examples.length,'requests',result.passes.reduce((n,p)=>n+p.metrics.requests,0))
}
await writeFile(join(output,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),durationMs:Date.now()-started,method:'Two actual read-only collection passes with durable disk reload, then cache verification where a valid inventory exists (otherwise a visible retry); local feed production and notification planning only. Not a scheduled-run or mobile-delivery proof.',sources:results},null,2)+'\n')
