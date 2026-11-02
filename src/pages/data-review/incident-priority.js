import {reviewCauseKey} from './review-causes.js'
const priority = { publication:0, conflict:1, anomaly:1, history:2, review:2, freshness:3, collection:4, overdue:5, checks:6, unobserved:7 }
export function prioritizeIncidents(rows) {
  return [...rows].sort((a,b) => (priority[a.kind] ?? 8) - (priority[b.kind] ?? 8)
    || new Set(b.tools ?? []).size - new Set(a.tools ?? []).size
    || String(a.firstSeenAt ?? '').localeCompare(String(b.firstSeenAt ?? ''))
    || String(a.id).localeCompare(String(b.id)))
}

export function groupIncidents(rows){
 const groups=new Map()
 for(const row of prioritizeIncidents(rows)){
  const key=reviewCauseKey(row)
  if(!groups.has(key))groups.set(key,{id:key,cause:row.cause,kind:row.kind,field:row.field,rows:[],tools:[]})
  const group=groups.get(key);group.rows.push(row);group.tools=[...new Set([...group.tools,...(row.tools??[])])]
 }
 return [...groups.values()]
}

// Merge the two known presentations only with an explicit matching full identity.
// Raw signals, their dates, routes and diagnostics remain attached unchanged.
export function incidentPresentations(rows) {
 const groups = new Map()
 for (const row of prioritizeIncidents(rows)) {
  const isin = row.kind === 'collection' && (String(row.id).match(/^field:instrument:([A-Z]{2}[A-Z0-9]{10}):completeHoldings$/)?.[1]
   ?? String(row.id).match(/^collection:[^:]+:dca-holdings:([A-Z]{2}[A-Z0-9]{10})$/)?.[1])
  const dimensions=['asOf','currency','scope','method','stage']
  const proven=isin&&dimensions.every(k=>typeof row[k]==='string'&&row[k].length>0)
  const key = proven ? JSON.stringify(['completeHoldings',isin,...dimensions.map(k=>row[k])]) : row.id
  if (!groups.has(key)) groups.set(key, {...row, signals: []})
  const item = groups.get(key)
  item.signals.push(row)
  item.tools = [...new Set(item.signals.flatMap(r => r.tools ?? []))]
  item.sourceUrls = [...new Set(item.signals.flatMap(r => r.sourceUrls ?? []))]
 }
 return [...groups.values()]
}
