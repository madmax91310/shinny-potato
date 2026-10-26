// Read-only real source collection. No publisher, credential or notification send.
import assert from 'node:assert/strict'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {collectPublications,PUBLICATION_SOURCES} from './lib/radar-publications.mjs'
import {advanceRadar} from './lib/editorial-radar.mjs'
import {planNotifications} from './lib/radar-notifications.mjs'
const output=resolve(process.argv[2]??'test-artifacts/radar-source-recovery')
await mkdir(output,{recursive:true})
const ids=['revolut-news','lbp-bank','hanetf','wisdomtree','drees','dares']
const results=await Promise.all(ids.map(async id=>{
 const source=PUBLICATION_SOURCES.find(s=>s.id===id),path=join(output,id+'-state.json')
 const first=await collectPublications(new Date(),fetch,{},[source],2)
 await writeFile(path,JSON.stringify(first.state))
 const second=await collectPublications(new Date(),fetch,JSON.parse(await readFile(path)),[source],2)
 await writeFile(path,JSON.stringify(second.state))
 const now=new Date(),baseline=advanceRadar(null,[],{now}),result=advanceRadar(baseline.state,second.observations,{now})
 for(const mode of ['major','digest'])assert.equal(planNotifications(result.feed.events,{acknowledged:[]},now,mode).events.length,0)
 assert.ok(second.observations.every(o=>o.backfill),'Initial archive qualification remains silent')
 const outage=await collectPublications(new Date(+now+8*86400000),async()=>new Response('Forbidden',{status:403}),second.state,[source],2)
 for(const observation of second.observations)assert.deepEqual(outage.observations.find(o=>o.sourceUrl===observation.sourceUrl),observation)
 const report=second.sources[0]
 if(id==='hanetf'&&report.status==='ok')assert.ok(Object.values(second.state.documents).every(d=>d.title!=='Read more'))
 const rows=second.observations.map(o=>({title:o.label,url:o.sourceUrl,publishedAt:o.publishedAt,checkedAt:o.checkedAt,sourceHash:o.evidence?.sourceHash,backfill:o.backfill}))
 console.log(id,report.status,report.failureKind??'',report.discovered??0,'discovered;',rows.length,'extracted')
 return {id,source:report,passes:[first,second].map(r=>({metrics:r.metrics,errors:r.errors})),examples:rows,observationPreservationVerified:true,initialNotificationCount:0}
}))
await writeFile(join(output,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),runId:process.env.GITHUB_RUN_ID??null,sourceRevision:process.env.GITHUB_SHA??null,method:'Two real bounded collection passes, disk reload, local notification planning and simulated outage preservation. External failures remain visible; not a scheduled-production or mobile-delivery proof.',sources:results},null,2)+'\n')
