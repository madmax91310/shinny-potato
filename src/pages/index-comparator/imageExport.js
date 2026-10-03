// Colonnes comparatives consacrées aux indices et à leur composition.
import { getIndexComparisonEditorial } from '../../data/index-comparison-editorial.js'
const BG = '#0b1426', CARD = '#152238', INK = '#f3f5f7', MUTED = '#acbbcd'
const COLORS = ['#6ee7b7', '#f2cc80', '#8fc5ff', '#c4afff', '#f6afa2']
const FONT = 'Arial, "Helvetica Neue", sans-serif'
function font(ctx, size, weight = 400, family = FONT) { ctx.font = `${weight} ${size}px ${family}` }
function lines(ctx, text, width) {
  return String(text).split('\n').flatMap(paragraph => {
    const output = []; let row = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = row ? `${row} ${word}` : word
      if (ctx.measureText(next).width > width && row) { output.push(row); row = word } else row = next
    }
    if (row) output.push(row)
    return output
  })
}
function draw(ctx, rows, x, y, height, color) {
  ctx.fillStyle = color
  rows.forEach((row, i) => ctx.fillText(row, x, y + i * height))
  return y + rows.length * height
}
// N’afficher que les photographies documentées du registre commun.
export function getIndexImageFacts(index) {
  const facts = index.indexFacts
  if (facts?.metadata?.sourceStatus !== 'documented') return null
  const numericRows = rows => (rows ?? []).filter(([, value]) => Number.isFinite(value) && value >= 0 && value <= 100)
  return {
    count: facts.constituents,
    asOf: facts.asOf,
    countries: numericRows(facts.countries).slice(0, 3),
    sectors: numericRows(facts.sectors).slice(0, 3),
  }
}
const cleanLabel = label => label.replace(/^[^\p{L}\p{N}]+/u, '').trim()
const percent = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
export async function renderIndexImage(family) {
  await document.fonts.ready
  const editorial = getIndexComparisonEditorial(family)
  const columns = Math.min(3, family.indices.length), W = 1440, PAD = 52, GAP = 24
  const WIDTH = (W - PAD * 2 - GAP * (columns - 1)) / columns, INNER = WIDTH - 48
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de générer le visuel.')
  const cards = family.indices.map((index, i) => {
    const displayName = index.name.replace(' (rappel, non-PEA)', '').replace(' (PEA)', '').replace('Émergents global (indice ESG)', 'Émergents ESG')
    font(ctx, 36, 700); const name = lines(ctx, displayName, INNER)
    font(ctx, 29); const points = editorial.visualPoints[i].map(point => lines(ctx, point, INNER))
    const facts = getIndexImageFacts(index)
    const stamp = facts?.asOf ? facts.asOf.split('-').reverse().join('/') : null
    const allocations = [['PRINCIPAUX PAYS', facts?.countries], ['PRINCIPAUX SECTEURS', facts?.sectors]].filter(([, rows]) => rows?.length).map(([label, rows]) => ({ label, rows: rows.map(([name, value]) => {
      font(ctx, 25); return { name: lines(ctx, cleanLabel(name), INNER - 105), value }
    }) }))
    return { name, points, count: facts?.count ?? null, stamp, allocations, color: COLORS[i] }
  })
  // Chaque rangée partage les mêmes positions pour les titres, chiffres et catégories.
  const rows = []
  for (let i = 0; i < cards.length; i += columns) {
    const row = cards.slice(i, i + columns)
    const nameHeight = Math.max(...row.map(c => c.name.length * 43))
    const pointHeight = Math.max(...row.map(c => c.points.reduce((sum, point) => sum + point.length * 36 + 8, 0)))
    const countOffset = 28 + nameHeight + 24 + pointHeight + 12
    let sectionOffset = countOffset + (row.some(c => c.count) ? 128 : 12)
    const sections = ['PRINCIPAUX PAYS', 'PRINCIPAUX SECTEURS'].map(label => {
      const offset = sectionOffset
      const maxRows = Math.max(...row.map(c => c.allocations.find(s => s.label === label)?.rows.length ?? 0))
      const heights = Array.from({ length: maxRows }, (_, n) => Math.max(...row.map(c => (c.allocations.find(s => s.label === label)?.rows[n]?.name.length ?? 1) * 30 + 26)))
      if (maxRows) sectionOffset += 54 + heights.reduce((sum, height) => sum + height, 0) + 18
      return { label, offset, heights, active: maxRows > 0 }
    })
    rows.push({ countOffset, sections, height: sectionOffset + 24 })
  }
  font(ctx, 62, 700); const title = lines(ctx, editorial.imageTitle, W - PAD * 2)
  const stamps = [...new Set(cards.map(card => card.stamp).filter(Boolean))]
  const commonStamp = stamps.length === 1 && cards.every(card => card.stamp) ? stamps[0] : null
  const HEADER = 50 + title.length * 74 + (commonStamp ? 75 : 40)
  const H = Math.ceil(HEADER + rows.reduce((sum, row) => sum + row.height + GAP, 0) + 72)
  canvas.width = W; canvas.height = H
  ctx.textBaseline = 'top'; ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
  ctx.textAlign = 'center'
  font(ctx, 62, 700); draw(ctx, title, W / 2, 50, 74, INK)
  if (commonStamp) { font(ctx, 22); draw(ctx, [`Composition au ${commonStamp}`], W / 2, 50 + title.length * 74 + 12, 28, MUTED) }
  ctx.textAlign = 'left'
  let top = HEADER
  cards.forEach((card, i) => {
    const rowIndex = Math.floor(i / columns), column = i % columns, row = rows[rowIndex]
    if (column === 0 && rowIndex > 0) top += rows[rowIndex - 1].height + GAP
    const x = PAD + column * (WIDTH + GAP), left = x + 24, center = x + WIDTH / 2
    ctx.fillStyle = CARD; ctx.beginPath(); ctx.roundRect(x, top, WIDTH, row.height, 16); ctx.fill()
    ctx.fillStyle = card.color; ctx.fillRect(x, top, WIDTH, 5)
    ctx.textAlign = 'center'
    font(ctx, 36, 700); let y = draw(ctx, card.name, center, top + 28, 43, card.color)
    const nameHeight = Math.max(...cards.slice(rowIndex * columns, (rowIndex + 1) * columns).map(c => c.name.length * 43))
    y = top + 28 + nameHeight + 24
    font(ctx, 29)
    for (const point of card.points) y = draw(ctx, point, center, y, 36, INK) + 8
    if (card.count) {
      font(ctx, 68, 700); draw(ctx, [card.count.toLocaleString('fr-FR')], center, top + row.countOffset, 78, card.color)
      font(ctx, 25); draw(ctx, ['valeurs dans l’indice'], center, top + row.countOffset + 78, 32, MUTED)
    }
    if (card.stamp && !commonStamp) { font(ctx, 22); draw(ctx, [card.stamp], center, top + row.countOffset + 111, 28, MUTED) }
    ctx.textAlign = 'left'
    for (const sectionLayout of row.sections.filter(s => s.active)) {
      const section = card.allocations.find(s => s.label === sectionLayout.label)
      if (!section) continue
      y = top + sectionLayout.offset + 12
      font(ctx, 23, 700); y = draw(ctx, [section.label], left, y, 34, MUTED) + 8
      for (let n = 0; n < section.rows.length; n++) {
        const entry = section.rows[n]
        font(ctx, 25); draw(ctx, entry.name, left, y, 30, INK)
        font(ctx, 26, 700); ctx.textAlign = 'right'; draw(ctx, [percent(entry.value)], left + INNER, y, 30, card.color); ctx.textAlign = 'left'
        const barY = y + sectionLayout.heights[n] - 20
        ctx.fillStyle = '#344259'; ctx.fillRect(left, barY, INNER, 5)
        ctx.fillStyle = card.color; ctx.fillRect(left, barY, INNER * entry.value / 100, 5)
        y += sectionLayout.heights[n]
      }
    }
  })
  font(ctx, 27, 700); ctx.textAlign = 'right'; draw(ctx, ['@epargnantlibre'], W - PAD, H - 42, 34, INK)
  return canvas
}
export async function downloadIndexImage(family) {
  const canvas = await renderIndexImage(family)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Impossible de générer le PNG')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `comparateur-indices-${family.id}.png`
  document.body.append(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
