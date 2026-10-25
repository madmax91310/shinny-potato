import { mkdir,writeFile,readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { collectPublications,PUBLICATION_SOURCES,parsePublication } from './lib/radar-publications.mjs'
import { INSEE_SEARCH,inseeDiscovery,inseeQuery } from './lib/radar-insee-search.mjs'
// Live public qualification only. No publisher, GitHub write API or notifier.
const output=resolve(process.argv[2]??'/tmp/radar-audit-fixes'),now=new Date()
await mkdir(output,{recursive:true})
const report={checkedAt:now.toISOString(),mode:'live-read-only',cases:[],ordinaryDiscovery:[],requests:0,bytes:0}
const request=async (...args)=>{report.requests++;const r=await fetch(...args);report.bytes+=(await r.clone().arrayBuffer()).byteLength;return r}
try{
 const first=await request(INSEE_SEARCH.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(inseeQuery(0)),signal:AbortSignal.timeout(25000)})
 if(!first.ok)throw Error('Recherche INSEE HTTP '+first.status)
 const discovered=await inseeDiscovery(await first.text(),INSEE_SEARCH,request)
 const dossier=discovered.find(d=>d.url.endsWith('/8996928'))
 report.ordinaryDiscovery.push({source:'insee-studies',discovered:discovered.length,dossier8996928:!!dossier,method:'API publique à catégories et pages bornées ; aucun article injecté'})
 if(dossier){const r=await request(dossier.url,{signal:AbortSignal.timeout(25000)});const parsed=parsePublication(await r.text(),INSEE_SEARCH,dossier.url,now,dossier);report.cases.push({case:'INSEE dossier',method:'discovered-then-extracted',title:parsed.label,publishedAt:parsed.publishedAt,status:parsed.rejected?'rejected':'qualified',reason:parsed.rejected??null})}
}catch(error){report.cases.push({case:'INSEE discovery',status:'error',reason:error.message})}
const monitored=PUBLICATION_SOURCES.filter(s=>s.method==='offer-watch'||s.id==='xetra'||s.id==='bpce-bank'||s.id==='credit-agricole-news')
let previous={}
for(let pass=1;pass<=2;pass++){
 const result=await collectPublications(new Date(),request,previous,monitored,12)
 const path=resolve(output,'state.json');await writeFile(path,JSON.stringify(result.state,null,2));previous=JSON.parse(await readFile(path,'utf8'))
 report.ordinaryDiscovery.push({pass,method:'normal collector, real clock, JSON persistence; no publication or notification',sources:result.sources.map(s=>({id:s.id,status:s.status,discovered:s.discovered,queue:s.queue,silentBaselines:s.silentBaselines,error:s.error})),metrics:result.metrics,errors:result.errors})
}
report.documents=Object.values(previous.documents).map(d=>({url:d.url,source:d.source,status:d.status,title:d.observation?.label??d.title,publishedAt:d.observation?.publishedAt,clauseCount:d.offerBaseline?.clauseCount,products:d.observation?.products?.map(p=>({name:p.name,isin:p.isin,fees:p.fees,pea:p.pea,availability:p.availability})),extraction:d.observation?.extraction,reason:d.error??d.reason??d.partialReason,backfill:d.observation?.backfill}))
await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2))
console.log(JSON.stringify({output,requests:report.requests,bytes:report.bytes,cases:report.cases,discovery:report.ordinaryDiscovery.filter(r=>r.source),documents:report.documents.length,errors:report.ordinaryDiscovery.filter(r=>r.errors?.length).flatMap(r=>r.errors)},null,2))
