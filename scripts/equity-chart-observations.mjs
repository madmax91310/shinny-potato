// Chart projection only: retain the issuer's original NAV observations elsewhere.
export function equityChartObservations(record, now = new Date()) {
 const facts=record?.compositionFacts, total=record?.rows?.reduce((s,r)=>s+r.weightPct,0)
 const age=(Date.parse(now.toISOString().slice(0,10))-Date.parse(record?.asOf))/86400000
 if(!record?.complete||record.basis!=='fund'||!record.sourceUrl||!facts||facts.asOf!==record.asOf||facts.method!=='same-snapshot-equity-country-of-risk-and-sector'||age<0||age>93||!Number.isFinite(age)||!(total>0&&total<=100.5))return null
 const result={}
 for(const field of ['countries','sectors']){
  const o=facts[field]
  if(o?.asOf!==record.asOf||!o.rows?.length||o.rows.some(r=>!r.name||!Number.isFinite(r.weightPct)||r.weightPct<0)||Math.abs(o.rows.reduce((s,r)=>s+r.weightPct,0)-total)>.001)return null
  result[field]={asOf:record.asOf,basis:'fund',sourceUrl:record.sourceUrl,compatibility:`equity-holdings-${field}`,method:'Same dated physical equity holdings only; cash and derivatives excluded; percentage of equity sleeve',rows:o.rows.filter(r=>r.weightPct>0).map(r=>({...r,weightPct:r.weightPct/total*100}))}
 }
 result.equitySleeve={asOf:record.asOf,sourceUrl:record.sourceUrl,weightPct:Math.min(total,100),method:'Sum of the same dated physical equity positions; cash and derivatives excluded'}
 return result
}
