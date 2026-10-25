import { formatPerformancePct } from './performanceFormat.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { getPerformanceEntries, MODES } from './engines/performance.js'

const W = 1600, INK = '#062354', BLUE = '#0846cf', PAPER = '#ffffff', RED = '#a7203d'
export const cumulativePerformance = rows => (rows.reduce((acc, row) => acc * (1 + row.pct / 100), 1) - 1) * 100
const font = (size, weight = 700) => `${weight} ${size}px Arial, sans-serif`
function text(ctx, value, x, y, size, { width = 1400, color = INK, align = 'center', weight = 700 } = {}) {
  while (size > 22) {
    ctx.font = font(size, weight)
    if (ctx.measureText(value).width <= width) break
    size--
  }
  if (ctx.measureText(value).width > width) throw new Error(`Texte de performance trop long : ${value}`)
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  ctx.fillText(value, x, y)
}
function wrap(ctx, value, size, width) {
  ctx.font = font(size, 800)
  const lines = ['']
  for (const word of value.split(/\s+/)) {
    const i = lines.length - 1, next = [lines[i], word].filter(Boolean).join(' ')
    if (lines[i] && ctx.measureText(next).width > width) lines.push(word)
    else lines[i] = next
  }
  return lines
}
function titleLayout(ctx, value, width, compact) {
  // Keep ordinary names on one line; wrap long exact share names without ellipses.
  for (const maxLines of [1, 2]) {
    for (let size = compact ? 70 : 160; size >= (maxLines === 1 ? (compact ? 44 : 85) : 30); size -= 2) {
      const lines = wrap(ctx, value, size, width)
      if (lines.length <= maxLines && lines.every(line => ctx.measureText(line).width <= width)) return { lines, size }
    }
  }
  throw new Error(`Nom de performance trop long : ${value}`)
}
export function performanceLayout(count, compact = false) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Actif ou performances annuelles absents')
  // Short histories occupy one full row. Balance 6–10 years over two rows,
  // then grow vertically without losing or inventing calendar years.
  const columns = compact ? Math.min(2, count) : count <= 5 ? count : count <= 10 ? Math.ceil(count / 2) : 5
  const rows = Math.ceil(count / columns)
  const gridTop = compact ? 675 : 900
  const rowStep = compact ? 170 : rows === 1 ? 260 : 235
  const cellHeight = rowStep - 20
  const height = Math.max(compact || rows === 1 ? 1280 : 1600, gridTop + rows * rowStep + 190)
  return { columns, rows, gridTop, rowStep, cellHeight, height }
}
function roundedBox(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill()
}
function corner(ctx, x, y, direction) {
  ctx.save(); ctx.translate(x, y); ctx.scale(direction, direction)
  ctx.fillStyle = '#deedff'
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(290, 0); ctx.lineTo(0, 290); ctx.closePath(); ctx.fill()
  ctx.fillStyle = BLUE
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(200, 0); ctx.lineTo(0, 200); ctx.closePath(); ctx.fill()
  ctx.restore()
}
const assetTitle = asset => (asset.label || asset.tweetPhrase).replace(/^Indice\s+/i, '')
function panel(ctx, entry, plan) {
  const { asset, returns } = entry
  const { x, width, compact, title, extra, layout } = plan, center = x + width / 2
  title.lines.forEach((line, i) => text(ctx, line, compact ? center : x + 25, (compact ? 90 : 155) + i * (title.size + 12), title.size,
    { width: compact ? width : width * .60, align: compact ? 'center' : 'left', weight: 800 }))
  const period = `${returns[0].year} à ${returns.at(-1).year} · EN ${asset.currency}`
  text(ctx, period, compact ? center : x + width - 25, (compact ? 275 : 290) + extra, compact ? 31 : 42,
    { width: compact ? width : width * .35, align: compact ? 'center' : 'right' })
  const top = (compact ? 350 : 400) + extra, bandH = compact ? 280 : 465
  roundedBox(ctx, x, top, width, bandH, compact ? 28 : 42, BLUE)
  const total = cumulativePerformance(returns)
  text(ctx, formatPerformancePct(total), center, top + (compact ? 40 : 60), compact ? 120 : 235,
    { width: width - 70, color: total < 0 ? '#ffd2dd' : PAPER, weight: 800 })
  text(ctx, `Cumul sur ${returns.length} an${returns.length > 1 ? 's' : ''}`, center, top + (compact ? 195 : 345), compact ? 36 : 65,
    { width: width - 70, color: PAPER })
  const gap = compact ? 18 : 20, cellW = (width - gap * (layout.columns - 1)) / layout.columns
  returns.forEach(({ year, pct }, i) => {
    const row = Math.floor(i / layout.columns), col = i % layout.columns
    const onRow = Math.min(layout.columns, returns.length - row * layout.columns)
    const left = x + (width - onRow * cellW - (onRow - 1) * gap) / 2 + col * (cellW + gap)
    const y = layout.gridTop + extra + row * layout.rowStep
    roundedBox(ctx, left, y, cellW, layout.cellHeight, compact ? 18 : 24, '#eaf3ff')
    text(ctx, String(year), left + cellW / 2, y + (compact ? 25 : 32), compact ? 35 : 42, { width: cellW - 30 })
    text(ctx, formatPerformancePct(pct), left + cellW / 2, y + (compact ? 83 : 113), compact ? 52 : 68,
      { width: cellW - 30, color: pct < 0 ? RED : BLUE })
  })
}
export async function renderPerformanceImage(item) {
  const entries = getPerformanceEntries(item)
  if (!entries.length || entries.some(entry => !entry.returns.length)) throw new Error('Actif ou performances annuelles absents')
  // Canvas primitives keep the export crisp, offline-capable and identical to its preview.
  const canvas = document.createElement('canvas'); canvas.width = W
  const ctx = canvas.getContext('2d'), compact = entries.length > 1
  const plans = entries.map((entry, i) => {
    const width = compact ? 700 : 1510, x = compact ? 70 + i * 760 : 45
    const title = titleLayout(ctx, assetTitle(entry.asset), compact ? width : width * .60, compact)
    return { x, width, compact, title, extra: Math.max(0, (title.lines.length - 1) * (title.size + 12)), layout: performanceLayout(entry.returns.length, compact) }
  })
  // Align titles, heroes and years in comparisons, including unequal histories.
  const extra = Math.max(...plans.map(plan => plan.extra))
  plans.forEach(plan => { plan.extra = extra })
  canvas.height = Math.max(...plans.map(plan => plan.layout.height + extra))
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, canvas.height)
  corner(ctx, 0, 0, 1); corner(ctx, W, canvas.height, -1)
  entries.forEach((entry, i) => panel(ctx, entry, plans[i]))
  text(ctx, 'Épargnant Libre', W / 2, canvas.height - 115, 46)
  return canvas
}
export async function downloadPerformanceImage(item) {
  const canvas = await renderPerformanceImage(item)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `performance-depuis-${item.currency || 'native'}-${item.year}-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`
  document.body.appendChild(link); startPublicationDownload(link); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
