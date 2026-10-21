import { COLORS } from './palette.js'
import { annualImagePercent, annualRankingColumns, annualRankingLayout, contrastText } from './annualRanking.js'
import { annualColumns, basisLabel, formatMonth, rebalanceLabel } from './engine.js'

const INK = '#f5eddb', MUTED = '#acc0c9', GOLD = '#e7c879'
function text(ctx, value, x, y, size, color = INK, align = 'left', serif = false, weight = 600) {
  ctx.font = `${weight} ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y)
}
function fit(ctx, value, x, y, size, width, color = INK, align = 'left', weight = 600) {
  while (size > 16) { ctx.font = `${weight} ${size}px Arial, sans-serif`; if (ctx.measureText(value).width <= width) break; size-- }
  if (ctx.measureText(value).width > width) {
    while (value.length > 1 && ctx.measureText(`${value}…`).width > width) value = value.slice(0, -1)
    value += '…'
  }
  text(ctx, value, x, y, size, color, align, false, weight)
}
function rounded(ctx, x, y, w, h, fill, stroke, radius = 14) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius)
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke() }
}
function label(ctx, value, x, y, maxWidth, size = 33, align = 'left') {
  const wrap = fontSize => {
    ctx.font = `700 ${fontSize}px Arial, sans-serif`
    const rows = []; let line = ''
    for (let word of value.split(' ')) {
      if (ctx.measureText(word).width > maxWidth && line) { rows.push(line); line = '' }
      while (ctx.measureText(word).width > maxWidth && word.length > 1) {
        let cut = word.length - 1
        while (cut > 1 && ctx.measureText(`${word.slice(0, cut)}-`).width > maxWidth) cut--
        rows.push(`${word.slice(0, cut)}-`); word = word.slice(cut)
      }
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width > maxWidth && line) { rows.push(line); line = word } else line = next
    }
    if (line) rows.push(line)
    return rows
  }
  // Reduce long single words before hyphenating, and keep every header to two lines.
  while (size > 22) {
    ctx.font = `700 ${size}px Arial, sans-serif`
    if (wrap(size).length <= 2 && value.split(' ').every(word => ctx.measureText(word).width <= maxWidth)) break
    size--
  }
  const rows = wrap(size)
  const shown = rows.length > 2 ? [rows[0], rows.slice(1).join(' ')] : rows
  shown.forEach((v, i) => fit(ctx, v, x, y + (i - (shown.length - 1) / 2) * (size + 7), size, maxWidth, INK, align, 700))
}
export function rankingImageLayout(assetCount, columnCount, regularity = false) {
  // Years remain rows for every multi-year comparison; one year lists the assets.
  const transposed = columnCount >= 2
  const width = 1200, margin = 40
  const labelWidth = transposed ? 110 : 510
  const gridColumns = transposed ? assetCount : columnCount
  const gridRows = transposed ? columnCount : assetCount
  const cellWidth = (width - margin * 2 - labelWidth) / gridColumns
  const rowHeight = transposed ? (columnCount <= 2 ? 146 : columnCount <= 3 ? 118 : columnCount <= 7 ? 88 : 72) : (assetCount <= 3 ? 146 : 112)
  const tableY = 158, headerHeight = transposed ? 106 : 76
  const tableBottom = tableY + headerHeight + gridRows * rowHeight
  return { width, height: tableBottom + 28 + (regularity ? 142 : 0), margin, labelWidth, cellWidth, rowHeight, tableY, headerHeight, tableBottom, transposed, gridColumns, gridRows }
}
const imagePercent = value => `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
export function renderRankingImage(result, _title, regularity, presentation = 'current') {
  if (presentation === 'annual') return renderAnnualRankingImage(result)
  const columns = annualColumns(result)
  const descriptions = [
    ...result.assets.filter(a => a.portfolio).map(a => `${a.shortLabel} : ${a.portfolio.lines.map(l => `${l.pct} % ${l.asset.shortLabel ?? l.asset.label}`).join(' + ')} · ${rebalanceLabel(a.portfolio.rebalance)}`),
  ]
  const l = rankingImageLayout(result.assets.length, columns.length, Boolean(regularity))
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = '600 18px Arial, sans-serif'
  const notes = []
  for (const description of descriptions) {
    let line = ''
    for (const word of description.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (line && measure.measureText(next).width > l.width - 120) { notes.push(line); line = word } else line = next
    }
    if (line) notes.push(line)
  }
  if (result.assets.some(a => a.portfolio)) notes.push('Sans flux · frais des fonds inclus · hors courtage, coûts de rééquilibrage et fiscalité')
  const hasPartial = columns.some(c => c.partial)
  l.height += notes.length * 30 + (hasPartial ? 36 : 0)
  const { width, height, margin, labelWidth, cellWidth, rowHeight, tableY, headerHeight, tableBottom, transposed, gridRows } = l
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#071c2b'); bg.addColorStop(.6, '#0b1c2b'); bg.addColorStop(1, '#101e30')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height)
  // Shared, collision-free masthead for short dates and custom month ranges.
  const period = result.mode === 'period' ? `Fin ${formatMonth(result.start, true)} à fin ${formatMonth(result.end, true)}` : columns.length === 1 ? columns[0].label : `${columns[0].label} à ${columns.at(-1).label}`
  fit(ctx, period, margin + 12, 57, 42, width - margin * 2 - 280, INK, 'left', 700)
  text(ctx, 'ÉPARGNANT LIBRE', width - margin - 12, 57, 20, GOLD, 'right', false, 700)
  const basis = basisLabel(result.coverage.basis).replace(/^Indices · /, '')
  fit(ctx, `${result.coverage.currency} · ${basis}`, margin + 12, 103, 22, width - margin * 2 - 24, MUTED, 'left', 400)
  ctx.strokeStyle = '#acc0c92e'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(margin, 139); ctx.lineTo(width - margin, 139); ctx.stroke()
  text(ctx, transposed ? 'Année' : 'Actif', margin + 14, tableY + headerHeight / 2, 26, INK, 'left', false, 700)
  const drawAsset = (asset, _index, x, y, maxWidth, centered = false) => {
    label(ctx, asset.shortLabel ?? asset.label, x, y, maxWidth, transposed ? (cellWidth < 190 ? 27 : 33) : 33, centered ? 'center' : 'left')
  }
  if (transposed) {
    result.assets.forEach((asset, i) => drawAsset(asset, i, margin + labelWidth + (i + .5) * cellWidth, tableY + headerHeight / 2, cellWidth - 24, true))
  } else {
    columns.forEach((column, i) => label(ctx, `${column.label}${column.partial ? '*' : ''}`, margin + labelWidth + (i + .5) * cellWidth, tableY + headerHeight / 2, cellWidth - 16, 27, 'center'))
  }
  for (let i = 0; i < gridRows; i++) {
    if (i % 2 === 0) rounded(ctx, margin, tableY + headerHeight + i * rowHeight + 3, width - margin * 2, rowHeight - 6, '#acc0c90c', null, 10)
  }
  if (transposed) {
    columns.forEach((column, i) => text(ctx, `${column.label}${column.partial ? '*' : ''}`, margin + labelWidth / 2, tableY + headerHeight + (i + .5) * rowHeight, 28, INK, 'center', false, 700))
  } else {
    result.assets.forEach((asset, i) => drawAsset(asset, i, margin + 22, tableY + headerHeight + (i + .5) * rowHeight, labelWidth - 64))
  }
  result.assets.forEach((asset, assetIndex) => {
    columns.forEach((column, columnIndex) => {
      const r = column.rows.find(r => r.id === asset.id)
      const x = margin + labelWidth + (transposed ? assetIndex : columnIndex) * cellWidth
      const y = tableY + headerHeight + (transposed ? columnIndex : assetIndex) * rowHeight
      if (r.rank === 1) rounded(ctx, x + 5, y + 5, cellWidth - 10, rowHeight - 10, '#d1aa3d16', GOLD, 10)
      fit(ctx, imagePercent(r.value), x + cellWidth / 2, y + rowHeight / 2, cellWidth >= 240 ? 38 : 32, cellWidth - 18, r.value < 0 ? '#ff8585' : r.value > 0 ? '#97eaca' : INK, 'center')
    })
  })
  let footerY = tableBottom + 22
  if (hasPartial) {
    const partials = columns.filter(c => c.partial).map(c => `${c.label} : ${c.detail}`).join(' · ')
    fit(ctx, `* Période partielle · clôtures ${partials}`, width / 2, footerY, 18, width - 96, MUTED, 'center')
    footerY += 36
  }
  notes.forEach((note, i) => fit(ctx, note, width / 2, footerY + i * 30, 18, width - 96, MUTED, 'center'))
  footerY += notes.length * 30
  if (regularity) {
    footerY += 26
    fit(ctx, `Première place sur ${regularity.count} périodes glissantes de ${regularity.months / 12} ans · égalités partagées`, width / 2, footerY, 21, width - 96, MUTED, 'center')
    const w = (width - margin * 2) / regularity.stats.length
    regularity.stats.forEach((s, i) => {
      const x = margin + (i + .5) * w
      fit(ctx, s.label, x, footerY + 35, 21, w - 16, COLORS[result.assets.findIndex(a => a.id === s.id)], 'center')
      text(ctx, `${(100 * s.wins / regularity.count).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`, x, footerY + 69, 27, INK, 'center')
    })
  }
  return canvas
}

// The preview and the download call this same canvas renderer with the same result.
export function renderAnnualRankingImage(result) {
  const columns = annualRankingColumns(result)
  const canvas = document.createElement('canvas')
  const measure = canvas.getContext('2d')
  const initial = annualRankingLayout(result.assets.length, columns.length)
  const nameHeight = Math.max(...columns.flatMap(column => column.rows.map(row => {
    const plan = annualNameLines(measure, row.label, initial.cellWidth - initial.gap - 24)
    return plan.rows.length * (plan.size + 3)
  })))
  const l = annualRankingLayout(result.assets.length, columns.length, nameHeight)
  canvas.width = l.width; canvas.height = l.height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0b1c2b'; ctx.fillRect(0, 0, l.width, l.height)
  text(ctx, 'Classement annuel', l.margin, 46, 38, INK, 'left', true, 700)
  text(ctx, columns.length === 1 ? columns[0].label : `${columns[0].label} — ${columns.at(-1).label}`, l.width - l.margin, 46, 28, GOLD, 'right')
  fit(ctx, `${result.coverage.currency} · ${basisLabel(result.coverage.basis)}`, l.margin, 98, 23, l.width - 2 * l.margin, MUTED, 'left', 400)
  ctx.strokeStyle = '#acc0c940'; ctx.beginPath(); ctx.moveTo(l.margin, 130); ctx.lineTo(l.width - l.margin, 130); ctx.stroke()
  text(ctx, 'Rang', l.margin + l.rankWidth / 2 - 5, l.tableY + l.headerHeight / 2, 19, MUTED, 'center')
  for (let rank = 0; rank < result.assets.length; rank++) {
    text(ctx, String(rank + 1), l.margin + l.rankWidth / 2 - 5, l.tableY + l.headerHeight + (rank + .5) * l.rowHeight, 32, MUTED, 'center')
  }
  columns.forEach((column, col) => {
    const x = l.margin + l.rankWidth + col * l.cellWidth
    text(ctx, column.label, x + l.cellWidth / 2, l.tableY + l.headerHeight / 2, 30, INK, 'center', false, 700)
    column.rows.forEach((row, index) => {
      const y = l.tableY + l.headerHeight + index * l.rowHeight
      const w = l.cellWidth - l.gap, h = l.rowHeight - l.gap
      rounded(ctx, x + l.gap / 2, y + l.gap / 2, w, h, row.color, null, 10)
      const color = contrastText(row.color), cx = x + l.cellWidth / 2
      const lines = annualNameLines(ctx, row.label, w - 24)
      lines.rows.forEach((line, i) => text(ctx, line, cx, y + 18 + lines.size / 2 + i * (lines.size + 3), lines.size, color, 'center', false, 700))
      text(ctx, annualImagePercent(row.value), cx, y + l.rowHeight - 49, 43, color, 'center', false, 700)
      if (row.tied) text(ctx, `${row.rank} ex æquo`, cx, y + l.rowHeight - 19, 17, color, 'center', false, 500)
    })
  })
  text(ctx, 'Épargnant Libre', l.width - l.margin, l.height - 20, 20, MUTED, 'right', true, 400)
  return canvas
}

export function annualNameLines(ctx, value, width) {
  // Keep the complete, unambiguous name: no ellipsis and no canvas maxWidth compression.
  for (let size = 29; size >= 18; size--) {
    ctx.font = `700 ${size}px Arial, sans-serif`
    const rows = []; let line = ''
    for (const word of value.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > width) { rows.push(line); line = word } else line = next
    }
    if (line) rows.push(line)
    if (rows.length * (size + 3) <= 104 && rows.every(row => ctx.measureText(row).width <= width)) return { rows, size }
  }
  throw new Error(`Nom trop long pour ce format : ${value}. Réduis le nombre d’années pour agrandir les cases.`)
}

