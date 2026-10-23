import { ETFS, loadSheetRecord } from './records.js'
import { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'
import { getAnnualPerformance, performanceEntries, performanceImageHeading } from './annualPerformance.js'
import { getPresentationCopy } from './editorial.js'
import { frenchCharacteristic } from '../../data/french-characteristics.js'

// Approved porcelain relief: artwork contains material and recesses only.
// Every identity, characteristic and dated observation remains live canvas text.
const W = 1600, H = 1600
const INK = '#08283f', MUTED = '#47565f', NEGATIVE = '#ae503e'
const BACKGROUND = 'etf-relief/porcelain-blue.webp'
const serif = 'ExportEditorial, Georgia, serif'
function wrap(ctx, text, width) {
  const lines = []
  for (const paragraph of String(text).split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > width) { lines.push(line); line = word } else line = next
    }
    if (line) lines.push(line)
  }
  return lines
}
function text(ctx, value, x, y, width, height, { size = 34, min = 25, weight = 600, sans = false, color = INK, align = 'left', relief = false, centered = false } = {}) {
  let lines, lineHeight
  for (; size >= min; size--) {
    ctx.font = `${weight} ${size}px ${sans ? 'Arial, sans-serif' : serif}`
    lines = wrap(ctx, value, width); lineHeight = Math.ceil(size * (sans ? 1.22 : 1.4))
    if (lines.length * lineHeight <= height && lines.every(line => ctx.measureText(line).width <= width)) break
  }
  if (size < min) throw new Error(`Le texte est trop long pour l’image : ${value}`)
  ctx.save(); ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  const top = centered ? y + (height - lines.length * lineHeight) / 2 : y
  lines.forEach((line, index) => {
    const yy = top + index * lineHeight
    if (relief) {
      // A single fillText per line keeps export copy and accessibility auditing exact.
      ctx.strokeStyle = color === '#f5f3ed' ? '#ffffffb0' : '#ffffffa0'; ctx.lineWidth = 1.1
      ctx.strokeText(line, x - .8, yy - .9)
      ctx.shadowColor = color === '#f5f3ed' ? '#000000b0' : '#15273760'
      ctx.shadowBlur = size > 55 ? 3 : 1.5; ctx.shadowOffsetX = 1.5; ctx.shadowOffsetY = 3
    }
    ctx.fillText(line, x, yy)
  })
  ctx.restore()
  return lines.length * lineHeight
}
function pill(ctx, x, y, width, height) {
  ctx.save()
  ctx.shadowColor = '#324a5b40'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 3
  const shade = ctx.createLinearGradient(0, y, 0, y + height)
  shade.addColorStop(0, '#dcebf0'); shade.addColorStop(1, '#bed2dd')
  ctx.fillStyle = shade; ctx.beginPath(); ctx.roundRect(x, y, width, height, height / 2); ctx.fill()
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#ffffffcf'; ctx.lineWidth = 2; ctx.stroke()
  ctx.restore()
}
function characteristics(etf) {
  const location = etf.location ?? '', comma = location.indexOf(',')
  const domicile = 'domicile' in etf ? etf.domicile && frenchCharacteristic(etf.domicile) : comma < 0 ? location : location.slice(0, comma)
  const replication = 'replicationMethod' in etf ? etf.replicationMethod && frenchCharacteristic(etf.replicationMethod).replace(/^réplication\s+/i, '') : comma < 0 ? null : location.slice(comma + 1).trim().replace(/^réplication\s+/i, '')
  return {
    left: [(etf.positions ?? '').replace(/^Exposition suivie\s*:\s*/, ''), etf.distribution, replication, etf.swapFee && `Swap : ${etf.swapFee}`].filter(Boolean),
    right: [domicile && `Domicile : ${domicile}`, etf.listing && `${etf.listing.exchange} · ${etf.listing.currency}`,etf.shareCurrency && `Part : ${etf.shareCurrency}`,etf.currencyHedge].filter(Boolean),
  }
}
function aumParts(aum) {
  const raw = String(aum ?? '')
  const date = raw.match(/\s+(au\s+\d{2}\/\d{2}\/\d{4}|\(relevé le [^)]+\))\s*$/)?.[1]
  const amount = raw.replace(/^(?:Part|Fonds)\s*:\s*/i, '').replace(/\s+(?:au\s+\d{2}\/\d{2}\/\d{4}|\(relevé le [^)]+\))\s*$/i, '').trim()
    .replace(/\d[\d \u00a0\u202f]*,\d+/g, value => Number(value.replace(/[ \u00a0\u202f]/g, '').replace(',', '.')).toLocaleString('fr-FR', { maximumFractionDigits: 0 }))
  // Fund-wide figures must not look like the assets of this share class.
  return { amount, date, label: /^Fonds\s*:/i.test(raw) ? 'Encours du fonds' : /^Part\s*:/i.test(raw) ? 'Encours de la part' : 'Encours' }
}
export async function renderETFImage(sourceEtf) {
  const etf = getPresentationCopy(sourceEtf)
  if (ETFS.some(item => item.id === etf.id)) await loadSheetRecord(etf.id)
  const [background] = await Promise.all([loadArtImage(BACKGROUND), loadEditorialFont()])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d'); ctx.drawImage(background, 0, 0, W, H)
  const legal = etf.name.match(/\s+(UCITS ETF.*)$/)
  const title = legal ? etf.name.slice(0, legal.index) : etf.name
  const issuer = title.match(/^(Amundi(?: PEA)?|iShares(?: Core| Edge)?|Xtrackers(?: II)?|(?:State Street )?SPDR|Vanguard|L&G|VanEck|Global X|CoinShares|Invesco|WisdomTree|Bitwise|21Shares)\s+/)
  const displayName = issuer ? `${issuer[1]}\n${title.slice(issuer[0].length)}` : title
  // Keep the legal nature, including ETC/ETP, in the complete fitted name.
  text(ctx, displayName, 185, 130, 850, 220, { size: 90, min: 36, sans: true, weight: 700, color: '#f5f3ed', relief: true, centered: true })
  if (legal) text(ctx, legal[1], 185, 359, 850, 34, { size: 25, min: 23, sans: true, weight: 400, color: '#d5e0e5' })
  const identity = [etf.listing?.ticker, `ISIN ${etf.isin}`].filter(Boolean).join(' · ')
  text(ctx, identity, 185, 405, 850, 48, { size: 34, min: 26, color: '#f5f3ed' })
  text(ctx, 'ÉPARGNANT LIBRE', 1265, 288, 305, 80, { size: 30, min: 26, weight: 500, align: 'center', color: '#f5f3ed', centered: true })
  text(ctx, etf.ter, 330, 649, 370, 120, { size: 109, min: 45, align: 'center', relief: true, centered: true })
  text(ctx, etf.swapFee ? 'Gestion / an' : 'Frais annuels', 330, 806, 350, 54, { size: 38, min: 32, align: 'center' })
  const accounts = [etf.pea === true ? 'PEA' : null, etf.cto ? 'CTO' : 'CTO indisponible'].filter(Boolean).join(' · ')
  text(ctx, accounts, 620, 538, 410, 75, { size: 61, min: 34, relief: true, centered: true })
  text(ctx, 'Enveloppes', 620, 625, 410, 45, { size: 34, color: MUTED })
  const aum = aumParts(etf.aum)
  text(ctx, aum.amount, 1100, 538, 390, 78, { size: 61, min: 29, relief: true, centered: true })
  text(ctx, aum.label, 1100, 618, 390, 42, { size: 29, color: MUTED })
  if (aum.date) text(ctx, aum.date, 1100, 661, 390, 39, { size: 26, min: 23, color: MUTED })
  const facts = characteristics(etf)
  text(ctx, facts.left.join('\n'), 628, 735, 485, 232, { size: 34, min: 24, centered: true })
  text(ctx, facts.right.join('\n'), 1180, 735, 300, 232, { size: 32, min: 24, centered: true })
  const annual = getAnnualPerformance(etf)
  if (annual) {
    text(ctx, performanceImageHeading(annual), 160, 1000, 1290, 65, { size: 43, min: 29, relief: true })
    const entries = performanceEntries(annual)
    const cols = Math.min(3, entries.length), rows = Math.ceil(entries.length / 3)
    const rowHeight = Math.min(186, 365 / Math.max(1, rows))
    const width = 1300 / Math.max(1, cols)
    entries.forEach(({ label, value }, i) => {
      const x = 150 + (i % cols) * width, y = 1093 + (rows === 1 ? 82 : 0) + Math.floor(i / cols) * rowHeight
      const pillWidth = Math.min(270, width - 55)
      pill(ctx, x + (width - pillWidth) / 2, y, pillWidth, 55)
      text(ctx, label, x + width / 2, y + 7, pillWidth - 22, 43, { size: 34, min: 24, align: 'center' })
      const performance = `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
      text(ctx, performance, x + width / 2, y + 75, width - 35, rowHeight - 78, { size: 74, min: 58, align: 'center', color: value < 0 ? NEGATIVE : INK, relief: true })
    })
    if (!annual.values.some(Number.isFinite) && annual.note) {
      text(ctx, annual.note, 165, entries.length ? 1440 : 1110, 1260, entries.length ? 60 : 270, { size: 32, min: 25, color: MUTED })
    }
  }
  text(ctx, 'Pas un conseil financier', 800, 1500, 1100, 40, { size: 28, min: 25, weight: 500, align: 'center', color: MUTED })
  return canvas
}
