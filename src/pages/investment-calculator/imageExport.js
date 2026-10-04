import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS, MONTHS_FULL, SPARSE_MONTHLY_DATA_IDS } from '../../data/market-history.js'
import { fmtEUR, fmtPct, pct, ymIndex } from './lib.js'
import { drawInvestmentArt, loadInvestmentArt } from './emeraldArt.js'

const W = 1600, INK = '#fff1cf', MUTED = '#afc3c5', GREEN = '#87f0c8', RED = '#ff9c91', GOLD = '#e8c377', GRID = '#28464c'
function text(ctx, value, x, y, size, { width = 1460, color = INK, align = 'left', weight = 700 } = {}) {
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px Arial, sans-serif`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 12)
  ctx.fillText(value, x, y)
}
const prettyMonth = ym => `${MONTHS_FULL[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`
const money = (value, currency) => fmtEUR(value, currency)
const hasOverride = state => !['', undefined].includes(state.overridePriceRaw) && Number(state.overridePriceRaw) > 0

export function investmentChartKind(state, d) {
  if (d.isCustom) return 'endpoints'
  if (SPARSE_MONTHLY_DATA_IDS.has(state.assetId) || INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId)) return 'annual'
  // Follow the observed grain of THIS window, even if a future series changes.
  const points = ASSETS[state.assetId].points.filter(p => p.date >= d.startYm && p.date <= d.endYm)
  return points.some((p, i) => i && ymIndex(p.date) - ymIndex(points[i - 1].date) > 1) ? 'annual' : 'monthly'
}
export function annualInvestmentCapital(state, d) {
  if (d.isCustom) return [
    { date: d.startYm, value: d.result.totalInvested },
    { date: d.endYm, value: d.result.finalValue },
  ]
  const realDates = new Set(ASSETS[state.assetId].points.map(p => p.date))
  const candidates = d.result.months.map((date, i) => ({ date, value: d.result.series[i] }))
    .filter(p => realDates.has(p.date) && (p.date.endsWith('-12') || p.date === d.startYm || p.date === d.endYm))
  // Annual data: retain the last verified observation in each calendar year,
  // including a non-December point when the source actually ends earlier.
  const selected = new Map(candidates.map(p => [p.date.slice(0, 4), p]))
  for (const p of ASSETS[state.assetId].points.filter(p => p.date >= d.startYm && p.date <= d.endYm)) {
    const previous = selected.get(p.date.slice(0, 4))
    if (!previous || p.date > previous.date) {
      const i = d.result.months.indexOf(p.date)
      if (i >= 0) selected.set(p.date.slice(0, 4), { date: p.date, value: d.result.series[i] })
    }
  }
  return [...selected.values()].sort((a, b) => a.date.localeCompare(b.date))
}
function title(ctx, label) {
  const full = `Et si tu avais investi dans ${label} ?`
  ctx.font = '700 56px Arial, sans-serif'
  if (ctx.measureText(full).width <= 1460) { text(ctx, full, 65, 83, 56); return }
  text(ctx, 'Et si tu avais investi dans', 65, 68, 45)
  text(ctx, `${label} ?`, 65, 131, 56)
}
function chart(ctx, state, d, currency, kind) {
  const annual = kind !== 'monthly', rows = annual ? annualInvestmentCapital(state, d) : null
  const values = annual ? rows.map(p => p.value) : d.result.series
  const left = 195, right = 1515, top = 735, bottom = 947
  const peak = Math.max(1, ...values, ...d.result.invested)
  const maximum = peak * 1.15
  const py = v => bottom - v / maximum * (bottom - top)
  const px = i => left + (values.length <= 1 ? .5 : i / (values.length - 1)) * (right - left)
  text(ctx, kind === 'endpoints' ? 'Départ → valeur finale' : annual ? 'Capital en fin d’année' : 'Capital suivi chaque mois', 650, 661, 27, { width: 870 })
  if (d.effectiveMode === 'dca' && !annual) {
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(1095, 652); ctx.lineTo(1125, 652); ctx.stroke(); ctx.setLineDash([])
    text(ctx, 'Versements cumulés', 1135, 661, 20, { width: 380, color: MUTED, weight: 400 })
  }
  for (let i = 0; i <= 2; i++) {
    const value = maximum * i / 2, y = py(value)
    ctx.strokeStyle = GRID; ctx.lineWidth = i ? 1 : 2; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke()
    text(ctx, money(value, currency), left - 18, y + 7, 21, { width: 150, align: 'right', color: MUTED, weight: 400 })
  }
  if (annual) {
    const cell = (right - left) / Math.max(1, rows.length), bar = Math.min(118, cell * .58)
    rows.forEach((p, i) => {
      const x = left + cell * (i + .5), y = py(p.value)
      ctx.fillStyle = i === rows.length - 1 ? GOLD : GREEN; ctx.fillRect(x - bar / 2, y, bar, bottom - y)
      text(ctx, money(p.value, currency), x, y - 14, 24, { width: cell - 8, align: 'center' })
      // Actual observation date, never a December fabricated from a July point.
      text(ctx, rows.length > 10 ? p.date.slice(0, 4) : p.date.split('-').reverse().join('/'), x, bottom + 34, 23, { width: cell - 5, align: 'center' })
    })
  } else {
    const points = values.map((v, i) => [px(i), py(v)])
    if (points.length > 1) {
      ctx.beginPath(); ctx.moveTo(left, bottom); points.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(points.at(-1)[0], bottom); ctx.closePath()
      const fill = ctx.createLinearGradient(0, top, 0, bottom); fill.addColorStop(0, '#87f0c847'); fill.addColorStop(1, '#87f0c800'); ctx.fillStyle = fill; ctx.fill()
    }
    function plot(series, color, dashed = false) {
      ctx.strokeStyle = color; ctx.lineWidth = dashed ? 2.5 : 4; ctx.setLineDash(dashed ? [8, 7] : [])
      ctx.beginPath(); series.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))); ctx.stroke(); ctx.setLineDash([])
    }
    if (d.effectiveMode === 'dca') plot(d.result.invested, GOLD, true)
    plot(values, d.result.finalValue < d.result.totalInvested ? RED : GREEN)
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(px(values.length - 1), py(values.at(-1)), 6, 0, Math.PI * 2); ctx.fill()
    if (values.length === 1) text(ctx, prettyMonth(d.endYm), (left + right) / 2, bottom + 34, 25, { width: 600, align: 'center' })
    else {
      text(ctx, prettyMonth(d.startYm), left, bottom + 34, 25, { width: 620 })
      text(ctx, prettyMonth(d.endYm), right, bottom + 34, 25, { width: 620, align: 'right' })
    }
  }
}
export async function renderInvestmentImage(state, d) {
  const asset = d.isCustom ? null : ASSETS[state.assetId], currency = asset?.currency ?? 'EUR'
  const art = await loadInvestmentArt(d.isCustom ? 'custom' : state.assetId); await document.fonts.ready
  const credits = (asset?.sourceCredit || '').replace(' · Calculs Épargnant Libre', '').split('\n').filter(Boolean)
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = 1110 + credits.length * 24
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#062424'; ctx.fillRect(0, 0, W, canvas.height)
  drawInvestmentArt(ctx, art)
  title(ctx, asset?.tweetPhrase || state.customLabel || 'cet actif')
  text(ctx, `${prettyMonth(d.startYm)} → ${prettyMonth(d.endYm)}`, 650, 203, 32, { width: 870, color: GOLD })
  const dca = d.effectiveMode === 'dca', gain = d.result.finalValue - d.result.totalInvested
  text(ctx, dca ? 'VERSEMENT PAR MOIS' : 'MISE DE DÉPART', 650, 266, 25, { color: MUTED, width: 870 })
  text(ctx, money(d.amount, currency), 650, 346, 65, { width: 650 })
  text(ctx, '↓', 1120, 375, 55, { color: GOLD, width: 200 })
  text(ctx, 'CAPITAL FINAL', 650, 426, 25, { width: 870, color: MUTED })
  text(ctx, money(d.result.finalValue, currency), 640, 537, 110, { width: 640, color: gain < 0 ? RED : GREEN })
  text(ctx, fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 1515, 534, 40, { width: 225, color: gain < 0 ? RED : GREEN, align: 'right' })
  if (dca) text(ctx, `TOTAL VERSÉ : ${money(d.result.totalInvested, currency)}`, 650, 582, 25, { width: 870, color: MUTED })
  const kind = investmentChartKind(state, d)
  chart(ctx, state, d, currency, kind)
  const details = [`En ${currency}`, hasOverride(state) && !d.isCustom ? 'Prix final saisi' : null, asset?.returnNote].filter(Boolean).join(' · ')
  text(ctx, details, 65, 1028, 21, { width: 1110, color: MUTED, weight: 400 })
  text(ctx, '@Epargnantlibre', 1535, 1028, 26, { width: 340, align: 'right' })
  if (state.assetId === 'silver') text(ctx, 'Futures COMEX continus · hors frais et roulement', 65, 1057, 19, { width: 1460, color: MUTED, weight: 400 })
  text(ctx, 'Les performances passées ne préjugent pas des performances futures.', 65, 1085, 20, { width: 1460, color: MUTED, weight: 400 })
  credits.forEach((credit, i) => text(ctx, credit, 65, 1110 + i * 24, 18, { width: 1460, color: MUTED, weight: 400 }))
  return canvas
}
