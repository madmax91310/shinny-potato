// Accounting evidence is explanatory. It never changes overlap admission,
// original weights, identity matching or the existing completeness thresholds.
const sum=values=>values.reduce((s,v)=>s+v,0)
const finite=value=>typeof value==='number'&&Number.isFinite(value)
const close=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<1e-7
const isin=value=>/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(value||'')
export function holdingsReconciliationDetails(h){
 const p=h?.navReconciliation
 if(!h?.complete||h.basis!=='fund'||!h.sourceUrl||!/^[a-f0-9]{64}$/.test(h.sha256||'')||!Array.isArray(h.rows)||!h.rows.length
  ||p?.schemaVersion!==1||p.normalizationApplied!==false||p.asOf!==h.asOf||typeof p.method!=='string'||!p.method)return null
 const selected=sum(h.rows.map(r=>r.weightPct)),classes=p.sourceWeightPctByType,excluded=p.excludedWeightPctByType
 if(!classes||!excluded||!Object.values(classes).every(finite)||!Object.values(excluded).every(finite)
  ||!close(selected,p.selectedWeightPct)||!close(sum(Object.values(classes)),p.publishedNetWeightPct)
  ||!close(selected+sum(Object.values(excluded)),p.publishedNetWeightPct)||p.publishedNetWeightPct<99||p.publishedNetWeightPct>101
  ||![p.sourceRowCount,p.selectedRowCount,p.excludedRowCount].every(n=>Number.isInteger(n)&&n>=0)
  ||p.selectedRowCount!==h.rows.length||p.sourceRowCount!==p.selectedRowCount+p.excludedRowCount)return null
 const unknown=h.rows.filter(r=>!isin(r.isin))
 if(!Array.isArray(p.unidentifiedPositions)||unknown.length!==p.unidentifiedPositions.length
  ||!unknown.every(r=>p.unidentifiedPositions.some(u=>u.name===r.name&&u.weightPct===r.weightPct)))return null
 if(p.qualifiedExcludedPositions!==undefined&&(!Array.isArray(p.qualifiedExcludedPositions)||!p.qualifiedExcludedPositions.every(q=>isin(q.isin)&&q.kind==='non-equity-money-market-fund'&&q.sourceUrl&&/^[a-f0-9]{64}$/.test(q.sha256||'')&&finite(q.weightPct)&&q.weightPct>=0&&q.sourceAssetClass in excluded)))return null
 return p
}
export const accountingWeight=value=>`${value.toLocaleString('fr-FR',{maximumFractionDigits:6})} %`
export const accountingClass=kind=>({Cash:'Liquidités','Money Market':'Supports monétaires','Cash Collateral and Margins':'Dépôts de garantie',FX:'Change',Futures:'Contrats à terme',Forwards:'Contrats à terme de change',Future:'Contrats à terme','FX Forward':'Contrats à terme de change','Mutual Fund':'Parts de fonds',Other:'Autres instruments'})[kind]||kind

// A rejected observation is a separate source diagnostic. It cannot re-date or
// replace the last admitted composition, and must never enter portfolio math.
export function rejectedPerimeterDetails(status,subjectIsin) {
 const d=status?.lastRejectedObservation,p=d?.navReconciliation
 if(d?.kind!=='unsupported-gross-net-perimeter'||d.financialDataQualified!==false||d.subjectIsin!==subjectIsin
  ||!d.sourceUrl||!/^[a-f0-9]{64}$/.test(d.sha256||'')||!Number.isFinite(Date.parse(d.checkedAt))
  ||!/^\d{4}-\d{2}-\d{2}$/.test(d.asOf||'')||!Number.isFinite(Date.parse(d.asOf))||new Date(d.asOf).toISOString().slice(0,10)!==d.asOf
  ||Date.parse(d.asOf)>Date.parse(d.checkedAt)||p?.schemaVersion!==1||p.asOf!==d.asOf||p.normalizationApplied!==false
  ||!finite(p.selectedWeightPct)||p.selectedWeightPct<=100.5||!finite(p.publishedNetWeightPct)||p.publishedNetWeightPct<99||p.publishedNetWeightPct>101
  ||!p.sourceWeightPctByType||!p.excludedWeightPctByType||!Object.values(p.sourceWeightPctByType).every(finite)||!Object.values(p.excludedWeightPctByType).every(finite)
  ||!close(sum(Object.values(p.sourceWeightPctByType)),p.publishedNetWeightPct)||!close(p.selectedWeightPct+sum(Object.values(p.excludedWeightPctByType)),p.publishedNetWeightPct))return null
 return d
}
