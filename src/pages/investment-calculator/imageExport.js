import { drawMetricIcon, drawSignatureLeaves, drawObsidianAsset, drawObsidianBackdrop, loadInvestmentEditorialArt } from './editorialArt.js'
import { ensureCalculatorAsset } from '../../data/calculator-history.js'
import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS, MONTHS_FULL, SPARSE_MONTHLY_DATA_IDS } from '../../data/calculator-history.js'
import { fmtEUR, fmtPct, pct, ymIndex } from './lib.js'

const W = 1600, H = 2040
const INK = '#fff5df', MUTED = '#c8c3b8', GOLD = '#edc46c', RED = '#ff8b84', MINT = '#a9e6c3'
function text(ctx, value, x, y, size, { width = 1460, color = INK, align = 'left', weight = 700, maxHeight = Infinity, top = null, display = false } = {}) {
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do {
    ctx.font = display ? `400 ${fitted}px InvestmentDisplay, Arial, sans-serif` : weight + ' ' + fitted + 'px Arial, sans-serif'
    const m = ctx.measureText(value)
    if (m.width <= width && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent <= maxHeight) break
    fitted--
  } while (fitted > 12)
  ctx.fillText(value, x, top === null ? y : top + ctx.measureText(value).actualBoundingBoxAscent)
}
const prettyMonth = ym => MONTHS_FULL[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4)
const money = (value, currency) => fmtEUR(value, currency)

// Omit the measurement annotation, while preserving product, share and hedge
// identifiers. Full conventions and attribution remain in the app and tweet.
export function investmentImageLabel(label) {
  return label.replace(/\s*\((?:once(?:,\s*moyenne mensuelle)?|moyenne mensuelle)\)/gi, '').trim()
}
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
  let size = 94, lines, ascent, descent, step
  do {
    ctx.font = '400 ' + size + 'px InvestmentDisplay, Arial, sans-serif'
    lines = ['']
    for (const word of label.split(/\s+/)) {
      // Preserve even a long unbroken custom label, wrapping rather than clipping.
      const fragments = []
      let fragment = ''
      for (const letter of word) {
        if (fragment && ctx.measureText(fragment + letter).width > 900) {
          fragments.push(fragment); fragment = ''
        }
        fragment += letter
      }
      if (fragment) fragments.push(fragment)
      for (let i = 0; i < fragments.length; i++) {
        const next = (lines.at(-1) + (i ? '' : ' ') + fragments[i]).trim()
        if (lines.at(-1) && (i || ctx.measureText(next).width > 900)) lines.push(fragments[i])
        else lines[lines.length - 1] = next
      }
    }
    const metrics = lines.map(line => ctx.measureText(line))
    ascent = Math.max(...metrics.map(m => m.actualBoundingBoxAscent))
    descent = Math.max(...metrics.map(m => m.actualBoundingBoxDescent))
    step = ascent + descent + 12
    if (lines.length * step - 12 <= 145) break
    size--
  } while (size > 18)
  // The title occupies a measured box between the mode and the dates. Accents
  // and descenders share one line height, including when they occur on different lines.
  lines.forEach((line, i) => text(ctx, line, 70, 340 + ascent + i * step, size,
    { width: 900, display: true }))
}

