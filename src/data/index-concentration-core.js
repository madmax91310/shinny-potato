// Shared by the build projection, UI and tests. Never infer issuers from names.
export function aggregateCompanies(rows, identities = {}) {
  const issuers = new Map()
  for (const row of rows ?? []) {
    if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(row.isin ?? '') || !row.name?.trim() ||
        !Number.isFinite(row.weightPct) || row.weightPct < 0 || row.weightPct > 100) {
      throw new Error('Identifiant, doublon ou poids de titre incohérent')
    }
    const identity = identities[row.isin]
    const id = identity?.issuerId ?? row.isin
    const company = issuers.get(id) ?? { id, name: identity?.name ?? row.name, weightPct: 0, securities: [] }
    company.weightPct += row.weightPct
    if (!company.securities.includes(row.isin)) company.securities.push(row.isin)
    issuers.set(id, company)
  }
  return [...issuers.values()].sort((a, b) => b.weightPct - a.weightPct || a.id.localeCompare(b.id))
}

export function calculateConcentration(record, identities = {}) {
  if (!record) return { available: false, reason: 'Aucune composition exploitable pour cet indice.' }
  try {
    if (!record.asOf || !record.sourceUrl || !record.checkedAt || !/^[a-f0-9]{64}$/.test(record.sha256 ?? '')) throw new Error('Provenance ou dates incomplètes')
    const companies = aggregateCompanies(record.rows, identities)
    const total = companies.reduce((n, row) => n + row.weightPct, 0)
    if (total > 100.00001 || total <= 0) throw new Error('Somme des poids incohérente')
    if (!record.complete && !record.topCompaniesCertified) throw new Error('Les principales lignes ne permettent pas de certifier dix entreprises après regroupement.')
    if (record.complete && total < 95) throw new Error('Composition trop incomplète pour établir le top 10')
    if (companies.length < 10) throw new Error('Moins de dix entreprises identifiées après regroupement des catégories d’actions.')
    const top = companies.slice(0, 10)
    const topWeight = top.reduce((n, row) => n + row.weightPct, 0)
    return { available: true, top, topWeight, otherWeight: 100 - topWeight, identifiedWeight: total }
  } catch (error) { return { available: false, reason: error.message } }
}

// Largest-remainder rounding: the eleven labels add to exactly 100.00%.
// Geometry and top-ten sum always use unrounded weights.
export function roundedComposition(concentration) {
  const weights = concentration.top.map(row => row.weightPct)
  const hundredths = weights.map(weight => Math.floor(weight * 100 + 1e-9))
  const target = Math.round(concentration.topWeight * 100)
  const order = weights.map((weight, i) => ({ i, remainder: weight * 100 - hundredths[i] })).sort((a, b) => b.remainder - a.remainder || a.i - b.i)
  const missing = target - hundredths.reduce((a, b) => a + b, 0)
  for (let n = 0; n < missing; n++) hundredths[order[n % order.length].i]++
  return [...hundredths, 10000 - target].map(value => value / 100)
}

// Failed refreshes retain a complete, previously qualified render model and date.
export function retainQualifiedComposition(candidate, previous) {
  if (candidate?.available) return candidate
  if (!previous?.available) return candidate
  return { ...previous, retained: true, refresh: { ...previous.refresh, status: 'failed', error: candidate.reason } }
}
