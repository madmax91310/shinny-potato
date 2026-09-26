import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS, SPARSE_MONTHLY_DATA_IDS } from './data'
import { fmtEUR, fmtPct, pct, ymIndex } from './lib'

const INK = '#172437'
const MUTED = '#586270'
const GREEN = '#226963'
const RED = '#b6604d'
const BRONZE = '#a68560'

function rule(ctx, y) {
  ctx.strokeStyle = '#c8c7c0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(60, y)
  ctx.lineTo(1020, y)
  ctx.stroke()
}

function wrapTitle(ctx, label) {
  const lines = ['']
  for (const word of label.split(' ')) {
    const i = lines.length - 1
    const next = lines[i] ? `${lines[i]} ${word}` : word
    if (ctx.measureText(next).width > 940 && lines[i] && lines.length < 2) lines.push(word)
    else lines[i] = next
  }
  lines.forEach((line, i) => ctx.fillText(line, 60, 184 + i * 58))
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

function drawMonthly(ctx, d) {
  ctx.font = 'bold 38px Georgia, serif'
  ctx.fillStyle = INK
  ctx.fillText('Évolution du placement', 60, 523)
  ctx.font = '21px Arial, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillStyle = GREEN
  ctx.fillRect(60, 545, 22, 3)
  ctx.fillStyle = MUTED
  ctx.fillText('Valeur du placement', 96, 559)
  ctx.fillStyle = '#83909a'
  ctx.fillRect(340, 545, 22, 3)
  ctx.fillStyle = MUTED
  ctx.fillText('Capital investi', 376, 559)

  const left = 80, right = 1000, top = 633, bottom = 1052
  const series = d.result.series
  const invested = d.result.invested
  const maximum = Math.max(1, ...series, ...invested) * 1.08
  const x = (i) => left + (series.length === 1 ? 0 : i / (series.length - 1) * (right - left))
  const y = (v) => bottom - v / maximum * (bottom - top)
  for (let n = 0; n <= 3; n++) {
    const level = maximum * n / 3
    const lineY = y(level)
    ctx.strokeStyle = '#d9dcd8'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(left, lineY)
    ctx.lineTo(right, lineY)
    ctx.stroke()
  }
  function plot(values, color, width, dashed = false) {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.setLineDash(dashed ? [9, 8] : [])
    values.forEach((value, i) => i ? ctx.lineTo(x(i), y(value)) : ctx.moveTo(x(i), y(value)))
    ctx.stroke()
    ctx.setLineDash([])
  }
  plot(invested, '#83909a', 3, true)
  plot(series, GREEN, 5)
  ctx.fillStyle = GREEN
  ctx.beginPath()
  ctx.arc(x(series.length - 1), y(series.at(-1)), 9, 0, 2 * Math.PI)
  ctx.fill()
  ctx.fillStyle = MUTED
  ctx.font = '21px Arial, sans-serif'
  ctx.fillText(d.startYm, left, 1114)
  ctx.textAlign = 'right'
  ctx.fillText(d.endYm, right, 1114)
  ctx.textAlign = 'left'
}

function drawAnnual(ctx, rows, d, currency) {
  ctx.font = 'bold 38px Georgia, serif'
  ctx.fillStyle = INK
  ctx.fillText(d.isCustom ? 'Performance sur la période' : 'Performances par année', 60, 523)
  ctx.font = '21px Arial, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText('Variation de la valeur du placement', 60, 559)
  const positives = rows.filter(({ value }) => value > 0).map(({ value }) => value)
  const negatives = rows.filter(({ value }) => value < 0).map(({ value }) => -value)
  const zero = positives.length && negatives.length ? 897 : positives.length ? 1000 : 680
  const up = positives.length && negatives.length ? 255 : 360
  const down = positives.length && negatives.length ? 110 : 350
  const maxPos = Math.max(1, ...positives)
  const maxNeg = Math.max(1, ...negatives)
  const cell = 940 / rows.length
  ctx.textAlign = 'center'
  rows.forEach(({ label, value, partial }, i) => {
    const x = 70 + cell * (i + .5)
    const height = Math.max(2, value >= 0 ? value / maxPos * up : -value / maxNeg * down)
    ctx.fillStyle = value < 0 ? RED : GREEN
    ctx.fillRect(x - Math.min(112, cell * .62) / 2, value >= 0 ? zero - height : zero, Math.min(112, cell * .62), height)
    ctx.font = `bold ${rows.length > 9 ? 17 : 22}px Arial, sans-serif`
    ctx.fillText(compactPct(value), x, value >= 0 ? zero - height - 17 : zero + height + 29)
    ctx.fillStyle = MUTED
    ctx.font = `${rows.length > 9 ? 18 : 23}px Georgia, serif`
    ctx.fillText(`${label}${partial && !d.isCustom ? '*' : ''}`, x, 1092)
  })
  ctx.textAlign = 'left'
  ctx.strokeStyle = BRONZE
  ctx.beginPath()
  ctx.moveTo(60, zero)
  ctx.lineTo(1020, zero)
  ctx.stroke()
  ctx.fillStyle = MUTED
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText(rows.some(({ partial }) => partial) && !d.isCustom ? '* Année partielle depuis le départ ou jusqu’au dernier point.' : 'Rendement sur la période sélectionnée.', 60, 1150)
  ctx.fillText(`Montants en ${currency} · ${d.startYm} → ${d.endYm}`, 60, 1186)
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
  ctx.fillStyle = '#f8f7f3'
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.strokeStyle = BRONZE
  ctx.beginPath()
  ctx.moveTo(60, 63)
  ctx.lineTo(1020, 63)
  ctx.stroke()
  ctx.font = 'bold 17px Arial, sans-serif'
  ctx.fillStyle = BRONZE
  ctx.fillText('ET SI TU AVAIS INVESTI ?', 60, 105)
  ctx.fillStyle = INK
  ctx.font = 'bold 53px Georgia, serif'
  wrapTitle(ctx, asset?.label || state.customLabel || 'Actif personnalisé')
  ctx.font = '22px Arial, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(`${d.effectiveMode === 'dca' ? 'DCA mensuel' : 'Versement unique'} · ${d.startYm} → ${d.endYm} · ${currency}`, 60, 322)
  rule(ctx, 352)
  ctx.fillStyle = MUTED
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText(`${fmtEUR(d.result.totalInvested, currency)} investis`, 60, 392)
  ctx.fillStyle = INK
  ctx.font = 'bold 54px Georgia, serif'
  ctx.fillText(fmtEUR(d.result.finalValue, currency), 60, 454)
  ctx.fillStyle = pct(d.result.finalValue, d.result.totalInvested) < 0 ? RED : GREEN
  ctx.font = 'bold 28px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(fmtPct(pct(d.result.finalValue, d.result.totalInvested)), 1020, 448)
  ctx.textAlign = 'left'
  rule(ctx, 480)
  if (annual) drawAnnual(ctx, annualInvestmentReturns(state, d), d, currency)
  else drawMonthly(ctx, d)
  rule(ctx, 1245)
  ctx.fillStyle = MUTED
  ctx.font = '19px Arial, sans-serif'
  ctx.fillText(state.overridePriceRaw && !d.isCustom ? 'Valeur finale calculée avec le prix saisi · Historique, pas une prévision' : 'Évolution historique · Les performances passées ne préjugent pas des performances futures', 60, 1286)
  return canvas
}
