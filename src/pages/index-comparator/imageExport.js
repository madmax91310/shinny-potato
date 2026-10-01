// Le visuel explique les différences d’exposition. Les références des fonds et
// leurs historiques détaillés restent dans le tweet assorti.
import { getIndexComparisonEditorial } from '../../data/index-comparison-editorial.js'
const PALETTE = { paper: '#f5f2e8', ink: '#0f2930', muted: '#586c6c', line: '#d6ded6', emerald: '#05766a', gold: '#d2ae70', brand: '#0c554e' }
const COLORS = [PALETTE.emerald, '#be754e', '#467888', '#77678b', '#9b7055']
const FONT = 'Arial, "Helvetica Neue", sans-serif'
function font(ctx, size, weight = 400) { ctx.font = `${weight} ${size}px ${FONT}` }
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
export async function renderIndexImage(family) {
  await document.fonts.ready
  const editorial = getIndexComparisonEditorial(family)
  const W = 1080, PAD = 64, INNER = W - PAD * 2
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de générer le visuel.')
  font(ctx, 52, 700)
  const title = lines(ctx, editorial.imageTitle, INNER)
  const cards = family.indices.map((index, i) => {
    font(ctx, 34, 700); const name = lines(ctx, index.name, INNER - 64)
    font(ctx, 30); const description = lines(ctx, editorial.exposures[i], INNER - 64)
    return { name, description, color: COLORS[i % COLORS.length], height: 52 + name.length * 42 + 14 + description.length * 40 }
  })
  font(ctx, 29); const takeaway = lines(ctx, editorial.takeaway, INNER)
  const headerHeight = 150 + title.length * 62 + 64
  const H = headerHeight + cards.reduce((sum, card) => sum + card.height + 22, 0) + 108 + takeaway.length * 39 + 120
  canvas.width = W; canvas.height = H
  ctx.textBaseline = 'top'; ctx.fillStyle = PALETTE.paper; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = PALETTE.gold; ctx.fillRect(0, 0, W, 10)
  font(ctx, 23, 700); draw(ctx, ['COMPARATEUR D’INDICES'], PAD, 50, 30, PALETTE.brand)
  font(ctx, 52, 700); let y = draw(ctx, title, PAD, 108, 62, PALETTE.ink)
  font(ctx, 27); draw(ctx, [`${family.indices.length} expositions · ce qui change dans le portefeuille`], PAD, y + 25, 34, PALETTE.muted)
  y = headerHeight
  for (const card of cards) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(PAD, y, INNER, card.height)
    ctx.fillStyle = card.color; ctx.fillRect(PAD, y, 6, card.height)
    font(ctx, 34, 700); const end = draw(ctx, card.name, PAD + 30, y + 25, 42, card.color)
    font(ctx, 30); draw(ctx, card.description, PAD + 30, end + 14, 40, PALETTE.ink)
    y += card.height + 22
  }
  ctx.fillStyle = PALETTE.line; ctx.fillRect(PAD, y + 10, INNER, 2)
  font(ctx, 24, 700); draw(ctx, ['LE POINT À RETENIR'], PAD, y + 38, 30, PALETTE.brand)
  font(ctx, 29); y = draw(ctx, takeaway, PAD, y + 80, 39, PALETTE.ink)
  font(ctx, 22); draw(ctx, ['Fonds, frais et performances : détails dans le texte associé.'], PAD, y + 27, 30, PALETTE.muted)
  ctx.fillStyle = PALETTE.brand; ctx.fillRect(0, H - 62, W, 62)
  font(ctx, 24, 700); ctx.textAlign = 'center'; draw(ctx, ['@epargnantlibre'], W / 2, H - 44, 30, PALETTE.paper)
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
