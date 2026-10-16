const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
export const monthIndex = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
export function monthAt(index) { return `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}` }
export function validateSeries(asset) {
  if (!asset?.points?.length || !asset.currency || !asset.basis) throw new Error('Historique non qualifié.')
  const seen = new Set()
  asset.points.forEach((p, i) => {
    if (!MONTH.test(p.date) || !Number.isFinite(p.price) || p.price <= 0 || seen.has(p.date)
      || (i && monthIndex(p.date) !== monthIndex(asset.points[i - 1].date) + 1)) throw new Error(`Historique discontinu ou invalide : ${asset.label}.`)
    seen.add(p.date)
  })
}
export function commonCoverage(assets) {
  if (assets.length < 2 || assets.length > 6) throw new Error('Choisis de deux à six actifs différents.')
  if (new Set(assets.map(a => a.id)).size !== assets.length) throw new Error('Chaque actif doit apparaître une seule fois.')
  assets.forEach(validateSeries)
  if (assets.some(a => a.currency !== assets[0].currency)) throw new Error('Choisis des historiques dans une même devise. La conversion mensuelle reste à raccorder.')
  if (assets.some(a => a.basis !== assets[0].basis)) throw new Error('Les conventions de rendement doivent être identiques pour ce classement.')
  if (['monthly-average', 'price-index', 'futures-price'].includes(assets[0].basis)) throw new Error('Cette convention ne permet pas encore un classement homogène avec dividendes réinvestis.')
  const start = assets.map(a => a.points[0].date).sort().at(-1)
  const end = assets.map(a => a.points.at(-1).date).sort()[0]
  if (start >= end) throw new Error('Les actifs ne partagent pas de période complète.')
  const years = []
  for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year++) {
    if (`${year - 1}-12` >= start && `${year}-12` <= end) years.push(year)
  }
  return { start, end, years, currency: assets[0].currency, basis: assets[0].basis }
}
export function periodReturn(asset, start, end, annualized = false) {
  if (!MONTH.test(start) || !MONTH.test(end) || start >= end) throw new Error('La date de fin doit suivre la date de début.')
  const first = asset.points.find(p => p.date === start), last = asset.points.find(p => p.date === end)
  if (!first || !last) throw new Error(`Bornes absentes de l’historique de ${asset.label}.`)
  const ratio = last.price / first.price
  return (Math.pow(ratio, annualized ? 12 / (monthIndex(end) - monthIndex(start)) : 1) - 1) * 100
}
export function rankRows(rows) {
  const sorted = rows.map(row => ({ ...row })).sort((a, b) => b.value - a.value || a.order - b.order)
  sorted.forEach((row, i) => { row.rank = i && Math.abs(row.value - sorted[i - 1].value) < 1e-8 ? sorted[i - 1].rank : i + 1 })
  return sorted
}
export function rankPeriod(assets, start, end, annualized = false) {
  const coverage = commonCoverage(assets)
  if (start < coverage.start || end > coverage.end) throw new Error('La période dépasse l’historique commun disponible.')
  return rankRows(assets.map((a, order) => ({ id: a.id, label: a.shortLabel ?? a.label, order, value: periodReturn(a, start, end, annualized) })))
}
export function buildRanking(assets, options) {
  const coverage = commonCoverage(assets)
  const { mode, startYear, endYear, start, end, annualized = false } = options
  let columns
  if (mode === 'period') {
    columns = [{ label: 'Sur la période', start, end, rows: rankPeriod(assets, start, end, annualized) }]
  } else {
    if (!['year', 'years'].includes(mode) || !Number.isInteger(startYear) || (mode === 'years' && (!Number.isInteger(endYear) || startYear > endYear))) throw new Error('Choisis des années valides.')
    const years = mode === 'year' ? [startYear] : Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
    if (years.length > 10) throw new Error('L’image peut présenter au maximum dix années à la fois.')
    if (years.some(year => !coverage.years.includes(year))) throw new Error('Ces années ne sont pas entièrement couvertes par tous les actifs.')
    columns = years.map(year => ({ label: String(year), start: `${year - 1}-12`, end: `${year}-12`, rows: rankPeriod(assets, `${year - 1}-12`, `${year}-12`) }))
  }
  return { coverage, columns, assets, mode, annualized: mode === 'period' && annualized,
    start: columns[0].start, end: columns.at(-1).end }
}
export function rollingRegularity(assets, months) {
  if (![12, 36, 60, 120].includes(months)) throw new Error('Durée glissante invalide.')
  const coverage = commonCoverage(assets)
  const count = monthIndex(coverage.end) - monthIndex(coverage.start) - months + 1
  if (count < 2) return null
  const stats = assets.map(a => ({ id: a.id, label: a.shortLabel ?? a.label, wins: 0, topTwo: 0, last: 0 }))
  // Build exact monthly lookups once; no interpolation or extrapolation.
  const maps = assets.map(a => new Map(a.points.map(p => [p.date, p.price])))
  for (let i = 0; i < count; i++) {
    const start = monthAt(monthIndex(coverage.start) + i), end = monthAt(monthIndex(start) + months)
    const rows = rankRows(assets.map((a, order) => ({ id: a.id, order, value: (maps[order].get(end) / maps[order].get(start) - 1) * 100 })))
    const min = Math.min(...rows.map(r => r.value))
    for (const row of rows) {
      const s = stats.find(s => s.id === row.id)
      if (row.rank === 1) s.wins++
      if (row.rank <= 2) s.topTwo++
      if (Math.abs(row.value - min) < 1e-8) s.last++
    }
  }
  return { count, months, start: coverage.start, end: coverage.end, stats }
}
export const formatPercent = value => `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`
export function basisLabel(basis) {
  return ({ adjusted: 'Cours ajustés · revenus réinvestis', 'index-net': 'Indices · dividendes nets réinvestis', 'index-gross': 'Indices · dividendes bruts réinvestis', 'spot-close': 'Cours de clôture' })[basis] ?? basis
}
export function buildTweet(result, title, regularity) {
  const { columns, coverage } = result
  const intro = result.mode === 'period' ? `Du ${result.start} au ${result.end}` : columns.length === 1 ? `En ${columns[0].label}` : `De ${columns[0].label} à ${columns.at(-1).label}`
  const lines = columns.length === 1 ? columns[0].rows.map(r => `${r.rank}. ${r.label} : ${formatPercent(r.value)}`)
    : columns.map(c => `${c.label} : ${c.rows.filter(r => r.rank === 1).map(r => `${r.label} (${formatPercent(r.value)})`).join(' / ')}`)
  const regularityText = regularity ? `\n\nSur ${regularity.count} périodes glissantes de ${regularity.months / 12} an${regularity.months > 12 ? 's' : ''}, entre ${regularity.start} et ${regularity.end} :\n${regularity.stats.map(s => `${s.label} : premier dans ${(100 * s.wins / regularity.count).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % des périodes`).join('\n')}\nPériodes mensuelles qui se chevauchent ; victoires partagées en cas d’égalité. Ce ne sont pas des probabilités futures.` : ''
  const fundNote = result.assets.some(a => a.isin) ? '\nPerformances des produits sélectionnés, frais des fonds inclus ; hors frais du courtier et fiscalité.' : '\nHors frais et fiscalité.'
  return `📊 ${title}\n\n${intro} · ${coverage.currency}\n${basisLabel(coverage.basis)}\n${result.annualized ? 'Performance annualisée' : result.mode === 'period' ? 'Performance cumulée' : 'Performances par année civile'}\n\n${lines.join('\n')}${fundNote}${regularityText}\n\nLes performances passées ne préjugent pas des performances futures.\nPas un conseil financier.`
}
