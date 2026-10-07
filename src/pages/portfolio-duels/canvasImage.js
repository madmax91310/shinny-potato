import { YEARS } from '../../data/portfolio-assets.js'
import { formatCapital, formatPercent } from './lib.js'
import { loadEditorialFont, loadArtImage } from '../tweet-midi/anniversaryArt.js'
import { loadDuelArt, drawDuelArt } from './visualIdentity.js'

const HEADER_SPACE = 80
const W = 1600, H = 1380 + HEADER_SPACE, GOLD = '#e5c48b', INK = '#fff2d7', MUTED = '#ccd0cb'
const CARD_W = 530, CARD_Y = 100, CARD_H = 800
function text(ctx, value, x, y, size, color = INK, editorial = false, align = 'left') {
  ctx.font = editorial ? `500 ${size}px Georgia, serif` : `600 ${size}px Arial, sans-serif`
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.7)'; ctx.shadowBlur=3; ctx.shadowOffsetY=2; ctx.fillText(String(value), x, y); ctx.restore(); ctx.textAlign = 'left'
}
function fitted(ctx, value, x, y, size, width, color = INK, editorial = false, align = 'left') {
  while (size > 22) {
    ctx.font = editorial ? `500 ${size}px Georgia, serif` : `600 ${size}px Arial, sans-serif`
    if (ctx.measureText(value).width <= width) break
    size--
  }
  if (ctx.measureText(value).width > width) throw new Error(`Texte du duel trop long : ${value}`)
  text(ctx, value, x, y, size, color, editorial, align)
}
function label(ctx, value, x, y, width) {
  // Up to two lines, without ellipses: all selected assets remain identifiable.
  for (let size = 37; size >= 26; size--) {
    ctx.font = `500 ${size}px Georgia, serif`
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
function portfolio(ctx, item, images, letter, x, currency, accent, dark) {
  ctx.save(); ctx.fillStyle=dark?'rgba(0,0,0,.05)':'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.roundRect(x+15,CARD_Y+20,CARD_W-30,CARD_H-35,16); ctx.fill(); ctx.restore()
  text(ctx, letter, x + 30, CARD_Y + 24, 22, accent)
  const count = item.assets.length, galleryW = CARD_W - 80, gap = 8, cellW = (galleryW - (count - 1) * gap) / count
  images.forEach((image, i) => drawDuelArt(ctx, image, x + 40 + i * (cellW + gap), 155, cellW, 215))
  rule(ctx, x + 35, 375, CARD_W - 70)
  const top = 396, rowHeight = 78
  item.assets.forEach((asset, i) => {
    const y = top + i * rowHeight
    // Same ordered asset on the plate and in the gallery above it.
    fitted(ctx, `${asset.pct} %`, x + CARD_W - 35, y + 5, 33, 110, accent, true, 'right')
    label(ctx, asset.label, x + 35, y, CARD_W - 175)
  })
  const resultY = 485 + (count-1)*65
  rule(ctx, x + 35, resultY, CARD_W - 70)
  text(ctx, 'Capital final', x + CARD_W / 2, resultY+18, 27, MUTED, true, 'center')
  fitted(ctx, formatCapital(item.final, currency), x + CARD_W / 2, resultY+62, 76, CARD_W - 75, GOLD, true, 'center')
  rule(ctx, x + 35, resultY+158, CARD_W - 70)
  text(ctx, 'Performance cumulée', x + CARD_W / 2, resultY+175, 26, MUTED, true, 'center')
  const performance = (item.final / 10000 - 1) * 100
  fitted(ctx, formatPercent(performance), x + CARD_W / 2, resultY+216, 60, CARD_W - 75, performance < 0 ? '#ffb09c' : '#b3edcc', true, 'center')
}
export async function renderDuelImage(duel) {
  if (!duel) throw new Error('Choisis deux portefeuilles avant de préparer l’image.')
  const years = duel.years ?? YEARS
  const [aImages, bImages, , studio] = await Promise.all([
    Promise.all(duel.a.assets.map(loadDuelArt)), Promise.all(duel.b.assets.map(loadDuelArt)), loadEditorialFont(), loadArtImage('approved/duel-studio.webp'),
  ])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle='#071018'; ctx.fillRect(0,0,W,H)
  ctx.drawImage(studio,0,HEADER_SPACE,W,1067)
  const symbol = duel.currency === 'USD' ? '$' : '€'
  text(ctx, `Début ${years[0]} → Fin ${years.at(-1)}`, W / 2, 30, 39, INK, true, 'center')
  text(ctx, `10 000 ${symbol} au départ · Sans versement supplémentaire`, W / 2, 85, 27, MUTED, false, 'center')
  // Keep the studio plates below the two header lines, including their shadows.
  ctx.save(); ctx.translate(0, HEADER_SPACE)
  portfolio(ctx, duel.a, aImages, 'A', 180, duel.currency, '#9dd9bb', false)
  portfolio(ctx, duel.b, bImages, 'B', 890, duel.currency, GOLD, true)
  text(ctx, 'VS', W / 2, 525, 44, GOLD, true, 'center')
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
  ctx.restore()
  return canvas.toDataURL('image/png')
}
