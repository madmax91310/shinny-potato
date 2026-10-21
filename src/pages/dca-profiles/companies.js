import { aggregateCompanies } from '../../data/index-concentration-core.js'
import identities from '../../data/index-company-identities.json' with {type:'json'}
import { portfolioAnalytics } from './analytics.js'

export function portfolioCompanies(lines, references, holdings, now=new Date()) {
 const equityLines=lines.filter(l=>!references[l.asset]?.outsideClassification)
 const groups=portfolioAnalytics(equityLines,references,holdings,now).groups.sort((a,b)=>b.coverage-a.coverage)
 const group=groups[0]
 if(!group)return {rows:[],complete:false,coverage:0,topWeight:0}
 const rows=aggregateCompanies(group.rows.map(r=>({isin:r.isin,name:r.name,weightPct:r.weight})),identities)
 const top=rows.slice(0,10)
 return {rows:top,complete:group.complete,coverage:group.coverage,topWeight:top.reduce((s,r)=>s+r.weightPct,0)}
}
