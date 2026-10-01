import { formatHouseholdNumber, getHouseholdVisual } from '../../data/household-statistics.js'

const PALETTES = {
  ivory: { bg: '#fffaf3', ink: '#171714', accent: '#c64e36', inactive: '#c8c3ba', muted: '#57564e', panel: '#eee9e1' },
  blue: { bg: '#2452ed', ink: '#ffffff', accent: '#2452ed', inactive: '#dce3fb', muted: '#ffffff', panel: '#ffffff' },
  plum: { bg: '#f2e8d8', ink: '#482239', accent: '#482239', inactive: '#cdbbab', muted: '#634f56', panel: '#482239' },
}
function font(ctx, size, bold = false, family = 'Arial, sans-serif') { ctx.font = `${bold ? 'bold ' : ''}${size}px ${family}` }
function text(ctx, value, x, y, size, color, bold = false, family) {
  font(ctx, size, bold, family); ctx.fillStyle = color; ctx.fillText(value, x, y)
}
function lines(ctx, value, width) {
  const result = []; let line = ''
  for (const word of value.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > width) { result.push(line); line = word } else line = next
  }
  if (line) result.push(line)
  return result
}
function paragraph(ctx, value, x, y, width, { size = 30, min = 22, maxLines = 2, height = 1.25, color, bold = false, family } = {}) {
  font(ctx, size, bold, family)
  let result = lines(ctx, value, width)
  while (result.length > maxLines && size > min) {
    size = Math.max(min, size - 2); font(ctx, size, bold, family); result = lines(ctx, value, width)
  }
  ctx.fillStyle = color
  result.forEach((line, i) => ctx.fillText(line, x, y + i * size * height))
}
function metric(ctx, value, x, y, width, size, color) {
  font(ctx, size, true)
  while (ctx.measureText(value).width > width && size > 50) { size -= 2; font(ctx, size, true) }
  ctx.fillStyle = color; ctx.fillText(value, x, y)
}
function person(ctx, x, y, size, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + size / 2, y + size * .13, size * .115, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.roundRect(x + size * .26, y + size * .32, size * .48, size * .4, size * .14); ctx.fill()
  ctx.fillRect(x + size * .29, y + size * .64, size * .17, size * .34)
  ctx.fillRect(x + size * .54, y + size * .64, size * .17, size * .34)
}
function grid(ctx, x, y, width, count, active, inactive, { columns = 10, squares = false, rowHeight } = {}) {
  const step = width / columns
  for (let i = 0; i < 100; i++) {
    const xx = x + i % columns * step, yy = y + Math.floor(i / columns) * (rowHeight ?? step), color = i < count ? active : inactive
    if (squares) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(xx + 5, yy + 5, step - 10, step - 10, 4); ctx.fill() }
    else person(ctx, xx + step * .13, yy, step * .74, color)
  }
}
function panel(ctx, x, y, width, height, color, rounded = false) {
  ctx.fillStyle = color
  if (rounded) { ctx.beginPath(); ctx.roundRect(x, y, width, height, 32); ctx.fill() } else ctx.fillRect(x, y, width, height)
}
function groupLabel(record) {
  if (record.kind === 'share') return 'les moins dotés'
  if (record.kind === 'threshold') return record.populationPercent === 10 ? 'au-dessus du seuil' : 'sous la médiane'
  return 'Environ.'
}
export function renderNewHouseholdImage(record, design) {
  const p = PALETTES[design]
  if (!p) throw new Error('Design inconnu.')
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Le navigateur ne permet pas de générer cette image.')
  panel(ctx, 0, 0, 1080, 1440, p.bg)
  const blue = design === 'blue', plum = design === 'plum'
  if (plum) panel(ctx, 0, 0, 1080, 444, p.panel)
  if (design === 'ivory') panel(ctx, 64, 140, 952, 8, p.accent)
  paragraph(ctx, record.headline, 64, plum ? 222 : blue ? 226 : 252, 952, { size: plum ? 75 : blue ? 65 : 78, min: 52, maxLines: 2, height: 1.15, color: plum ? p.bg : p.ink, bold: !plum, family: plum ? 'Georgia, serif' : undefined })
  const grids = getHouseholdVisual(record)
  if (record.kind === 'comparison') {
    grids.forEach((item, i) => {
      const x = 64 + i * 502
      metric(ctx, item.exact, x, plum ? 574 : 528, 450, 105, p.ink)
      paragraph(ctx, item.label, x, plum ? 635 : 591, 450, { size: 30, color: p.ink, bold: true })
      const y = plum ? 719 : 680
      panel(ctx, x, y, 450, 465, blue ? p.panel : plum ? '#e8daca' : p.panel, blue)
      grid(ctx, x + 16, y + 26, 418, item.count, p.accent, p.inactive, { squares: blue })
    })
  } else {
    const value = `${formatHouseholdNumber(record.value)} ${record.unit === 'EUR' ? '€' : '%'}`
    metric(ctx, value, blue ? 52 : 64, plum ? 620 : blue ? 534 : 566, 952, plum ? 164 : blue ? 205 : 191, p.ink)
    paragraph(ctx, record.metricLabel, 64, plum ? 682 : blue ? 601 : 627, 952, { size: 35, min: 28, color: p.ink })
    if (plum) {
      panel(ctx, 64, 746, 952, 3, '#bc6e86')
      grid(ctx, 64, 796, 952, grids[0].count, p.accent, p.inactive, { columns: 20, rowHeight: 75 })
      const rounded = record.kind === 'rate' ? `Environ ${grids[0].count} ${record.population} sur 100.` : grids[0].label
      paragraph(ctx, rounded, 64, 1220, 952, { size: 37, min: 28, color: p.ink, bold: true })
    } else {
      const y = blue ? 680 : 712
      panel(ctx, 64, y, 952, blue ? 564 : 537, p.panel, blue)
      grid(ctx, blue ? 104 : 470, y + 28, blue ? 490 : 515, grids[0].count, p.accent, p.inactive, { squares: blue })
      const x = blue ? 646 : 100, ink = blue ? '#15234c' : p.ink
      text(ctx, `${record.kind === 'rate' && blue ? '≈ ' : ''}${grids[0].count}`, x - 9, y + 165, blue ? 85 : 143, p.accent, true)
      text(ctx, 'sur 100', x, y + 228, blue ? 40 : 47, ink, true)
      text(ctx, record.population, x, y + 279, blue ? 33 : 36, ink)
      paragraph(ctx, groupLabel(record), x, y + 432, blue ? 284 : 330, { size: 26, min: 24, color: p.accent, bold: true })
    }
  }
  ctx.textAlign = 'right'; text(ctx, '@epargnantlibre', 1016, 1420, 23, p.muted, true)
  return canvas.toDataURL('image/png')
}
