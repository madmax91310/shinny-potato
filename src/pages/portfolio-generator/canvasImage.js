import { getAsset } from '../../data/portfolio-assets.js'
import { dataLabels } from './compact.js'
import { annualizedReturn, computeYearlyPerf, formatPerformance, performanceYears } from './performance.js'
export { annualizedReturn } from './performance.js'

const WIDTH = 1080
const MARGIN = 52
const PAPER = '#f8f2e7'
const INK = '#1c2635'
const CREAM = '#fff2dc'
const GOLD = '#f4d18d'
const POSITIVE = '#85e5ae'
const NEGATIVE = '#ff958e'
const PALETTE = ['#244ca0', '#216962', '#c58e2b', '#654682', '#a84636', '#586e38', '#81554c', '#42748a', '#835a16', '#58354d']
const TAU = Math.PI * 2
const weightLabel = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
const isIndicative = asset => dataLabels(asset).includes('Historique reconstitué') || ['fonds_euros', 'scpi'].includes(asset.id)

function font(ctx, size, weight = 700) {
  ctx.font = `${weight} ${size}px Arial, sans-serif`
}

function label(ctx, text, x, y, size, color, align = 'center', weight = 700) {
  font(ctx, size, weight)
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

function fitSize(ctx, text, width, max, weight = 700) {
  let size = max
  font(ctx, size, weight)
  while (size > 12 && ctx.measureText(text).width > width) font(ctx, --size, weight)
  return size
}

function wrap(ctx, text, width, size) {
  font(ctx, size)
  const lines = []
  let line = ''
  for (const word of text.trim().split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = ''
    }
    if (ctx.measureText(word).width > width) {
      for (const character of word) {
        if (line && ctx.measureText(line + character).width > width) {
          lines.push(line)
          line = ''
        }
        line += character
      }
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

function tint(hex, target, amount) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map(part => parseInt(part, 16))
  return `rgb(${rgb.map(value => Math.round(value + (target - value) * amount)).join(',')})`
}

function makeSegments(selection) {
  const total = selection.reduce((sum, asset) => sum + asset.pct, 0)
  let start = -65 * Math.PI / 180
  return selection.map((asset, index) => {
    const sweep = asset.pct / total * TAU
    const end = start + sweep
    const gap = selection.length === 1 ? 0 : Math.min(.015, sweep / 8)
    const segment = {
      asset, start: start + gap, end: end - gap,
      middle: (start + end) / 2, color: PALETTE[index % PALETTE.length],
      textColor: index % PALETTE.length === 2 ? '#282119' : '#fff9ed',
      name: asset.name + (isIndicative(asset) ? ' *' : ''),
      weight: weightLabel(asset.pct),
    }
    start = end
    return segment
  })
}

function point(cx, cy, radius, angle) {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
}

function ringPath(ctx, segment, cx, cy, inner, outer) {
  ctx.beginPath()
  ctx.arc(cx, cy, outer, segment.start, segment.end)
  ctx.arc(cx, cy, inner, segment.end, segment.start, true)
  ctx.closePath()
}

function weightPosition(ctx, segment, cx, cy, inner, outer) {
  const middleRadius = (inner + outer) / 2
  const halfAngle = (segment.end - segment.start) / 2
  for (const radius of [middleRadius, middleRadius + 21, middleRadius - 19]) {
    const [x, y] = point(cx, cy, radius, segment.middle)
    for (let size = Math.min(58, Math.round(35 + segment.asset.pct)); size >= 26; size -= 2) {
      font(ctx, size)
      const width = ctx.measureText(segment.weight).width
      const corners = [-1, 1].flatMap(dx => [-1, 1].map(dy => [x - cx + dx * (width / 2 + 4), y - cy + dy * (size * .38 + 4)]))
      if (corners.every(([px, py]) => {
        const radius = Math.hypot(px, py)
        const angle = Math.atan2(py, px) - segment.middle
        return radius > inner + 4 && radius < outer - 4 &&
          Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < halfAngle
      })) return { x, y, size }
    }
  }
  return null
}

function drawDonut(ctx, segments, cx, cy, inner, outer) {
  for (const segment of segments) {
    ringPath(ctx, segment, cx, cy + 8, inner, outer)
    ctx.fillStyle = tint(segment.color, 0, .33)
    ctx.fill()
  }
  for (const segment of segments) {
    const material = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer)
    material.addColorStop(0, tint(segment.color, 0, .13))
    material.addColorStop(.18, segment.color)
    material.addColorStop(.93, tint(segment.color, 255, .07))
    material.addColorStop(1, tint(segment.color, 255, .22))
    ringPath(ctx, segment, cx, cy, inner, outer)
    ctx.fillStyle = material
    ctx.fill()
    const position = segment.weightPosition
    if (position) label(ctx, segment.weight, position.x, position.y, position.size, segment.textColor)
  }
}

function calloutRows(ctx, segments, cx, cy, outer) {
  const maxSize = segments.length >= 7 ? 27 : 30
  return [-1, 1].map(side => {
    const rows = segments.filter(segment => Math.sign(Math.cos(segment.middle)) === side)
      .map(segment => {
        const [x, y] = point(cx, cy, outer + 6, segment.middle)
        const size = Math.max(22, Math.min(...segment.name.split(/\s+/).map(word => fitSize(ctx, word, 224, maxSize))))
        const lines = wrap(ctx, segment.name, 224, size)
        if (!segment.weightPosition) lines.push(segment.weight)
        return { segment, lines, x, y, size, height: lines.length * (size + 5), center: y }
      }).sort((a, b) => a.y - b.y)
    return { side, rows }
  })
}

function drawCallouts(ctx, sides) {
  const top = 38, bottom = 678, gap = 20
  for (const { side, rows } of sides) {
    let edge = top
    for (const row of rows) {
      row.center = Math.max(row.y, edge + row.height / 2)
      edge = row.center + row.height / 2 + gap
    }
    edge = bottom
    for (const row of rows.slice().reverse()) {
      row.center = Math.min(row.center, edge - row.height / 2)
      edge = row.center - row.height / 2 - gap
    }
    for (const { segment, lines, size, x, y, center } of rows) {
      const end = side < 0 ? 271 : 809
      ctx.beginPath()
      ctx.moveTo(x, y)
      const elbow = side < 0 ? Math.max(end, x - 15) : Math.min(end, x + 15)
      ctx.lineTo(elbow, center)
      ctx.lineTo(end, center)
      ctx.strokeStyle = segment.color
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(end, center, 3, 0, TAU)
      ctx.fillStyle = segment.color
      ctx.fill()
      lines.forEach((line, i) => label(ctx, line, end + side * 13, center + (i - (lines.length - 1) / 2) * (size + 5), size, INK, side < 0 ? 'right' : 'left'))
    }
  }
}

function legendRows(ctx, segments) {
  return segments.map(segment => {
    const lines = wrap(ctx, segment.name, 294, 27)
    return { segment, lines, height: Math.max(47, lines.length * 32 + 9) }
  })
}

function drawLegend(ctx, rows, top) {
  for (let i = 0; i < rows.length; i += 2) {
    rows.slice(i, i + 2).forEach(({ segment, lines }, column) => {
      const x = MARGIN + column * 493
      ctx.fillStyle = segment.color
      ctx.fillRect(x, top + 6, 8, 28)
      lines.forEach((line, index) => label(ctx, line, x + 20, top + 20 + index * 32, 27, INK, 'left'))
      label(ctx, segment.weight, x + 463, top + 21, 33, INK, 'right')
    })
    top += Math.max(rows[i].height, rows[i + 1]?.height ?? 0)
  }
}

function drawPerformance(ctx, perf, top, height, indicative) {
  const background = ctx.createLinearGradient(0, top, WIDTH, height)
  background.addColorStop(0, '#1b2843')
  background.addColorStop(1, '#131d32')
  ctx.fillStyle = background
  ctx.fillRect(0, top, WIDTH, height - top)
  ctx.fillStyle = '#c6a66d'
  ctx.fillRect(0, top, WIDTH, 2)
  const years = performanceYears(perf)
  const columns = 3, left = 38, width = 726
  const rowCount = Math.max(1, Math.ceil(years.length / columns))
  const divider = 782
  ctx.fillStyle = '#576277'
  ctx.fillRect(divider, top + 82, 1, rowCount * 174)
  for (let row = 1; row < rowCount; row++) {
    ctx.fillRect(left, top + 82 + row * 174, width, 1)
  }
  years.forEach((year, index) => {
    const row = Math.floor(index / columns)
    const count = Math.min(columns, years.length - row * columns)
    const cellWidth = width / count
    const x = left + (index % columns + .5) * cellWidth
    const y = top + 103 + row * 174
    const value = perf[year]
    const text = Number.isFinite(value) ? formatPerformance(value) : 'n.d.'
    const color = !Number.isFinite(value) || value === 0 ? CREAM : value > 0 ? POSITIVE : NEGATIVE
    label(ctx, String(year), x, y, 33, CREAM)
    label(ctx, text, x, y + 77, fitSize(ctx, text, cellWidth - 17, 72, 800), color, 'center', 800)
  })
  if (!years.length) label(ctx, 'Performances indisponibles', left + width / 2, top + 155, 33, CREAM)

  const annual = annualizedReturn(perf)
  const result = annual === null ? 'n.d.' : formatPerformance(annual)
  const resultTop = top + 112 + (rowCount - 1) * 87
  label(ctx, result, 925, resultTop, fitSize(ctx, result, 266, 96, 800), annual !== null && annual < 0 ? NEGATIVE : GOLD, 'center', 800)
  label(ctx, 'Rendement annualisé', 925, resultTop + 75, 24, CREAM)
  if (indicative) label(ctx, '* Historique indicatif', MARGIN, height - 120, 25, CREAM, 'left')
  ctx.fillStyle = '#847359'
  ctx.fillRect(MARGIN, height - 98, WIDTH - MARGIN * 2, 1)
  label(ctx, 'Épargnant Libre', WIDTH / 2, height - 49, 30, CREAM)
}

export function renderPortfolioImage(portfolio) {
  const selection = portfolio.selection.filter(asset => asset.pct > 0)
    .map(asset => asset.calendarReturns || asset.r ? asset : { ...getAsset(asset.id), ...asset })
    .sort((a, b) => b.pct - a.pct)
  const segments = makeSegments(selection)
  const perf = computeYearlyPerf(selection)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  // The standard layout fits 4:5. A dense allocation grows vertically to keep each name legible.
  const cx = WIDTH / 2, cy = 372, inner = 126, outer = 259
  segments.forEach(segment => { segment.weightPosition = weightPosition(ctx, segment, cx, cy, inner, outer) })
  const sides = calloutRows(ctx, segments, cx, cy, outer)
  const compact = segments.length <= 8 && sides.every(({ rows }) => rows.reduce((sum, row) => sum + row.height + 20, 0) <= 660)
  const rows = compact ? [] : legendRows(ctx, segments)
  let upper = 718
  if (rows.length) {
    upper = Math.max(718, 650 + rows.reduce((sum, row, index) => index % 2 ? sum : sum + Math.max(row.height, rows[index + 1]?.height ?? 0), 0))
  }
  const extraPerformanceRows = Math.max(0, Math.ceil(performanceYears(perf).length / 3) - 2)
  canvas.width = WIDTH
  canvas.height = upper + 632 + extraPerformanceRows * 174
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, WIDTH, upper)
  drawDonut(ctx, segments, cx, cy, inner, outer)
  if (compact) drawCallouts(ctx, sides)
  else drawLegend(ctx, rows, 627)
  drawPerformance(ctx, perf, upper, canvas.height, selection.some(isIndicative))
  return canvas
}
