import { drawEditorialCollage, drawEditorialPaper, loadInvestmentEditorialArt } from './editorialArt.js'
import { ensureCalculatorAsset } from '../../data/calculator-history.js'
import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS, MONTHS_FULL, SPARSE_MONTHLY_DATA_IDS } from '../../data/calculator-history.js'
import { fmtEUR, fmtPct, pct, ymIndex } from './lib.js'

const W = 1600, INK = '#171b16', MUTED = '#526057', GREEN = '#174c3c', RED = '#ad3d2b', GOLD = '#cf5937', GRID = '#d6d2c5'
function text(ctx, value, x, y, size, { width = 1460, color = INK, align = 'left', weight = 700, family = 'Arial, sans-serif', maxHeight = Infinity } = {}) {
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px ${family}`; const m = ctx.measureText(value); if (m.width <= width && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent <= maxHeight) break; fitted-- } while (fitted > 12)
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
  ctx.font = '900 232px Georgia, serif'
  for (const word of words) {
    const i = lines.length - 1, next = `${lines[i]} ${word}`.trim()
    if (ctx.measureText(next).width > 860 && i === 0 && lines[i]) lines.push(word)
    else lines[i] = next
  }
  lines.forEach((line, i) => text(ctx, line, 65, (lines.length === 1 ? 680 : 620) + i * 180, lines.length === 1 ? 252 : 155,
    { width: 860, family: 'Georgia, serif', weight: 900, maxHeight: lines.length === 1 ? 230 : 135 }))
}
function chart(ctx, state, d, currency, kind) {
  const annual = kind !== 'monthly', rows = annual ? annualInvestmentCapital(state, d) : null
  const values = annual ? rows.map(p => p.value) : d.result.series
  const left = 195, right = 1515, top = 1330, bottom = 1780
  const peak = Math.max(1, ...values, ...d.result.invested)
  const magnitude = 10 ** Math.floor(Math.log10(peak / 2))
  const maximum = Math.ceil(peak * 1.08 / magnitude) * magnitude
  const py = v => bottom - v / maximum * (bottom - top)
  const px = i => left + (values.length <= 1 ? .5 : i / (values.length - 1)) * (right - left)
  if (annual) text(ctx, kind === 'endpoints' ? 'Départ → valeur finale' : rows.every(p => p.date.endsWith('-12')) ? 'Capital en fin d’année' : 'Capital aux dates observées', 350, 1295, 26, { width: 1100 })
  if (d.effectiveMode === 'dca' && !annual) {
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(1095, 1286); ctx.lineTo(1125, 1286); ctx.stroke(); ctx.setLineDash([])
    text(ctx, 'Versements cumulés', 1135, 1295, 20, { width: 380, color: MUTED, weight: 400 })
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
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = 2040
  const ctx = canvas.getContext('2d'); drawEditorialPaper(ctx, art); drawEditorialCollage(ctx, art)
  const dca = d.effectiveMode === 'dca', gain = d.result.finalValue - d.result.totalInvested
  const condensed = { weight: 400, family: 'InvestmentCondensed, Impact, sans-serif' }
  text(ctx, money(d.amount, currency), 65, 330, 310, { ...condensed, width: 860, maxHeight: 290 })
  text(ctx, dca ? 'investis chaque mois dans' : 'investis dans', 65, 425, 73, { width: 860, weight: 900 })
  title(ctx, asset?.label || state.customLabel || 'cet actif')
  text(ctx, `${prettyMonth(d.startYm)} → ${prettyMonth(d.endYm)}`, 65, 875, 39, { width: 880, family: 'Georgia, serif', weight: 400 })
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(65, 902); ctx.lineTo(870, 902); ctx.stroke()
  if (dca) text(ctx, `TOTAL VERSÉ : ${money(d.result.totalInvested, currency)}`, 65, 943, 28, { width: 900, color: MUTED })
  text(ctx, 'Capital final', 65, 1005, 39, { width: 520 })
  text(ctx, money(d.result.finalValue, currency), 65, 1190, 220, { ...condensed, width: 530, color: gain < 0 ? RED : GREEN, maxHeight: 160 })
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(625, 970); ctx.lineTo(625, 1220); ctx.stroke()
  text(ctx, gain < 0 ? 'Perte' : 'Gain', 665, 1005, 35, { width: 400 })
  text(ctx, money(Math.abs(gain), currency), 665, 1090, 112, { ...condensed, width: 400, maxHeight: 75, color: gain < 0 ? RED : GREEN })
  text(ctx, dca ? `${gain < 0 ? 'Perte' : 'Gain'} sur les sommes versées` : 'Performance', 665, 1140, 31, { width: 400 })
  text(ctx, fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 665, 1210, 103, { ...condensed, width: 400, maxHeight: 65, color: gain < 0 ? RED : GREEN })
  ctx.save(); ctx.shadowColor = '#30281835'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 9
  ctx.fillStyle = '#fff8e9'; ctx.beginPath(); ctx.roundRect(45, 1240, 1510, 630, 40); ctx.fill(); ctx.restore()
  const kind = investmentChartKind(state, d)
  // The reference's coral label is restored; the plot still follows the actual
  // observed grain and never invents monthly points for annual histories.
  ctx.fillStyle = GOLD; ctx.fillRect(85, 1260, kind === 'monthly' ? 235 : 210, 49)
  text(ctx, kind === 'monthly' ? 'MENSUEL' : kind === 'annual' ? 'ANNUEL' : 'DÉPART / FIN', 105, 1297, 32,
    { width: kind === 'endpoints' ? 170 : 200, color: '#fffaf0' })
  chart(ctx, state, d, currency, kind)
  text(ctx, '@Epargnantlibre', 65, 1940, 51, { width: 650, family: 'Georgia, serif', weight: 400 })
  ctx.strokeStyle = GOLD; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(75, 1960); ctx.lineTo(625, 1950); ctx.stroke()
  const details = [`En ${currency}`, hasOverride(state) && !d.isCustom ? 'Prix final saisi' : null, asset?.returnNote, state.assetId === 'silver' ? 'Futures COMEX continus · hors frais et roulement' : null].filter(Boolean).join(' · ')
  text(ctx, details, 65, 1990, 21, { width: 1460, color: MUTED, weight: 400 })
  text(ctx, 'Pas un conseil financier', 65, 2020, 23, { width: 650, color: MUTED, weight: 400 })
  credits.forEach((credit, i) => text(ctx, credit, 1535, 1940 + i * 27, 19, { width: 760, color: MUTED, align: 'right', weight: 400 }))
  return canvas
}
