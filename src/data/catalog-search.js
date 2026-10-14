const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
export function searchCatalog(records, query = '', type = 'all') {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return records.filter(record => (type === 'all' || record.type === type)
    && words.every(word => normalize([record.id, record.name, ...record.aliases].join(' ')).includes(word)))
    .sort((a, b) => (normalize(b.id) === normalize(query)) - (normalize(a.id) === normalize(query)) || a.name.localeCompare(b.name, 'fr'))
}
export function exportDataRecord(record) { return JSON.stringify({ schemaVersion: 1, ...record }, null, 2) }
