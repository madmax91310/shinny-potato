import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {bdfDebtCharts} from './lib/bdf-debt-charts.mjs'
import {PUBLICATION_SOURCES,parsePublication,collectPublications} from './lib/radar-publications.mjs'
const dir='scripts/fixtures/radar-publications/bdf-debt',manifest=JSON.parse(fs.readFileSync(dir+'/manifest.json'))
const source=PUBLICATION_SOURCES.find(s=>s.id==='bdf-debt'),now=new Date('2026-10-29T12:00:00Z')
let qualified=0,rejected=0
for(const row of manifest.responses){
 const raw=gunzipSync(fs.readFileSync(dir+'/'+row.file)),html=raw.toString()
 assert.equal(createHash('sha256').update(raw).digest('hex'),row.sha256)
 if(row.url.endsWith('2023t2')){
  assert.throws(()=>bdfDebtCharts(html,row.title,row.publishedAt),/bornes différentes/)
  rejected++;continue
 }
 const evidence=bdfDebtCharts(html,row.title,row.publishedAt),result=parsePublication(html,source,row.url,now,{publishedAt:row.publishedAt})
 assert.equal(evidence.series.length,4);assert.equal(result.evidence.controlledSeries.length,4)
 assert.equal(result.referencePeriod,evidence.period);assert.equal(result.publishedAt,row.publishedAt)
 assert.equal(result.checkedAt,now.toISOString());assert.equal(result.sourceUrl,row.url)
 assert.equal(result.evidence.sourceHash,row.sha256)
 assert.equal(evidence.series.filter(s=>s.unit==='% du PIB').length,3)
 assert.equal(evidence.series.find(s=>s.unit==='% des fonds propres').population,'Sociétés non financières')
 assert(result.value.includes(evidence.period.slice(0,4)));qualified++
}
assert.equal(qualified,11);assert.equal(rejected,1)
const latest=manifest.responses.find(r=>r.url.endsWith('2025-q4')),html=gunzipSync(fs.readFileSync(dir+'/'+latest.file)).toString()
assert.deepEqual(bdfDebtCharts(html,latest.title,latest.publishedAt).series.map(s=>s.value),[59.13,174.08,38.87,75.48])
const invalids=[
 html.replace('Ratios en % du PIB','Ratios en % du total'),
 html.replace("yAxis : 'YAxis2'","yAxis : 'YAxis'"),
 html.replaceAll("'T4 2025'","'T1 2026'"),
 html.replace("'T1 2001'","'T2 2001'"),
 html.replace('33.91,34.04','(()=>{globalThis.__bdfExecuted=true;return 33.91})(),34.04'),
 html.replace('59.40,59.13','59.40,null'),
 html.replace('59.40,59.13','59.40'),
 html.replaceAll('chart29878389','chart29878384'),
 html.slice(0,html.indexOf('chart29878389')),
]
for(const invalid of invalids){assert.notEqual(invalid,html,'The regression must mutate the actual response');assert.throws(()=>bdfDebtCharts(invalid,latest.title,latest.publishedAt))}
assert.equal(globalThis.__bdfExecuted,undefined,'Downloaded script must never be executed')
assert.throws(()=>bdfDebtCharts(html,latest.title,'2025-11-01'),/postérieure/)
const bad=manifest.responses.find(r=>r.url.endsWith('2023t2')),badHtml=gunzipSync(fs.readFileSync(dir+'/'+bad.file)).toString()
const monthNames=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const card=r=>`<a href="${new URL(r.url).pathname}"><h3>${r.title}</h3><span>${Number(r.publishedAt.slice(8))} ${monthNames[Number(r.publishedAt.slice(5,7))-1]} ${r.publishedAt.slice(0,4)}</span></a>`
const request=async url=>new Response(url===source.url?card(latest)+card(bad):url===latest.url?html:badHtml,{headers:{'content-type':'text/html'}})
const result=await collectPublications(now,request,{},[source],10)
assert(result.observations.some(o=>o.sourceUrl===latest.url&&o.evidence.controlledSeries.length===4))
assert(result.errors.some(e=>e.entity===bad.url&&/bornes différentes/.test(e.reason)))
assert(!result.observations.some(o=>o.sourceUrl===bad.url),'The inconsistent archive must remain unqualified')
console.log('BDF debt: 11/12 actual documents qualified, inconsistent2023T2 retained; periods, axes, four series, null/partial/malformed responses and isolated producer errors verified.')

