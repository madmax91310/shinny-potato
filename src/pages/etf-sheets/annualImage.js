import { getAnnualPerformance } from './annualPerformance.js'

const INK = '#172437'
const MUTED = '#586270'
const BRONZE = '#a68560'
const GREEN = '#226963'
const RED = '#b6604d'

function line(ctx, x1, y, x2, color = '#c8c7c0') {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

function titleLines(ctx, title) {
  const words = title.split(' ')
  const lines = ['']
  for (const word of words) {
    const index = lines.length - 1
    const next = lines[index] ? `${lines[index]} ${word}` : word
    if (ctx.measureText(next).width > 940 && lines[index] && lines.length < 3) lines.push(word)
    else lines[index] = next
  }
  return lines
}

function pct(value) {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

export function renderAnnualETFImage(etf) {
  const series = getAnnualPerformance(etf)
  const points = series?.values.flatMap((value, index) => Number.isFinite(value) ? [{ year: 2020 + index, value }] : []) ?? []
  if (points.length < 2) throw new Error('Historique annuel insuffisant pour dessiner le graphique.')

  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = 2700
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = '#f8f7f3'
  ctx.fillRect(0, 0, 1080, 1350)
  line(ctx, 60, 63, 1020, BRONZE)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = BRONZE
  ctx.font = 'bold 17px Arial, sans-serif'
  ctx.fillText('PRÉSENTATION D’ETF', 60, 104)
  ctx.font = 'bold 54px Georgia, serif'
  ctx.fillStyle = INK
  titleLines(ctx, etf.name).forEach((text, index) => ctx.fillText(text, 60, 180 + index * 60))
  const identifiers = [
    { label: 'TICKER', value: etf.tickers.join(' / '), x: 60, width: 240 },
    { label: 'ISIN', value: etf.isin, x: 320, width: 390 },
    { label: 'FRAIS ANNUELS', value: etf.ter, x: 735, width: 285 },
  ]
  ctx.fillStyle = '#ece9e0'
  ctx.fillRect(60, 279, 960, 111)
  identifiers.forEach(({ label, value, x, width }, index) => {
    if (index) { ctx.fillStyle = '#c8c7c0'; ctx.fillRect(x - 15, 298, 1, 72) }
    ctx.fillStyle = MUTED
    ctx.font = 'bold 18px Arial, sans-serif'
    ctx.fillText(label, x + 16, 312)
    ctx.fillStyle = index === 2 ? GREEN : INK
    let size = 32
    do { ctx.font = `bold ${size}px Arial, sans-serif`; size -= 1 } while (ctx.measureText(String(value)).width > width - 32 && size > 22)
    ctx.fillText(String(value), x + 16, 362)
  })
  line(ctx, 60, 405, 1020)

  ctx.fillStyle = INK
  ctx.font = 'bold 39px Georgia, serif'
  ctx.fillText('Performances annuelles', 60, 464)
  ctx.fillStyle = MUTED
  ctx.font = '22px Arial, sans-serif'
  ctx.fillText(`Part en ${series.currency} · ${points[0].year}–${points.at(-1).year}`, 60, 502)

  const positives = points.filter(({ value }) => value > 0)
  const negatives = points.filter(({ value }) => value < 0)
  const zeroY = positives.length && negatives.length ? 856 : positives.length ? 961 : 555
  const positiveRoom = positives.length && negatives.length ? 285 : 405
  const negativeRoom = positives.length && negatives.length ? 130 : 410
  const positiveMax = Math.max(1, ...positives.map(({ value }) => value))
  const negativeMax = Math.max(1, ...negatives.map(({ value }) => Math.abs(value)))
  const cellWidth = 940 / points.length
  const firstX = 70 + cellWidth / 2
  ctx.textAlign = 'center'
  points.forEach(({ year, value }, index) => {
    const x = firstX + index * cellWidth
    const barWidth = Math.min(112, cellWidth * .61)
    const length = value >= 0 ? value / positiveMax * positiveRoom : Math.abs(value) / negativeMax * negativeRoom
    ctx.fillStyle = value < 0 ? RED : GREEN
    ctx.fillRect(x - barWidth / 2, value >= 0 ? zeroY - length : zeroY, barWidth, Math.max(2, length))
    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.fillText(pct(value), x, value >= 0 ? zeroY - length - 19 : zeroY + length + 32)
    ctx.fillStyle = MUTED
    ctx.font = '23px Georgia, serif'
    ctx.fillText(String(year), x, 1082)
  })
  ctx.textAlign = 'left'
  line(ctx, 60, zeroY, 1020, BRONZE)
  line(ctx, 60, 1116, 1020)

  const best = points.reduce((max, point) => point.value > max.value ? point : max)
  const worst = points.reduce((min, point) => point.value < min.value ? point : min)
  ctx.font = '20px Arial, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText('MEILLEURE ANNÉE', 60, 1160)
  ctx.fillText('PIRE ANNÉE', 567, 1160)
  ctx.font = 'bold 43px Georgia, serif'
  ctx.fillStyle = best.value < 0 ? RED : GREEN
  ctx.fillText(pct(best.value), 60, 1218)
  ctx.fillStyle = worst.value < 0 ? RED : GREEN
  ctx.fillText(pct(worst.value), 567, 1218)
  ctx.fillStyle = MUTED
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText(`en ${best.year}`, 60, 1252)
  ctx.fillText(`en ${worst.year}`, 567, 1252)
  line(ctx, 60, 1283, 1020, BRONZE)
  ctx.font = '17px Arial, sans-serif'
  ctx.fillText(`Rendements calendaires de la part en ${series.currency} · Historique, pas une prévision`, 60, 1317)
  return canvas
}
