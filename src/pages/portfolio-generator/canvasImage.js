import { CATEGORIES, YEARS } from './data.js'

const GOLD = '#ecc36d'
const WHITE = '#f8f5ec'
const MUTED = '#abb8c4'
const BACK = '#09121c'

function percent(value) {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function annualizedReturn(perf) {
  if (!YEARS.every((year) => Number.isFinite(perf[year]))) return null
  const growth = YEARS.reduce((product, year) => product * (1 + perf[year] / 100), 1)
  return growth > 0 ? (Math.pow(growth, 1 / YEARS.length) - 1) * 100 : null
}

function colorOf(asset) {
  if (asset.id.includes('bitcoin')) return '#e9872f'
  if (asset.id.includes('silver') || asset.id.includes('argent')) return '#b6c2cd'
  if (asset.id.includes('or_') || asset.id === 'or') return '#e7bb58'
  if (asset.id === 'lqq' || asset.id === 'cl2') return '#f4d44f'
  return CATEGORIES[asset.cat]?.color || '#58baaf'
}

function chartSelection(selection) {
  const variants = {
    obligataire: ['#3987e5', '#75a8e8', '#4473b8'],
    actions_larges: ['#199e70', '#48bd91', '#26755d'],
    matieres_premieres: ['#d95926', '#efb454', '#b56832'],
    dividendes: ['#c98500', '#e3b44e', '#b28a32'],
    immobilier: ['#d55181', '#e181a2', '#a84474'],
    emergents: ['#5ead51', '#90c770', '#397e50'],
    crypto: ['#e66767', '#f09358', '#bd536a'],
  }
  const seen = {}
  return selection.map((asset) => {
    const position = seen[asset.cat] || 0
    seen[asset.cat] = position + 1
    const special = colorOf(asset)
    return { ...asset, chartColor: special !== CATEGORIES[asset.cat]?.color ? special : variants[asset.cat]?.[position % 3] || special }
  })
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function fit(ctx, text, width, size, min = 17, family = 'Georgia, serif') {
  let current = size
  while (current > min) {
    ctx.font = `bold ${current}px ${family}`
    if (ctx.measureText(text).width <= width) return current
    current -= 1
  }
  ctx.font = `bold ${min}px ${family}`
  return min
}

function textLines(ctx, text, width, maxLines = 3) {
  const lines = ['']
  for (const word of text.split(' ')) {
    const index = lines.length - 1
    const next = `${lines[index]} ${word}`.trim()
    if (lines[index] && ctx.measureText(next).width > width) lines.push(word)
    else lines[index] = next
  }
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines - 1)
    let last = lines.slice(maxLines - 1).join(' ')
    while (last.length && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1)
    return [...keep, `${last.trimEnd()}…`]
  }
  return lines
}

function backdrop(ctx, height, background) {
  if (background?.complete && background.naturalWidth) {
    const sourceWidth = Math.min(background.naturalWidth, background.naturalHeight * 1080 / height)
    ctx.drawImage(background, (background.naturalWidth - sourceWidth) / 2, 0, sourceWidth, background.naturalHeight, 0, 0, 1080, height)
    ctx.fillStyle = 'rgba(3, 9, 16, .24)'
    ctx.fillRect(0, 0, 1080, height)
    return
  }
  const gradient = ctx.createLinearGradient(0, 0, 1080, height)
  gradient.addColorStop(0, '#14202a')
  gradient.addColorStop(.45, BACK)
  gradient.addColorStop(1, '#0d1824')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, height)
  // Discreet gold circuit traces echo the reference without copying its fixed labels or assets.
  ctx.strokeStyle = 'rgba(223, 164, 67, .20)'
  ctx.lineWidth = 2
  for (let index = 0; index < 9; index++) {
    const offset = index * 19
    for (const side of [0, 1]) {
      const x = side ? 1080 : 0
      const sign = side ? -1 : 1
      ctx.beginPath()
      ctx.moveTo(x, 130 + offset)
      ctx.lineTo(x + sign * (68 + index * 8), 130 + offset)
      ctx.lineTo(x + sign * (100 + index * 8), 96 + offset)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x + sign * (100 + index * 8), 96 + offset, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(235, 180, 82, .35)'
      ctx.fill()
    }
  }
  const glow = ctx.createRadialGradient(535, 585, 35, 535, 585, 530)
  glow.addColorStop(0, 'rgba(166, 123, 47, .21)')
  glow.addColorStop(1, 'rgba(166, 123, 47, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 180, 1080, 860)
}

