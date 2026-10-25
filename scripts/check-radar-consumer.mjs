// Read-only qualification. Never imports the publisher or uses GitHub credentials.
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CONSUMER_SOURCES } from './lib/radar-consumer.mjs'
import { collectPublications } from './lib/radar-publications.mjs'
import { editorialAssessment } from '../src/lib/radar-editorial.js'
const now=new Date(), started=Date.now(), results=[]
for(const source of CONSUMER_SOURCES){
 const result=await collectPublications(now,fetch,{},[source],2)
 const examples=result.observations.map(row=>({title:row.label,url:row.sourceUrl,publishedAt:row.publishedAt,checkedAt:row.checkedAt,topic:row.topic,summary:row.summary,evidenceLevel:row.evidenceLevel,sourceHash:row.evidence.sourceHash,referencePeriod:row.referencePeriod,factType:row.factType,backfill:row.backfill,assessment:editorialAssessment({...row,after:row.value,kind:'new'},+now)}))
 const report={...result.sources[0],qualification:examples.length?'discovery-and-extraction-verified':'not-qualified',metrics:result.metrics,examples,errors:result.errors}
 results.push(report);console.log(source.id,report.qualification,report.discovered,examples.length,report.errors.map(e=>e.reason).join('; '))
}
const output=resolve(process.argv[2]??'test-artifacts/radar-consumer-live.json');await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify({checkedAt:now.toISOString(),durationMs:Date.now()-started,method:'Découverte automatique du point d’entrée puis deux documents au maximum par source ; état local vierge, aucun envoi ni publication. Ce contrôle ne prouve pas une collecte programmée.',sources:results},null,2)+'\n');console.log(output)
