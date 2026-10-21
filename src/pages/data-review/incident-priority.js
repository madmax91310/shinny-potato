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
  // Same collector, field and cause only. Different source hosts or currencies
  // remain separate; changing a check date does not create another root cause.
  const cause=String(row.cause??'Cause non documentée').replace(/\b\d{4}-\d{2}-\d{2}(?:T[\d:.+Z-]+)?\b/g,'[date]')
  const key=JSON.stringify([row.workflow??'',row.kind,row.field,cause,row.currency??''])
  if(!groups.has(key))groups.set(key,{id:key,cause:row.cause,kind:row.kind,field:row.field,rows:[],tools:[]})
  const group=groups.get(key);group.rows.push(row);group.tools=[...new Set([...group.tools,...(row.tools??[])])]
 }
 return [...groups.values()]
}
