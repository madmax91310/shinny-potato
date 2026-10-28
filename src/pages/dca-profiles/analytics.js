import { publishedExposure, exposureDisplay, EXPOSURE_MAX_SPREAD_DAYS } from './exposure.js'
import { sharedPositions } from './verification.js'

// Cash flows are analysed as a separate allocation, never as current holdings.
export function flowAllocation(lines) {
 const total=lines.reduce((sum,line)=>sum+(Number.isFinite(line.amount)&&line.amount>0?line.amount:0),0)
 return total>0?lines.filter(l=>l.amount>0).map(l=>({...l,weight:l.amount/total*100})):[]
}
export function allocationAfterContributions(lines,capital,months) {
 if(!Number.isFinite(capital)||capital<=0||!Number.isInteger(months)||months<1||months>120)throw Error('Indique un capital positif et une durée de 1 à 120 mois.')
 if(lines.some(l=>!Number.isFinite(l.amount)||l.amount<0||!Number.isFinite(l.weight)||l.weight<0)||Math.abs(lines.reduce((s,l)=>s+l.weight,0)-100)>.001)throw Error('Allocation ou versements invalides.')
 const monthly=lines.reduce((sum,line)=>sum+line.amount,0),total=capital+months*monthly
 return lines.map(l=>({...l,weight:100*(capital*l.weight/100+months*l.amount)/total}))
}
export function concentration(groups) {
 return groups.map(group=>({...group,top5:group.rows.slice(0,5).reduce((s,r)=>s+r.weight,0),top10:group.rows.slice(0,10).reduce((s,r)=>s+r.weight,0),identified:group.rows.length,complete:group.complete===true&&group.coverage>=99.5&&group.portfolioWeight>=99.5}))
}
export const concentrationGroupKey = group => JSON.stringify([group.scope,group.oldest,group.asOf])
export function selectConcentrationGroup(groups,key) {
 return groups.find(group=>concentrationGroupKey(group)===key) || [...groups].sort((a,b)=>Number(b.rows.length>0)-Number(a.rows.length>0)||b.coverage-a.coverage||concentrationGroupKey(a).localeCompare(concentrationGroupKey(b)))[0]
}
export function analysisView(profile) {
 const view=profile.analysisView
 return {mode:!profile.imageOnly&&['flows','future'].includes(view?.mode)?view.mode:'held',capital:view?.capital??'10000',months:view?.months??'12',groupKey:typeof view?.groupKey==='string'?view.groupKey:''}
}
export function analyzedLines(profile) {
 const view=analysisView(profile)
 return view.mode==='flows'?flowAllocation(profile.lines):view.mode==='future'?allocationAfterContributions(profile.lines,Number(view.capital),Number(view.months)):profile.lines
}
export function portfolioAnalytics(lines,refs,holdings,now=new Date()) {
 const shared=sharedPositions(lines,refs,now,holdings)
 const exposures=Object.fromEntries(['countries','sectors'].map(field=>[field,publishedExposure(lines,refs,field,now)]))
 return {...shared,groups:concentration(shared.totals),exposures}
}
export function compareExposures(before,after,field) {
 const a=before.exposures[field],b=after.exposures[field],ga=a.groups[0],gb=b.groups[0]
 // A published synthesis deliberately combines source labels. Its group name is
 // not a method certificate: compare the actual observation contracts instead.
 const contract=group=>{
  if(!group?.observations?.length)return null
  const methods=group.observations.map(o=>o.classification&&o.basis?JSON.stringify([o.classification,o.basis,o.method||o.classification]):null)
  return methods.every(method=>method&&method===methods[0])?methods[0]:null
 }
 const method=contract(ga)
 const dates=[ga?.oldest,ga?.asOf,gb?.oldest,gb?.asOf].map(date=>Date.parse(date))
 if(!ga||!gb||ga.classification!==gb.classification||!method||method!==contract(gb)||dates.some(date=>!Number.isFinite(date))||(Math.max(...dates)-Math.min(...dates))/86400000>EXPOSURE_MAX_SPREAD_DAYS)return {compatible:false,rows:[]}
 const left=new Map(ga.rows.map(r=>[r.name,r.weight])),right=new Map(gb.rows.map(r=>[r.name,r.weight]))
 return {compatible:true,coverage:[exposureDisplay(a).coverage,exposureDisplay(b).coverage],rows:[...new Set([...left.keys(),...right.keys()])].map(name=>({name,before:left.get(name)||0,after:right.get(name)||0,delta:(right.get(name)||0)-(left.get(name)||0)})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))}
}
