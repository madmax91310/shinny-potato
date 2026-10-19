const priority = { publication:0, conflict:1, anomaly:1, history:2, review:2, freshness:3, collection:4, overdue:5, checks:6, unobserved:7 }
export function prioritizeIncidents(rows) {
  return [...rows].sort((a,b) => (priority[a.kind] ?? 8) - (priority[b.kind] ?? 8)
    || new Set(b.tools ?? []).size - new Set(a.tools ?? []).size
    || String(a.firstSeenAt ?? '').localeCompare(String(b.firstSeenAt ?? ''))
    || String(a.id).localeCompare(String(b.id)))
}
