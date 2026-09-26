// Fiche éditoriale, rendue localement : les données proviennent de data.js.
const W = 1080
const H = 2500
const BG = '#091321'
const PANEL = '#101e2e'
const LINE = '#253649'
const WHITE = '#f5f3eb'
const MUTED = '#a9bac8'
const GOLD = '#d4b77b'
const TEAL = '#5dd2bd'

function text(ctx, value, x, y, size = 24, color = WHITE, weight = 400, align = 'left') {
  ctx.font = `${weight} ${size}px Arial, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(String(value), x, y)
  ctx.textAlign = 'left'
}

function rule(ctx, y) {
  ctx.fillStyle = LINE
  ctx.fillRect(64, y, 952, 1)
}

function section(ctx, label, y, number) {
  text(ctx, number, 64, y, 19, GOLD, 700)
  text(ctx, label.toUpperCase(), 113, y, 22, WHITE, 700)
  rule(ctx, y + 20)
}

function fitted(ctx, value, maxWidth, size = 22, min = 17) {
  let fontSize = size
  while (fontSize > min) {
    ctx.font = `400 ${fontSize}px Arial, sans-serif`
    if (ctx.measureText(value).width <= maxWidth) break
    fontSize--
  }
  let result = value
  while (ctx.measureText(result).width > maxWidth && result.length > 3) result = `${result.slice(0, -2).trimEnd()}…`
  return [result, fontSize]
}

function wrap(ctx, value, x, y, width, size = 22, lineHeight = 31, color = MUTED, maxLines = 3) {
  ctx.font = `400 ${size}px Arial, sans-serif`
  const words = String(value).split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width > width && current) { lines.push(current); current = word } else current = candidate
  }
  if (current) lines.push(current)
  lines.slice(0, maxLines).forEach((line, index) => {
    const [fittedLine] = fitted(ctx, line, width, size, size)
    text(ctx, fittedLine, x, y + index * lineHeight, size, color)
  })
}

function pct(value, sign = false) {
  return `${sign && value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`
}

function rows(ctx, entries, x, y, width, step, bar = false) {
  const labelWidth = bar ? width - 110 : width - 80
  entries.forEach(([name, value], index) => {
    const yy = y + index * step
    const [label, size] = fitted(ctx, name, labelWidth)
    text(ctx, label, x, yy, size, WHITE)
    text(ctx, pct(value), x + width, yy, 22, GOLD, 700, 'right')
    if (bar) {
      ctx.fillStyle = LINE
      ctx.fillRect(x, yy + 13, width, 5)
      ctx.fillStyle = TEAL
      ctx.fillRect(x, yy + 13, Math.max(3, width * value / 100), 5)
    }
  })
}

export function renderFactsheetImage(sheet) {
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(900, 0, 30, 900, 0, 800)
  glow.addColorStop(0, '#1b3b43')
  glow.addColorStop(1, 'rgba(9,19,33,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 700)

  ctx.fillStyle = GOLD
  ctx.fillRect(64, 67, 44, 4)
  text(ctx, 'ÉPARGNANT LIBRE  /  DANS LES COULISSES DES INDICES', 124, 78, 19, GOLD, 700)
  text(ctx, sheet.title, 64, 179, sheet.title.length > 19 ? 54 : 70, WHITE, 700)
  wrap(ctx, sheet.intro, 64, 224, 940, 23, 31, MUTED, 2)
  text(ctx, `COMPOSITION AU ${sheet.snapshot.toUpperCase()}`, 64, 305, 18, GOLD, 700)

  ctx.fillStyle = PANEL
  ctx.fillRect(64, 339, 952, 151)
  const stats = [
    [sheet.constituents.toLocaleString('fr-FR'), 'VALEURS'],
    [sheet.marketCap?.split(' de ')[0] ?? '—', sheet.marketCap ? 'CAPITALISATION' : 'INDICE'],
    [sheet.topWeight ? pct(sheet.topWeight) : '—', 'TOP 10'],
  ]
  stats.forEach(([value, label], i) => {
    const x = 91 + i * 318
    if (i) { ctx.fillStyle = LINE; ctx.fillRect(x - 27, 367, 1, 94) }
    const [v, size] = fitted(ctx, value, 258, 35, 26)
    text(ctx, v, x, 410, size, WHITE, 700)
    text(ctx, label, x, 449, 16, GOLD, 700)
  })
  wrap(ctx, sheet.markets, 64, 533, 940, 21, 27, MUTED, 2)
  if (sheet.isin) text(ctx, `ETF CITÉ : ${sheet.isin}`, 64, 594, 18, TEAL, 700)

  section(ctx, 'Répartition géographique', 649, '01')
  rows(ctx, sheet.countries, 64, 711, 952, 53, true)

  section(ctx, 'Secteurs', 1092, '02')
  const leftSectors = sheet.sectors.slice(0, 6)
  const rightSectors = sheet.sectors.slice(6)
  rows(ctx, leftSectors, 64, 1152, 443, 56)
  rows(ctx, rightSectors, 568, 1152, 448, 56)

  section(ctx, 'Dix premières entreprises', 1539, '03')
  rows(ctx, sheet.holdings.slice(0, 5), 64, 1600, 443, 53)
  rows(ctx, sheet.holdings.slice(5, 10), 568, 1600, 448, 53)

  section(ctx, 'Performances annuelles', 1913, '04')
  const maxReturn = Math.max(40, ...sheet.returns.map(([, value]) => Math.abs(value)))
  sheet.returns.forEach(([year, value], i) => {
    const x = 64 + i * 194
    text(ctx, year, x, 1976, 19, MUTED, 700)
    text(ctx, pct(value, true), x, 2018, 28, value >= 0 ? TEAL : '#e2a48e', 700)
    ctx.fillStyle = LINE
    ctx.fillRect(x, 2040, 160, 7)
    ctx.fillStyle = value >= 0 ? TEAL : '#e2a48e'
    ctx.fillRect(x, 2040, 160 * Math.abs(value) / maxReturn, 7)
  })
  wrap(ctx, sheet.performance.detail, 64, 2090, 940, 18, 26, MUTED, 2)
  const longReturn = sheet.performance.tenYear != null ? `Sur 10 ans : ${pct(sheet.performance.tenYear)} par an` : sheet.performance.annualizedFiveYear != null ? `Sur 5 ans : ${pct(sheet.performance.annualizedFiveYear)} par an` : ''
  if (longReturn) text(ctx, longReturn, 64, 2151, 20, GOLD, 700)
  if (sheet.performance.historyNote) wrap(ctx, sheet.performance.historyNote, 64, 2178, 940, 17, 21, '#e2a48e', 2)

  ctx.fillStyle = PANEL
  ctx.fillRect(64, 2230, 952, 140)
  ctx.fillStyle = GOLD
  ctx.fillRect(64, 2230, 5, 140)
  wrap(ctx, sheet.insight, 88, 2272, 900, 23, 31, WHITE, 2)
  wrap(ctx, sheet.takeaway, 88, 2332, 900, 17, 22, MUTED, 2)

  rule(ctx, 2406)
  const sources = [...new Set(sheet.source.map(({ url }) => new URL(url).hostname.replace(/^www\./, '')))].join(' · ')
  text(ctx, `SOURCE : ${sources.toUpperCase()}  ·  ${sheet.snapshot.toUpperCase()}`, 64, 2440, 16, GOLD, 700)
  text(ctx, `Performances : ${sheet.performance.date} · Données historiques, pas un conseil financier.`, 64, 2472, 16, MUTED)
  return canvas
}
