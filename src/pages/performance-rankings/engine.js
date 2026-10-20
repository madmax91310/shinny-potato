const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
export const monthIndex = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
export function monthAt(index) { return `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}` }
export function validateSeries(asset) {
  if (asset?.frequency === 'annual') {
    if (!asset.currency || !Object.keys(asset.years ?? {}).length || Object.entries(asset.years).some(([year, value]) => !/^\d{4}$/.test(year) || !Number.isFinite(value) || value <= -100)) throw new Error('Calendrier annuel non qualifié.')
    return
  }
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
  if (assets.some(a => a.currency !== assets[0].currency)) throw new Error('Choisis une même devise, ou active la conversion EUR/USD.')
  const annual = assets[0].frequency === 'annual'
  if (assets.some(a => (a.frequency === 'annual') !== annual)) throw new Error('Les calendriers NAV annuels et les cotations mensuelles se comparent dans des sélections distinctes.')
  const variants = new Set(assets.flatMap(a => a.indexVariants ?? (a.basis.startsWith('index-') ? [a.basis] : [])))
  if (variants.has('index-net') && variants.has('index-gross')) throw new Error('Les conventions de rendement des indices doivent être identiques : net ou brut.')
  if (annual && assets.some(a => a.basis !== assets[0].basis)) throw new Error('Les conventions des calendriers annuels doivent être identiques.')
  if (['monthly-average', 'price-index', 'futures-price'].includes(assets[0].basis)) throw new Error('Cette convention ne permet pas encore un classement homogène avec dividendes réinvestis.')
  if (assets.some(a => ['monthly-average', 'price-index', 'futures-price'].includes(a.basis))) throw new Error('Cette convention ne permet pas un classement homogène.')
  if (annual) {
    const years = Object.keys(assets[0].years).map(Number).filter(y => assets.every(a => Number.isFinite(a.years[y]))).sort((a, b) => a - b)
    if (!years.length) throw new Error('Aucune année civile complète commune.')
    return { start: `${years[0] - 1}-12`, end: `${years.at(-1)}-12`, years, currency: assets[0].currency, basis: assets[0].basis, frequency: 'annual' }
  }
  const start = assets.map(a => a.points[0].date).sort().at(-1)
  const end = assets.map(a => a.points.at(-1).date).sort()[0]
  if (start >= end) throw new Error('Les actifs ne partagent pas de période complète.')
  const years = []
  for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year++) {
    if (`${year - 1}-12` >= start && `${year}-12` <= end) years.push(year)
  }
  const basis = assets.every(a => a.basis === assets[0].basis) ? assets[0].basis : 'mixed-total'
  return { start, end, years, currency: assets[0].currency, basis, frequency: 'monthly' }
}
export function periodReturn(asset, start, end, annualized = false) {
  if (!MONTH.test(start) || !MONTH.test(end) || start >= end) throw new Error('La date de fin doit suivre la date de début.')
  if (asset.frequency === 'annual') {
    if (!start.endsWith('-12') || !end.endsWith('-12')) throw new Error('Un calendrier annuel exige des bornes de décembre à décembre.')
    let growth = 1
    for (let year = Number(start.slice(0, 4)) + 1; year <= Number(end.slice(0, 4)); year++) {
      if (!Number.isFinite(asset.years[year])) throw new Error('Année absente du calendrier annuel.')
      growth *= 1 + asset.years[year] / 100
    }
    return (Math.pow(growth, annualized ? 12 / (monthIndex(end) - monthIndex(start)) : 1) - 1) * 100
  }
  if (asset.portfolio) return portfolioReturn(asset, start, end, annualized)
  const first = asset.points.find(p => p.date === start), last = asset.points.find(p => p.date === end)
  if (!first || !last) throw new Error(`Bornes absentes de l’historique de ${asset.label}.`)
  const ratio = last.price / first.price
  return (Math.pow(ratio, annualized ? 12 / (monthIndex(end) - monthIndex(start)) : 1) - 1) * 100
}
export function rankRows(rows) {
  const sorted = rows.map(row => ({ ...row })).sort((a, b) => b.value - a.value || a.order - b.order)
  sorted.forEach((row, i) => { row.rank = i && row.value === sorted[i - 1].value ? sorted[i - 1].rank : i + 1 })
  return sorted
}
export function rankPeriod(assets, start, end, annualized = false, portfolioAnchor = start) {
  const coverage = commonCoverage(assets)
  if (start < coverage.start || end > coverage.end) throw new Error('La période dépasse l’historique commun disponible.')
  return rankRows(assets.map((a, order) => {
    let value = periodReturn(a, start, end, annualized)
    if (a.portfolio && portfolioAnchor < start) {
      const growth = (1 + portfolioReturn(a, portfolioAnchor, end) / 100) / (1 + portfolioReturn(a, portfolioAnchor, start) / 100)
      value = (Math.pow(growth, annualized ? 12 / (monthIndex(end) - monthIndex(start)) : 1) - 1) * 100
    }
    return { id: a.id, label: a.shortLabel ?? a.label, order, value }
  }))
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
    columns = years.map(year => ({ label: String(year), start: `${year - 1}-12`, end: `${year}-12`, rows: rankPeriod(assets, `${year - 1}-12`, `${year}-12`, false, `${years[0] - 1}-12`) }))
  }
  return { coverage, columns, assets, mode, annualized: mode === 'period' && annualized,
    start: columns[0].start, end: columns.at(-1).end }
}
export function rollingRegularity(assets, months) {
  if (![12, 36, 60, 120].includes(months)) throw new Error('Durée glissante invalide.')
  const coverage = commonCoverage(assets)
  if (coverage.frequency === 'annual') return null
  const count = monthIndex(coverage.end) - monthIndex(coverage.start) - months + 1
  if (count < 2) return null
  const stats = assets.map(a => ({ id: a.id, label: a.shortLabel ?? a.label, wins: 0, topTwo: 0, last: 0 }))
  // Build exact monthly lookups once; no interpolation or extrapolation.
  const maps = assets.map(a => new Map(a.points.map(p => [p.date, p.price])))
  for (let i = 0; i < count; i++) {
    const start = monthAt(monthIndex(coverage.start) + i), end = monthAt(monthIndex(start) + months)
    const rows = rankRows(assets.map((a, order) => ({ id: a.id, order, value: a.portfolio ? portfolioReturn(a, start, end) : (maps[order].get(end) / maps[order].get(start) - 1) * 100 })))
    const min = Math.min(...rows.map(r => r.value))
    for (const row of rows) {
      const s = stats.find(s => s.id === row.id)
      if (row.rank === 1) s.wins++
      if (row.rank <= 2) s.topTwo++
      if (row.value === min) s.last++
    }
  }
  return { count, months, start: coverage.start, end: coverage.end, stats }
}
export const formatPercent = value => `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`
export const formatMonth = (value, short = false) => new Date(`${value}-01T00:00:00Z`).toLocaleDateString('fr-FR', { month: short ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' })
export function basisLabel(basis) {
  return ({ adjusted: 'Cours ajustés · revenus réinvestis', 'fund-nav': 'Calendriers NAV officiels · revenus réinvestis', 'mixed-total': 'Rendements totaux et clôtures des actifs sans revenus', portfolio: 'Allocations pondérées · revenus réinvestis', 'index-net': 'Indices · dividendes nets réinvestis', 'index-gross': 'Indices · dividendes bruts réinvestis', 'spot-close': 'Cours de clôture' })[basis] ?? basis
}
export function supportLabel(assets) {
  return [...new Set(assets.map(a => a.portfolio ? 'Portefeuilles' : a.instrumentType === 'EQUITY' ? 'Actions' : a.isin ? a.instrumentType ?? 'ETF' : a.priceUnit === 'points' ? 'Indices' : a.basis === 'adjusted' ? 'Actions' : 'Actifs au comptant'))].join(' / ')
}
// Export fixed asset rows for all modes, splitting custom periods at calendar boundaries.
export function annualColumns(result) {
  if (result.mode !== 'period') return result.columns
  const columns = []
  let start = result.start
  while (start < result.end) {
    const year = Number(start.slice(0, 4)) + (start.endsWith('-12') ? 1 : 0)
    const end = `${year}-12` < result.end ? `${year}-12` : result.end
    const fullYear = start === `${year - 1}-12` && end === `${year}-12`
    columns.push({ label: String(year), partial: !fullYear,
      detail: fullYear ? '' : `${formatMonth(start, true)} → ${formatMonth(end, true)}`,
      start, end, rows: rankPeriod(result.assets, start, end, false, result.start) })
    start = end
  }
  return columns
}
export function publicationRanking(result) {
  const annualized = monthIndex(result.end) - monthIndex(result.start) > 12
  return { annualized, rows: rankPeriod(result.assets, result.start, result.end, annualized) }
}
function tweetUniverse(result, title) {
  const etfs = result.assets.every(a => a.isin && (!a.instrumentType || a.instrumentType === 'ETF'))
  const kinds = result.assets.every(a => a.portfolio) ? 'ces portefeuilles' : etfs ? 'ces ETF' : result.assets.every(a => a.instrumentType === 'EQUITY' || (!a.isin && a.basis === 'adjusted')) ? 'ces actions' : result.assets.every(a => a.priceUnit === 'points') ? 'ces indices' : 'ces actifs'
  const qualifiers = { 'Marchés mondiaux': 'mondiaux', 'Marchés européens': 'européens', 'Facteurs mondiaux': 'factoriels mondiaux', 'Secteurs européens': 'sectoriels européens', 'Secteurs mondiaux': 'sectoriels mondiaux', 'Thématiques': 'thématiques', 'Stratégies dividendes': 'à dividendes', 'Obligations': 'obligataires' }
  return `${kinds}${qualifiers[title] ? ` ${qualifiers[title]}` : ''}`
}
export function buildTweet(result, title) {
  const { rows, annualized } = publicationRanking(result)
  const fullYears = result.start.endsWith('-12') && result.end.endsWith('-12')
  const firstYear = Number(result.start.slice(0, 4)) + 1
  const lastYear = Number(result.end.slice(0, 4))
  const period = fullYears ? firstYear === lastYear ? `en ${lastYear}` : `entre ${firstYear} et ${lastYear}` : `entre fin ${formatMonth(result.start)} et fin ${formatMonth(result.end)}`
  const badges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣']
  const lines = rows.map(r => `${badges[r.rank - 1]} ${r.label} : ${formatPercent(r.value)}${annualized ? '/an' : ''}`)
  const benchmark = result.assets.find(a => a.benchmark)
  const hook = benchmark
    ? `Parmi ces cinq actions, lesquelles ont battu l’${benchmark.shortLabel.replace(/ \(réf\.\)$/, '')} ${period} ? 👇`
    : `Parmi ${tweetUniverse(result, title)}, lequel a le mieux performé ${period} ? 👇`
  return `${hook}\n\n${lines.join('\n')}\n\nLe détail année par année dans l’image 👇\n\n💬 Tu es exposé à l’un d’entre eux ?\n\nPas un conseil financier.`
}

export function rebalanceLabel(value) { return ({ none: 'Sans rééquilibrage', annual: 'Rééquilibrage en décembre', monthly: 'Rééquilibrage chaque mois' })[value] }
const pointMaps = new WeakMap()
function pointMap(asset) {
  if (!pointMaps.has(asset.points)) pointMaps.set(asset.points, new Map(asset.points.map(p => [p.date, p.price])))
  return pointMaps.get(asset.points)
}
export function portfolioReturn(asset, start, end, annualized = false) {
  const { lines, rebalance } = asset.portfolio
  let values = lines.map(line => line.pct / 100)
  for (let index = monthIndex(start) + 1; index <= monthIndex(end); index++) {
    const before = monthAt(index - 1), after = monthAt(index)
    values = values.map((v, i) => {
      const points = pointMap(lines[i].asset)
      const prev = points.get(before), next = points.get(after)
      if (!prev || !next) throw new Error('Mois absent du portefeuille.')
      return v * next / prev
    })
    if (rebalance === 'monthly' || (rebalance === 'annual' && after.endsWith('-12'))) {
      const total = values.reduce((sum, v) => sum + v, 0)
      values = lines.map(line => total * line.pct / 100)
    }
  }
  const growth = values.reduce((sum, v) => sum + v, 0)
  return (Math.pow(growth, annualized ? 12 / (monthIndex(end) - monthIndex(start)) : 1) - 1) * 100
}

