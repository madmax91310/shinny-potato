import { dataLabels } from './compact.js'
import { performanceYears, computeYearlyPerf } from './performance.js'
import { annualizedReturn, formatPerformance as percent } from './performance.js'
export { annualizedReturn } from './performance.js'

const PALETTE = ['#e3bf7a', '#afc9df', '#68c3aa', '#9dabc9', '#c28c78', '#9eb778', '#bd8eaf', '#79adba', '#cbab8f', '#a7aaa5']
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

function label(ctx, value, x, y, size, color = WHITE, align = 'left', bold = true, font = 'Arial, sans-serif') {
  ctx.font = `${bold ? '700' : '400'} ${size}px ${font}`
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
  const radius = 229, thickness = 110
  const total = selection.reduce((sum, asset) => sum + asset.pct, 0)
  ctx.save()
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 26
  ctx.shadowOffsetY = 12
  ringArc(ctx, cx, cy, radius, 0, Math.PI * 2, thickness, '#111a1b')
  ctx.restore()
  for (let depth = 28; depth >= 0; depth--) {
    let angle = -Math.PI / 2
    selection.forEach((asset, index) => {
      const end = angle + asset.pct / total * Math.PI * 2
      const gap = Math.min(.006, (end - angle) / 8)
      const color = PALETTE[index % PALETTE.length]
      const side = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy)
      side.addColorStop(0, mix(color, 0, .75))
      side.addColorStop(.25, color)
      side.addColorStop(.4, mix(color, 0, .6))
      side.addColorStop(1, mix(color, 0, .8))
      ringArc(ctx, cx, cy + depth, radius, angle + gap, end - gap, thickness,
        depth ? side : metal(ctx, cx - radius, cy - radius, radius * 2, radius * 2, color))
      if (!depth) {
        ringArc(ctx, cx, cy, radius + thickness / 2 - 2, angle + gap, end - gap, 2, mix(color, 255, .7))
        ringArc(ctx, cx, cy, radius - thickness / 2 + 2, angle + gap, end - gap, 2, mix(color, 0, .48))
      }
      angle = end
    })
  }
  label(ctx, String(selection.length), cx, cy + 7, 99, WHITE, 'center', false, 'Georgia, serif')
  label(ctx, selection.length === 1 ? 'ACTIF' : 'ACTIFS', cx, cy + 52, 23, MUTED, 'center', false)
}

