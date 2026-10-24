// Read-only live verification. Never imports the publisher or sends notifications.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { collectPublications } from './lib/radar-publications.mjs'
import { checkSourceAccess } from './lib/radar-source-access.mjs'
import { collectPurchasingNews } from './lib/purchasing-power-news.mjs'
import { collectRadarNews } from './lib/radar-news.mjs'
const args=process.argv.slice(2), value=flag=>args[args.indexOf(flag)+1]
const output=args.includes('--output')?value('--output'):'/tmp/radar-source-verification.json'
const now=new Date()
const [access,purchasing,news]=await Promise.all([checkSourceAccess(now),collectPurchasingNews(now),collectRadarNews(now)])
let result,previous={}
if(args.includes('--state')) try{previous=JSON.parse(await readFile(value('--state'),'utf8'))}catch(error){if(error.code!=='ENOENT')throw error}
const passes=args.includes('--passes')?Number(value('--passes')):1
if(!Number.isInteger(passes)||passes<1||passes>5)throw new Error('1 à 5 passages autorisés')
for(let i=0;i<passes;i++){result=await collectPublications(now,fetch,previous);previous=result.state}
if(args.includes('--state'))await writeFile(value('--state'),JSON.stringify(result.state))
const referenceUrls=['https://www.insee.fr/fr/statistiques/9087193','https://www.amundietf.fr/fr/professionnels/a-propos/news/investors-notice/amundi-renforce-sa-gamme-d-etf-thematiques-lies-a-l-ia']
const report={checkedAt:now.toISOString(),notifications:'disabled: publisher not imported',sources:result.sources,accessGaps:Object.values(access),purchasingSources:purchasing.sources,legacyEtfNews:{observations:news.observations.length,errors:news.errors},references:referenceUrls.map(url=>({url,discovered:Boolean(result.state.documents[url]),extracted:Boolean(result.state.documents[url]?.observation),status:result.state.documents[url]?.status ?? 'missed'})),extractions:result.observations.map(row=>({title:row.label,url:row.sourceUrl,publishedAt:row.publishedAt,referencePeriod:row.referencePeriod??null,checkedAt:row.checkedAt,products:row.products?.map(p=>({name:p.name,isin:p.isin,fees:p.fees}))??[],sourceHash:row.evidence?.sourceHash})),failures:result.errors,metrics:{sampleDocuments:Object.keys(result.state.documents).length,successfulExtractions:result.observations.length,rejected:Object.values(result.state.documents).filter(d=>d.status==='rejected').map(d=>({url:d.url,reason:d.reason})),delays:Object.values(result.state.documents).filter(d=>d.observation).map(d=>({url:d.url,publicationToDetectionHours:d.detectionDelayHours,detectionToAvailabilityHours:d.availabilityDelayHours}))},limits:'Échantillon borné, sans prétendre mesurer un rappel exhaustif ni les faux positifs de tout le Web. Accès non qualifié ≠ source raccordée.'}
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n')
console.log(`${report.sources.length} sources de découverte, ${report.extractions.length} extractions, références : ${report.references.filter(r=>r.extracted).length}/${report.references.length}. Rapport : ${output}. Notifications désactivées.`)
