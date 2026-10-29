// Two ordinary public requests: configured listing, then its latest dated item.
import fs from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {PUBLICATION_SOURCES,discoverPublications,parsePublication} from './lib/radar-publications.mjs'
import {requestRadarSource} from './lib/radar-source-health.mjs'
const source=PUBLICATION_SOURCES.find(s=>s.id==='bdf-debt'),out=process.argv[2]
if(!out)throw Error('Output directory required')
await fs.mkdir(out,{recursive:true})
const report={sourceId:source.id,attemptedAt:new Date().toISOString(),runtime:{runId:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null,event:process.env.GITHUB_EVENT_NAME??null,codeRevision:process.env.GITHUB_SHA??null},expectedFields:['households:debt-to-gdp','households:financial-assets-to-gdp','snf:leverage','snf:debt-to-gdp'],sourceChecks:[],status:'failed'}
async function acquire(url,name){
 const response=await requestRadarSource(fetch,url,{headers:{'User-Agent':'EpargnantLibre-Radar/2.0',Accept:'text/html'},signal:AbortSignal.timeout(25000)},()=>{})
 if(!response.ok)throw Error(`HTTP ${response.status}`)
 if(response.url&&new URL(response.url).hostname!==source.host)throw Error('Unexpected issuer redirect')
 const raw=Buffer.from(await response.arrayBuffer())
 if(raw.length>2500000)throw Error('Issuer response exceeds ordinary bound')
 await fs.writeFile(path.join(out,name),raw)
 report.sourceChecks.push({url,checkedAt:new Date().toISOString(),sha256:createHash('sha256').update(raw).digest('hex'),bytes:raw.length})
 return raw.toString('utf8')
}
try{
 const listing=await acquire(source.url,'listing.html'),items=discoverPublications(listing,source).filter(r=>Number.isFinite(Date.parse(r.publishedAt))).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))
 if(!items.length)throw Error('No dated official publication')
 const selected=items[0]
 report.expectedDocument={url:selected.url,publishedAt:selected.publishedAt,title:selected.title}
 const html=await acquire(selected.url,'document.html'),observation=parsePublication(html,source,selected.url,new Date(),selected)
 if(observation.evidence?.controlledSeries?.length!==4)throw Error('Four exact chart series were not qualified')
 report.observation=observation;report.status='qualified';report.sourceCheckedAt=report.sourceChecks.at(-1).checkedAt
 report.scope='Latest document selected from the ordinary source listing; not the complete archive, not a production publication'
}catch(error){report.reason=error.message;process.exitCode=1}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,document:report.expectedDocument?.url,reason:report.reason,sourceChecks:report.sourceChecks.length}))