// Production had ten pre-parser errors held until tomorrow. A version bump
// must reach the queue selector, not merely annotate its source definition.
const earlier=new Date(+now-3600000).toISOString(),future=new Date(+now+86400000).toISOString()
const oldFailure=(row,status='error')=>({url:row.url,source:source.id,title:row.title,publishedAt:row.publishedAt,discoveredAt:earlier,attemptedAt:earlier,nextAttemptAt:future,attempts:7,status,error:'Résumé statistique chiffré absent : extraction à adapter'})
const settled=manifest.responses.find(r=>r.url.endsWith('2022t4'))
const documents=Object.fromEntries([latest,bad,settled].map(row=>[row.url,oldFailure(row)]))
documents[settled.url].status='done';delete documents[settled.url].error
const before={sources:{[source.id]:{id:source.id,status:'ok',checkedAt:earlier,lastSuccessAt:earlier,nextCheckAt:future}},documents}
const requested=[]
const controlledRequest=async(url,args)=>{
 requested.push(url)
 assert.equal(args.headers['If-None-Match'],undefined,'Parser migration must exercise the source, not a cached response')
 assert([latest.url,bad.url].includes(url),'Already valid documents must not be replayed')
 return new Response(url===latest.url?html:badHtml,{headers:{'content-type':'text/html'}})
}
const recovered=await collectPublications(now,controlledRequest,before,[source],2)
assert.equal(recovered.metrics.attemptedDocuments,2)
assert.deepEqual(new Set(requested),new Set([latest.url,bad.url]))
assert.equal(recovered.state.documents[latest.url].status,'done')
assert.equal(recovered.state.documents[latest.url].parserVersion,1)
assert.equal(recovered.state.documents[latest.url].parserVersionAttempted,1)
assert(recovered.state.documents[latest.url].recoveredAt)
assert.equal(recovered.state.documents[bad.url].status,'error')
assert.equal(recovered.state.documents[bad.url].parserVersionAttempted,1)
assert(recovered.errors.some(e=>e.entity===bad.url&&/bornes différentes/.test(e.reason)))
assert.deepEqual(recovered.state.documents[settled.url],before.documents[settled.url])
assert.equal(before.documents[latest.url].status,'error','Input historical state is immutable')
const again=await collectPublications(new Date(+now+1000),async()=>{throw Error('No immediate repeated attempt permitted')},recovered.state,[source],2)
assert.equal(again.metrics.requests,0)
assert.equal(again.state.documents[latest.url].observation.checkedAt,now.toISOString())
assert(again.errors.some(e=>e.entity===bad.url),'A later targeted success must not clear the contradictory document')
// A smaller ordinary budget preserves every unselected old failure for a later pass.
const bounded=await collectPublications(now,controlledRequest,before,[source],1)
assert.equal(bounded.metrics.attemptedDocuments,1)
const untouched=Object.entries(bounded.state.documents).filter(([url,item])=>url!==settled.url&&!item.parserVersionAttempted)
assert.equal(untouched.length,1)
assert.equal(untouched[0][1].attemptedAt,earlier)
console.log('BDF versioned recovery: future-backoff legacy failures requalified once within ordinary budget; valid history, failed periods, no-source-cache and unattempted identities preserved.')

// Integration with a congested ordinary queue: a fresh parser must actually
// reach its source, while older unrelated work still gets half the envelope.
const q3=manifest.responses.find(r=>r.url.endsWith('2025-q3')),q3Html=gunzipSync(fs.readFileSync(dir+'/'+q3.file)).toString()
const other=PUBLICATION_SOURCES.find(s=>s.id==='bdf-credit'),longAgo=new Date(+now-3*86400000).toISOString()
const backlog=Object.fromEntries(Array.from({length:8},(_,i)=>{const url=other.url+'&isolated-test='+i;return[url,{url,source:other.id,title:'Ancien dossier de test isolé',status:'error',attempts:3,firstAttemptAt:longAgo,attemptedAt:longAgo,lastQueueServiceAt:longAgo,discoveredAt:longAgo,nextAttemptAt:earlier,error:'Previous isolated failure'}]}))
const congested={sources:{...before.sources,[other.id]:{id:other.id,status:'ok',checkedAt:earlier,nextCheckAt:future}},documents:{...backlog,[latest.url]:oldFailure(latest),[q3.url]:oldFailure(q3),[bad.url]:oldFailure(bad)}}
const calls=[]
const replay=await collectPublications(now,async url=>{
 calls.push(url)
 if(url===latest.url||url===q3.url)return new Response(url===latest.url?html:q3Html,{headers:{'content-type':'text/html'}})
 if(Object.hasOwn(backlog,url))return new Response('Isolated background failure',{status:503})
 throw Error('The older contradictory document must remain unattempted in this four-document pass')
},congested,[other,source],4)
assert.equal(replay.metrics.attemptedDocuments,4)
assert.equal(replay.metrics.queue.requalificationsEligible,3)
assert.equal(replay.metrics.queue.requalificationsSelected,2)
assert.equal(replay.state.documents[latest.url].status,'done');assert.equal(replay.state.documents[q3.url].status,'done')
assert.equal(new Set(calls.filter(url=>Object.hasOwn(backlog,url))).size,2,'Unrelated background work retains half the no-news budget')
assert.deepEqual(replay.state.documents[bad.url],congested.documents[bad.url],'A targeted recovery does not certify the unattempted archive')
assert.equal(replay.sources.find(s=>s.id===source.id).checkedAt,earlier,'Document recovery must not invent a new listing check')
console.log('BDF congested queue: latest two real documents recovered before eight older failures, two background attempts retained, old contradiction unattempted and not certified.')