function pie(ctx, selection, centerY, withLegend) {
  const cx = 540, radius = withLegend ? 260 : 277
  let start = -Math.PI / 2
  const slices = selection.map((asset) => {
    const end = start + asset.pct / 100 * Math.PI * 2
    const slice = { asset, start, end, mid: (start + end) / 2, color: asset.chartColor }
    start = end
    return slice
  })
  for (const slice of slices) {
    ctx.save()
    ctx.translate(0, 13)
    ctx.beginPath()
    ctx.moveTo(cx, centerY)
    ctx.arc(cx, centerY, radius, slice.start, slice.end)
    ctx.closePath()
    ctx.fillStyle = '#04090e'
    ctx.fill()
    ctx.restore()
    ctx.beginPath()
    ctx.moveTo(cx, centerY)
    ctx.arc(cx, centerY, radius, slice.start, slice.end)
    ctx.closePath()
    ctx.fillStyle = slice.color
    ctx.fill()
    ctx.save()
    ctx.clip()
    const metal = ctx.createLinearGradient(cx - radius, centerY - radius, cx + radius, centerY + radius)
    metal.addColorStop(0, 'rgba(255,255,255,.45)')
    metal.addColorStop(.43, 'rgba(255,255,255,.08)')
    metal.addColorStop(.77, 'rgba(0,0,0,.06)')
    metal.addColorStop(1, 'rgba(0,0,0,.36)')
    ctx.fillStyle = metal
    ctx.fillRect(cx - radius, centerY - radius, radius * 2, radius * 2)
    ctx.restore()
    ctx.strokeStyle = BACK
    ctx.lineWidth = 5
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(cx, centerY, radius + 3, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(246, 196, 105, .8)'
  ctx.lineWidth = 2
  ctx.stroke()
  if (withLegend) {
    const rowHeight = 78
    const rows = Math.ceil(selection.length / 2)
    const top = centerY + radius + 55
    selection.forEach((asset, index) => {
      const column = Math.floor(index / rows)
      const row = index % rows
      const x = 68 + column * 505
      const y = top + row * rowHeight
      ctx.fillStyle = asset.chartColor
      ctx.fillRect(x, y - 16, 15, 15)
      ctx.fillStyle = WHITE
      ctx.font = 'bold 17px Arial, sans-serif'
      textLines(ctx, asset.name, 342).forEach((line, lineIndex) => ctx.fillText(line, x + 27, y - 2 + lineIndex * 21))
      ctx.fillStyle = GOLD
      ctx.font = 'bold 23px Georgia, serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${asset.pct} %`, x + 467, y + 13)
      ctx.textAlign = 'left'
    })
    return top + rows * rowHeight + 12
  }
  // Outside callouts for compact portfolios, like the five segments in the reference.
  for (const side of [-1, 1]) {
    const items = slices.filter((slice) => Math.cos(slice.mid) * side >= 0)
      .sort((a, b) => Math.sin(a.mid) - Math.sin(b.mid))
    const minY = centerY - radius + 15
    const maxY = centerY + radius - 8
    const gap = Math.min(117, (maxY - minY) / Math.max(1, items.length - 1))
    let previous = minY - gap
    for (let index = 0; index < items.length; index++) {
      const slice = items[index]
      const desired = centerY + Math.sin(slice.mid) * radius * .93
      const rest = items.length - index - 1
      const y = Math.min(Math.max(desired, previous + gap), maxY - rest * gap)
      previous = y
      const originX = cx + Math.cos(slice.mid) * radius * .95
      const originY = centerY + Math.sin(slice.mid) * radius * .95
      const edgeX = side < 0 ? 270 : 810
      const labelX = side < 0 ? 246 : 834
      ctx.strokeStyle = slice.color
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(edgeX, y)
      ctx.lineTo(labelX + (side < 0 ? -8 : 8), y)
      ctx.stroke()
      ctx.fillStyle = slice.color
      ctx.beginPath()
      ctx.arc(originX, originY, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.textAlign = side < 0 ? 'right' : 'left'
      ctx.fillStyle = WHITE
      fit(ctx, slice.asset.name, 214, 23, 15)
      ctx.fillText(slice.asset.name, labelX, y - 8)
      ctx.fillStyle = slice.color
      ctx.font = 'bold 34px Georgia, serif'
      ctx.fillText(`${slice.asset.pct} %`, labelX, y + 29)
    }
  }
  ctx.textAlign = 'left'
  return centerY + radius + 50
}

export function renderPortfolioImage(portfolio, background) {
  const selection = chartSelection(portfolio.selection.filter((asset) => asset.pct > 0).slice().sort((a, b) => b.pct - a.pct))
  const withLegend = selection.length > 5 || selection.some((asset) => asset.name.length > 18)
  const rows = Math.ceil(selection.length / 2)
  const pieY = withLegend ? 550 : 585
  const panelY = withLegend ? 920 + rows * 78 : 1040
  const height = panelY + 565
  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  backdrop(ctx, height, background)
  ctx.textAlign = 'center'
  ctx.fillStyle = WHITE
  fit(ctx, 'EXEMPLE DE RÉPARTITION', 960, 55, 37)
  ctx.fillText('EXEMPLE DE RÉPARTITION', 540, 105)
  ctx.fillText('DE PATRIMOINE', 540, 168)
  const annualized = annualizedReturn(portfolio.perf)
  ctx.fillStyle = GOLD
  const heading = annualized === null ? 'Historique annuel incomplet' : `${percent(annualized)} annualisé de 2020 à 2025`
  fit(ctx, heading, 940, 47, 32)
  ctx.fillText(heading, 540, 234)
  ctx.textAlign = 'left'

  pie(ctx, selection, pieY, withLegend)

  ctx.fillStyle = 'rgba(7, 16, 25, .84)'
  roundedRect(ctx, 45, panelY, 990, 360, 28)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.stroke()
  YEARS.forEach((year, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = 210 + col * 330
    const y = panelY + 84 + row * 164
    ctx.textAlign = 'center'
    ctx.fillStyle = WHITE
    ctx.font = 'bold 38px Georgia, serif'
    ctx.fillText(String(year), x, y)
    const value = portfolio.perf[year]
    ctx.fillStyle = Number.isFinite(value) && value < 0 ? '#e8a49a' : GOLD
    ctx.font = 'bold 45px Georgia, serif'
    ctx.fillText(Number.isFinite(value) ? percent(value) : 'n.d.', x, y + 61)
  })
  ctx.strokeStyle = 'rgba(236, 195, 109, .35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(87, panelY + 180)
  ctx.lineTo(993, panelY + 180)
  ctx.stroke()
  for (const col of [375, 705]) {
    ctx.beginPath()
    ctx.moveTo(col, panelY + 42)
    ctx.lineTo(col, panelY + 316)
    ctx.stroke()
  }

  const worst = portfolio.worst
  ctx.fillStyle = 'rgba(7, 16, 25, .86)'
  roundedRect(ctx, 87, panelY + 393, 906, 116, 25)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = WHITE
  const worstText = Number.isFinite(worst.value) ? `Pire année : ${percent(worst.value)} en ${worst.year}` : 'Pire année : non disponible'
  fit(ctx, worstText, 840, 43, 30)
  ctx.fillText(worstText, 540, panelY + 468)
  ctx.fillStyle = MUTED
  ctx.font = '17px Arial, sans-serif'
  ctx.fillText('Performances historiques simulées · Allocations repondérées chaque année · Devises non converties', 540, height - 23)
  return canvas
}