// Draw every chart from the actual portfolio. Material effects never change angles,
// bar scales, returns or names. More holdings expand the legend instead of clipping it.
export function renderPortfolioImage(portfolio, background) {
  const selection = portfolio.selection.filter(asset => asset.pct > 0).slice().sort((a, b) => b.pct - a.pct)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const nameWidth = 690, nameSize = 49
  const isIndicative = asset => dataLabels(asset).includes('Historique reconstitué') || ['fonds_euros', 'scpi'].includes(asset.id)
  const rows = selection.map(asset => ({ asset, lines: wrap(ctx, asset.name + (isIndicative(asset) ? ' *' : ''), nameWidth, nameSize) }))
  rows.forEach(row => { row.height = Math.max(159, row.lines.length * 57 + 65) })
  const legendHeight = rows.reduce((sum, row) => sum + row.height, 0)
  const upperHeight = Math.max(664, legendHeight + 120)
  const height = upperHeight + 536
  canvas.width = 2700
  canvas.height = Math.ceil(height * 1.5)
  ctx.scale(1.5, 1.5)

  const bg = ctx.createLinearGradient(0, 0, 1800, height)
  bg.addColorStop(0, '#152b3a'); bg.addColorStop(1, '#060e19')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1800, height)
  if (background) ctx.drawImage(background, 0, 0, 1800, height)
  ctx.fillStyle = 'rgba(3,11,21,.28)'; ctx.fillRect(0, 0, 1800, height)

  const cy = upperHeight / 2
  donut(ctx, selection, 365, cy - 12)
  let rowY = (upperHeight - legendHeight) / 2
  rows.forEach(({ asset, lines, height: rowHeight }, index) => {
    const color = PALETTE[index % PALETTE.length]
    const center = rowY + rowHeight / 2
    ctx.fillStyle = metal(ctx, 750, center - 38, 7, 75, color)
    ctx.beginPath(); ctx.roundRect(750, center - 38, 7, 75, 3); ctx.fill()
    const first = center - (lines.length - 1) * 28.5 + 17
    lines.forEach((line, lineIndex) => label(ctx, line, 792, first + lineIndex * 57, nameSize))
    label(ctx, weightLabel(asset.pct), 1707, center + 20, 65, metal(ctx, 1510, center - 45, 200, 80, color), 'right', false, 'Georgia, serif')
    if (index < rows.length - 1) rule(ctx, 785, rowY + rowHeight, 920)
    rowY += rowHeight
  })

  rule(ctx, 70, upperHeight, 1660)
  label(ctx, 'Performances annuelles', 70, upperHeight + 61, 36, '#dbbf87', 'left', false, 'Georgia, serif')
  const plotLeft = 80, plotWidth = 1240, plotTop = upperHeight + 137
  const halfHeight = 135, baseline = plotTop + halfHeight
  const perf = computeYearlyPerf(selection)
  const YEARS = performanceYears(perf)
  const finite = YEARS.map(year => perf[year]).filter(Number.isFinite)
  const maxAbs = Math.max(1, ...finite.map(Math.abs))
  rule(ctx, plotLeft, baseline, plotWidth)
  YEARS.forEach((year, index) => {
    const center = plotLeft + plotWidth * (index + .5) / YEARS.length
    const value = perf[year]
    const positive = value >= 0
    const color = !Number.isFinite(value) || value === 0 ? MUTED : positive ? '#80dfb3' : '#efa28b'
    if (Number.isFinite(value) && value !== 0) {
      const barHeight = Math.abs(value) / maxAbs * halfHeight
      const top = positive ? baseline - barHeight : baseline
      const width = Math.min(96, plotWidth / YEARS.length * .55)
      const material = ctx.createLinearGradient(center - width / 2, top, center + width / 2, top)
      for (const [at, target, amount] of [[0, 0, .35], [.12, 255, .3], [.3, 255, .12], [.58, 0, .14], [.86, 255, .14], [1, 0, .4]]) material.addColorStop(at, mix(color, target, amount))
      ctx.fillStyle = material; ctx.fillRect(center - width / 2, top, width, barHeight)
      ctx.strokeStyle = mix(color, 255, .25); ctx.lineWidth = 1
      ctx.strokeRect(center - width / 2, top, width, barHeight)
      ctx.fillStyle = mix(color, 255, .6)
      ctx.fillRect(center - width / 2 + 1, positive ? top : top + barHeight - 2, width - 2, 2)
    }
    const text = Number.isFinite(value) ? percent(value) : 'n.d.'
    const size = fitSize(ctx, text, plotWidth / YEARS.length - 12, 36)
    const offset = Number.isFinite(value) ? Math.abs(value) / maxAbs * halfHeight : 0
    label(ctx, text, center, positive || !Number.isFinite(value) ? baseline - offset - 16 : baseline + offset + 38, size, color, 'center')
    label(ctx, String(year), center, upperHeight + 476, 25, '#e8d7b3', 'center', false)
  })
  ctx.fillStyle = '#75654e'; ctx.fillRect(1390, upperHeight + 106, 1, 334)
  const annualized = annualizedReturn(perf)
  const result = annualized === null ? 'n.d.' : percent(annualized)
  const resultColor = annualized === null ? MUTED : annualized < 0 ? '#efa28b' : '#dfbd7b'
  label(ctx, result, 1570, upperHeight + 266, fitSize(ctx, result, 280, 77), metal(ctx, 1430, upperHeight + 200, 280, 90, resultColor), 'center', false, 'Georgia, serif')
  label(ctx, 'Annualisé', 1570, upperHeight + 157, 32, WHITE, 'center', false, 'Georgia, serif')
  label(ctx, `${YEARS[0]}–${YEARS.at(-1)}`, 1570, upperHeight + 316, 27, MUTED, 'center', false)
  rule(ctx, 70, height - 50, 1660)
  label(ctx, `EUR · change BCE · rééquilibrage annuel${selection.some(isIndicative) ? ' · * historique indicatif' : ''}`, 70, height - 18, 18, MUTED, 'left', false)
  label(ctx, 'Épargnant Libre', 1730, height - 18, 24, '#dfc390', 'right', false)
  return canvas
}
