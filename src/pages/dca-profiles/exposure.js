import { frenchCharacteristic } from '../../data/french-characteristics.js'
export const EXPOSURE_MAX_AGE_DAYS=93
export const EXPOSURE_MAX_SPREAD_DAYS=45
const day=86400000
const aliases={'korea':'Corée du Sud','korea, republic of':'Corée du Sud','republic of korea':'Corée du Sud','etats-unis':'États-Unis','communication':'Communication','unassigned':'Non classé','basic materials':'Matériaux'}
const nameOf = name => aliases[name.toLowerCase()] || frenchCharacteristic(name)
const neutral={gold:'Or',silver:'Argent',btc:'Bitcoin',eth:'Ethereum'}
function stamp(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return NaN
 const n=Date.parse(date+'T00:00:00Z')
 return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===date?n:NaN
}
// Approximation from recent compatible observations; each source keeps its actual date.
// This is intentionally local to DCA, not a relaxation of historical comparison rules.
export function dcaExposure(lines,references,field,now=new Date(),{synthesis=false}={}){
 const groups=new Map(),neutralRows=[],excluded=[]
 const today=Date.parse(new Date(now).toISOString().slice(0,10)+'T00:00:00Z')
 for(const l of lines.filter(l=>l.weight>0)){
  const outside=neutral[l.asset]||(l.isin===references[l.asset]?.isin&&references[l.asset]?.outsideClassification)
  if(outside){neutralRows.push({name:outside,weight:l.weight});continue}
  const r=references[l.asset],o=r?.[field]
  let reason=!l.isin?'Support non confirmé':r?.isin&&l.isin!==r.isin?'Support différent de la référence':!o?'Ventilation absente':null
  if(!reason){
   const date=stamp(o.asOf),age=(today-date)/day
   if(!Number.isFinite(date)||age<0||age>EXPOSURE_MAX_AGE_DAYS)reason='Observation trop ancienne ou date invalide'
   else if(!o.sourceUrl||!['fund','index','equity'].includes(o.basis)||!o.compatibility||!o.rows?.length)reason='Méthode ou source non qualifiée'
   else if(o.rows.some(row=>Number.isFinite(row.weightPct)&&(row.weightPct<0||row.weightPct>100)))reason='Poids signés incompatibles avec un donut'
   else if(o.rows.some(row=>!row.name||!Number.isFinite(row.weightPct)||row.weightPct<0||row.weightPct>100)||new Set(o.rows.map(row=>row.name.toLowerCase())).size!==o.rows.length)reason='Ventilation invalide'
  }
  const sum=!reason?o.rows.reduce((s,row)=>s+row.weightPct,0):0
  if(!reason&&(sum<=0||sum>100.5))reason='Total de ventilation invalide'
  if(reason){excluded.push({asset:l.asset,label:l.label,weight:l.weight,reason});continue}
  // A published overview combines issuer labels, not supposedly identical taxonomies.
  // Strict comparisons retain their original contracts. Dates and all validity checks still apply.
  const key=synthesis?`published-${field}`:o.compatibility
  if(!groups.has(key))groups.set(key,[])
  groups.get(key).push({line:l,o,sum})
 }
 const result=[]
 for(const [classification,items] of groups){
  // Cluster from the freshest observation; do not chain dates across a long interval.
  items.sort((a,b)=>b.o.asOf.localeCompare(a.o.asOf)||a.line.asset.localeCompare(b.line.asset))
  while(items.length){
   const latest=items[0].o.asOf,cluster=[]
   while(items.length&&(stamp(latest)-stamp(items[0].o.asOf))/day<=EXPOSURE_MAX_SPREAD_DAYS)cluster.push(items.shift())
   const rows=new Map(),contributions=new Map(),observations=[];let coverage=0
   for(const {line:l,o,sum} of cluster){
    const scale=sum>100?100/sum:1 // Only source rounding excess, never fill a short table.
    coverage+=l.weight*Math.min(sum,100)/100
    for(const row of o.rows){
     const name=nameOf(row.label||row.name),weight=l.weight*row.weightPct*scale/100
     rows.set(name,(rows.get(name)||0)+weight)
     if(!contributions.has(name))contributions.set(name,[])
     contributions.get(name).push({asset:l.asset,label:l.label,weight,withinAsset:row.weightPct*scale})
    }
    observations.push({asset:l.asset,label:l.label,asOf:o.asOf,basis:o.basis,sourceUrl:o.sourceUrl,method:o.method||o.compatibility,classification:o.compatibility,weight:l.weight})
   }
   result.push({asOf:latest,oldest:cluster.at(-1).o.asOf,basis:[...new Set(observations.map(o=>o.basis))].join('+'),classification,indicative:synthesis,coverage,observations,sources:[...new Set(observations.map(o=>o.sourceUrl))],rows:[...rows].map(([name,weight])=>({name,weight,contributions:contributions.get(name).sort((a,b)=>b.weight-a.weight)})).filter(r=>r.weight>0).sort((a,b)=>b.weight-a.weight)})
  }
 }
 result.sort((a,b)=>b.coverage-a.coverage||a.classification.localeCompare(b.classification)||b.asOf.localeCompare(a.asOf))
 return {groups:result,coverage:result.reduce((s,g)=>s+g.coverage,0),neutralRows,neutralWeight:neutralRows.reduce((s,r)=>s+r.weight,0),excluded}
}

// Coverage shown to the user must describe the same group as the donut.
export function exposureDisplay(exposure){
 const group=exposure.groups[0]
 const omitted=[...exposure.excluded,...exposure.groups.slice(1).flatMap(g=>g.observations.map(o=>({
  ...o,reason:g.classification===group?.classification?'Dates trop éloignées pour ce graphique':'Méthode géographique ou sectorielle différente'
 })))]
 return {coverage:group?.coverage||0,missing:Math.max(0,100-(group?.coverage||0)-exposure.neutralWeight),omitted}
}

// Portfolio overview only: published country/sector labels, with source methods retained.
// This does not assert GICS/ICB or country-of-risk/registration equivalence.
export function publishedExposure(lines,references,field,now=new Date()){
 return dcaExposure(lines,references,field,now,{synthesis:true})
}
