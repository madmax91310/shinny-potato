// Financial observation dates take precedence over retrieval and registry order.
export function mergeDatedRecords(...registries) {
  const result = {}
  const stamp = block => [block?.asOf ?? block?.effectiveAt ?? '', block?.checkedAt ?? block?.source?.checkedAt ?? ''].join('|')
  for (const registry of registries) for (const [id, record] of Object.entries(registry ?? {})) {
    if (!record) continue
    const prior = result[id]
    result[id] = { ...prior, ...record }
    if (!prior) continue
    for (const field of ['countries','sectors','holdings','aum','performance','characteristics']) {
      if (prior[field] && (!record[field] || stamp(prior[field]) > stamp(record[field]))) result[id][field] = { ...prior[field], sourceUrl: prior[field].sourceUrl ?? prior.sourceUrl }
    }
  }
  return result
}
