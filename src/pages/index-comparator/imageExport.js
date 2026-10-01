// Colonnes comparatives : différences d’exposition et parts exactes côte à côte.
import { getIndexComparisonEditorial } from '../../data/index-comparison-editorial.js'
import { getInstrumentPeaStatus } from '../../data/instruments.js'
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
const normalize = text => text.toLowerCase().replace(/\s*\(.*?\)/g, '').replace(/[^\p{L}\p{N}]/gu, '')
export function getIndexImageGroups(family) {
  return family.indices.map(index => family.etfGroups.find(group => normalize(group.indexName) === normalize(index.name)) ?? null)
}
function productName(fund) {
  return fund.name.replace(/\bUCITS ETF\b/gi, '').replace(/\s+/g, ' ').trim()
}
export async function renderIndexImage(family) {
  await document.fonts.ready
  const editorial = getIndexComparisonEditorial(family)
  const columns = Math.min(3, family.indices.length), W = 1440, PAD = 52, GAP = 24
  const WIDTH = (W - PAD * 2 - GAP * (columns - 1)) / columns, INNER = WIDTH - 48
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de générer le visuel.')
  const groups = getIndexImageGroups(family)
  const cards = family.indices.map((index, i) => {
    const displayName = index.name.replace(' (rappel, non-PEA)', '').replace(' (PEA)', '').replace('Émergents global (indice ESG)', 'Émergents ESG')
    font(ctx, 36, 700); const name = lines(ctx, displayName, INNER)
    font(ctx, 29); const points = editorial.visualPoints[i].map(point => lines(ctx, point, INNER))
    const facts = index.indexFacts
    const count = facts?.constituents && facts.metadata?.sourceStatus === 'documented' ? `${facts.constituents.toLocaleString('fr-FR')} valeurs` : null
    const stamp = count && facts.asOf ? facts.asOf.split('-').reverse().join('/') : null
    const funds = (groups[i]?.funds ?? []).map(fund => {
      font(ctx, 30, 700); const name = lines(ctx, productName(fund), INNER)
      return { fund, name, height: name.length * 36 + 132 }
    })
    const topHeight = 28 + name.length * 43 + 26 + points.reduce((sum, rows) => sum + rows.length * 36 + 12, 0) + (count ? 74 : 10)
    return { name, points, count, stamp, funds, topHeight, color: COLORS[i], bottomHeight: 66 + (funds.length ? funds.reduce((sum, fund) => sum + fund.height + 18, 0) : 112) + 25 }
  })
  const rowHeights = []
  for (let i = 0; i < cards.length; i += columns) {
    const row = cards.slice(i, i + columns)
    rowHeights.push(Math.max(...row.map(card => card.topHeight)) + Math.max(...row.map(card => card.bottomHeight)))
  }
  font(ctx, 66, 700); const title = lines(ctx, editorial.imageTitle, W - PAD * 2)
  const HEADER = 112 + title.length * 78 + 75
  const H = Math.ceil(HEADER + rowHeights.reduce((sum, height) => sum + height + GAP, 0) + 112)
  canvas.width = W; canvas.height = H
  ctx.textBaseline = 'top'; ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
  font(ctx, 26, 700); draw(ctx, ['LES INDICES À LA LOUPE'], PAD, 42, 34, '#6ee7b7')
  font(ctx, 66, 700); const end = draw(ctx, title, PAD, 92, 78, INK)
  font(ctx, 30); draw(ctx, ['Ce que tu détiens · les produits pour y accéder'], PAD, end + 14, 38, MUTED)
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
      if (card.stamp) { font(ctx, 23); draw(ctx, [`Composition au ${card.stamp}`], left, y, 29, MUTED) }
    }
    // Le début des références reste aligné dans chaque rangée.
    const sharedTop = Math.max(...cards.slice(row * columns, (row + 1) * columns).map(c => c.topHeight))
    y = top + sharedTop
    ctx.fillStyle = '#344259'; ctx.fillRect(left, y, INNER, 2)
    font(ctx, 24, 700); y = draw(ctx, [family.id === 'crypto' ? 'ETP CITÉS' : family.id === 'or-argent' ? 'ETC CITÉS' : 'ETF CITÉS'], left, y + 18, 30, MUTED) + 16
    for (const product of card.funds) {
      font(ctx, 30, 700); y = draw(ctx, product.name, left, y, 36, INK) + 8
      font(ctx, 29); y = draw(ctx, [product.fund.isin], left, y, 47, MUTED)
      font(ctx, 38, 700); y = draw(ctx, [`${product.fund.ter} / an`], left, y, 46, card.color)
      const pea = getInstrumentPeaStatus(product.fund.isin)
      font(ctx, 25); y = draw(ctx, [pea === null ? 'PEA : statut non établi' : pea ? 'Éligible au PEA' : 'Non éligible au PEA'], left, y, 31, MUTED) + 18
    }
    if (!card.funds.length) { font(ctx, 28); draw(ctx, lines(ctx, 'Pas de produit détaillé dans cette sélection.', INNER), left, y, 36, MUTED) }
  })
  font(ctx, 24); draw(ctx, ['Frais annuels des parts citées · performances dans le tweet associé'], PAD, H - 82, 32, MUTED)
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
