import { qualifyHoldings } from './holdings-qualification.js'
import { aggregateCompanies } from '../../data/index-concentration-core.js'
import COMPANY_IDENTITIES from '../../data/index-company-identities.json' with { type: 'json' }
import { dcaExposure, exposureDisplay, EXPOSURE_MAX_SPREAD_DAYS } from './exposure.js'
export function catalogCoverage(references,now=new Date()){
 return Object.entries(references).map(([asset,r])=>{
  const line={asset,label:r.name,isin:r.isin,weight:100}
  const fields=Object.fromEntries(['countries','sectors'].map(field=>{
   const e=dcaExposure([line],references,field,now),d=exposureDisplay(e)
   return [field,{coverage:d.coverage,outside:e.neutralWeight,reason:e.neutralWeight?'Hors classification':d.omitted[0]?.reason|| (d.missing>.5?'Ventilation partielle':'Disponible'),date:r[field]?.asOf}]
  }))
  return {asset,...r,...fields}
 })
}
// Exact security identifiers only. Top holdings are evidence of shared positions,
// never a full-portfolio overlap score or a match based on company name.
export function sharedPositions(lines,references,now=new Date(),observations={}){
 const eligible=[],unavailable=[],qualification=[],incompatiblePairs=[]
 for(const line of lines.filter(l=>l.weight>0).slice().sort((a,b)=>a.asset.localeCompare(b.asset))){
  const r=references[line.asset]
  if(r?.outsideClassification)continue // No company positions for bonds, cash, metals or crypto.
  const o=r?.countries||r?.sectors
  const h=r?.kind==='equity'&&r.isin&&o?{asOf:o.asOf,sourceUrl:o.sourceUrl,basis:'equity',complete:true,rows:[{isin:r.isin,name:r.name,weightPct:100}]}:observations[line.asset]
  const q=qualifyHoldings(h,line,r,now)
  qualification.push({asset:line.asset,label:line.label,isin:line.isin,asOf:h?.asOf,sourceUrl:h?.sourceUrl,...q})
  if(!q.valid){unavailable.push(line.label);continue}
  const rows=new Map()
  for(const row of h.rows.filter(r=>/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(r.isin||'')))rows.set(row.isin,{...row,weightPct:(rows.get(row.isin)?.weightPct||0)+row.weightPct})
  if([...rows.values()].some(row=>row.weightPct>100)){unavailable.push(line.label);continue}
  eligible.push({line,h,rows,q})
 }
 // A shared gate for pair scores and concentration completeness. A complete
 // source file with unknown identifiers, excess weights or missing coverage is
 // still insufficient for a complete portfolio claim. Keep its real weights.
 const completeList=x=>x.q.complete
 const pairs=[]
 for(let i=0;i<eligible.length;i++)for(let j=i+1;j<eligible.length;j++){
  const left=eligible[i],right=eligible[j]
  const basisMismatch=left.h.basis!==right.h.basis&&left.h.basis!=='equity'&&right.h.basis!=='equity'
  const dateMismatch=Math.abs(Date.parse(left.h.asOf)-Date.parse(right.h.asOf))/86400000>EXPOSURE_MAX_SPREAD_DAYS
  if(basisMismatch||dateMismatch){incompatiblePairs.push({left:left.line.label,right:right.line.label,reasons:[...(basisMismatch?['Détentions du fonds et exposition d’indice : périmètres distincts.']:[]),...(dateMismatch?['Dates de photographie trop éloignées.']:[])]});continue}
  const common=[...left.rows].filter(([isin])=>right.rows.has(isin)).map(([isin,l])=>({isin,name:l.name,leftWeight:l.weightPct,rightWeight:right.rows.get(isin).weightPct,portfolioWeight:(left.line.weight*l.weightPct+right.line.weight*right.rows.get(isin).weightPct)/100})).sort((a,b)=>b.portfolioWeight-a.portfolioWeight)
  const companies = [left,right].map(item => new Map(aggregateCompanies([...item.rows.values()].map(row=>({...row,name:row.name?.trim()||row.isin})), COMPANY_IDENTITIES).map(row => [row.id,row])))
  const companyCommon = [...companies[0]].filter(([id]) => companies[1].has(id)).map(([id,row]) => ({
    id, name:row.name, leftWeight:row.weightPct, rightWeight:companies[1].get(id).weightPct,
    leftSecurities:row.securities, rightSecurities:companies[1].get(id).securities,
  }))
  const full=[left,right].every(completeList)
  pairs.push({left:left.line.label,right:right.line.label,common,companyCommon,full,overlap:full?companyCommon.reduce((s,r)=>s+Math.min(r.leftWeight,r.rightWeight),0):null,sources:[left.h,right.h].map(h=>({asOf:h.asOf,url:h.sourceUrl,basis:h.basis,checkedAt:h.checkedAt,sha256:h.sha256,method:h.method,index:h.index,indexId:h.indexId,scope:h.scope})),identifiedCoverage:[left,right].map(x=>[...x.rows.values()].reduce((s,r)=>s+r.weightPct,0))})
 }
 // Aggregate each security once across all compatible lines (never sum pairs).
 const totals=[]
 const scopes=[...new Set(eligible.filter(x=>x.h.basis!=='equity').map(x=>x.h.basis))]
 if(!scopes.length&&eligible.length)scopes.push('equity')
 for(const scope of scopes){
  const items=eligible.filter(x=>x.h.basis===scope||x.h.basis==='equity').sort((a,b)=>b.h.asOf.localeCompare(a.h.asOf))
  while(items.length){
   const latest=items[0].h.asOf,cluster=[]
   while(items.length&&(Date.parse(latest)-Date.parse(items[0].h.asOf))/86400000<=EXPOSURE_MAX_SPREAD_DAYS)cluster.push(items.shift())
   const securities=new Map()
   for(const {line,h,rows} of cluster)for(const [isin,row] of rows){
    const current=securities.get(isin)||{isin,name:row.name,weight:0,direct:0,indirect:0,contributions:[]}
    const weight=line.weight*row.weightPct/100
    current.weight+=weight;current[h.basis==='equity'?'direct':'indirect']+=weight
    current.contributions.push({asset:line.asset,label:line.label,weight,asOf:h.asOf,sourceUrl:h.sourceUrl})
    securities.set(isin,current)
   }
   const rows=[...securities.values()].sort((a,b)=>b.weight-a.weight)
   totals.push({scope,asOf:latest,oldest:cluster.at(-1).h.asOf,rows,coverage:rows.reduce((s,r)=>s+r.weight,0),portfolioWeight:cluster.reduce((s,x)=>s+x.line.weight,0),complete:cluster.every(completeList)})
  }
 }
 // Keep unidentifiable scopes visible, after scopes with usable positions.
 // Their zero identified weight must not hide another scope's real holdings.
 totals.sort((a,b)=>Number(b.rows.length>0)-Number(a.rows.length>0))
 return {pairs,unavailable,totals,qualification,incompatiblePairs}
}
