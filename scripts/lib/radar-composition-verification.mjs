import {createHash} from 'node:crypto'
import {compositionIssue,COMPOSITION_REVIEW_POINTS} from '../../src/lib/radar-composition.js'
import {compositionEvidence} from './radar-composition-evidence.mjs'
const hash=value=>createHash('sha256').update(value).digest('hex')
const date=value=>{const text=String(value??'');return /^\d{8}$/.test(text)?`${text.slice(0,4)}-${text.slice(4,6)}-${text.slice(6)}`:null}
const point=(points,key)=>points?.[key]?.value
const allowed=url=>{try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www.blackrock.com'&&u.pathname.includes('/product-data/api/')&&u.pathname.endsWith('/get-product-data')}catch{return false}}
// Independent, same-date full-position evidence. Signed NAV weights remain exact;
// no clipping, scaling, or inference from a top ten or an index portfolio.
export function verifyBlackRockAllocation(body,template,rawHash,checkedAt) {
 const c=body.componentsByNameMap,f=c?.keyFundFacts?.containersByNameMap?.default?.dataPointsByNameMap
 if(point(f,'isin')!==template.entity||String(body.productId)!==new URL(template.sourceUrl).searchParams.get('portfolioId')||point(f,'seriesBaseCurrencyCode')!==body.currencyCode)throw Error('Identité de part ou devise non corroborée')
 if(point(f,'productStructure')!=='Physical'||point(f,'assetClass')!=='Equity')throw Error('Méthode physique actions non qualifiée par cet adaptateur')
 const p=c.exposureBreakdowns?.containersByNameMap?.sector?.dataPointsByNameMap,labels=point(p,'type'),weights=point(p,'fund'),asOf=date(point(p,'asOf'))
 if(!asOf||!Array.isArray(labels)||!Array.isArray(weights)||!labels.length||labels.length!==weights.length||weights.some(w=>!Number.isFinite(w)))throw Error('Ventilation sectorielle officielle incomplète')
 const block={asOf,sourceComponent:'exposureBreakdowns.sector',sha256:rawHash,rows:labels.map((name,i)=>({name,weightPct:weights[i]}))}
 const e=compositionEvidence(block,{isin:template.entity,basis:'fund',currency:body.currencyCode,sourceUrl:template.sourceUrl,checkedAt,dimension:'sectors'})
 const h=c.holdings?.containersByNameMap?.all?.dataPointsByNameMap,metrics=c.fundamentalsAndRisk?.containersByNameMap?.default?.dataPointsByNameMap
 let reason='Positions complètes de même date non corroborées'
 if(date(point(h,'asOfDate'))!==asOf)reason=`Dates incompatibles : ventilation ${asOf}, positions ${date(point(h,'asOfDate'))??'inconnue'}`
 else {
  const keys=['holdingPercent','sectorName','assetClass','isin','ticker','exchange','marketCurrencyCode'],cols=Object.fromEntries(keys.map(k=>[k,point(h,k)]))
  const n=cols.holdingPercent?.length
  const count=metrics?.numHoldings
  if(n&&keys.every(k=>Array.isArray(cols[k])&&cols[k].length===n)&&date(count?.asOfDate)===asOf){
   const sectors=new Map(),equities=new Set();let total=0,valid=true,equityRows=0
   for(let i=0;i<n;i++){
    const w=cols.holdingPercent[i],kind=cols.assetClass[i],sector=cols.sectorName[i]
    if(!Number.isFinite(w)||!sector||!['Equity','Cash','Cash Collateral and Margins','FX','Futures','Forwards'].includes(kind)||kind==='Equity'&&w<0||kind!=='Equity'&&sector!=='Cash and/or Derivatives'){valid=false;break}
    if(kind==='Equity'){equityRows++;equities.add(JSON.stringify([cols.isin[i],cols.ticker[i],cols.exchange[i],cols.marketCurrencyCode[i]]))}
    total+=w;sectors.set(sector,(sectors.get(sector)??0)+w)
   }
   const matches=valid&&count.active===true&&count.value===equityRows&&equities.size===equityRows&&Math.abs(total-100)<=n*.000005&&[...sectors].every(([k,w])=>labels.includes(k)&&Math.abs(weights[labels.indexOf(k)]-w)<=.01+n*.000005)&&labels.every((k,i)=>Math.abs(weights[i]-(sectors.get(k)??0))<=.01+n*.000005)
   if(matches)e.confirmation={kind:'complete-positions',identity:e.identity,basis:e.basis,unit:e.unit,asOf,sourceHash:rawHash,sourceUrl:template.sourceUrl,coverage:'complete',matchesAllocation:true,positionCount:n,method:'Toutes les positions physiques, date et nombre de titres corroborés ; poids NAV signés et arrondis publiés, sans normalisation'}
   else reason='Positions, couverture ou catégories incompatibles avec la ventilation'
  }
 }
 e.complete=Boolean(e.confirmation)
 const rows=labels.map((label,i)=>({...template,field:'sectors:'+label,fieldLabel:'Poids du secteur '+label,value:weights[i],period:asOf,checkedAt,sourceHash:rawHash,completeComposition:e.complete,compositionEvidence:e,compositionEventKey:JSON.stringify([template.entity,'sectors','fund',asOf,rawHash])}))
 return {rows,evidence:{identity:e.identity,allocationDate:asOf,positionsDate:date(point(h,'asOfDate')),sourceHash:rawHash,sourceUrl:template.sourceUrl},status:e.confirmation?'confirmed':compositionIssue(e)?'pending':'observed',reason:e.confirmation?'Ventilation corroborée par les positions complètes de même date':reason}
}
export async function qualifyCompositionCandidates(observations,previous,{now=new Date(),fetchImpl=fetch,budget=2}={}) {
 const entries=structuredClone(previous?.compositionVerification?.entries??{}),candidates=new Map(),errors=[]
 const previousRows=new Map(Object.values(previous?.current??{}).map(row=>[JSON.stringify([row.entity,row.field,row.scope]),row]))
 const priorReviews=Object.values(previous?.compositionReviews??{}).filter(r=>!r.resolvedAt).flatMap(r=>r.observations??[])
 for(const row of [...priorReviews,...observations]){
  if(row.family!=='etf'||!row.field?.startsWith('sectors:')||!allowed(row.sourceUrl))continue
  const before=previousRows.get(JSON.stringify([row.entity,row.field,row.scope]))
  if(!compositionIssue(row.compositionEvidence)&&!(before&&Math.abs(row.value-before.value)>=COMPOSITION_REVIEW_POINTS)&&!(row.value===100&&/Cash/.test(row.field)))continue
  candidates.set(row.entity+row.scope,row)
 }
 let requests=0,cachedCount=0,deferred=0,networkBytes=0
 for(const [key,row]of [...candidates].sort(([a],[b])=>String(entries[a]?.attemptedAt??'').localeCompare(String(entries[b]?.attemptedAt??'')))){
  const cached=entries[key],fingerprint=hash(JSON.stringify([row.period,row.compositionEvidence?.sourceHash??row.sourceHash,row.value]))
  if(cached?.fingerprint===fingerprint&&+now-Date.parse(cached.attemptedAt)<3600000){cachedCount++;continue}
  if(requests>=budget){deferred++;continue}
  requests++;const started=performance.now();const entry={fingerprint,attemptedAt:now.toISOString(),sourceUrl:row.sourceUrl,identity:row.entity}
  try{
   const headers={Accept:'application/json',...(cached?.etag?{'If-None-Match':cached.etag}:{}),...(cached?.lastModified?{'If-Modified-Since':cached.lastModified}:{})}
   const response=await fetchImpl(row.sourceUrl,{headers,signal:AbortSignal.timeout(12000),redirect:'error'})
   entry.httpStatus=response.status
   if(response.status===304){entries[key]={...cached,...entry};continue}
   if(!response.ok)throw Error(`HTTP ${response.status}`)
   if(Number(response.headers.get('content-length'))>8000000)throw Error('Réponse de qualification trop volumineuse')
   const raw=await response.text();networkBytes+=Buffer.byteLength(raw);if(Buffer.byteLength(raw)>8000000)throw Error('Réponse de qualification trop volumineuse')
   const checked=verifyBlackRockAllocation(JSON.parse(raw),row,hash(raw),now.toISOString())
   entries[key]={...entry,status:checked.status,reason:checked.reason,evidence:checked.evidence,etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified')}
   // Only corroborated or structurally usable snapshots enter the normal guard.
   if(checked.status!=='pending'&&checked.rows[0].period>=row.period){for(let i=observations.length-1;i>=0;i--)if(observations[i].entity===row.entity&&observations[i].scope===row.scope&&observations[i].field.startsWith('sectors:'))observations.splice(i,1);observations.push(...checked.rows)}
   if(checked.status==='pending')errors.push({family:'etf',entity:row.entity,reason:`Qualification complémentaire : ${checked.reason}`})
  }catch(error){entries[key]={...cached,...entry,status:'error',reason:error.message};errors.push({family:'etf',entity:row.entity,reason:`Qualification complémentaire en panne : ${error.message}. Dernière référence conservée.`})}
  finally{if(entries[key])entries[key].durationMs=Math.round(performance.now()-started)}
 }
 return {entries,errors,metrics:{candidates:candidates.size,requests,cached:cachedCount,deferred,budget,networkBytes}}
}
