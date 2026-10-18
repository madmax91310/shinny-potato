import { COLORS } from './data.js'
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
  const words = value.split(' '), rows = []; let line = ''
  // Prefer a modest size adjustment before splitting a single long word.
  do {
    ctx.font = `700 ${size}px Arial, sans-serif`
    if (words.every(word => ctx.measureText(word).width <= maxWidth) || size <= 24) break
    size--
  } while (size > 23)
  for (let word of words) {
    // Wrap long single-word names too, rather than shrinking them to a tiny label.
    if (ctx.measureText(word).width > maxWidth && line) { rows.push(line); line = '' }
    while (ctx.measureText(word).width > maxWidth && word.length > 1) {
      let cut = Math.ceil(word.length / 2)
      while (cut > 1 && ctx.measureText(`${word.slice(0, cut)}-`).width > maxWidth) cut--
      rows.push(`${word.slice(0, cut)}-`); word = word.slice(cut)
    }
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) { rows.push(line); line = word } else line = next
  }
  if (line) rows.push(line)
  const shown = rows.length > 2 ? [rows[0], rows.slice(1).join(' ')] : rows
  shown.forEach((v, i) => fit(ctx, v, x, y + (i - (shown.length - 1) / 2) * (size + 7), size, maxWidth, INK, align, 700))
}
export function rankingImageLayout(assetCount, columnCount, regularity = false) {
  // Keep exports readable in the feed instead of widening with every year.
  const transposed = columnCount >= 4 && (assetCount <= 3 || columnCount >= 5)
  const width = 1200, margin = 42
  const labelWidth = transposed ? 132 : (columnCount === 1 ? 510 : 330)
  const gridColumns = transposed ? assetCount : columnCount
  const gridRows = transposed ? columnCount : assetCount
  const cellWidth = (width - margin * 2 - labelWidth) / gridColumns
  const rowHeight = transposed ? (columnCount <= 7 ? 100 : 82) : (assetCount <= 3 ? 146 : 116)
  const tableY = 190, headerHeight = transposed ? 120 : 76
  const tableBottom = tableY + headerHeight + gridRows * rowHeight
  return { width, height: tableBottom + 94 + (regularity ? 142 : 0), margin, labelWidth, cellWidth, rowHeight, tableY, headerHeight, tableBottom, transposed, gridColumns, gridRows }
}
const imagePercent = value => `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
export function renderRankingImage(result, _title, regularity) {
  const columns = annualColumns(result)
  const descriptions = [
    ...(result.assets.some(a => a.fxConverted) ? ['Conversion BCE de fin de mois · sans couverture de change'] : []),
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
  l.height += notes.length * 30 + (columns.some(c => c.partial) && notes.length ? 30 : 0)
  const { width, height, margin, labelWidth, cellWidth, rowHeight, tableY, headerHeight, tableBottom, transposed, gridColumns, gridRows } = l
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#071c2b'); bg.addColorStop(.6, '#0b1c2b'); bg.addColorStop(1, '#101e30')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height)
  // Compact masthead leaves the image primarily to the comparison.
  text(ctx, 'ÉPARGNANT LIBRE', width / 2, 49, 29, GOLD, 'center', true)
  const period = result.mode === 'period' ? `Fin ${formatMonth(result.start, true)} — fin ${formatMonth(result.end, true)}` : columns.length === 1 ? columns[0].label : `${columns[0].label} — ${columns.at(-1).label}`
  text(ctx, period, width / 2, 106, 34, INK, 'center', true)
  const basis = basisLabel(result.coverage.basis).replace(/^Indices · /, '')
  fit(ctx, `${result.coverage.currency} · ${basis}`, width / 2, 150, 22, width - 100, MUTED, 'center')
  rounded(ctx, margin, tableY, width - margin * 2, tableBottom - tableY, '#ffffff04', '#526672')
  rounded(ctx, margin, tableY, width - margin * 2, headerHeight, '#ffffff09', null)
  text(ctx, transposed ? 'Année' : 'Actif', margin + 20, tableY + headerHeight / 2, 25)
  const drawAsset = (asset, index, x, y, maxWidth, centered = false) => {
    ctx.fillStyle = COLORS[index]; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill()
    // Reserve a full row for the marker above two-line column names.
    label(ctx, asset.shortLabel ?? asset.label, centered ? x : x + 22, centered ? y + 55 : y, maxWidth, transposed ? 31 : 33, centered ? 'center' : 'left')
  }
  if (transposed) {
    result.assets.forEach((asset, i) => drawAsset(asset, i, margin + labelWidth + (i + .5) * cellWidth, tableY + 22, cellWidth - 20, true))
  } else {
    columns.forEach((column, i) => label(ctx, `${column.label}${column.partial ? '*' : ''}`, margin + labelWidth + (i + .5) * cellWidth, tableY + headerHeight / 2, cellWidth - 16, 27, 'center'))
  }
  for (let i = 0; i <= gridRows; i++) {
    const y = tableY + headerHeight + i * rowHeight
    ctx.strokeStyle = '#51657166'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(width - margin, y); ctx.stroke()
  }
  for (let i = 0; i < gridColumns; i++) {
    const x = margin + labelWidth + i * cellWidth
    ctx.beginPath(); ctx.moveTo(x, tableY); ctx.lineTo(x, tableBottom); ctx.stroke()
  }
  if (transposed) {
    columns.forEach((column, i) => text(ctx, `${column.label}${column.partial ? '*' : ''}`, margin + labelWidth / 2, tableY + headerHeight + (i + .5) * rowHeight, 27, INK, 'center', true))
  } else {
    result.assets.forEach((asset, i) => drawAsset(asset, i, margin + 22, tableY + headerHeight + (i + .5) * rowHeight, labelWidth - 64))
  }
  result.assets.forEach((asset, assetIndex) => {
    columns.forEach((column, columnIndex) => {
      const r = column.rows.find(r => r.id === asset.id)
      const x = margin + labelWidth + (transposed ? assetIndex : columnIndex) * cellWidth
      const y = tableY + headerHeight + (transposed ? columnIndex : assetIndex) * rowHeight
      if (r.rank === 1) rounded(ctx, x + 5, y + 5, cellWidth - 10, rowHeight - 10, '#d1aa3d20', null, 8)
      fit(ctx, imagePercent(r.value), x + cellWidth / 2, y + rowHeight / 2, cellWidth >= 240 ? 38 : 32, cellWidth - 18, r.value < 0 ? '#ff8585' : r.value > 0 ? '#97eaca' : INK, 'center')
    })
  })
  let footerY = tableBottom + 38
  rounded(ctx, width / 2 - 230, footerY - 9, 18, 18, '#d1aa3d40', null, 3)
  text(ctx, 'Meilleure performance de l’année', width / 2 + 15, footerY, 21, MUTED, 'center')
  if (columns.some(c => c.partial)) {
    const partials = columns.filter(c => c.partial).map(c => `${c.label} : ${c.detail}`).join(' · ')
    fit(ctx, `* Période partielle · clôtures ${partials}`, width / 2, footerY + 32, 18, width - 96, MUTED, 'center')
  }
  const notesY = tableBottom + 80 + (columns.some(c => c.partial) ? 30 : 0)
  notes.forEach((note, i) => fit(ctx, note, width / 2, notesY + i * 30, 18, width - 96, MUTED, 'center'))
  if (regularity) {
    footerY += 90 + notes.length * 30
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
