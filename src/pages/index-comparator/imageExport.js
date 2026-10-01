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
    sectors: numericRows(facts.sectors).slice(0, 2),
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
    const count = facts?.count ? `${facts.count.toLocaleString('fr-FR')} valeurs` : null
    const stamp = facts?.asOf ? facts.asOf.split('-').reverse().join('/') : null
    const allocations = [['PRINCIPAUX PAYS', facts?.countries], ['PRINCIPAUX SECTEURS', facts?.sectors]].filter(([, rows]) => rows?.length).map(([label, rows]) => ({ label, rows: rows.map(([name, value]) => {
      font(ctx, 25); return { name: lines(ctx, cleanLabel(name), INNER - 105), value }
    }) }))
    const dataHeight = allocations.reduce((sum, section) => sum + 46 + section.rows.reduce((total, entry) => total + entry.name.length * 30 + 24, 0), 0)
    const topHeight = 28 + name.length * 43 + 26 + points.reduce((sum, rows) => sum + rows.length * 36 + 12, 0) + (count ? 74 : 10) + dataHeight
    return { name, points, count, stamp, allocations, topHeight, color: COLORS[i] }
  })
  const rowHeights = []
  for (let i = 0; i < cards.length; i += columns) {
    const row = cards.slice(i, i + columns)
    rowHeights.push(Math.max(...row.map(card => card.topHeight)) + 32)
  }
  font(ctx, 66, 700); const title = lines(ctx, editorial.imageTitle, W - PAD * 2)
  const HEADER = 112 + title.length * 78 + 75
  const H = Math.ceil(HEADER + rowHeights.reduce((sum, height) => sum + height + GAP, 0) + 112)
  canvas.width = W; canvas.height = H
  ctx.textBaseline = 'top'; ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
  font(ctx, 26, 700); draw(ctx, ['LES INDICES À LA LOUPE'], PAD, 42, 34, '#6ee7b7')
  font(ctx, 66, 700); const end = draw(ctx, title, PAD, 92, 78, INK)
  font(ctx, 30); draw(ctx, ['Composition des indices · poids des pays et secteurs'], PAD, end + 14, 38, MUTED)
  let top = HEADER
  cards.forEach((card, i) => {
    const row = Math.floor(i / columns), column = i % columns
    if (column === 0 && row > 0) top += rowHeights[row - 1] + GAP
    const x = PAD + column * (WIDTH + GAP), left = x + 24
    ctx.fillStyle = CARD; ctx.fillRect(x, top, WIDTH, rowHeights[row])
    ctx.fillStyle = card.color; ctx.fillRect(x, top, WIDTH, 5)
    font(ctx, 36, 700); let y = draw(ctx, card.name, left, top + 28, 43, card.color) + 26
    font(ctx, 29)
    for (const point of card.points) y = draw(ctx, point, left, y, 36, INK) + 12
    if (card.count) {
      font(ctx, 34, 700); y = draw(ctx, [card.count], left, y + 4, 42, card.color)
      if (card.stamp) { font(ctx, 23); y = draw(ctx, [`Composition au ${card.stamp}`], left, y, 29, MUTED) }
    }
    for (const section of card.allocations) {
      font(ctx, 23, 700); y = draw(ctx, [section.label], left, y + 12, 34, MUTED)
      for (const entry of section.rows) {
        font(ctx, 25); draw(ctx, entry.name, left, y, 30, INK)
        font(ctx, 26, 700); ctx.textAlign = 'right'; draw(ctx, [percent(entry.value)], left + INNER, y, 30, card.color); ctx.textAlign = 'left'
        y += entry.name.length * 30 + 6
        ctx.fillStyle = '#344259'; ctx.fillRect(left, y, INNER, 5)
        ctx.fillStyle = card.color; ctx.fillRect(left, y, INNER * entry.value / 100, 5)
        y += 18
      }
    }

  })
  font(ctx, 24); draw(ctx, ['Sources et références dans le tweet · secteurs selon chaque fournisseur'], PAD, H - 82, 32, MUTED)
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
