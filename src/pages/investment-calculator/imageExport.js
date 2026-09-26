import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS, MONTHS_FULL, SPARSE_MONTHLY_DATA_IDS } from './data'
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
  ctx.fillStyle = INK
  fittedText(ctx, 'ET SI TU AVAIS INVESTI', 950, 'Georgia, serif', 42, 56)
  ctx.fillText('ET SI TU AVAIS INVESTI', 540, 144)
  const title = `DANS ${label.toUpperCase()} ?`
  const size = fittedText(ctx, title, 950, 'Georgia, serif', 36, 60)
  if (ctx.measureText(title).width <= 950) {
    ctx.fillText(title, 540, 221)
  } else {
    const words = title.split(' ')
    const lines = ['']
    for (const word of words) {
      const last = lines.length - 1
      const next = `${lines[last]} ${word}`.trim()
      if (ctx.measureText(next).width > 930 && lines[last]) lines.push(word)
      else lines[last] = next
    }
    ctx.font = `bold ${Math.min(size, 43)}px Georgia, serif`
    lines.forEach((line, index) => ctx.fillText(line, 540, 206 + index * 51))
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

// Les barres utilisent seulement les clôtures réellement présentes dans la base, plus
// la date de départ et le prix de fin de simulation. La première et la dernière
// année peuvent ainsi couvrir moins de douze mois : elles sont signalées comme telles.
export function annualInvestmentReturns(state, d) {
  if (d.isCustom) return [{ label: 'Période', value: pct(d.result.finalValue, d.amount), partial: true }]
  const points = ASSETS[state.assetId].points
  const end = d.endYm
  const anchors = points.filter(({ date }) => date.endsWith('-12') && ymIndex(date) > ymIndex(d.startYm) && ymIndex(date) < ymIndex(end))
  const values = new Map(d.result.months.map((month, index) => [month, d.result.series[index]]))
  const dates = [d.startYm, ...anchors.map(({ date }) => date), end]
  return dates.slice(1).map((date, i) => {
    const previous = dates[i]
    const firstValue = values.get(previous)
    const lastValue = values.get(date)
    return {
      label: date.slice(0, 4),
      value: (lastValue / firstValue - 1) * 100,
      partial: !previous.endsWith('-12') || !date.endsWith('-12'),
    }
  }).filter(({ value }) => Number.isFinite(value))
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
  ctx.font = 'bold 31px Georgia, serif'
  ctx.fillStyle = INK
  ctx.fillText(d.isCustom ? 'Performance sur la période' : 'Performances par année', 60, 621)
  ctx.font = '23px Arial, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText('Variation de la valeur du placement · axe en %', 60, 654)
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
  rows.forEach(({ label, value, partial }, i) => {
    const x = 155 + cell * (i + .5)
    const height = Math.max(2, value >= 0 ? value / maxPos * up : -value / maxNeg * down)
    ctx.fillStyle = value < 0 ? RED : GREEN
    ctx.fillRect(x - Math.min(112, cell * .62) / 2, value >= 0 ? zero - height : zero, Math.min(112, cell * .62), height)
    ctx.font = `bold ${rows.length > 9 ? 20 : 26}px Arial, sans-serif`
    ctx.fillText(compactPct(value), x, value >= 0 ? zero - height - 17 : zero + height + 29)
    ctx.fillStyle = MUTED
    ctx.font = `${rows.length > 9 ? 20 : 26}px Georgia, serif`
    ctx.fillText(`${label}${partial && !d.isCustom ? '*' : ''}`, x, 1141)
  })
  ctx.textAlign = 'left'
  ctx.strokeStyle = BRONZE
  ctx.beginPath()
  ctx.moveTo(155, zero)
  ctx.lineTo(1020, zero)
  ctx.stroke()
  ctx.fillStyle = MUTED
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText(rows.some(({ partial }) => partial) && !d.isCustom ? '* Année partielle depuis le départ ou jusqu’au dernier point.' : 'Rendement sur la période sélectionnée.', 60, 1190)
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
    ? `${fmtEUR(d.amount, currency)} PLACÉS CHAQUE MOIS DEPUIS ${start.toUpperCase()}`
    : `${fmtEUR(d.amount, currency)} PLACÉS EN ${start.toUpperCase()}`
  fittedText(ctx, investmentLine, 950, 'Arial, sans-serif', 23, 32)
  ctx.fillText(investmentLine, 540, 317)
  ctx.font = 'bold 23px Arial, sans-serif'
  ctx.fillStyle = BRONZE
  ctx.fillText(d.effectiveMode === 'dca' ? `VERSEMENT MENSUEL · JUSQU’À ${prettyMonth(d.endYm).toUpperCase()}` : 'VERSEMENT UNIQUE', 540, 349)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#fff'
  ctx.fillRect(60, 381, 960, 180)
  ctx.fillStyle = MUTED
  ctx.font = 'bold 23px Arial, sans-serif'
  ctx.fillText(`VALEUR EN ${prettyMonth(d.endYm).toUpperCase()}`, 94, 423)
  ctx.fillStyle = INK
  fittedText(ctx, fmtEUR(d.result.finalValue, currency), 690, 'Georgia, serif', 56, 82)
  ctx.fillText(fmtEUR(d.result.finalValue, currency), 92, 518)
  ctx.fillStyle = pct(d.result.finalValue, d.result.totalInvested) < 0 ? RED : GREEN
  fittedText(ctx, fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 240, 'Georgia, serif', 26, 40)
  ctx.textAlign = 'right'
  ctx.fillText(fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 987, 424)
  ctx.textAlign = 'left'
  ctx.fillStyle = MUTED
  ctx.font = 'bold 21px Arial, sans-serif'
  ctx.fillText(`CAPITAL INVESTI : ${fmtEUR(d.result.totalInvested, currency)}`, 94, 553)
  if (annual) drawAnnual(ctx, annualInvestmentReturns(state, d), d, currency)
  else drawMonthly(ctx, d, currency)
  rule(ctx, 1247)
  ctx.fillStyle = MUTED
  ctx.font = '21px Arial, sans-serif'
  ctx.fillText(state.overridePriceRaw && !d.isCustom ? 'Valeur finale calculée avec le prix saisi · Historique, pas une prévision' : 'Évolution historique · Les performances passées ne préjugent pas des performances futures', 60, 1287)
  return canvas
}
