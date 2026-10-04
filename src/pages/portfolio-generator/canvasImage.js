import { YEARS } from '../../data/portfolio-assets.js'
import { annualizedReturn, formatPerformance as percent } from './performance.js'
export { annualizedReturn } from './performance.js'

const PALETTE = ['#d1b273', '#afc6d2', '#55bd98', '#9dabc9', '#c28c78', '#9eb778', '#bd8eaf', '#79adba', '#cbab8f', '#a7aaa5']
const WHITE = '#f5f2e9'
const MUTED = '#a8b3b8'
const weightLabel = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`


function mix(hex, target, amount) {
  const rgb = hex.match(/\w\w/g).map(value => parseInt(value, 16))
  return `rgb(${rgb.map(value => Math.round(value + (target - value) * amount)).join(',')})`
}

function metal(ctx, x, y, width, height, color) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  for (const [at, target, amount] of [[0, 0, .42], [.2, 255, .18], [.39, 255, .62], [.47, 255, .28], [.64, 0, .12], [.86, 255, .25], [1, 0, .32]]) {
    gradient.addColorStop(at, mix(color, target, amount))
  }
  return gradient
}

function label(ctx, value, x, y, size, color = WHITE, align = 'left', bold = true) {
  ctx.font = `${bold ? '700' : '400'} ${size}px Arial, sans-serif`
  ctx.textAlign = align
  ctx.fillStyle = color
  ctx.fillText(value, x, y)
}

function fitSize(ctx, text, width, initial = 44) {
  let size = initial
  ctx.font = `700 ${size}px Arial, sans-serif`
  while (size > 16 && ctx.measureText(text).width > width) {
    size--
    ctx.font = `700 ${size}px Arial, sans-serif`
  }
  return size
}

function wrap(ctx, name, width, size) {
  ctx.font = `700 ${size}px Arial, sans-serif`
  const lines = ['']
  for (const word of name.split(/\s+/)) {
    const last = lines.length - 1
    const candidate = `${lines[last]} ${word}`.trim()
    if (lines[last] && ctx.measureText(candidate).width > width) lines.push(word)
    else lines[last] = candidate
  }
  return lines
}

function rule(ctx, x, y, width) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y)
  gradient.addColorStop(0, '#655840')
  gradient.addColorStop(.48, '#c2aa7c')
  gradient.addColorStop(1, '#484034')
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, 1)
}

function ringArc(ctx, x, y, radius, start, end, width, color) {
  ctx.beginPath()
  ctx.arc(x, y, radius, start, end)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

function donut(ctx, selection, cx, cy) {
  const radius = 192, thickness = 74
  const total = selection.reduce((sum, asset) => sum + asset.pct, 0)
  ctx.save()
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 26
  ctx.shadowOffsetY = 12
  ringArc(ctx, cx, cy, radius, 0, Math.PI * 2, thickness, '#111a1b')
  ctx.restore()
  let angle = -Math.PI / 2
  selection.forEach((asset, index) => {
    const end = angle + asset.pct / total * Math.PI * 2
    const gap = Math.min(.011, (end - angle) / 8)
    const color = PALETTE[index % PALETTE.length]
    ringArc(ctx, cx, cy + 9, radius, angle + gap, end - gap, thickness, mix(color, 0, .67))
    ringArc(ctx, cx, cy, radius, angle + gap, end - gap, thickness,
      metal(ctx, cx - radius, cy - radius, radius * 2, radius * 2, color))
    ringArc(ctx, cx, cy, radius + thickness / 2 - 2, angle + gap, end - gap, 2, mix(color, 255, .7))
    ringArc(ctx, cx, cy, radius - thickness / 2 + 2, angle + gap, end - gap, 2, mix(color, 0, .48))
    angle = end
  })
  label(ctx, String(selection.length), cx, cy + 1, 62, WHITE, 'center')
  label(ctx, selection.length === 1 ? 'ACTIF' : 'ACTIFS', cx, cy + 41, 19, MUTED, 'center', false)
}

// Draw every chart from the actual portfolio. Material effects never change angles,
// bar scales, returns or names. More holdings expand the legend instead of clipping it.
export function renderPortfolioImage(portfolio) {
  const selection = portfolio.selection.filter(asset => asset.pct > 0).slice().sort((a, b) => b.pct - a.pct)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const nameWidth = 645, nameSize = 28
  const rows = selection.map(asset => ({ asset, lines: wrap(ctx, asset.name, nameWidth, nameSize) }))
  rows.forEach(row => { row.height = Math.max(106, row.lines.length * 34 + 40) })
  const legendHeight = rows.reduce((sum, row) => sum + row.height, 0)
  const upperHeight = Math.max(540, legendHeight + 100)
  const height = upperHeight + 510
  canvas.width = 2400
  canvas.height = Math.ceil(height * 1.5)
  ctx.scale(1.5, 1.5)

  const bg = ctx.createLinearGradient(0, 0, 1600, height)
  bg.addColorStop(0, '#142023'); bg.addColorStop(.43, '#090e10'); bg.addColorStop(1, '#050809')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1600, height)
  // Deterministic fine grain; no background image or external asset is needed.
  for (let i = 0; i < 6500; i++) {
    const x = (i * 137.73) % 1600, y = (i * 79.31) % height
    ctx.fillStyle = i % 3 ? 'rgba(230,240,235,.025)' : 'rgba(0,0,0,.1)'
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.save()
  ctx.strokeStyle = metal(ctx, 0, 0, 1600, height, '#c9b281')
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(226,184,109,.4)'; ctx.shadowBlur = 9
  ctx.beginPath(); ctx.roundRect(9, 9, 1582, height - 18, 26); ctx.stroke()
  ctx.restore()

  const cy = upperHeight / 2
  donut(ctx, selection, 293, cy)
  let rowY = (upperHeight - legendHeight) / 2
  rows.forEach(({ asset, lines, height: rowHeight }, index) => {
    const color = PALETTE[index % PALETTE.length]
    const center = rowY + rowHeight / 2
    ctx.fillStyle = metal(ctx, 592, center - 15, 22, 22, color)
    ctx.fillRect(592, center - 15, 22, 22)
    ctx.strokeStyle = mix(color, 255, .5); ctx.lineWidth = 1
    ctx.strokeRect(592, center - 15, 22, 22)
    const first = center - (lines.length - 1) * 17 + 9
    lines.forEach((line, lineIndex) => label(ctx, line, 640, first + lineIndex * 34, nameSize))
    label(ctx, weightLabel(asset.pct), 1514, center + 13, 45, metal(ctx, 1370, center - 34, 145, 65, color), 'right')
    if (index < rows.length - 1) rule(ctx, 592, rowY + rowHeight, 922)
    rowY += rowHeight
  })

  rule(ctx, 48, upperHeight, 1504)
  label(ctx, 'PERFORMANCES ANNUELLES', 54, upperHeight + 55, 21, '#dbbf87')
  const plotLeft = 70, plotWidth = 1168, plotTop = upperHeight + 112
  const halfHeight = 135, baseline = plotTop + halfHeight
  const finite = YEARS.map(year => portfolio.perf[year]).filter(Number.isFinite)
  const maxAbs = Math.max(1, ...finite.map(Math.abs))
  rule(ctx, plotLeft, baseline, plotWidth)
  YEARS.forEach((year, index) => {
    const center = plotLeft + plotWidth * (index + .5) / YEARS.length
    const value = portfolio.perf[year]
    const positive = value >= 0
    const color = !Number.isFinite(value) || value === 0 ? MUTED : positive ? '#80dfb3' : '#efa28b'
    if (Number.isFinite(value) && value !== 0) {
      const barHeight = Math.abs(value) / maxAbs * halfHeight
      const top = positive ? baseline - barHeight : baseline
      const width = 102
      const material = ctx.createLinearGradient(center - width / 2, top, center + width / 2, top)
      for (const [at, target, amount] of [[0, 0, .35], [.12, 255, .3], [.3, 255, .12], [.58, 0, .14], [.86, 255, .14], [1, 0, .4]]) material.addColorStop(at, mix(color, target, amount))
      ctx.fillStyle = material; ctx.fillRect(center - width / 2, top, width, barHeight)
      ctx.strokeStyle = mix(color, 255, .25); ctx.lineWidth = 1
      ctx.strokeRect(center - width / 2, top, width, barHeight)
      ctx.fillStyle = mix(color, 255, .6)
      ctx.fillRect(center - width / 2 + 1, positive ? top : top + barHeight - 2, width - 2, 2)
    }
    const text = Number.isFinite(value) ? percent(value) : 'n.d.'
    const size = fitSize(ctx, text, plotWidth / YEARS.length - 12, 33)
    const offset = Number.isFinite(value) ? Math.abs(value) / maxAbs * halfHeight : 0
    label(ctx, text, center, positive || !Number.isFinite(value) ? baseline - offset - 16 : baseline + offset + 38, size, color, 'center')
    label(ctx, String(year), center, upperHeight + 452, 24, '#e8d7b3', 'center', false)
  })
  rule(ctx, 1266, upperHeight + 84, 1)
  ctx.fillStyle = '#75654e'; ctx.fillRect(1266, upperHeight + 84, 1, 330)
  const annualized = annualizedReturn(portfolio.perf)
  const result = annualized === null ? 'n.d.' : percent(annualized)
  const resultColor = annualized === null ? MUTED : annualized < 0 ? '#efa28b' : '#dfbd7b'
  label(ctx, result, 1408, upperHeight + 241, fitSize(ctx, result, 245, 62), metal(ctx, 1280, upperHeight + 185, 255, 80, resultColor), 'center')
  label(ctx, 'Annualisé', 1408, upperHeight + 292, 26, WHITE, 'center', false)
  label(ctx, `${YEARS[0]}–${YEARS.at(-1)}`, 1408, upperHeight + 330, 22, MUTED, 'center', false)
  rule(ctx, 48, height - 47, 1504)
  label(ctx, 'Simulation historique', 54, height - 23, 16, MUTED, 'left', false)
  label(ctx, 'Épargnant Libre', 1546, height - 23, 18, '#dfc390', 'right', false)
  return canvas
}
