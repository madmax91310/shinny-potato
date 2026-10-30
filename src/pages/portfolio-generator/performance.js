import { latestCommonYears, performanceYears, calendarMap, HISTORICAL_YEARS } from '../../data/annual-window.js'
export { performanceYears }
import { PORTFOLIO_CURRENCIES } from '../../data/portfolio-currencies.js'
import { convertCalendarReturn } from '../../data/calendar-fx.js'
import { getAsset } from '../../data/portfolio-assets.js'
import { dataLabels } from './compact.js'

// These exceptions describe the historical series, not the trading currency.
const historicalCurrencies = { fonds_euros: 'EUR', scpi: 'EUR', msci_world_amundi_pea: 'EUR', smallcap_europe: 'EUR', qyld_ucits: 'USD', oblig_hy_amundi: 'EUR' }
export function returnCurrency(asset) {
  const isin = asset.isin ?? getAsset(asset.id)?.isin
  return asset.returnCurrency ?? historicalCurrencies[asset.id] ?? PORTFOLIO_CURRENCIES[isin] ?? null
}
export function assetReturn(asset, year) {
  const original = (asset.calendarReturns ?? calendarMap(asset.r))[year]
  if (!Number.isFinite(original) || original < -100) return null
  const currency = returnCurrency(asset)
  return convertCalendarReturn(original, year, currency, 'EUR')
}

export function performanceNotes(selection, { includeMethod = true } = {}) {
  const notes = includeMethod ? ['En euros · pondérations rétablies chaque année · hors courtage et fiscalité.'] : []
  if (selection.some(asset => returnCurrency(asset) === 'USD')) notes.push('Rendements USD convertis en EUR avec les taux BCE de fin d’année.')
  const proxies = selection.filter(asset => dataLabels(asset).includes('Historique reconstitué') || ['fonds_euros', 'scpi'].includes(asset.id))
  if (proxies.length) notes.push('Historiques indicatifs : ' + proxies.map(asset => `${asset.name} — ${asset.confidenceNote ?? 'historique reconstitué'}`).join(' ; '))
  if (selection.some(asset => !returnCurrency(asset))) notes.push('Performance indisponible : devise historique non documentée pour une ligne.')
  // A short common window (recent share) is stated as such: its worst year is not comparable to a six-year worst year.
  const years = performanceYears(computeYearlyPerf(selection))
  if (years.length && years.length < 6) notes.push(`Fenêtre courte : ${years.length} années communes (${years[0]}–${years.at(-1)}) ; la pire année observée n’est pas comparable à celle d’une fenêtre de six ans.`)
  return notes.join('\n')
}

// Chaque ligne est repondérée au début de l'année ; même calcul pour le Générateur et les duels.
export function computeYearlyPerf(selection) {
  const perf = {}
  const allocationValid = validAllocation(selection)
  const maps = selection.map(asset => asset.calendarReturns ?? calendarMap(asset.r))
  // Recent shares may have fewer years, but an internal gap must stay visible.
  const hasInternalGap = maps.some(map => {
    const available = Object.keys(map).map(Number).filter(year => Number.isFinite(map[year])).sort((a,b)=>a-b)
    return available.some((year,i) => i > 0 && year !== available[i-1]+1)
  })
  const years = latestCommonYears(maps, { minimum: hasInternalGap ? 6 : 3 })
  // No mixed periods: retain the explicitly dated archive if a live window is unavailable.
  const selectedYears = years.length ? years : HISTORICAL_YEARS
  // Canonical summation keeps display sorting from changing a rounding boundary.
  selectedYears.forEach(year => {
    perf[year] = !allocationValid || selection.some((asset) => !Number.isFinite(assetReturn(asset, year)))
      ? null
      : selection.map(asset => assetReturn(asset, year) * asset.pct / 100).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b).reduce((sum, value) => sum + value, 0)
  })
  return perf
}

// Capability filter for options already admitted by a recipe. This does not
// grant any allocation role or relax the required six-year common window.
export function hasCompleteAutomaticWindow(asset) {
  const perf=computeYearlyPerf([{...asset,pct:100}])
  return performanceYears(perf).length===6 && Object.values(perf).every(Number.isFinite)
}

// Même capitalisation géométrique pour le tweet et l’image, sur toute la période.
export function annualizedReturn(perf) {
  const YEARS = performanceYears(perf)
  if (!YEARS.length || !YEARS.every((year, index) => year < new Date().getUTCFullYear() && (!index || year === YEARS[index - 1] + 1) && Number.isFinite(perf?.[year]) && perf[year] >= -100)) return null
  const growth = YEARS.reduce((product, year) => product * (1 + perf[year] / 100), 1)
  return Number.isFinite(growth) && growth >= 0 ? (Math.pow(growth, 1 / YEARS.length) - 1) * 100 : null
}

export function formatPerformance(value) {
  return Number.isFinite(value)
    ? `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
    : 'non disponible'
}

export function performanceExcerpt(perf) {
  const YEARS = performanceYears(perf)
  const annualized = annualizedReturn(perf)
  return [
    '📈 Performances annuelles simulées (EUR)',
    ...YEARS.map(year => `${Number.isFinite(perf?.[year]) ? perf[year] >= 0 ? '🟢 ' : '🔴 ' : ''}${year} : ${formatPerformance(perf?.[year])}`),
    '',
    `📊 Performance annualisée (${YEARS[0]} à ${YEARS.at(-1)}) : ${formatPerformance(annualized)}${annualized === null ? '' : ' par an'}`,
  ].join('\n')
}


// The form and calculation share the same tolerance; never round an invalid total to 100.
export function validAllocation(selection) {
  return selection.length > 0 && selection.every(row => Number.isFinite(row.pct) && row.pct >= 0) &&
    Math.abs(selection.reduce((sum, row) => sum + row.pct, 0) - 100) < 1e-6
}
