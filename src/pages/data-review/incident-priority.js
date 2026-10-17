const priority = { publication:0, conflict:1, freshness:2, collection:3, overdue:4, checks:5, unobserved:6 }
export function prioritizeIncidents(rows) {
  return [...rows].sort((a,b) => (priority[a.kind] ?? 7) - (priority[b.kind] ?? 7)
    || new Set(b.tools ?? []).size - new Set(a.tools ?? []).size
    || String(a.firstSeenAt ?? '').localeCompare(String(b.firstSeenAt ?? ''))
    || String(a.id).localeCompare(String(b.id)))
}
