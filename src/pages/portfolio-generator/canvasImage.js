import { YEARS } from '../../data/portfolio-assets.js'

const PALETTE = ['#d0aa64', '#84b3b0', '#6989a8', '#e1ca8d', '#b47868', '#8cbd83', '#c684a0', '#77a7be', '#d99372', '#aab181']
const WHITE = '#f8f3e7'
const MUTED = '#adc1be'
const RULE = '#425359'
const percent = (value) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`

export function annualizedReturn(perf) {
  if (!YEARS.every((year) => Number.isFinite(perf[year]))) return null
  const growth = YEARS.reduce((product, year) => product * (1 + perf[year] / 100), 1)
  return growth > 0 ? (Math.pow(growth, 1 / YEARS.length) - 1) * 100 : null
}

function rect(ctx, x, y, width, height, color, radius = 0) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
}

function label(ctx, value, x, y, size, color = WHITE, align = 'left', font = 'Arial, sans-serif') {
  ctx.font = `bold ${size}px ${font}`
  ctx.textAlign = align
  ctx.fillStyle = color
  ctx.fillText(value, x, y)
}

function fitted(ctx, value, x, y, width, size, color = WHITE, align = 'left', min = 17) {
  ctx.font = `bold ${size}px Arial, sans-serif`
  while (size > min && ctx.measureText(value).width > width) {
    size -= 1
    ctx.font = `bold ${size}px Arial, sans-serif`
  }
  if (ctx.measureText(value).width > width) {
    while (value.length && ctx.measureText(`${value}…`).width > width) value = value.slice(0, -1)
    value = `${value.trimEnd()}…`
  }
  label(ctx, value, x, y, size, color, align)
}

export function renderPortfolioImage(portfolio) {
  const selection = portfolio.selection
    .filter((asset) => asset.pct > 0)
    .slice()
    .sort((a, b) => b.pct - a.pct)
  const mainBottom = Math.max(875, 423 + selection.length * 76 + 55)
  const height = mainBottom + 475
  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)

  const background = ctx.createLinearGradient(0, 0, 1080, height)
  background.addColorStop(0, '#101a23')
  background.addColorStop(1, '#090e15')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 1080, height)
  const glow = ctx.createRadialGradient(325, 644, 40, 325, 644, 340)
  glow.addColorStop(0, 'rgba(49,67,67,.42)')
  glow.addColorStop(1, 'rgba(12,19,25,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 280, 680, 750)

  rect(ctx, 62, 54, 9, 42, '#d4af6a', 3)
  label(ctx, 'ÉPARGNANT LIBRE', 93, 84, 25, '#e6d4aa')
  label(ctx, 'Répartition de', 62, 189, 57, WHITE, 'left', 'Georgia, serif')
  label(ctx, 'portefeuille', 62, 258, 65, WHITE, 'left', 'Georgia, serif')
  rect(ctx, 62, 294, 956, 1, RULE)
  label(ctx, 'COMPOSITION', 62, 345, 21, MUTED)

  // Same order and colors for the donut and the corresponding large legend squares.
  const cx = 329
  const cy = 638
  const radius = 179
  const total = selection.reduce((sum, asset) => sum + asset.pct, 0)
  ctx.strokeStyle = '#27363b'
  ctx.lineWidth = 78
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
  let angle = -Math.PI / 2
  selection.forEach((asset, index) => {
    const end = angle + (asset.pct / total) * Math.PI * 2
    const gap = Math.min(.009, (end - angle) / 7)
    ctx.beginPath()
    ctx.arc(cx, cy, radius, angle + gap, end - gap)
    ctx.strokeStyle = PALETTE[index % PALETTE.length]
    ctx.lineWidth = 76
    ctx.stroke()
    angle = end
  })

  const rowStep = selection.length <= 6 ? 83 : 76
  selection.forEach((asset, index) => {
    const y = 464 + index * rowStep
    rect(ctx, 620, y - 27, 34, 34, PALETTE[index % PALETTE.length], 8)
    fitted(ctx, asset.name, 675, y - 1, 240, 22, '#d7deda', 'left', 17)
    label(ctx, `${asset.pct} %`, 1015, y + 2, 34, WHITE, 'right')
  })

  rect(ctx, 62, mainBottom, 956, 1, RULE)
  label(ctx, 'RÉSULTAT ANNUEL', 62, mainBottom + 46, 19, MUTED)
  YEARS.forEach((year, index) => {
    const x = 62 + (index % 3) * 326
    const y = mainBottom + 88 + Math.floor(index / 3) * 119
    rect(ctx, x, y, 303, 98, '#1a2930', 14)
    label(ctx, String(year), x + 19, y + 34, 20, '#9aaba9')
    const value = portfolio.perf[year]
    fitted(ctx, Number.isFinite(value) ? percent(value) : 'n.d.', x + 284, y + 66, 264, 33, value < 0 ? '#de927a' : '#d8bc7e', 'right')
  })
  rect(ctx, 62, mainBottom + 335, 956, 65, '#30322f', 12)
  label(ctx, 'PERFORMANCE ANNUALISÉE', 85, mainBottom + 378, 17, '#dbd6c3')
  const annualized = annualizedReturn(portfolio.perf)
  fitted(ctx, annualized === null ? 'n.d.' : percent(annualized), 995, mainBottom + 381, 380, 38, '#eed89d', 'right')
  rect(ctx, 62, height - 54, 956, 1, RULE)
  label(ctx, 'PERFORMANCES HISTORIQUES SIMULÉES · DEVISES NON CONVERTIES', 64, height - 27, 15, '#8c9b9d')
  return canvas
}
