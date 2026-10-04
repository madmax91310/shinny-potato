import { loadArtImage, loadEditorialFont, drawTitaniumMark } from '../tweet-midi/anniversaryArt.js'
import { getETFArt } from './visualIdentity.js'
import { annualPerformanceRange, getAnnualPerformance } from './annualPerformance.js'

const W = 1600, H = 2000, PAD = 100, INK = '#252822', MUTED = '#45473f', PAPER = '#eeede7'
const sans = size => `${size}px Arial, sans-serif`
function wrap(ctx, text, width) {
  if (String(text).includes('\n')) return String(text).split('\n').flatMap(line => wrap(ctx, line, width))
  const lines = []; let line = ''
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word } else line = next
  }
  if (line) lines.push(line)
  return lines
}
// Measured text keeps long names and dated evidence complete, without truncation.
function block(ctx, text, x, y, width, height, { size = 34, min = 22, editorial = false, color = INK, weight = 400 } = {}) {
  let lines, lineHeight
  for (; size >= min; size--) {
    ctx.font = editorial ? `500 ${size}px ExportEditorial, Georgia, serif` : `${weight} ${sans(size)}`
    lines = wrap(ctx, text, width); lineHeight = Math.ceil(size * 1.2)
    if (lines.length * lineHeight <= height && lines.every(line => ctx.measureText(line).width <= width)) break
  }
  if (size < min) throw new Error(`Le texte est trop long pour l’image : ${text}`)
  ctx.fillStyle = color
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight))
}
function rule(ctx, y) {
  ctx.strokeStyle = '#b4b0a4'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
}
function fact(ctx, label, value, x, y, width, height = 112) {
  block(ctx, label.toLocaleUpperCase('fr'), x, y, width, 40, { size: 30, min: 28, color: MUTED, weight: 600 })
  block(ctx, value, x, y + 50, width, height, { size: 48, min: 28, weight: 600 })
}
export async function renderETFImage(etf) {
  const art = getETFArt(etf.id)
  const [scene, mark] = await Promise.all([
    loadArtImage(art.scene || 'titanium.webp'),
    art.mark ? loadArtImage(art.mark) : null,
    loadEditorialFont(),
  ])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d'); ctx.textBaseline = 'top'
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H)
  // No baked financial data; only the selected local scene is loaded.
  const hero = document.createElement('canvas'); hero.width = W; hero.height = 460
  const hctx = hero.getContext('2d')
  const sh = art.scene?.startsWith('etf/') ? scene.height : scene.height / 2
  const scale = Math.min(1400 / scene.width, 460 / sh)
  const dw = scene.width * scale, dh = sh * scale, dx = (W - dw) / 2
  hctx.drawImage(scene, 0, 0, scene.width, sh, dx, 0, dw, dh)
  hctx.globalCompositeOperation = 'destination-in'
  const edges = hctx.createLinearGradient(dx, 0, dx + dw, 0)
  edges.addColorStop(0, 'transparent'); edges.addColorStop(.12, '#fff'); edges.addColorStop(.88, '#fff'); edges.addColorStop(1, 'transparent')
  hctx.fillStyle = edges; hctx.fillRect(0, 0, W, 460)
  const bottom = hctx.createLinearGradient(0, 280, 0, 460)
  bottom.addColorStop(0, '#fff'); bottom.addColorStop(1, 'transparent')
  hctx.fillStyle = bottom; hctx.fillRect(0, 0, W, 460)
  ctx.drawImage(hero, 0, 0)
  if (mark) drawTitaniumMark(ctx, mark, 610, 100, 380, 330)
  const fade = ctx.createLinearGradient(0, 320, 0, 600)
  fade.addColorStop(0, 'rgba(238,237,231,0)'); fade.addColorStop(1, PAPER)
  ctx.fillStyle = fade; ctx.fillRect(0, 320, W, 280)
  for (let y = 600; y < H; y += 3) {
    ctx.fillStyle = y % 9 === 0 ? 'rgba(75,72,57,.025)' : 'rgba(255,255,255,.06)'
    ctx.fillRect(0, y, W, 1)
  }
  block(ctx, 'ÉPARGNANT LIBRE', PAD, 65, 600, 42, { size: 34, weight: 600 })
  const issuer = etf.name.match(/^(Amundi(?: PEA)?|iShares(?: Core| Edge)?|Xtrackers(?: II)?|(?:State Street )?SPDR|Vanguard|L&G|VanEck|Global X|CoinShares|Invesco|WisdomTree|Bitwise|21Shares)\s+/)
  const name = issuer ? `${issuer[1]}\n${etf.name.slice(issuer[0].length)}` : etf.name
  block(ctx, name, PAD, 470, 1400, 270, { size: 96, min: 64, editorial: true })
  if (etf.listing) block(ctx, etf.listing.ticker, PAD, 770, 1400, 50, { size: 40, color: MUTED, weight: 600 })
  rule(ctx, 850)
  block(ctx, 'FRAIS ANNUELS', PAD, 880, 540, 40, { size: 30, color: MUTED, weight: 600 })
  block(ctx, etf.ter, PAD, 925, 500, 72, { size: 64, weight: 600 })
  const accounts = [etf.pea === true ? 'PEA' : null, etf.cto ? 'CTO' : 'CTO indisponible'].filter(Boolean).join(' · ')
  ctx.textAlign = 'right'; block(ctx, accounts, W - PAD, 925, 700, 72, { size: 48, weight: 600 }); ctx.textAlign = 'left'
  rule(ctx, 1000)
  const right = 840, col = 660
  fact(ctx, 'Positions', etf.positions, PAD, 1030, col, 108)
  fact(ctx, 'Distribution', etf.distribution, right, 1030, col, 108)
  const comma = etf.location.indexOf(',')
  const domicile = comma < 0 ? etf.location : etf.location.slice(0, comma)
  const replication = comma < 0 ? 'Non documentée' : etf.location.slice(comma + 1).trim().replace(/^réplication\s+/i, '')
  fact(ctx, 'Réplication / adossement', replication, PAD, 1200, col, 122)
  fact(ctx, 'Domicile', domicile, right, 1200, col, 122)
  fact(ctx, 'Cotation', etf.listing ? `${etf.listing.exchange} · ${etf.listing.currency}` : 'Non documentée', PAD, 1380, col, 112)
  fact(ctx, 'Encours', etf.aum, right, 1380, col, 112)
  const annual = getAnnualPerformance(etf)
  if (annual) {
    rule(ctx, 1520)
    block(ctx, `PERFORMANCES ANNUELLES · ${annualPerformanceRange(annual)} · ${annual.currency}`, PAD, 1545, 1400, 42, { size: 30, weight: 600 })
    const entries = annual.values.map((value, index) => ({ year: 2020 + index, value })).filter(item => Number.isFinite(item.value))
    const gap = 20, cellWidth = (1400 - 2 * gap) / 3, cellHeight = 130
    entries.forEach(({ year, value }, index) => {
      const x = PAD + (index % 3) * (cellWidth + gap), y = 1600 + Math.floor(index / 3) * (cellHeight + gap)
      ctx.fillStyle = value > 0 ? '#e0e9df' : value < 0 ? '#f0e1db' : '#e4e3dc'
      ctx.beginPath(); ctx.roundRect(x, y, cellWidth, cellHeight, 14); ctx.fill()
      block(ctx, String(year), x + 22, y + 14, cellWidth - 44, 38, { size: 30, weight: 600, color: MUTED })
      const performance = `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
      block(ctx, performance, x + 22, y + 52, cellWidth - 44, 78, { size: 64, min: 58, weight: 700, color: value > 0 ? '#226641' : value < 0 ? '#a13d35' : INK })
    })
  }
  rule(ctx, 1895)
  block(ctx, `ISIN ${etf.isin}`, PAD, 1920, 650, 40, { size: 30, color: MUTED })
  ctx.textAlign = 'right'
  block(ctx, 'Pas un conseil en investissement', W - PAD, 1920, 750, 40, { size: 30, color: MUTED })
  return canvas
}
