import { ETFS, loadSheetRecord } from './records.js'
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
export async function renderETFImage(etf) {
  if(ETFS.some(item=>item.id===etf.id)) await loadSheetRecord(etf.id)
  const art = getETFArt(etf.id)
  const [scene, mark] = await Promise.all([
    art.scene ? loadArtImage(art.scene) : null,
    art.mark ? loadArtImage(art.mark) : null,
    loadEditorialFont(),
  ])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d'); ctx.textBaseline = 'top'
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H)
  // Approved A: compact illustration; all facts remain live text on the canvas.
  if (scene) {
    const scale = Math.min(1100 / scene.width, 550 / scene.height)
    const dw = scene.width * scale, dh = scene.height * scale
    ctx.drawImage(scene, W - dw, 0, dw, dh)
  }
  if (mark) drawTitaniumMark(ctx, mark, 1110, 120, 350, 340)
  const shade = ctx.createLinearGradient(0, 0, 1250, 0)
  shade.addColorStop(0, PAPER); shade.addColorStop(.65, 'rgba(6,21,34,.96)'); shade.addColorStop(1, 'rgba(6,21,34,0)')
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, 550)
  block(ctx, 'ÉPARGNANT LIBRE', PAD, 55, 650, 48, { size: 34, weight: 600, color: GOLD })
  const issuer = etf.name.match(/^(Amundi(?: PEA)?|iShares(?: Core| Edge)?|Xtrackers(?: II)?|(?:State Street )?SPDR|Vanguard|L&G|VanEck|Global X|CoinShares|Invesco|WisdomTree|Bitwise|21Shares)\s+/)
  const name = issuer ? `${issuer[1]}\n${etf.name.slice(issuer[0].length)}` : etf.name
  const legal = name.match(/\s+(UCITS ETF.*)$/)
  block(ctx, legal ? name.slice(0, legal.index) : name, PAD, 135, 1020, 300, { size: 94, min: 38, editorial: true })
  if (legal) block(ctx, legal[1], PAD, 445, 1000, 70, { size: 32, min: 26, color: MUTED })
  if (etf.listing) block(ctx, etf.listing.ticker, PAD, 520, 500, 62, { size: 46, color: GOLD, weight: 600 })
  rule(ctx, 595)
  block(ctx, `ISIN ${etf.isin}`, PAD, 627, 790, 70, { size: 42, min: 36, weight: 600 })
  block(ctx, 'Frais annuels', 970, 617, 530, 48, { size: 32, color: MUTED })
  block(ctx, etf.ter, 970, 667, 530, 85, { size: 70, weight: 600, color: GOLD })
  rule(ctx, 775)
  const accounts = [etf.pea === true ? 'PEA' : null, etf.cto ? 'CTO' : 'CTO indisponible'].filter(Boolean).join(' · ')
  const comma = etf.location.indexOf(',')
  const domicile = comma < 0 ? etf.location : etf.location.slice(0, comma)
  const replication = comma < 0 ? 'Non documentée' : etf.location.slice(comma + 1).trim().replace(/^réplication\s+/i, '')
  const fields = [
    ['Enveloppes', accounts], ['Réplication / adossement', replication],
    [String(etf.positions).startsWith('Exposition suivie') ? 'Exposition' : 'Positions', String(etf.positions).replace(/^Exposition suivie\s*:\s*/, '')], ['Domicile', domicile],
    ['Distribution', etf.distribution], ['Cotation', etf.listing ? `${etf.listing.exchange} · ${etf.listing.currency}` : 'Non documentée'],
  ]
  fields.forEach(([label, value], index) => {
    const x = index % 2 ? 850 : PAD, y = 805 + Math.floor(index / 2) * 175
    block(ctx, label, x, y, 640, 45, { size: 30, color: MUTED })
    block(ctx, value, x, y + 47, 640, 104, { size: 44, min: 28, weight: 600 })
  })
  rule(ctx, 1335)
  const rawAum = String(etf.aum)
  const aumDate = rawAum.match(/\s+(au\s+\d{2}\/\d{2}\/\d{4}|\(relevé le [^)]+\))\s*$/)?.[1]
  const aumAmount = rawAum.replace(/^(?:Part|Fonds)\s*:\s*/i, '').replace(/\s+(?:au\s+\d{2}\/\d{2}\/\d{4}|\(relevé le [^)]+\))\s*$/i, '').trim()
    .replace(/\d[\d \u00a0\u202f]*,\d+/g, amount => Number(amount.replace(/[ \u00a0\u202f]/g, '').replace(',', '.')).toLocaleString('fr-FR', { maximumFractionDigits: 0 }))
  block(ctx, 'Encours', PAD, 1365, 700, 48, { size: 32, color: MUTED })
  block(ctx, aumAmount, PAD, 1420, 700, 100, { size: 62, min: 30, weight: 600 })
  if (aumDate) block(ctx, aumDate, 850, 1430, 650, 75, { size: 32, min: 28, color: MUTED })
  const annual = getAnnualPerformance(etf)
  if (annual) {
    rule(ctx, 1540)
    block(ctx, performanceImageHeading(annual), PAD, 1565, 1400, 54, { size: 40, weight: 600 })
    const entries = performanceEntries(annual)
    const gap = 20, cellWidth = (1400 - 2 * gap) / 3, cellHeight = 120
    entries.forEach(({ label, value }, index) => {
      const x = PAD + (index % 3) * (cellWidth + gap), y = 1625 + Math.floor(index / 3) * (cellHeight + 10)
      ctx.fillStyle = '#0c2230'; ctx.beginPath(); ctx.roundRect(x, y, cellWidth, cellHeight, 14); ctx.fill()
      ctx.textAlign = 'center'
      block(ctx, label, x + cellWidth / 2, y + 8, cellWidth - 44, 48, { size: 40, weight: 600, color: MUTED })
      const performance = `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
      block(ctx, performance, x + cellWidth / 2, y + 50, cellWidth - 44, 78, { size: 68, min: 58, weight: 700, color: value > 0 ? '#9bebb4' : value < 0 ? '#ff998b' : INK })
      ctx.textAlign = 'left'
    })
    if (!annual.values.some(Number.isFinite)) block(ctx, annual.note, PAD, entries.length ? 1780 : 1640, 1400, entries.length ? 95 : 220, { size: 32, min: 30, color: MUTED })
  }
  rule(ctx, 1895)
  ctx.textAlign = 'center'; block(ctx, 'Pas un conseil financier', W / 2, 1920, 1400, 40, { size: 30, color: MUTED })
  return canvas
}
