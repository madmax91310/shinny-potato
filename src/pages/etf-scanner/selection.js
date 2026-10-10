import { readiness } from './lib.js'

// An index is a search criterion, never a replacement for a fund's holdings.
// Keep exact benchmark names: ESG, ex-country and IMI variants are not aliases.
export function benchmarkChoices(items) {
  const groups = new Map()
  for (const item of items) {
    if (!item.index || !item.complete) continue
    const group = groups.get(item.index) ?? []
    group.push(item); groups.set(item.index, group)
  }
  return [...groups].map(([index, funds]) => ({ id: index, label: index, group: 'Indices suivis', badges: ['Compositions de fonds'], detail: `${funds.length} ETF avec composition complète disponible`, funds }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}
export function selectionItems(manifest, now, label, peaStatus) {
  return [...Object.entries(manifest.instruments), ...Object.entries(manifest.peaCoverage ?? {})].map(([isin, e]) => {
    const reason = readiness(e, manifest.policy, now), pea = peaStatus(isin) === true
    return { id: isin, isin, label: label(isin), index: e.index ?? '', search: e.index ?? '', complete: !reason,
      group: pea ? 'PEA' : 'Compositions de fonds', badges: [...(pea ? ['PEA'] : []), reason ? 'Indisponible' : 'Complète'],
      detail: reason ?? `${e.index || 'Indice non renseigné'} · ${e.asOf} · ${e.positionCount} positions` }
  })
}
