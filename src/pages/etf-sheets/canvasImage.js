import { loadArtImage, loadEditorialFont, drawTitaniumMark } from '../tweet-midi/anniversaryArt.js'
import { getETFArt } from './visualIdentity.js'
import { getAnnualPerformance, performanceEntries, performanceImageHeading } from './annualPerformance.js'

const W = 1600, H = 2000, PAD = 100, INK = '#fff4da', MUTED = '#bdc8cf', PAPER = '#061522', GOLD = '#e6bf79'
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
    lines = wrap(ctx, text, width); lineHeight = Math.ceil(size * (editorial ? 1.4 : 1.2))
    if (lines.length * lineHeight <= height && lines.every(line => ctx.measureText(line).width <= width)) break
  }
  if (size < min) throw new Error(`Le texte est trop long pour l’image : ${text}`)
  ctx.fillStyle = color
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight))
  return lines.length * lineHeight
}
function rule(ctx, y) {
  ctx.strokeStyle = '#b18d55'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
}
function fact(ctx, label, value, x, y, width, height = 112) {
  block(ctx, label, x, y, width, 50, { size: 40, min: 36, color: MUTED, weight: 400 })
  block(ctx, value, x, y + 58, width, height, { size: 60, min: 28, weight: 600 })
}
export async function renderETFImage(etf) {
  const art = getETFArt(etf.id)
  const [scene, mark] = await Promise.all([
    art.scene ? loadArtImage(art.scene) : null,
    art.mark ? loadArtImage(art.mark) : null,
    loadEditorialFont(),
  ])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d'); ctx.textBaseline = 'top'
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H)
  // Illustrations contain no financial text. Identity mapping stays explicit.
  const hero = document.createElement('canvas'); hero.width = W; hero.height = 1000
  const hctx = hero.getContext('2d')
  if (scene) {
    const scale = Math.min(W / scene.width, 900 / scene.height)
    const dw = scene.width * scale, dh = scene.height * scale
    hctx.drawImage(scene, W - dw, 0, dw, dh)
    hctx.globalCompositeOperation = 'destination-in'
    const edge = hctx.createLinearGradient(W - dw, 0, W - dw + 180, 0)
    edge.addColorStop(0, 'transparent'); edge.addColorStop(1, '#fff')
    hctx.fillStyle = edge; hctx.fillRect(0, 0, W, 1000)
    const bottom = hctx.createLinearGradient(0, 550, 0, 900)
    bottom.addColorStop(0, '#fff'); bottom.addColorStop(1, 'transparent')
    hctx.fillStyle = bottom; hctx.fillRect(0, 0, W, 1000)
    ctx.drawImage(hero, 0, 0)
  } else {
    const glow = ctx.createRadialGradient(1210, 300, 10, 1210, 300, 600)
    glow.addColorStop(0, '#364b59'); glow.addColorStop(.6, '#122e42'); glow.addColorStop(1, PAPER)
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 850)
  }
  if (mark) {
    ctx.save(); ctx.shadowColor = 'rgba(230,191,121,.35)'; ctx.shadowBlur = 50
    drawTitaniumMark(ctx, mark, 960, 170, 480, 440); ctx.restore()
  }
  // A quiet title surface protects contrast even on bright thematic scenes.
  const shade = ctx.createLinearGradient(0, 0, 1150, 0)
  shade.addColorStop(0, 'rgba(6,21,34,.94)'); shade.addColorStop(.65, 'rgba(6,21,34,.82)'); shade.addColorStop(1, 'rgba(6,21,34,0)')
  const titleShade = document.createElement('canvas'); titleShade.width = W; titleShade.height = 850
  const tctx = titleShade.getContext('2d'); tctx.fillStyle = shade; tctx.fillRect(0, 0, W, 850)
  tctx.globalCompositeOperation = 'destination-in'
  const feather = tctx.createLinearGradient(0, 0, 0, 850)
  feather.addColorStop(0, 'transparent'); feather.addColorStop(.22, '#fff'); feather.addColorStop(.75, '#fff'); feather.addColorStop(1, 'transparent')
  tctx.fillStyle = feather; tctx.fillRect(0, 0, W, 850); ctx.drawImage(titleShade, 0, 0)
  for (let y = 1000; y < H; y += 4) {
    ctx.strokeStyle = 'rgba(137,166,186,.025)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y - 180); ctx.stroke()
  }
  block(ctx, 'ÉPARGNANT LIBRE', PAD, 65, 600, 42, { size: 34, weight: 600, color: GOLD })
  ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.moveTo(PAD, 125); ctx.lineTo(520, 125); ctx.stroke()
  const issuer = etf.name.match(/^(Amundi(?: PEA)?|iShares(?: Core| Edge)?|Xtrackers(?: II)?|(?:State Street )?SPDR|Vanguard|L&G|VanEck|Global X|CoinShares|Invesco|WisdomTree|Bitwise|21Shares)\s+/)
  const name = issuer ? `${issuer[1]}\n${etf.name.slice(issuer[0].length)}` : etf.name
  const legal = name.match(/\s+(UCITS ETF.*)$/)
  const title = legal ? name.slice(0, legal.index) : name
  const titleHeight = block(ctx, title, PAD, 185, 890, 340, { size: 112, min: 60, editorial: true })
  if (legal) block(ctx, legal[1], PAD, Math.min(540, 200 + titleHeight), 900, 70, { size: 32, min: 26, color: MUTED })
  if (etf.listing) block(ctx, etf.listing.ticker, PAD, 620, 650, 64, { size: 56, color: GOLD, weight: 600 })
  ctx.textAlign = 'right'
  block(ctx, `ISIN ${etf.isin}`, W - PAD, 630, 650, 60, { size: 42, color: GOLD })
  ctx.textAlign = 'left'
  rule(ctx, 700)
  block(ctx, 'Frais annuels', PAD, 725, 540, 55, { size: 40, color: MUTED, weight: 600 })
  block(ctx, etf.ter, PAD, 780, 500, 100, { size: 88, weight: 600, editorial: true, color: GOLD })
  const accounts = [etf.pea === true ? 'PEA' : null, etf.cto ? 'CTO' : 'CTO indisponible'].filter(Boolean).join(' · ')
  ctx.textAlign = 'right'; block(ctx, accounts, W - PAD, 795, 700, 90, { size: 64, weight: 600, color: GOLD }); ctx.textAlign = 'left'
  rule(ctx, 910)
  const right = 840, col = 660
  fact(ctx, String(etf.positions).startsWith('Exposition suivie') ? 'Exposition' : 'Positions', String(etf.positions).replace(/^Exposition suivie\s*:\s*/, ''), PAD, 940, col, 130)
  fact(ctx, 'Distribution', etf.distribution, right, 940, col, 130)
  rule(ctx, 1130)
  const comma = etf.location.indexOf(',')
  const domicile = comma < 0 ? etf.location : etf.location.slice(0, comma)
  const replication = comma < 0 ? 'Non documentée' : etf.location.slice(comma + 1).trim().replace(/^réplication\s+/i, '')
  fact(ctx, 'Réplication / adossement', replication, PAD, 1160, col, 130)
  fact(ctx, 'Domicile', domicile, right, 1160, col, 130)
  rule(ctx, 1350)
  fact(ctx, 'Cotation', etf.listing ? `${etf.listing.exchange} · ${etf.listing.currency}` : 'Non documentée', PAD, 1380, col, 102)
  // The image shows only the amount; evidence dates and scope stay in the source data.
  const aumAmount = String(etf.aum)
    .replace(/^(?:Part|Fonds)\s*:\s*/i, '')
    .replace(/\s+(?:au\s+\d{2}\/\d{2}\/\d{4}|\(relevé le [^)]+\))\s*$/i, '')
    .trim()
    .replace(/\d[\d \u00a0\u202f]*,\d+/g, amount => Number(amount.replace(/[ \u00a0\u202f]/g, '').replace(',', '.')).toLocaleString('fr-FR', { maximumFractionDigits: 0 }))
  fact(ctx, 'Encours', aumAmount, right, 1380, col, 102)
  const annual = getAnnualPerformance(etf)
  if (annual) {
    rule(ctx, 1540)
    block(ctx, performanceImageHeading(annual), PAD, 1565, 1400, 54, { size: 40, weight: 600 })
    const entries = performanceEntries(annual)
    const gap = 20, cellWidth = (1400 - 2 * gap) / 3, cellHeight = 120
    entries.forEach(({ label, value }, index) => {
      const x = PAD + (index % 3) * (cellWidth + gap), y = 1625 + Math.floor(index / 3) * (cellHeight + 10)
      const surface = ctx.createLinearGradient(x, y, x, y + cellHeight)
      surface.addColorStop(0, value < 0 ? '#29303a' : '#123044'); surface.addColorStop(1, '#071925')
      ctx.fillStyle = surface
      ctx.beginPath(); ctx.roundRect(x, y, cellWidth, cellHeight, 14); ctx.fill()
      ctx.strokeStyle = value < 0 ? '#a27d6c' : '#426880'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.textAlign = 'center'
      block(ctx, label, x + cellWidth / 2, y + 8, cellWidth - 44, 48, { size: 40, weight: 600, color: MUTED })
      const performance = `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
      block(ctx, performance, x + cellWidth / 2, y + 50, cellWidth - 44, 78, { size: 68, min: 58, weight: 700, color: value > 0 ? '#9bebb4' : value < 0 ? '#ff998b' : INK })
      ctx.textAlign = 'left'
    })
    if (!annual.values.some(Number.isFinite)) {
      block(ctx, annual.note, PAD, entries.length ? 1780 : 1640, 1400, entries.length ? 95 : 220, { size: 32, min: 30, color: MUTED })
    }
  }
  rule(ctx, 1895)
  ctx.textAlign = 'center'
  block(ctx, 'Pas un conseil financier', W / 2, 1920, 1400, 40, { size: 30, color: MUTED })
  return canvas
}
