import { YEARS } from '../../data/portfolio-assets.js'
import { formatCapital, formatPercent } from './lib.js'
import { loadEditorialFont } from '../tweet-midi/anniversaryArt.js'
import { loadDuelArt, drawDuelArt } from './visualIdentity.js'

const W = 1600, H = 1380, GOLD = '#e5c48b', INK = '#fff2d7', MUTED = '#ccd0cb'
const CARD_W = 665, CARD_Y = 142, CARD_H = 884
function text(ctx, value, x, y, size, color = INK, editorial = false, align = 'left') {
  ctx.font = editorial ? `500 ${size}px ExportEditorial, Georgia, serif` : `600 ${size}px Arial, sans-serif`
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'
  ctx.fillText(String(value), x, y); ctx.textAlign = 'left'
}
function fitted(ctx, value, x, y, size, width, color = INK, editorial = false, align = 'left') {
  while (size > 22) {
    ctx.font = editorial ? `500 ${size}px ExportEditorial, Georgia, serif` : `600 ${size}px Arial, sans-serif`
    if (ctx.measureText(value).width <= width) break
    size--
  }
  if (ctx.measureText(value).width > width) throw new Error(`Texte du duel trop long : ${value}`)
  text(ctx, value, x, y, size, color, editorial, align)
}
function label(ctx, value, x, y, width) {
  // Up to two lines, without ellipses: all selected assets remain identifiable.
  for (let size = 37; size >= 26; size--) {
    ctx.font = `500 ${size}px ExportEditorial, Georgia, serif`
    const lines = ['']
    for (const word of value.split(' ')) {
      const i = lines.length - 1, next = [lines[i], word].filter(Boolean).join(' ')
      if (lines[i] && ctx.measureText(next).width > width) lines.push(word)
      else lines[i] = next
    }
    if (lines.length <= 2 && lines.every(line => ctx.measureText(line).width <= width)) {
      lines.forEach((line, i) => text(ctx, line, x, y + i * (size + 5), size, INK, true))
      return
    }
  }
  throw new Error(`Nom du support trop long : ${value}`)
}
function rule(ctx, x, y, width, color = '#957e57') {
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.stroke()
}
function surface(ctx, x, accent, dark) {
  // The plate is drawn independently of its data: engraved edges, metal grain,
  // extrusion and studio shadow remain identical for every composition.
  ctx.save(); ctx.shadowColor = '#000'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 18
  const edge = ctx.createLinearGradient(x, CARD_Y, x + CARD_W, CARD_Y + CARD_H)
  edge.addColorStop(0, '#fff0cc'); edge.addColorStop(.25, accent); edge.addColorStop(.6, '#4b473e'); edge.addColorStop(1, GOLD)
  ctx.fillStyle = edge; ctx.beginPath(); ctx.roundRect(x - 7, CARD_Y - 7, CARD_W + 14, CARD_H + 19, 26); ctx.fill(); ctx.restore()
  const face = ctx.createLinearGradient(x, CARD_Y, x + CARD_W, CARD_Y + CARD_H)
  face.addColorStop(0, dark ? '#343b3d' : '#555d60'); face.addColorStop(.2, dark ? '#19232a' : '#303c43')
  face.addColorStop(.52, '#101d29'); face.addColorStop(.8, dark ? '#1b2329' : '#3c464c'); face.addColorStop(1, '#162029')
  ctx.fillStyle = face; ctx.beginPath(); ctx.roundRect(x, CARD_Y, CARD_W, CARD_H, 22); ctx.fill()
  ctx.save(); ctx.clip()
  for (let y = CARD_Y; y < CARD_Y + CARD_H; y += 3) {
    ctx.strokeStyle = y % 9 === 0 ? 'rgba(237,230,205,.045)' : 'rgba(0,0,0,.045)'
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CARD_W, y - 3); ctx.stroke()
  }
  ctx.restore(); ctx.strokeStyle = accent; ctx.lineWidth = 2
  ctx.beginPath(); ctx.roundRect(x + 10, CARD_Y + 10, CARD_W - 20, CARD_H - 20, 15); ctx.stroke()
}
function portfolio(ctx, item, images, letter, x, currency, accent, dark) {
  surface(ctx, x, accent, dark)
  text(ctx, letter, x + 27, CARD_Y + 24, 27, accent)
  const count = item.assets.length, galleryW = CARD_W - 70, gap = 8, cellW = (galleryW - (count - 1) * gap) / count
  images.forEach((image, i) => drawDuelArt(ctx, image, x + 35 + i * (cellW + gap), 190, cellW, 240))
  rule(ctx, x + 35, 425, CARD_W - 70)
  const top = 449, rowHeight = 88
  item.assets.forEach((asset, i) => {
    const y = top + i * rowHeight
    // Same ordered asset on the plate and in the gallery above it.
    fitted(ctx, `${asset.pct} %`, x + CARD_W - 35, y + 5, 40, 130, accent, true, 'right')
    label(ctx, asset.label, x + 35, y, CARD_W - 220)
  })
  rule(ctx, x + 35, 720, CARD_W - 70)
  text(ctx, 'Capital final', x + CARD_W / 2, 740, 29, MUTED, true, 'center')
  fitted(ctx, formatCapital(item.final, currency), x + CARD_W / 2, 783, 86, CARD_W - 75, GOLD, true, 'center')
  rule(ctx, x + 35, 887, CARD_W - 70)
  text(ctx, 'Performance cumulée', x + CARD_W / 2, 902, 27, MUTED, true, 'center')
  const performance = (item.final / 10000 - 1) * 100
  fitted(ctx, formatPercent(performance), x + CARD_W / 2, 943, 66, CARD_W - 75, performance < 0 ? '#ffb09c' : '#b3edcc', true, 'center')
}
export async function renderDuelImage(duel) {
  if (!duel) throw new Error('Choisis deux portefeuilles avant de préparer l’image.')
  const years = duel.years ?? YEARS
  const [aImages, bImages] = await Promise.all([
    Promise.all(duel.a.assets.map(loadDuelArt)), Promise.all(duel.b.assets.map(loadDuelArt)), loadEditorialFont(),
  ])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const backdrop = ctx.createLinearGradient(0, 0, W, H)
  backdrop.addColorStop(0, '#16232b'); backdrop.addColorStop(.45, '#050d15'); backdrop.addColorStop(1, '#29302e')
  ctx.fillStyle = backdrop; ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(1260, 0, 0, 1260, 0, 1100)
  glow.addColorStop(0, 'rgba(221,175,88,.2)'); glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
  // A sober plinth joins the cards without giving either side a winner's pedestal.
  const floor = ctx.createLinearGradient(0, 995, 0, 1090)
  floor.addColorStop(0, '#777063'); floor.addColorStop(.12, '#232b2e'); floor.addColorStop(1, '#09131c')
  ctx.fillStyle = floor; ctx.fillRect(35, 1012, W - 70, 82)
  const symbol = duel.currency === 'USD' ? '$' : '€'
  text(ctx, `Début ${years[0]} → Fin ${years.at(-1)}`, W / 2, 30, 39, INK, true, 'center')
  text(ctx, `10 000 ${symbol} au départ · Sans versement supplémentaire`, W / 2, 85, 27, MUTED, false, 'center')
  portfolio(ctx, duel.a, aImages, 'A', 70, duel.currency, '#9dd9bb', false)
  portfolio(ctx, duel.b, bImages, 'B', 865, duel.currency, GOLD, true)
  text(ctx, 'VS', W / 2, 562, 40, GOLD, true, 'center')
  const difference = duel.b.final - duel.a.final
  const gap = Math.abs(difference) < .5 ? 'Même capital final à l’euro près'
    : `${formatCapital(Math.abs(difference), duel.currency)} de plus pour ${difference > 0 ? 'B' : 'A'}`
  fitted(ctx, gap, W / 2, 1050, 34, W - 150, GOLD, true, 'center')
  rule(ctx, 70, 1108, W - 140)
  const colW = (W - 140) / years.length
  years.forEach((year, i) => {
    const center = 70 + (i + .5) * colW
    text(ctx, year, center, 1123, 26, MUTED, false, 'center')
    fitted(ctx, `A ${formatPercent(duel.a.annual[year])}`, center, 1164, 32, colW - 20, '#b3edcc', false, 'center')
    fitted(ctx, `B ${formatPercent(duel.b.annual[year])}`, center, 1209, 32, colW - 20, GOLD, false, 'center')
  })
  rule(ctx, 70, 1261, W - 140)
  text(ctx, `En ${duel.currency} · Revenus réinvestis · Rééquilibrage annuel · Hors courtage et fiscalité`, W / 2, 1279, 22, MUTED, false, 'center')
  text(ctx, 'Les performances passées ne préjugent pas des performances futures.', W / 2, 1312, 20, MUTED, false, 'center')
  text(ctx, 'Épargnant Libre', W / 2, 1346, 23, GOLD, true, 'center')
  return canvas.toDataURL('image/png')
}
