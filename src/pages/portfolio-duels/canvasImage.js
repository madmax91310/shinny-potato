import { HISTORICAL_YEARS as YEARS } from '../../data/annual-window.js'
import { formatCapital, formatPercent } from './lib.js'
import { loadEditorialFont, loadArtImage } from '../tweet-midi/anniversaryArt.js'

const W = 1600, H = 1600
const INK = '#133348', RUST = '#a44625', PAPER = '#f4eee2', MUTED = '#4c565b'
const CARD_W = 700, CARD_Y = 290, CARD_H = 890
function text(ctx, value, x, y, size, color = INK, editorial = false, align = 'left') {
  ctx.font = editorial ? `600 ${size}px Georgia, serif` : `600 ${size}px Arial, sans-serif`
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'
  ctx.fillText(String(value), x, y); ctx.textAlign = 'left'
}
function fitted(ctx, value, x, y, size, width, color = INK, editorial = false, align = 'left') {
  while (size > 22) {
    ctx.font = editorial ? `600 ${size}px Georgia, serif` : `600 ${size}px Arial, sans-serif`
    if (ctx.measureText(value).width <= width) break
    size--
  }
  if (ctx.measureText(value).width > width) throw new Error(`Texte du duel trop long : ${value}`)
  text(ctx, value, x, y, size, color, editorial, align)
}
function label(ctx, value, x, y, width, height, maxSize) {
  // Keep exact identities even in dense manual portfolios; never truncate names.
  for (let size = maxSize; size >= 17; size--) {
    ctx.font = `600 ${size}px Georgia, serif`
    const lines = ['']
    for (const word of value.split(' ')) {
      const i = lines.length - 1, next = [lines[i], word].filter(Boolean).join(' ')
      if (lines[i] && ctx.measureText(next).width > width) lines.push(word)
      else lines[i] = next
    }
    const lineH = size + 5
    if (lines.length <= 3 && lines.length * lineH <= height && lines.every(line => ctx.measureText(line).width <= width)) {
      const top = y + (height - lines.length * lineH) / 2
      lines.forEach((line, i) => text(ctx, line, x, top + i * lineH, size, INK, true))
      return
    }
  }
  throw new Error(`Nom du support trop long : ${value}`)
}
function rule(ctx, x, y, width) {
  ctx.strokeStyle = '#b9ac97'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.stroke()
}
function sheet(ctx, x, y, w, h, color = PAPER, depth = 8) {
  ctx.save()
  ctx.shadowColor = 'rgba(61,42,24,.22)'; ctx.shadowBlur = depth * 2; ctx.shadowOffsetY = depth
  ctx.fillStyle = color; ctx.beginPath()
  // Chamfered corners, a bright edge and cast shadows give paper layers depth.
  const cut = 22
  ctx.moveTo(x + cut, y); ctx.lineTo(x + w - cut, y); ctx.lineTo(x + w, y + cut)
  ctx.lineTo(x + w, y + h - cut); ctx.lineTo(x + w - cut, y + h)
  ctx.lineTo(x + cut, y + h); ctx.lineTo(x, y + h - cut); ctx.lineTo(x, y + cut)
  ctx.closePath(); ctx.fill()
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2; ctx.stroke()
  ctx.restore()
}
function portfolio(ctx, item, letter, x, currency, accent, maxCount) {
  sheet(ctx, x, CARD_Y + 8, CARD_W, CARD_H, '#d7cbbb', 7)
  sheet(ctx, x, CARD_Y, CARD_W, CARD_H, 'rgba(250,246,237,.95)', 7)
  sheet(ctx, x, CARD_Y, CARD_W, 115, accent, 3)
  text(ctx, letter, x + 35, CARD_Y + 12, 84, PAPER, true)
  text(ctx, 'Allocation', x + 150, CARD_Y + 36, 40, PAPER, true)
  const top = 432, areaH = 385, rowH = areaH / maxCount
  item.assets.forEach((asset, i) => {
    const y = top + i * rowH
    label(ctx, asset.label, x + 36, y, CARD_W - 218, rowH - 10, maxCount > 3 ? 35 : 44)
    fitted(ctx, `${asset.pct} %`, x + CARD_W - 34, y + (rowH - 43) / 2, 43, 140, accent, true, 'right')
    if (i < item.assets.length - 1) rule(ctx, x + 36, y + rowH - 5, CARD_W - 72)
  })
  rule(ctx, x + 35, 837, CARD_W - 70)
  text(ctx, 'Capital final', x + CARD_W / 2, 857, 34, INK, true, 'center')
  fitted(ctx, formatCapital(item.final, currency), x + CARD_W / 2, 905, 91, CARD_W - 65, INK, true, 'center')
  sheet(ctx, x + 2, 1023, CARD_W - 4, 155, accent, 4)
  text(ctx, 'Performance cumulée', x + CARD_W / 2, 1040, 32, PAPER, true, 'center')
  fitted(ctx, formatPercent((item.final / 10000 - 1) * 100), x + CARD_W / 2, 1085, 73, CARD_W - 70, PAPER, true, 'center')
}
export async function renderDuelImage(duel) {
  if (!duel) throw new Error('Choisis deux portefeuilles avant de préparer l’image.')
  const years = duel.years ?? YEARS
  const [, background] = await Promise.all([loadEditorialFont(), loadArtImage('duel-paper/ivory-corners.webp')])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.drawImage(background, 0, 0, W, H)
  text(ctx, `Début ${years[0]} → Fin ${years.at(-1)}`, W / 2, 70, 78, INK, true, 'center')
  const symbol = duel.currency === 'USD' ? '$' : '€'
  fitted(ctx, `10 000 ${symbol} au départ · Sans versement supplémentaire`, W / 2, 190, 34, 1410, INK, false, 'center')
  const maxCount = Math.max(duel.a.assets.length, duel.b.assets.length)
  portfolio(ctx, duel.a, 'A', 70, duel.currency, INK, maxCount)
  portfolio(ctx, duel.b, 'B', 830, duel.currency, RUST, maxCount)
  const difference = duel.b.final - duel.a.final
  const gap = Math.abs(difference) < .5 ? 'Même capital final à l’euro près'
    : `${formatCapital(Math.abs(difference), duel.currency)} de plus pour ${difference > 0 ? 'B' : 'A'}`
  fitted(ctx, gap, W / 2, 1208, 34, W - 150, INK, true, 'center')
  sheet(ctx, 70, 1270, 1460, 196, 'rgba(250,246,237,.95)', 5)
  const labelW = 80, colW = (1460 - labelW) / years.length
  ctx.fillStyle = INK; ctx.fillRect(72 + labelW, 1272, 1456 - labelW, 53)
  text(ctx, 'A', 110, 1343, 36, INK, true, 'center')
  text(ctx, 'B', 110, 1403, 36, RUST, true, 'center')
  years.forEach((year, i) => {
    const center = 70 + labelW + (i + .5) * colW
    text(ctx, year, center, 1280, 34, PAPER, true, 'center')
    fitted(ctx, `A ${formatPercent(duel.a.annual[year])}`, center, 1344, 33, colW - 20, INK, false, 'center')
    fitted(ctx, `B ${formatPercent(duel.b.annual[year])}`, center, 1404, 33, colW - 20, RUST, false, 'center')
  })
  rule(ctx, 72, 1389, 1456)
  fitted(ctx, `En ${duel.currency} · Revenus réinvestis · Rééquilibrage annuel · Hors courtage et fiscalité`, W / 2, 1487, 26, 1460, MUTED, false, 'center')
  text(ctx, 'Les performances passées ne préjugent pas des performances futures.', W / 2, 1525, 24, MUTED, false, 'center')
  text(ctx, 'Épargnant Libre', W / 2, 1560, 30, INK, true, 'center')
  return canvas.toDataURL('image/png')
}
