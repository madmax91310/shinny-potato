export function mergeIncidents(rows) {
  const incidents = new Map()
  for (const row of rows) {
    if (!row.id) throw new Error('Missing incident identity')
    const prior = incidents.get(row.id)
    if (!prior) { incidents.set(row.id, { ...row, reasons: [...new Set(row.reasons ?? [row.error])], sourceUrls: [...new Set([...(row.sourceUrls ?? []), row.sourceUrl].filter(Boolean))] }); continue }
    const reasons = [...new Set([...(prior.reasons ?? [prior.error]), ...(row.reasons ?? [row.error])])]
    const sourceUrls = [...new Set([...(prior.sourceUrls ?? []), prior.sourceUrl, ...(row.sourceUrls ?? []), row.sourceUrl].filter(Boolean))]
    incidents.set(row.id, { ...prior, reasons, sourceUrls, error: reasons.join(' | ') })
  }
  return [...incidents.values()]
}

export function mergeCollectionReport(previous, errors, successes) {
  const merged = mergeIncidents([...(previous.errors ?? []), ...errors])
  const failed = new Set(merged.map(row => row.id))
  return { ...previous, errors: merged,
    successes: [...new Map([...(previous.successes ?? []), ...successes]
      .filter(row => !failed.has(row.id)).map(row => [row.id, row])).values()] }
}
