// NAV weights stay in their source scale. ISIN identifies a security, not a company.
export const percent = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const DAY = 86400000
function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
  const stamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp : NaN
}
export function readiness(entry, policy, now = new Date()) {
  if (!entry?.file || entry.basis !== 'fund' || entry.scope !== 'all-published-positions') return 'Composition complète indisponible'
  const today = day(now.toISOString().slice(0, 10))
  for (const [field, maximum] of [['asOf', policy?.maxSnapshotAgeDays], ['checkedAt', policy?.maxCheckAgeDays]]) {
    const age = (today - day(entry[field])) / DAY
    if (!Number.isFinite(age) || !Number.isFinite(maximum) || age < 0 || age > maximum) return 'Données trop anciennes ou dates invalides'
  }
  return null
}
export function validateAllocation(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 12) throw new Error('Choisis entre 1 et 12 ETF.')
  if (new Set(lines.map(l => l.isin)).size !== lines.length) throw new Error('Un ETF apparaît plusieurs fois : regroupe ses poids.')
  if (lines.some(l => !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(l.isin) || !Number.isFinite(l.weight) || l.weight <= 0 || l.weight > 100)) throw new Error('Chaque ETF doit avoir un poids supérieur à 0 et inférieur ou égal à 100 %.')
  const total = lines.reduce((s, l) => s + l.weight, 0)
  if (Math.abs(total - 100) > 0.000001) throw new Error(`La répartition fait ${percent(total)}. Ajuste les poids pour arriver à 100 %.`)
}
export function validateSnapshot(snapshot, isin, entry) {
  if (snapshot?.schemaVersion !== 1 || snapshot.isin !== isin || snapshot.complete !== true || snapshot.basis !== 'fund' || snapshot.scope !== 'all-published-positions' || snapshot.asOf !== entry.asOf || (entry.sha256 && snapshot.sha256 !== entry.sha256) || !Array.isArray(snapshot.rows) || !snapshot.rows.length || snapshot.rows.length !== entry.positionCount) throw new Error('Composition incohérente avec le manifeste.')
  if (snapshot.rows.some(r => typeof r.name !== 'string' || !Number.isFinite(r.weightPct) || Math.abs(r.weightPct) > 100 || (r.assetClass === 'Equity' && r.weightPct < 0) || typeof r.assetClass !== 'string')) throw new Error('Une position contient un poids ou une identité invalide.')
  const sum = snapshot.rows.reduce((s, r) => s + r.weightPct, 0)
  if (Math.abs(sum - snapshot.portfolioWeightPct) > 0.0001 || Math.abs(sum - 100) > 1) throw new Error('La somme des poids publiés est incohérente.')
  return snapshot
}
export function equityMap(snapshot) {
  const securities = new Map()
  for (const row of snapshot.rows) {
    if (row.assetClass !== 'Equity' || !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(row.isin ?? '') || row.weightPct <= 0) continue
    const previous = securities.get(row.isin)
    if (previous) previous.weightPct += row.weightPct
    else securities.set(row.isin, { ...row })
  }
  return securities
}
export function pairOverlap(a, b) {
  const left = equityMap(a), right = equityMap(b)
  const shared = [...left.values()].filter(row => right.has(row.isin))
  return { weight: shared.reduce((s, row) => s + Math.min(row.weightPct, right.get(row.isin).weightPct), 0), count: shared.length,
    rows: shared.map(row => ({ isin: row.isin, name: row.name, a: row.weightPct, b: right.get(row.isin).weightPct })).sort((x, y) => Math.min(y.a, y.b) - Math.min(x.a, x.b)) }
}
function breakdown(map) { return [...map.entries()].map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight) }
export function analyze(lines, snapshots, manifest, now = new Date()) {
  validateAllocation(lines)
  const securities = new Map(), countries = new Map(), sectors = new Map(), excluded = [], sources = []
  let analyzedWeight = 0, equityWeight = 0, unidentifiedWeight = 0, nonEquityWeight = 0
  for (const line of lines) {
    const entry = manifest.instruments?.[line.isin] ?? manifest.peaCoverage?.[line.isin]
    const reason = readiness(entry, manifest.policy, now)
    if (reason || !snapshots[line.isin]) { excluded.push({ ...line, reason: reason ?? 'Échec du chargement de la composition' }); continue }
    const snapshot = validateSnapshot(snapshots[line.isin], line.isin, entry)
    analyzedWeight += line.weight
    sources.push({ isin: line.isin, name: entry.name, asOf: entry.asOf, checkedAt: entry.checkedAt, sourceUrl: snapshot.sourceUrl, hash: entry.sha256, fileHash: entry.fileSha256 })
    for (const row of snapshot.rows) {
      const weight = line.weight / 100 * row.weightPct
      if (row.assetClass !== 'Equity') { nonEquityWeight += weight; continue }
      equityWeight += weight
      countries.set(row.country || 'Non renseigné', (countries.get(row.country || 'Non renseigné') ?? 0) + weight)
      sectors.set(row.sector || 'Non renseigné', (sectors.get(row.sector || 'Non renseigné') ?? 0) + weight)
      if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(row.isin ?? '')) { unidentifiedWeight += weight; continue }
      if (weight <= 0) continue
      let security = securities.get(row.isin)
      if (!security) { security = { isin: row.isin, name: row.name, weight: 0, contributions: new Map() }; securities.set(row.isin, security) }
      security.weight += weight
      security.contributions.set(line.isin, (security.contributions.get(line.isin) ?? 0) + weight)
    }
  }
  if (!sources.length) throw new Error('Aucune composition complète et récente n’est disponible pour cette répartition.')
  const positions = [...securities.values()].sort((a, b) => b.weight - a.weight).map(r => ({ ...r, contributions: [...r.contributions].map(([isin, weight]) => ({ isin, weight })) }))
  if (!positions.length) throw new Error('Aucun titre action identifiable dans les compositions analysées.')
  const pairs = []
  for (let i = 0; i < sources.length; i++) for (let j = i + 1; j < sources.length; j++) {
    const a = sources[i].isin, b = sources[j].isin
    pairs.push({ a, b, ...pairOverlap(snapshots[a], snapshots[b]) })
  }
  const shared = positions.filter(r => r.contributions.length > 1)
  return { positions, countries: breakdown(countries), sectors: breakdown(sectors), pairs, sources, excluded,
    analyzedWeight, equityWeight, unidentifiedWeight, nonEquityWeight, identifiedWeight: positions.reduce((s, r) => s + r.weight, 0),
    top10: positions.slice(0, 10).reduce((s, r) => s + r.weight, 0), sharedCount: shared.length,
    sharedWeight: shared.reduce((s, r) => s + r.weight, 0), complete: excluded.length === 0, generatedAt: now.toISOString() }
}
export function compare(a, b) {
  if (!a.complete || !b.complete) return null
  return { top10: b.top10 - a.top10, sharedWeight: b.sharedWeight - a.sharedWeight, count: b.positions.length - a.positions.length }
}
export function buildTweet(a, b, linesA, linesB, label) {
  const result = b ?? a, lines = b ? linesB : linesA
  const name = isin => label(isin)
  const allocation = lines.map(l => `${percent(l.weight)} ${name(l.isin)}`).join('\n')
  const top = result.positions[0]
  const delta = b && compare(a, b)
  const dates = [...new Set(result.sources.map(s => s.asOf))].sort()
  return `Plusieurs ETF peuvent détenir les mêmes titres. J’ai regardé ce que cette répartition contient réellement 👇\n\n${allocation}\n\n${result.positions.length.toLocaleString('fr-FR')} titres actions identifiés\nLes 10 principales lignes pèsent ${percent(result.top10)} du portefeuille.\n${top.name} arrive en tête à ${percent(top.weight)}.\n${result.sharedCount.toLocaleString('fr-FR')} titres sont présents dans plusieurs ETF, soit ${percent(result.sharedWeight)} du portefeuille.${delta ? `\n\nEn passant à cette répartition, le poids des 10 premières lignes passe de ${percent(a.top10)} à ${percent(b.top10)}.` : ''}\n\n${result.complete ? '' : `Analyse partielle : ${percent(result.analyzedWeight)} du portefeuille couvert.\n`}Compositions des fonds au ${dates.join(' / ')}. Rapprochement par ISIN ; classes d’actions distinctes conservées. Les liquidités et dérivés sont hors calcul des doublons.`
}
