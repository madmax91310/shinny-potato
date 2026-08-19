// Logique de calcul — reprise telle quelle de la session d'origine (vanilla JS),
// juste modernisée en syntaxe ES / modules, aucune formule modifiée.
import { ASSETS, LATEST_YM, MONTHS_FULL, LIVRET_A, INFLATION } from './data'

export function ymIndex(ym) {
  const [y, m] = ym.split('-')
  return parseInt(y, 10) * 12 + (parseInt(m, 10) - 1)
}

export function indexToYm(idx) {
  const y = Math.floor(idx / 12)
  const m = (idx % 12) + 1
  return y + '-' + (m < 10 ? '0' + m : m)
}

export function monthsBetween(startYm, endYm) {
  const a = ymIndex(startYm)
  const b = ymIndex(endYm)
  const out = []
  for (let i = a; i <= b; i++) out.push(indexToYm(i))
  return out
}

export function clampYm(ym, maxYm) {
  return ymIndex(ym) > ymIndex(maxYm) ? maxYm : ym
}

export function interpolatePrice(points, ym) {
  const idx = ymIndex(ym)
  const first = points[0]
  const last = points[points.length - 1]
  if (idx <= ymIndex(first.date)) return first.price
  if (idx >= ymIndex(last.date)) return last.price
  for (let i = 0; i < points.length - 1; i++) {
    const i0 = ymIndex(points[i].date)
    const i1 = ymIndex(points[i + 1].date)
    if (idx >= i0 && idx <= i1) {
      if (i1 === i0) return points[i].price
      const t = (idx - i0) / (i1 - i0)
      return points[i].price + (points[i + 1].price - points[i].price) * t
    }
  }
  return last.price
}

export function computeAssetSeries(points, startYm, endYm, amount, mode) {
  const months = monthsBetween(startYm, endYm)
  const series = []
  const invested = []
  if (mode === 'dca') {
    let units = 0
    let totalInvested = 0
    for (const month of months) {
      const price = interpolatePrice(points, month)
      units += amount / price
      totalInvested += amount
      series.push(units * price)
      invested.push(totalInvested)
    }
  } else {
    const p0 = interpolatePrice(points, startYm)
    const u = amount / p0
    for (const month of months) {
      series.push(u * interpolatePrice(points, month))
      invested.push(amount)
    }
  }
  return { months, series, invested, finalValue: series[series.length - 1], totalInvested: invested[invested.length - 1] }
}

export function computeBenchmarkSeries(rateTable, startYm, endYm, amount, mode) {
  const months = monthsBetween(startYm, endYm)
  const series = []
  const invested = []
  let value = 0
  let totalInvested = 0
  for (let i = 0; i < months.length; i++) {
    if (i > 0) {
      const year = parseInt(months[i].split('-')[0], 10)
      const annual = rateTable[year] !== undefined ? rateTable[year] : 0
      const factor = Math.pow(1 + annual / 100, 1 / 12)
      value *= factor
    }
    if (mode === 'dca') {
      value += amount
      totalInvested += amount
    } else if (i === 0) {
      value = amount
      totalInvested = amount
    }
    series.push(value)
    invested.push(totalInvested)
  }
  return { months, series, invested, finalValue: series[series.length - 1], totalInvested: invested[invested.length - 1] }
}

export function computeCustomSeries(startYm, endYm, amount, customStart, customEnd) {
  const p0 = parseFloat(customStart)
  const p1 = parseFloat(customEnd)
  const ratio = Number.isFinite(p0) && p0 > 0 && Number.isFinite(p1) ? p1 / p0 : 1
  const months = monthsBetween(startYm, endYm)
  const series = months.map((_, i) => {
    const t = months.length > 1 ? i / (months.length - 1) : 1
    return amount * (1 + (ratio - 1) * t)
  })
  const invested = months.map(() => amount)
  return { months, series, invested, finalValue: amount * ratio, totalInvested: amount }
}

export function fmtEUR(n, currency = 'EUR') {
  try {
    return n.toLocaleString('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 })
  } catch {
    return Math.round(n).toLocaleString('fr-FR') + ' €'
  }
}

export function fmtPct(n) {
  const s = n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (n >= 0 ? '+' : '') + s + ' %'
}

export function pct(final, invested) {
  return invested > 0 ? ((final - invested) / invested) * 100 : 0
}

export function derive(state) {
  const amount = parseFloat(state.amountRaw) || 0
  const isCustom = state.assetId === 'custom'
  const effectiveMode = isCustom ? 'lump' : state.mode
  const startYm = clampYm(state.startYear + '-' + (state.startMonth < 10 ? '0' + state.startMonth : state.startMonth), LATEST_YM)
  const endYm = LATEST_YM

  const result = isCustom
    ? computeCustomSeries(startYm, endYm, amount, state.customStart, state.customEnd)
    : computeAssetSeries(ASSETS[state.assetId].points, startYm, endYm, amount, effectiveMode)
  const livretA = computeBenchmarkSeries(LIVRET_A, startYm, endYm, amount, effectiveMode)
  const inflation = computeBenchmarkSeries(INFLATION, startYm, endYm, amount, effectiveMode)

  return { amount, isCustom, effectiveMode, startYm, endYm, result, livretA, inflation }
}

export function buildTweetText(state, d) {
  const asset = d.isCustom ? null : ASSETS[state.assetId]
  const tweetPhrase = d.isCustom ? (state.customLabel ? `« ${state.customLabel} »` : 'cet actif') : asset.tweetPhrase
  const monthLabel = MONTHS_FULL[parseInt(d.startYm.split('-')[1], 10) - 1]
  const yearLabel = d.startYm.split('-')[0]
  const gainPct = pct(d.result.finalValue, d.result.totalInvested)
  const finalFmt = fmtEUR(d.result.finalValue)
  const pctFmt = fmtPct(gainPct)
  if (d.effectiveMode === 'dca') {
    return (
      `Si tu avais mis ${fmtEUR(d.amount)}/mois dans ${tweetPhrase} depuis ${monthLabel} ${yearLabel} ` +
      `(versement programmé), tu aurais aujourd'hui ${finalFmt} (${pctFmt}) pour ${fmtEUR(d.result.totalInvested)} investis. 🧵`
    )
  }
  return `Si tu avais investi ${fmtEUR(d.amount)} dans ${tweetPhrase} en ${monthLabel} ${yearLabel}, tu aurais aujourd'hui ${finalFmt} (${pctFmt}). 🧵`
}
