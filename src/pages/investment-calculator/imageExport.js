import { drawEditorialCollage, drawEditorialPaper, loadInvestmentEditorialArt } from './editorialArt.js'
import { ensureCalculatorAsset } from '../../data/calculator-history.js'
import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS, MONTHS_FULL, SPARSE_MONTHLY_DATA_IDS } from '../../data/calculator-history.js'
import { fmtEUR, fmtPct, pct, ymIndex } from './lib.js'

const W = 1600, INK = '#171b16', MUTED = '#526057', GREEN = '#174c3c', RED = '#ad3d2b', GOLD = '#cf5937', GRID = '#d6d2c5'
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
  const complete = points.length === ymIndex(d.endYm) - ymIndex(d.startYm) + 1
    && points[0]?.date === d.startYm && points.at(-1)?.date === d.endYm
    && points.every((p, i) => !i || ymIndex(p.date) - ymIndex(points[i - 1].date) === 1)
  return complete ? 'monthly' : 'annual'
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
  const words = label.split(/\s+/), lines = ['']
  ctx.font = '500 100px ExportEditorial, Georgia, serif'
  for (const word of words) {
    const i = lines.length - 1, next = `${lines[i]} ${word}`.trim()
    if (ctx.measureText(next).width > 900 && i === 0 && lines[i]) lines.push(word)
    else lines[i] = next
  }
  lines.forEach((line, i) => {
    let size = 100
    do { ctx.font = `500 ${size}px ExportEditorial, Georgia, serif`; if (ctx.measureText(line).width <= 900) break; size-- } while (size > 12)
    ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(line, 65, 330 + i * 98)
  })
}
function chart(ctx, state, d, currency, kind) {
  const annual = kind !== 'monthly', rows = annual ? annualInvestmentCapital(state, d) : null
  const values = annual ? rows.map(p => p.value) : d.result.series
  const left = 195, right = 1515, top = 840, bottom = 1330
  const peak = Math.max(1, ...values, ...d.result.invested)
  const magnitude = 10 ** Math.floor(Math.log10(peak / 2))
  const step = [1, 2, 2.5, 5, 10].map(n => n * magnitude).find(n => n * 2 >= peak * 1.15) || magnitude * 10
  const maximum = step * 2
  const py = v => bottom - v / maximum * (bottom - top)
  const px = i => left + (values.length <= 1 ? .5 : i / (values.length - 1)) * (right - left)
  if (annual) text(ctx, kind === 'endpoints' ? 'Départ → valeur finale' : rows.every(p => p.date.endsWith('-12')) ? 'Capital en fin d’année' : 'Capital aux dates observées', 85, 795, 29, { width: 1000 })
  if (d.effectiveMode === 'dca' && !annual) {
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(1095, 786); ctx.lineTo(1125, 786); ctx.stroke(); ctx.setLineDash([])
    text(ctx, 'Versements cumulés', 1135, 795, 20, { width: 380, color: MUTED, weight: 400 })
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
      const fill = ctx.createLinearGradient(0, top, 0, bottom); fill.addColorStop(0, '#174c3c30'); fill.addColorStop(1, '#174c3c00'); ctx.fillStyle = fill; ctx.fill()
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
  if(state.assetId!=='custom') await ensureCalculatorAsset(state.assetId)
  const asset = d.isCustom ? null : d.asset ?? ASSETS[state.assetId], currency = d.currency ?? asset?.currency ?? 'EUR'
  const art = await loadInvestmentEditorialArt(state.assetId)
  await document.fonts.ready
  const credits = (asset?.sourceCredit || '').replace(' · Calculs Épargnant Libre', '').split('\n').filter(Boolean)
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = W
  const ctx = canvas.getContext('2d'); drawEditorialPaper(ctx); drawEditorialCollage(ctx, art)
  const dca = d.effectiveMode === 'dca', gain = d.result.finalValue - d.result.totalInvested
  text(ctx, money(d.amount, currency), 65, 155, 130, { width: 900, weight: 900 })
  text(ctx, dca ? 'investis chaque mois dans' : 'investis dans', 65, 225, 47, { width: 900 })
  title(ctx, asset?.tweetPhrase || state.customLabel || 'cet actif')
  text(ctx, `${prettyMonth(d.startYm)} → ${prettyMonth(d.endYm)}`, 65, 480, 30, { width: 900, weight: 400 })
  if (dca) text(ctx, `TOTAL VERSÉ : ${money(d.result.totalInvested, currency)}`, 65, 518, 25, { width: 900, color: MUTED })
  text(ctx, 'Capital final', 65, 568, 30, { width: 690 })
  text(ctx, money(d.result.finalValue, currency), 65, 680, 108, { width: 690, color: gain < 0 ? RED : GREEN, weight: 900 })
  ctx.strokeStyle = MUTED; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(800, 546); ctx.lineTo(800, 714); ctx.stroke()
  text(ctx, gain < 0 ? 'Perte' : 'Gain', 845, 566, 28, { width: 690 })
  text(ctx, money(Math.abs(gain), currency), 845, 626, 56, { width: 690, color: gain < 0 ? RED : GREEN })
  text(ctx, fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 845, 685, 48, { width: 690, color: gain < 0 ? RED : GREEN })
  text(ctx, dca ? `${gain < 0 ? 'Perte' : 'Gain'} sur les sommes versées` : 'Sur la période', 845, 720, 23, { width: 690, color: MUTED, weight: 400 })
  ctx.save(); ctx.shadowColor = '#30281820'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.roundRect(45, 750, 1510, 650, 26); ctx.fill(); ctx.restore()
  const kind = investmentChartKind(state, d)
  if (kind === 'monthly') text(ctx, 'Évolution du capital', 85, 795, 29, { weight: 400 })
  chart(ctx, state, d, currency, kind)
  const details = [`En ${currency}`, hasOverride(state) && !d.isCustom ? 'Prix final saisi' : null, asset?.returnNote].filter(Boolean).join(' · ')
  ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(65, 1410); ctx.lineTo(1535, 1410); ctx.stroke()
  text(ctx, details, 65, 1450, 26, { width: 1460, color: MUTED, weight: 400 })
  if (state.assetId === 'silver') text(ctx, 'Futures COMEX continus · hors frais et roulement', 65, 1480, 24, { width: 1460, color: MUTED, weight: 400 })
  credits.forEach((credit, i) => text(ctx, credit, 65, 1510 + i * 28, 23, { width: 1460, color: MUTED, weight: 400 }))
  text(ctx, 'Pas un conseil financier', 65, 1570, 26, { width: 900, color: MUTED, weight: 400 })
  text(ctx, '@Epargnantlibre', 1535, 1570, 30, { width: 450, align: 'right' })
  return canvas
}
