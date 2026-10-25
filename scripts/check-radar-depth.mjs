// Read-only end-to-end qualification. No publisher, GitHub write or send API.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { collectPublications, PUBLICATION_SOURCES } from './lib/radar-publications.mjs'
import { editorialAssessment } from '../src/lib/radar-editorial.js'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { planNotifications } from './lib/radar-notifications.mjs'
const output=process.argv[2]??'test-artifacts/radar-depth'
await mkdir(output,{recursive:true})
const ids=['fortuneo-tariffs','fortuneo-offers','boursobank-tariffs','boursobank-offers','insee-studies','bdf-credit','notaires-paris','credit-logement','revolut-news']
const started=Date.now(),results=[]
for(const id of ids) {
  const source=PUBLICATION_SOURCES.find(s=>s.id===id),path=join(output,id+'-state.json'),passes=[]
  let previous={}
  for(let i=0;i<2;i++){
    const r=await collectPublications(new Date(),fetch,previous,[source],2)
    await writeFile(path,JSON.stringify(r.state));previous=JSON.parse(await readFile(path))
    passes.push(r)
  }
  const cacheValid=Date.parse(previous.sources[id]?.nextCheckAt)>Date.now()
  const cached=await collectPublications(new Date(),cacheValid?()=>assert.fail('Validated cache must make no request'):fetch,previous,[source],0)
  if(cacheValid)assert.equal(cached.metrics.requests,0)
  const docs=Object.values(cached.state.documents),observations=cached.observations,now=new Date()
  const publication=advanceRadar(advanceRadar(null,[],{now}).state,observations,{now})
  for(const mode of ['major','digest'])assert.equal(planNotifications(publication.feed.events,{acknowledged:[]},now,mode).events.length,0,'New archive has no retrospective alert')
  const report={...cached.sources[0],qualification:docs.some(d=>d.offerBaseline)?'silent-reference-qualified-no-change-proven':observations.length?'discovery-extraction-persistence-qualified':'not-qualified',cacheVerified:cacheValid&&cached.metrics.requests===0,passes:passes.map(p=>({metrics:p.metrics,queue:p.sources[0].queue,errors:p.errors})),examples:observations.map(o=>({title:o.label,url:o.sourceUrl,publishedAt:o.publishedAt,referencePeriod:o.referencePeriod,sourceDeclaredPublicationDate:o.sourceDeclaredPublicationDate,publicationDateNote:o.publicationDateNote,summary:o.summary,sourceHash:o.evidence?.sourceHash,housing:o.housing,backfill:o.backfill,assessment:editorialAssessment({...o,after:o.value,kind:'new'},+now)})),baselines:docs.filter(d=>d.offerBaseline).map(d=>({url:d.url,firstObservedAt:d.firstObservedAt,checkedAt:d.offerBaseline.checkedAt,sourceHash:d.offerBaseline.sourceHash,clauseCount:d.offerBaseline.clauseCount,dates:d.offerBaseline.dates,examples:Object.values(d.offerBaseline.clauses).slice(0,3).map(c=>c.quote)})),documents:docs.map(d=>({url:d.url,status:d.status,error:d.error,reason:d.reason,publishedAt:d.observation?.publishedAt??null})),initialNotifications:0}
  results.push(report);console.log(id,report.qualification,docs.length,observations.length)
}
const access=[]
for(const url of ['https://traderepublic.com/fr-fr/about','https://traderepublic.com/en-fr/about','https://support.traderepublic.com/fr-fr','https://www.revolut.com/sitemap-index.xml','https://www.revolut.com/sitemap-index-0.xml']) {
  try {const r=await fetch(url,{headers:{'User-Agent':'EpargnantLibre-Radar/2.0'},signal:AbortSignal.timeout(15000)});const bytes=await r.arrayBuffer();if(url==='https://traderepublic.com/fr-fr/about'&&r.ok&&bytes.byteLength<2500000)await writeFile(join(output,'trade-republic-entry.html'),Buffer.from(bytes));access.push({url,status:r.status,finalUrl:r.url,bytes:bytes.byteLength,checkedAt:new Date().toISOString(),qualification:'access-only-not-a-qualified-connector'})}catch(e){access.push({url,error:e.message,checkedAt:new Date().toISOString()})}
}
await writeFile(join(output,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),environment:process.env.GITHUB_ACTIONS?'github-actions':'local',durationMs:Date.now()-started,method:'Two real passes with disk reload and cached recheck; deterministic feed and simulated notification planning. Baseline is not a detected announcement. No send or publish action.',sources:results,access},null,2)+'\n')
