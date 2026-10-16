import { COLORS } from './data.js'
import { annualColumns, basisLabel, formatMonth, formatPercent, rebalanceLabel } from './engine.js'

const INK = '#f5eddb', MUTED = '#acc0c9', GOLD = '#e7c879'
function text(ctx, value, x, y, size, color = INK, align = 'left', serif = false) {
  ctx.font = `600 ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y)
}
function fit(ctx, value, x, y, size, width, color = INK, align = 'left') {
  while (size > 16) { ctx.font = `600 ${size}px Arial, sans-serif`; if (ctx.measureText(value).width <= width) break; size-- }
  if (ctx.measureText(value).width > width) {
    while (value.length > 1 && ctx.measureText(`${value}…`).width > width) value = value.slice(0, -1)
    value += '…'
  }
  text(ctx, value, x, y, size, color, align)
}
function rounded(ctx, x, y, w, h, fill, stroke, radius = 14) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius)
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke() }
}
// Draw the trophy directly so PNGs do not depend on installed emoji fonts.
function trophy(ctx, x, y, size = 25) {
  ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 30, size / 30)
  ctx.fillStyle = GOLD; ctx.strokeStyle = GOLD; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(7, 3); ctx.lineTo(23, 3); ctx.lineTo(22, 13); ctx.quadraticCurveTo(15, 25, 8, 13); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(7, 5); ctx.lineTo(2, 5); ctx.quadraticCurveTo(1, 15, 9, 15); ctx.moveTo(23, 5); ctx.lineTo(28, 5); ctx.quadraticCurveTo(29, 15, 21, 15); ctx.stroke()
  ctx.fillRect(13, 19, 4, 7); ctx.fillRect(8, 26, 14, 3); ctx.restore()
}
function label(ctx, value, x, y, maxWidth) {
  ctx.font = '600 27px Arial, sans-serif'
  const words = value.split(' '), rows = []; let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) { rows.push(line); line = word } else line = next
  }
  if (line) rows.push(line)
  const shown = rows.length > 2 ? [rows[0], rows.slice(1).join(' ')] : rows
  shown.forEach((v, i) => fit(ctx, v, x, y + (i - (shown.length - 1) / 2) * 34, 27, maxWidth))
}
export function rankingImageLayout(assetCount, columnCount, regularity = false) {
  const margin = 48, labelWidth = 340
  const width = Math.max(1180, margin * 2 + labelWidth + columnCount * 172)
  const cellWidth = (width - margin * 2 - labelWidth) / columnCount
  const rowHeight = assetCount <= 3 ? 132 : 116
  const tableY = 230, headerHeight = 78
  const tableBottom = tableY + headerHeight + assetCount * rowHeight
  return { width, height: tableBottom + 94 + (regularity ? 142 : 0), margin, labelWidth, cellWidth, rowHeight, tableY, headerHeight, tableBottom }
}
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
  const { width, height, margin, labelWidth, cellWidth, rowHeight, tableY, headerHeight, tableBottom } = l
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#071c2b'); bg.addColorStop(.6, '#0b1c2b'); bg.addColorStop(1, '#101e30')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height)
  // Subtle engraved leaf and centered masthead, with no editorial title.
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(width / 2 - 9, 53); ctx.quadraticCurveTo(width / 2 - 24, 31, width / 2 - 21, 22); ctx.quadraticCurveTo(width / 2, 26, width / 2, 49)
  ctx.moveTo(width / 2, 55); ctx.quadraticCurveTo(width / 2 + 3, 23, width / 2 + 24, 17); ctx.quadraticCurveTo(width / 2 + 29, 40, width / 2, 55); ctx.stroke()
  text(ctx, 'ÉPARGNANT LIBRE', width / 2, 96, 38, INK, 'center', true)
  const period = result.mode === 'period' ? `Fin ${formatMonth(result.start, true)} — fin ${formatMonth(result.end, true)}` : columns.length === 1 ? columns[0].label : `${columns[0].label} — ${columns.at(-1).label}`
  text(ctx, period, width / 2, 153, 27, INK, 'center', true)
  const basis = basisLabel(result.coverage.basis).replace(/^Indices · /, '')
  fit(ctx, `${result.coverage.currency} · ${basis}`, width / 2, 193, 22, width - 100, MUTED, 'center')
  rounded(ctx, margin, tableY, width - margin * 2, tableBottom - tableY, '#ffffff04', '#526672')
  text(ctx, 'Actif', margin + 30, tableY + headerHeight / 2, 25, INK)
  columns.forEach((column, i) => {
    const x = margin + labelWidth + (i + .5) * cellWidth
    text(ctx, `${column.label}${column.partial ? '*' : ''}`, x, tableY + headerHeight / 2, 27, INK, 'center', true)
  })
  for (let i = 0; i <= result.assets.length; i++) {
    const y = tableY + headerHeight + i * rowHeight
    ctx.strokeStyle = '#51657166'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(width - margin, y); ctx.stroke()
  }
  for (let i = 0; i < columns.length; i++) {
    const x = margin + labelWidth + i * cellWidth
    ctx.beginPath(); ctx.moveTo(x, tableY); ctx.lineTo(x, tableBottom); ctx.stroke()
  }
  result.assets.forEach((asset, row) => {
    const y = tableY + headerHeight + row * rowHeight
    ctx.fillStyle = COLORS[row]; ctx.beginPath(); ctx.arc(margin + 28, y + rowHeight / 2, 9, 0, Math.PI * 2); ctx.fill()
    label(ctx, asset.shortLabel ?? asset.label, margin + 51, y + rowHeight / 2, labelWidth - 73)
    columns.forEach((column, col) => {
      const r = column.rows.find(r => r.id === asset.id), x = margin + labelWidth + col * cellWidth
      if (r.rank === 1) {
        rounded(ctx, x + 5, y + 5, cellWidth - 10, rowHeight - 10, '#d1aa3d16', GOLD, 12)
        trophy(ctx, x + cellWidth / 2, y + rowHeight * .25)
      }
      fit(ctx, formatPercent(r.value), x + cellWidth / 2, y + rowHeight * (r.rank === 1 ? .65 : .5), 29, cellWidth - 20, r.value < 0 ? '#ff8585' : r.value > 0 ? '#97eaca' : INK, 'center')
    })
  })
  let footerY = tableBottom + 38
  trophy(ctx, width / 2 - 220, footerY, 23)
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
