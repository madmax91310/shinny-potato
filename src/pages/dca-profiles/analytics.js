import { publishedExposure, exposureDisplay } from './exposure.js'
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
export function portfolioAnalytics(lines,refs,holdings,now=new Date()) {
 const shared=sharedPositions(lines,refs,now,holdings)
 const exposures=Object.fromEntries(['countries','sectors'].map(field=>[field,publishedExposure(lines,refs,field,now)]))
 return {...shared,groups:concentration(shared.totals),exposures}
}
export function compareExposures(before,after,field) {
 const a=before.exposures[field],b=after.exposures[field],ga=a.groups[0],gb=b.groups[0]
 if(!ga||!gb||ga.classification!==gb.classification||ga.compatibility!==gb.compatibility||Math.abs(Date.parse(ga.asOf)-Date.parse(gb.oldest))/86400000>45||Math.abs(Date.parse(gb.asOf)-Date.parse(ga.oldest))/86400000>45)return {compatible:false,rows:[]}
 const left=new Map(ga.rows.map(r=>[r.name,r.weight])),right=new Map(gb.rows.map(r=>[r.name,r.weight]))
 return {compatible:true,coverage:[exposureDisplay(a).coverage,exposureDisplay(b).coverage],rows:[...new Set([...left.keys(),...right.keys()])].map(name=>({name,before:left.get(name)||0,after:right.get(name)||0,delta:(right.get(name)||0)-(left.get(name)||0)})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))}
}
