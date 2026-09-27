import { CATEGORIES, YEARS } from './data.js'

const C = { bg: '#101a23', gold: '#f1c77a', white: '#f8f7f1', muted: '#b4c2c4', line: '#40545c', track: '#30414a' }
const percent = (value) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`

export function annualizedReturn(perf) {
  if (!YEARS.every((year) => Number.isFinite(perf[year]))) return null
  const growth = YEARS.reduce((product, year) => product * (1 + perf[year] / 100), 1)
  return growth > 0 ? (Math.pow(growth, 1 / YEARS.length) - 1) * 100 : null
}

function colorOf(asset) {
  if (asset.id.includes('bitcoin')) return '#e59556'
  if (asset.id.includes('silver') || asset.id.includes('argent')) return '#97a6b1'
  if (asset.id.includes('or_') || asset.id === 'or') return '#dcb966'
  if (asset.id === 'lqq' || asset.id === 'cl2') return '#f4d44f'
  return CATEGORIES[asset.cat]?.color || '#8cc0bb'
}

function chartSelection(selection) {
  const variants = {
    obligataire: ['#8cc0bb', '#77a7be', '#97a6b1'],
    actions_larges: ['#568bb8', '#6daaa2', '#7fafd3'],
    matieres_premieres: ['#e59556', '#dcb966', '#c98762'],
    dividendes: ['#dcb966', '#e6a768', '#b99970'],
    immobilier: ['#c684a0', '#d899ae', '#ab7298'],
    emergents: ['#8cbd83', '#a9c674', '#74a683'],
    crypto: ['#e59556', '#df796c', '#dcae70'],
  }
  const seen = {}
  return selection.map((asset) => {
    const position = seen[asset.cat] || 0
    seen[asset.cat] = position + 1
    const special = colorOf(asset)
    return { ...asset, chartColor: special !== CATEGORIES[asset.cat]?.color ? special : variants[asset.cat]?.[position % 3] || special }
  })
}

function text(ctx, value, x, y, size, color = C.white, align = 'left') {
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.font = `bold ${size}px Arial, sans-serif`
  ctx.fillText(value, x, y)
}

function fit(ctx, value, width, maxSize, minSize = 23) {
  let size = maxSize
  while (size > minSize) {
    ctx.font = `bold ${size}px Arial, sans-serif`
    if (ctx.measureText(value).width <= width) break
    size -= 1
  }
  return size
}

function names(ctx, value, width) {
  ctx.font = 'bold 31px Arial, sans-serif'
  const words = value.split(' ')
  const lines = ['']
  for (const word of words) {
    const last = lines.length - 1
    const next = `${lines[last]} ${word}`.trim()
    if (lines[last] && ctx.measureText(next).width > width && lines.length < 2) lines.push(word)
    else lines[last] = next
  }
  return lines.map((line) => {
    ctx.font = 'bold 23px Arial, sans-serif'
    if (ctx.measureText(line).width <= width) return line
    let shortened = line
    while (shortened.length && ctx.measureText(`${shortened}…`).width > width) shortened = shortened.slice(0, -1)
    return `${shortened.trimEnd()}…`
  })
}

function rect(ctx, x, y, width, height, color, radius = 0) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, Math.max(1, width), height, radius)
  ctx.fill()
}

export function renderPortfolioImage(portfolio) {
  const selection = chartSelection(portfolio.selection.filter((asset) => asset.pct > 0).slice().sort((a, b) => b.pct - a.pct))
  const rowHeight = 137
  const performanceY = 514 + selection.length * rowHeight
  const height = performanceY + 340
  const canvas = document.createElement('canvas')
  canvas.width = 2400
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, 1200, height)
  rect(ctx, 0, 0, 1200, 12, C.gold)

  text(ctx, 'ÉPARGNANT LIBRE', 600, 89, 25, C.gold, 'center')
  text(ctx, 'RÉPARTITION DU', 600, 177, 60, C.white, 'center')
  text(ctx, 'PORTEFEUILLE', 600, 252, 60, C.white, 'center')
  text(ctx, `${selection.length} SUPPORT${selection.length > 1 ? 'S' : ''}  ·  100 % RÉPARTIS`, 600, 334, 24, C.muted, 'center')

  // The full strip uses each allocation's share of the whole, even when one line is dominant.
  const total = selection.reduce((sum, asset) => sum + asset.pct, 0)
  let offset = 70
  for (const [index, asset] of selection.entries()) {
    const width = index === selection.length - 1 ? 1130 - offset : 1060 * asset.pct / total
    rect(ctx, offset, 355, Math.max(1, width - 3), 50, asset.chartColor)
    offset += width
  }

  text(ctx, 'ALLOCATION', 70, 462, 24, C.gold)
  const maxWeight = Math.max(1, ...selection.map((asset) => asset.pct))
  selection.forEach((asset, index) => {
    const y = 520 + index * rowHeight
    rect(ctx, 70, y - 23, 13, 82, asset.chartColor, 4)
    const lines = names(ctx, asset.name, 650)
    if (lines.length === 1) {
      text(ctx, lines[0], 106, y + 8, fit(ctx, lines[0], 650, 37))
    } else {
      lines.forEach((line, row) => text(ctx, line, 106, y - 13 + row * 35, fit(ctx, line, 650, 30)))
    }
    text(ctx, `${asset.pct} %`, 1130, y + 24, 69, C.white, 'right')
    rect(ctx, 108, y + 66, 706, 14, C.track, 6)
    rect(ctx, 108, y + 66, 706 * asset.pct / maxWeight, 14, asset.chartColor, 6)
  })

  rect(ctx, 70, performanceY, 1060, 2, C.line)
  text(ctx, 'PERFORMANCES ANNUELLES', 70, performanceY + 43, 24, C.gold)
  YEARS.forEach((year, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = 74 + col * 370
    const y = performanceY + 97 + row * 91
    text(ctx, String(year), x, y, 23, C.muted)
    const value = portfolio.perf[year]
    text(ctx, Number.isFinite(value) ? percent(value) : 'n.d.', x, y + 38, 37, value < 0 ? '#ee9a89' : C.white)
  })
  const worst = portfolio.worst
  const worstLabel = Number.isFinite(worst.value) ? `Pire année : ${percent(worst.value)} en ${worst.year}` : 'Pire année : non disponible'
  text(ctx, worstLabel, 70, performanceY + 265, fit(ctx, worstLabel, 1040, 23, 18), C.muted)
  ctx.fillStyle = C.muted
  ctx.textAlign = 'left'
  ctx.font = '18px Arial, sans-serif'
  ctx.fillText('Performances historiques simulées · allocations repondérées chaque année · devises non converties', 70, height - 16)
  return canvas
}
