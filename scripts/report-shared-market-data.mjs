// Scope is derived from actual consumers, never from the company-analysis roster.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {MARKET_ASSETS,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {references} from '../src/pages/dca-profiles/engine.js'
import {publishedExposure,exposureView} from '../src/pages/dca-profiles/exposure.js'
import {sharedPositions} from '../src/pages/dca-profiles/verification.js'
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)))
const records={...read('src/data/automated-monthly.json'),...read('src/data/automated-etf-monthly.json'),...read('src/data/non-bond-monthly-records.json')}
const config=[...read('scripts/monthly-automation.json').series,...read('scripts/non-bond-monthly-sources.json').series]
const configured=new Map(config.map(r=>[r.id,r]))
const links=read('src/data/equity-history-links.json')
const monthlyStatus=read('scripts/source-snapshots/monthly-collection-status.json').series
const policy=read('src/data/freshness-policy.json').fields['series.monthly']
const manifest=read('src/pages/dca-profiles/holdings-manifest.json')
const holdings=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>read(`src/pages/dca-profiles/holdings-${n}.json`)))
const holdingsSources={...read('scripts/dca-complete-holdings-sources.json'),...read('scripts/generated-holdings-sources.json')}
const holdingsStatus=read('src/data/dca-holdings-status.json')
const tools={calculator:new Set(ASSET_ORDER),performance:new Set(MARKET_ASSETS.map(r=>r.id)),anniversary:new Set(ANNIVERSAIRE_ELIGIBLE_ASSETS.map(r=>r.id))}
const now=new Date(),today=now.toISOString().slice(0,10),errors=[]
const histories=Object.entries(ASSETS).filter(([id,a])=>a.instrumentType==='EQUITY'||records[id]?.consumerScope==='catalog').map(([id,a])=>{
 const record=records[id],source=configured.get(id),consumers=Object.entries(tools).filter(([,ids])=>ids.has(id)).map(([key])=>key)
 const status=monthlyStatus?.[id],checkedAt=record?.checkedAt??null
 const lastSuccessfulCheck=status?.status==='validated'?status.checkedAt:checkedAt
 const date=Date.parse(lastSuccessfulCheck),age=(now-date)/86400000
 const stale=!Number.isFinite(age)||age<0||age>policy.checkDays
 const actual=a.points??[],expected=record?.points??[]
 const propagated=actual.length===expected.length&&actual.every((p,i)=>p.date===expected[i][0]&&p.price===expected[i][1])
 const pricePropagated=!record?.anniversaryPoints?.length||(a.anniversaryPoints?.length===record.anniversaryPoints.length&&a.anniversaryPoints.every((p,i)=>p.date===record.anniversaryPoints[i][0]&&p.price===record.anniversaryPoints[i][1]))
 if(record&&(!propagated||!pricePropagated||a.currency!==record.currency))errors.push(`${id}: observation differs from the consumer history`)
 if(record&&source?.field==='adjclose'&&a.priceMethod!=='adjusted')errors.push(`${id}: adjusted performance convention lost`)
 const isin=record?.isin??links[id]?.isin??a.isin??null
 return {id,name:a.label,type:a.instrumentType??'ETF',isin,symbol:record?.symbol??source?.symbol??null,currency:a.currency,consumers,
  configured:!!source,observed:!!record,propagated,pricePropagated,state:!record?'missing':!source?'not-configured':stale?'check-overdue':'current',
  checkedAt,lastSuccessfulCheck,lastCollection:status??null,periodStart:record?.periodStart??null,periodEnd:record?.periodEnd??null,
  method:record?.method??null,performanceField:source?.field??null,
  anniversary:!consumers.includes('anniversary')?'not-eligible':record?.anniversaryPoints?.length?'separate-close-series':'requires-specific-review',
  identityLimit:isin?null:'No exact ISIN link qualified; do not merge an ADR and an ordinary share.',
  sourceUrls:record?.sourceUrls??[],responseSha256:record?.responseSha256??null}
})
const byIsin=new Map()
for(const row of histories)if(row.isin)byIsin.set(row.isin,[...(byIsin.get(row.isin)??[]),row.id])
const seen=new Set(),exposures=[]
for(const [id,r]of Object.entries(references)){
 const identity=r.isin||id;if(seen.has(identity))continue;seen.add(identity)
 const line={asset:id,isin:r.isin,label:r.name,weight:100}
 const fields=Object.fromEntries(['countries','sectors'].map(field=>{
  const e=publishedExposure([line],references,field,now),v=exposureView(e),o=r[field]
  return [field,{coverage:v.eligible?v.coverage/v.eligible*100:0,outside:v.eligible===0,asOf:o?.asOf??null,checkedAt:o?.checkedAt??null,sourceUrl:o?.sourceUrl??null,method:o?.method??null,limits:v.omitted.map(x=>x.reason)}]
 }))
 const shared=sharedPositions([line],references,now,holdings),h=holdings[id],total=shared.totals[0]
 exposures.push({id,name:r.name,isin:r.isin??null,kind:r.kind,consumers:['exposures'],histories:byIsin.get(r.isin)??[],...fields,
  positions:{state:fields.countries.outside&&fields.sectors.outside?'not-applicable':!total?'unavailable':total.complete?'complete-list':'partial-list',
   identifiedCoverage:total?.coverage??0,asOf:h?.asOf??(r.kind==='equity'?(r.countries??r.sectors)?.asOf:null)??null,
   sourceUrl:h?.sourceUrl??(r.kind==='equity'?(r.countries??r.sectors)?.sourceUrl:null)??null,
   configured:!!holdingsSources[r.isin],lastCollection:holdingsStatus[r.isin]??null}})
}
const count=(rows,field)=>rows.reduce((counts,row)=>(counts[row[field]]=(counts[row[field]]??0)+1,counts),{})
const report={schemaVersion:1,checkedAt:now.toISOString(),scope:{included:['Actions et ETF utilisés par les performances et simulations','Prix historiques qualifiés séparément','Pays, secteurs et positions utilisés par Actifs & expositions'],excluded:['Comptes, prévisions et valorisations réservés à Analyse d’entreprise'],note:'Une donnée présente ne prouve pas une collecte réussie aujourd’hui. Les dates des observations sont conservées. Les identités ADR/actions ordinaires restent séparées.'},summary:{histories:histories.length,equityHistories:histories.filter(r=>r.type==='EQUITY').length,historyStates:count(histories,'state'),exposures:exposures.length,positionStates:count(exposures.map(r=>r.positions),'state'),identityLimits:histories.filter(r=>r.identityLimit).length},histories,exposures,errors}
mkdirSync('public/data',{recursive:true})
writeFileSync('public/data/shared-market-coverage.json',JSON.stringify(report)+'\n')
console.log(JSON.stringify({sharedMarketData:report.summary,errors}))
// Source limitations remain visible; a broken link to an existing valid record blocks publication.
if(errors.length)process.exitCode=1
