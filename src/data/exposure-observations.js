// Observations éditoriales calculées : aucune pondération recopiée dans les tweets.
// Le champ, sa date et son périmètre restent indissociables.
const pct = n => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const dated = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && Number.isFinite(Date.parse(value))
const date = value => value.split('-').reverse().join('/')
const excluded = /cash|derivative|liquidit|^autres$|^other/i

export function holdingConcentration(record) {
  const observation = record?.holdings
  if (!dated(observation?.asOf) || !['fund', 'index', 'tracked-index'].includes(observation?.basis)) return null
  const rows = observation.rows
  if (!Array.isArray(rows) || rows.some(r => !Number.isFinite(r.weightPct))) return null
  const names = rows.filter(r => r.weightPct > 0 && !excluded.test(r.name ?? ''))
  if (names.length < 3 || names.some(r => !r.name || r.weightPct > 100) || new Set(names.map(r => r.name)).size !== names.length) return null
  const top = [...names].sort((a, b) => b.weightPct - a.weightPct).slice(0, 3)
  const weight = top.reduce((sum, r) => sum + r.weightPct, 0)
  if (weight > 100) return null
  return { weight, asOf: observation.asOf, basis: observation.basis === 'fund' ? 'fund' : 'index', top }
}

export function concentrationCopy(record) {
  const c = holdingConcentration(record)
  if (!c || c.weight < 20) return ''
  const scope = c.basis === 'index' ? 'de l’indice suivi' : 'du fonds'
  return `Au ${date(c.asOf)}, les trois premières positions publiées ${scope} pèsent ensemble ${pct(c.weight)}. Leur évolution peut donc compter sensiblement dans le résultat.`
}

// Une comparaison de poids n'est produite que sur une même photographie et
// un même périmètre. Aucune déduction de diversification à partir du seul nombre de titres.
export function comparisonConcentration(funds, records) {
  if (funds.length !== 2) return ''
  const [a, b] = funds.map(f => holdingConcentration(records[f.isin]))
  if (!a || !b || a.asOf !== b.asOf || a.basis !== b.basis || Math.abs(a.weight - b.weight) < 1) return ''
  const scope = a.basis === 'index' ? 'dans les indices suivis' : 'dans les fonds'
  return `Au ${date(a.asOf)}, les trois premières positions publiées pèsent ${pct(a.weight)} pour ${funds[0].nom} et ${pct(b.weight)} pour ${funds[1].nom}, ${scope}. Le nombre de lignes ne suffit donc pas à comparer leur concentration.`
}