function chart(ctx, state, d, currency, kind) {
  const annual = kind !== 'monthly', rows = annual ? annualInvestmentCapital(state, d) : null
  const values = annual ? rows.map(p => p.value) : d.result.series
  const left = 195, right = 1500, top = 920, bottom = 1510
  const peak = Math.max(1, ...values, ...d.result.invested)
  const magnitude = 10 ** Math.floor(Math.log10(peak / 2))
  const maximum = Math.ceil(peak * 1.18 / magnitude) * magnitude
  const py = v => bottom - v / maximum * (bottom - top)
  const px = i => left + (values.length <= 1 ? .5 : i / (values.length - 1)) * (right - left)
  const color = d.result.finalValue < d.result.totalInvested ? RED : GOLD
  if (annual) {
    text(ctx, kind === 'endpoints' ? 'Départ → valeur finale' : rows.every(p => p.date.endsWith('-12')) ? 'Capital en fin d’année' : 'Capital aux dates observées',
      70, 900, 29, { width: 1000, color: MUTED, weight: 400 })
  }
  for (let i = 0; i <= 2; i++) {
    const value = maximum * i / 2, y = py(value)
    ctx.strokeStyle = '#ffffff20'; ctx.lineWidth = i ? 1 : 2
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke()
    text(ctx, money(value, currency), left - 24, y + 9, 26,
      { width: 165, align: 'right', color: MUTED, weight: 400 })
  }
  if (annual) {
    const cell = (right - left) / Math.max(1, rows.length), bar = Math.min(118, cell * .58)
    rows.forEach((p, i) => {
      const x = left + cell * (i + .5), y = py(p.value)
      const fill = ctx.createLinearGradient(0, y, 0, bottom)
      fill.addColorStop(0, i === rows.length - 1 ? color : '#cfae70')
      fill.addColorStop(1, '#76613b')
      ctx.fillStyle = fill; ctx.fillRect(x - bar / 2, y, bar, bottom - y)
      // Values and dates are the real observed points, with no interpolated curve.
      if (rows.length <= 10 || i === rows.length - 1) text(ctx, money(p.value, currency), x, y - 18, 25, { width: rows.length <= 10 ? cell - 8 : 240, align: rows.length <= 10 ? 'center' : 'right' })
      if (rows.length <= 10 || i === rows.length - 1 || i % Math.ceil(rows.length / 8) === 0) text(ctx, rows.length > 10 ? p.date.slice(0, 4) : p.date.split('-').reverse().join('/'),
        x, bottom + 42, 25, { width: cell - 5, align: 'center', color: MUTED, weight: 400 })
    })
  } else {
    const points = values.map((v, i) => [px(i), py(v)])
    if (points.length > 1) {
      ctx.beginPath(); ctx.moveTo(left, bottom)
      points.forEach(([x, y]) => ctx.lineTo(x, y))
      ctx.lineTo(points.at(-1)[0], bottom); ctx.closePath()
      const fill = ctx.createLinearGradient(0, top, 0, bottom)
      fill.addColorStop(0, color === RED ? '#ff8b8445' : '#edc46c55')
      fill.addColorStop(1, '#edc46c00'); ctx.fillStyle = fill; ctx.fill()
    }
    const plot = (series, stroke, dashed = false) => {
      ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = dashed ? 3 : 7
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash(dashed ? [12, 10] : [])
      ctx.beginPath()
      series.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)))
      ctx.stroke(); ctx.restore()
    }
    if (d.effectiveMode === 'dca') plot(d.result.invested, '#e5e0d2', true)
    ctx.save(); ctx.shadowColor = color + '66'; ctx.shadowBlur = 12
    plot(values, color); ctx.restore()
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px(values.length - 1), py(values.at(-1)), 8, 0, Math.PI * 2); ctx.fill()
    if (values.length > 1) {
      const finalY = py(values.at(-1)), investedY = py(d.result.totalInvested)
      text(ctx, money(d.result.finalValue, currency), 1490, finalY - 30, 30,
        { width: 330, align: 'right', color, display: true })
      if (d.effectiveMode === 'dca' && Math.abs(finalY - investedY) >= 65) {
        text(ctx, money(d.result.totalInvested, currency), 1490, investedY - 30, 28,
          { width: 330, align: 'right', color: MUTED, display: true })
      }
    }
    if (values.length === 1) text(ctx, prettyMonth(d.endYm), (left + right) / 2, bottom + 42, 30,
      { width: 600, align: 'center', color: MUTED, weight: 400 })
    else {
      text(ctx, prettyMonth(d.startYm), left, bottom + 42, 30, { width: 620, color: MUTED, weight: 400 })
      text(ctx, prettyMonth(d.endYm), right, bottom + 42, 30, { width: 620, align: 'right', color: MUTED, weight: 400 })
    }
  }
  // Legend stays below the plot; it cannot collide with the last capital point.
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(505, 1630); ctx.lineTo(560, 1630); ctx.stroke()
  text(ctx, 'Capital', 580, 1640, 28, { width: 250, color: MUTED, weight: 400 })
  if (d.effectiveMode === 'dca' && !annual) {
    ctx.strokeStyle = '#e5e0d2'; ctx.lineWidth = 3; ctx.setLineDash([12, 10])
    ctx.beginPath(); ctx.moveTo(890, 1630); ctx.lineTo(945, 1630); ctx.stroke(); ctx.setLineDash([])
    text(ctx, 'Versements', 965, 1640, 28, { width: 400, color: MUTED, weight: 400 })
  }
}

