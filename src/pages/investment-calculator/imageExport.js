import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS, MONTHS_FULL, SPARSE_MONTHLY_DATA_IDS } from '../../data/market-history.js'
import { fmtEUR, fmtPct, pct, ymIndex } from './lib'

const INK = '#172437'
const MUTED = '#586270'
const GREEN = '#226963'
const RED = '#b6604d'
const BRONZE = '#a68560'

function rule(ctx, y) {
  ctx.strokeStyle = '#c8c7c0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(60, y)
  ctx.lineTo(1020, y)
  ctx.stroke()
}

function fittedText(ctx, text, maxWidth, font, minSize, startSize) {
  let size = startSize
  do {
    ctx.font = `bold ${size}px ${font}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 1
  } while (size > minSize)
  return size
}

function centeredTitle(ctx, label) {
  ctx.textAlign = 'center'
  ctx.fillStyle = BRONZE
  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillText('ÉPARGNANT LIBRE', 540, 125)
  ctx.fillStyle = INK
  const name = label.toUpperCase()
  const size = fittedText(ctx, name, 950, 'Georgia, serif', 40, 92)
  if (ctx.measureText(name).width <= 950) {
    ctx.fillText(name, 540, 252)
  } else {
    const words = name.split(' ')
    const lines = ['']
    ctx.font = 'bold 48px Georgia, serif'
    for (const word of words) {
      const last = lines.length - 1
      const proposed = `${lines[last]} ${word}`.trim()
      if (ctx.measureText(proposed).width > 950 && lines[last] && lines.length < 2) lines.push(word)
      else lines[last] = proposed
    }
    lines.forEach((line, index) => {
      fittedText(ctx, line, 950, 'Georgia, serif', 24, Math.min(48, size + 8))
      ctx.fillText(line, 540, 200 + index * 59)
    })
  }
  ctx.textAlign = 'left'
}

function prettyMonth(ym) {
  const [year, month] = ym.split('-').map(Number)
  return `${MONTHS_FULL[month - 1].toLowerCase()} ${year}`
}

function compactPct(value) {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

// Les barres comparent les clôtures de décembre présentes dans la base : chaque
// année affichée couvre une année civile complète. La valorisation du placement
// au-dessus reste calculée sur les dates choisies par l'utilisateur.
export function annualInvestmentReturns(state, d) {
  if (d.isCustom) return [{ label: 'Période', value: pct(d.result.finalValue, d.amount) }]
  const points = ASSETS[state.assetId].points
  const december = new Map(points.filter(({ date }) => date.endsWith('-12')).map(({ date, price }) => [Number(date.slice(0, 4)), price]))
  const years = []
  for (let year = Number(d.startYm.slice(0, 4)); year <= Number(d.endYm.slice(0, 4)); year++) {
    if (ymIndex(`${year}-12`) > ymIndex(d.endYm)) continue
    const previous = december.get(year - 1)
    const current = december.get(year)
    if (previous > 0 && Number.isFinite(current)) years.push({ label: String(year), value: (current / previous - 1) * 100 })
  }
  return years.length ? years : [{ label: 'Période', value: pct(d.result.finalValue, d.amount) }]
}

function drawMonthly(ctx, d, currency) {
  ctx.font = 'bold 31px Georgia, serif'
  ctx.fillStyle = INK
  ctx.fillText('La valeur, mois après mois', 60, 621)
  ctx.font = '23px Arial, sans-serif'
  ctx.fillStyle = GREEN
  ctx.fillRect(60, 644, 22, 4)
  ctx.fillStyle = MUTED
  ctx.fillText('Valeur du placement', 92, 654)
  ctx.fillStyle = '#83909a'
  ctx.fillRect(326, 644, 22, 4)
  ctx.fillStyle = MUTED
  ctx.fillText('Capital investi', 358, 654)

  const left = 150, right = 1000, top = 706, bottom = 1096
  const series = d.result.series
  const invested = d.result.invested
  const peak = Math.max(1, ...series, ...invested)
  const tickSize = 10 ** Math.floor(Math.log10(peak / 4))
  const niceStep = [1, 2, 2.5, 5, 10].map((n) => n * tickSize).find((n) => n * 4 >= peak * 1.05) ?? tickSize * 10
  const maximum = niceStep * 4
  const x = (i) => left + (series.length === 1 ? 0 : i / (series.length - 1) * (right - left))
  const y = (v) => bottom - v / maximum * (bottom - top)
  ctx.font = '21px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  for (let n = 0; n <= 4; n++) {
    const level = niceStep * n
    const lineY = y(level)
    ctx.fillText(`${Math.round(level).toLocaleString('fr-FR')} ${currency === 'USD' ? '$' : '€'}`, left - 14, lineY + 6)
    ctx.strokeStyle = '#d9dcd8'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(left, lineY)
    ctx.lineTo(right, lineY)
    ctx.stroke()
  }
  ctx.textAlign = 'left'
  ctx.beginPath()
  series.forEach((value, index) => index ? ctx.lineTo(x(index), y(value)) : ctx.moveTo(x(index), y(value)))
  ctx.lineTo(right, bottom)
  ctx.lineTo(left, bottom)
  ctx.closePath()
  const fill = ctx.createLinearGradient(0, top, 0, bottom)
  fill.addColorStop(0, 'rgba(60, 171, 140, .42)')
  fill.addColorStop(1, 'rgba(60, 171, 140, .02)')
  ctx.fillStyle = fill
  ctx.fill()
  function plot(values, color, width, dashed = false) {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.setLineDash(dashed ? [9, 8] : [])
    values.forEach((value, i) => i ? ctx.lineTo(x(i), y(value)) : ctx.moveTo(x(i), y(value)))
    ctx.stroke()
    ctx.setLineDash([])
  }
  plot(invested, '#83909a', 2.5, true)
  plot(series, '#146d65', 4.5)
  ctx.fillStyle = GREEN
  ctx.beginPath()
  ctx.arc(x(series.length - 1), y(series.at(-1)), 9, 0, 2 * Math.PI)
  ctx.fill()
  ctx.fillStyle = MUTED
  ctx.font = 'bold 23px Arial, sans-serif'
  ctx.fillText(prettyMonth(d.startYm), left, 1136)
  ctx.textAlign = 'right'
  ctx.fillText(prettyMonth(d.endYm), right, 1136)
  ctx.textAlign = 'left'
}

function drawAnnual(ctx, rows, d, currency) {
  const calendar = !d.isCustom && rows[0]?.label !== 'Période'
  ctx.font = 'bold 31px Georgia, serif'
  ctx.fillStyle = INK
  ctx.fillText(calendar ? 'Performances de l’actif par année' : 'Performance sur la période', 60, 621)
  ctx.font = '23px Arial, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(calendar ? 'Rendements annuels (%)' : 'Variation de la valeur du placement · axe en %', 60, 654)
  const positives = rows.filter(({ value }) => value > 0).map(({ value }) => value)
  const negatives = rows.filter(({ value }) => value < 0).map(({ value }) => -value)
  const zero = positives.length && negatives.length ? 974 : positives.length ? 1070 : 741
  const up = positives.length && negatives.length ? 254 : 350
  const down = positives.length && negatives.length ? 102 : 338
  const maxPos = Math.max(1, ...positives)
  const maxNeg = Math.max(1, ...negatives)
  const cell = 850 / rows.length
  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = '21px Arial, sans-serif'
  const ticks = [
    { value: maxPos, y: zero - up },
    { value: maxPos / 2, y: zero - up / 2 },
    { value: 0, y: zero },
    ...(negatives.length ? [{ value: -maxNeg, y: zero + down }] : []),
  ]
  for (const tick of ticks) {
    if (tick.value > 0 && !positives.length) continue
    ctx.fillText(compactPct(tick.value), 141, tick.y + 6)
    ctx.strokeStyle = '#d9dcd8'
    ctx.beginPath()
    ctx.moveTo(155, tick.y)
    ctx.lineTo(1020, tick.y)
    ctx.stroke()
  }
  ctx.textAlign = 'center'
  rows.forEach(({ label, value }, i) => {
    const x = 155 + cell * (i + .5)
    const height = Math.max(2, value >= 0 ? value / maxPos * up : -value / maxNeg * down)
    ctx.fillStyle = value < 0 ? RED : GREEN
    ctx.fillRect(x - Math.min(112, cell * .62) / 2, value >= 0 ? zero - height : zero, Math.min(112, cell * .62), height)
    ctx.font = `bold ${rows.length > 9 ? 20 : 26}px Arial, sans-serif`
    ctx.fillText(compactPct(value), x, value >= 0 ? zero - height - 17 : zero + height + 29)
    ctx.fillStyle = MUTED
    ctx.font = `${rows.length > 9 ? 20 : 26}px Georgia, serif`
    ctx.fillText(label, x, 1141)
  })
  ctx.textAlign = 'left'
  ctx.strokeStyle = BRONZE
  ctx.beginPath()
  ctx.moveTo(155, zero)
  ctx.lineTo(1020, zero)
  ctx.stroke()
  ctx.fillStyle = MUTED
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText(calendar ? `Années civiles closes · Valorisation du placement en ${prettyMonth(d.endYm)}.` : 'Rendement sur la période sélectionnée.', 60, 1190)
  ctx.fillText(`Montants en ${currency} · ${d.startYm} → ${d.endYm}`, 60, 1219)
}

export function renderInvestmentImage(state, d) {
  const asset = d.isCustom ? null : ASSETS[state.assetId]
  const annual = d.isCustom || SPARSE_MONTHLY_DATA_IDS.has(state.assetId) || INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId)
  const currency = asset?.currency ?? 'EUR'
  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = 2700
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = '#f5f2ea'
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.strokeStyle = BRONZE
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(60, 63)
  ctx.lineTo(1020, 63)
  ctx.stroke()
  centeredTitle(ctx, asset?.tweetPhrase || state.customLabel || 'cet actif')
  const start = prettyMonth(d.startYm)
  ctx.textAlign = 'center'
  ctx.fillStyle = INK
  const investmentLine = d.effectiveMode === 'dca'
    ? `${fmtEUR(d.amount, currency)} / MOIS DEPUIS ${start.toUpperCase()}`
    : `${fmtEUR(d.amount, currency)} PLACÉS EN ${start.toUpperCase()}`
  fittedText(ctx, investmentLine, 950, 'Arial, sans-serif', 28, 48)
  ctx.fillText(investmentLine, 540, 332)
  ctx.font = 'bold 21px Arial, sans-serif'
  ctx.fillStyle = BRONZE
  ctx.fillText(d.effectiveMode === 'dca' ? `VERSEMENTS MENSUELS JUSQU’À ${prettyMonth(d.endYm).toUpperCase()}` : 'VERSEMENT UNIQUE', 540, 363)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#fff'
  ctx.fillRect(60, 390, 960, 186)
  ctx.fillStyle = MUTED
  ctx.font = 'bold 24px Arial, sans-serif'
  ctx.fillText(`VALEUR EN ${prettyMonth(d.endYm).toUpperCase()}`, 94, 427)
  ctx.fillStyle = INK
  fittedText(ctx, fmtEUR(d.result.finalValue, currency), 660, 'Georgia, serif', 48, 100)
  ctx.fillText(fmtEUR(d.result.finalValue, currency), 92, 529)
  const gain = d.result.finalValue - d.result.totalInvested
  ctx.fillStyle = gain < 0 ? RED : GREEN
  fittedText(ctx, fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 240, 'Arial, sans-serif', 28, 48)
  ctx.textAlign = 'right'
  ctx.fillText(fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 987, 475)
  ctx.textAlign = 'left'
  ctx.fillStyle = MUTED
  ctx.font = 'bold 20px Arial, sans-serif'
  ctx.fillText(`INVESTI : ${fmtEUR(d.result.totalInvested, currency)}`, 94, 566)
  ctx.textAlign = 'right'
  ctx.fillText(`${gain < 0 ? 'PERTE' : 'GAIN'} : ${fmtEUR(Math.abs(gain), currency)}`, 985, 566)
  ctx.textAlign = 'left'
  if (annual) drawAnnual(ctx, annualInvestmentReturns(state, d), d, currency)
  else drawMonthly(ctx, d, currency)
  rule(ctx, 1247)
  ctx.fillStyle = MUTED
  ctx.font = '21px Arial, sans-serif'
  ctx.fillText(state.overridePriceRaw && !d.isCustom ? 'Prix final saisi · performances passées' : 'Les performances passées ne préjugent pas des performances futures', 60, 1287)
  if (asset?.sourceCredit) {
    ctx.font = '18px Arial, sans-serif'
    asset.sourceCredit.split('\n').forEach((line, i) => ctx.fillText(line, 60, 1310 + i * 26))
  }
  return canvas
}