export async function renderInvestmentImage(state, d) {
  if (state.assetId !== 'custom') await ensureCalculatorAsset(state.assetId)
  const asset = d.isCustom ? null : d.asset ?? ASSETS[state.assetId]
  const currency = d.currency ?? asset?.currency ?? 'EUR'
  const art = await loadInvestmentEditorialArt(state.assetId)
  await document.fonts.ready
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  drawObsidianBackdrop(ctx, W, H)
  drawObsidianAsset(ctx, art, 950, 30, 630, 650)
  const dca = d.effectiveMode === 'dca', gain = d.result.finalValue - d.result.totalInvested
  text(ctx, money(d.amount, currency), 70, 315, 278, { width: 900, maxHeight: 245, top: 70, display: true })
  const label = investmentImageLabel(asset?.label || state.customLabel || 'cet actif')
  const target = state.assetId === 'or' ? 'dans l’or' : `sur ${label}`
  title(ctx, `${dca ? 'par mois' : 'investis'} ${target}`)
  text(ctx, prettyMonth(d.startYm) + ' → ' + prettyMonth(d.endYm), 70, 535, 39,
    { width: 1460, color: MUTED, weight: 400 })
  text(ctx, 'Capital final', 70, 615, 53, { width: 1400 })
  const face = ctx.createLinearGradient(0, 645, 0, 845)
  face.addColorStop(0, '#fff6d6'); face.addColorStop(.35, '#fff0b0'); face.addColorStop(.6, '#eac15f'); face.addColorStop(1, '#ce983f')
  ctx.save(); ctx.shadowColor = gain < 0 ? '#ff8b8430' : '#eeb83e38'; ctx.shadowBlur = 24
  text(ctx, money(d.result.finalValue, currency), 70, 850, 265,
    { width: 1460, maxHeight: 215, top: 650, color: gain < 0 ? RED : face, display: true })
  ctx.restore()
  chart(ctx, state, d, currency, investmentChartKind(state, d))
  ctx.save()
  const rail = ctx.createLinearGradient(0, 1710, 0, 1925)
  rail.addColorStop(0, '#252015'); rail.addColorStop(.2, '#141313'); rail.addColorStop(1, '#0a0b0c')
  ctx.fillStyle = rail; ctx.beginPath(); ctx.roundRect(45, 1710, 1510, 215, 44); ctx.fill()
  ctx.shadowColor = '#edbb59'; ctx.shadowBlur = 18
  ctx.strokeStyle = '#e6bf76'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore()
  // Short light streaks, as in the approved frame. Never behind the numbers.
  for (const [x, y] of [[340, 1710], [1270, 1925]]) {
    const gleam = ctx.createRadialGradient(x, y, 0, x, y, 120)
    gleam.addColorStop(0, '#fff4c0'); gleam.addColorStop(.15, '#f7d48a99'); gleam.addColorStop(1, '#edc46c00')
    ctx.fillStyle = gleam; ctx.fillRect(x - 120, y - 6, 240, 12)
  }
  const facts = [
    { label: 'Investi', value: money(d.result.totalInvested, currency), color: INK },
    { label: gain < 0 ? 'Perte' : 'Gain', value: (gain > 0 ? '+' : gain < 0 ? '−' : '') + money(Math.abs(gain), currency), color: gain < 0 ? RED : GOLD },
    { label: 'Performance', value: fmtPct(pct(d.result.finalValue, d.result.totalInvested)), color: gain < 0 ? RED : MINT },
  ]
  facts.forEach((fact, i) => {
    const x = 80 + i * 500
    drawMetricIcon(ctx, i, x, 1790, i === 2 ? fact.color : GOLD, gain < 0)
    text(ctx, fact.label, x + 105, 1792, 35, { width: 355, color: MUTED, weight: 400 })
    text(ctx, fact.value, x + 105, 1880, 76, { width: 355, maxHeight: 72, color: fact.color, display: true })
    if (i) {
      ctx.strokeStyle = '#bd955155'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(x - 25, 1750); ctx.lineTo(x - 25, 1890); ctx.stroke()
    }
  })
  // Center the complete signature, including the leaf symbol.
  ctx.font = '700 48px Arial, sans-serif'
  const brandWidth = ctx.measureText('Épargnant Libre').width
  const brandX = (W - brandWidth - 100) / 2
  drawSignatureLeaves(ctx, brandX, 1950)
  text(ctx, 'Épargnant Libre', brandX + 100, 2010, 48, { width: brandWidth + 2, color: GOLD, weight: 700 })
  return canvas
}
