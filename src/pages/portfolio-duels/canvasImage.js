import { YEARS } from '../portfolio-generator/data.js'
import { formatCapital, formatPercent } from './lib.js'

const INK = '#172437'
const MUTED = '#586270'
const RULE = '#c8c7c0'
const ACCENT = '#a68560'

function line(ctx, x1, y, x2, color = RULE, width = 1) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

function fit(ctx, value, width) {
  let result = value
  while (ctx.measureText(result).width > width && result.length > 3) result = `${result.slice(0, -2).trimEnd()}…`
  return result
}

function shortName(name) {
  // La désignation complète reste visible dans le tweet et dans l'interface.
  if (name === 'iShares MSCI World Information Technology Sector Advanced UCITS ETF') return 'MSCI World Technologie'
  if (name === 'iShares Physical Silver ETC (estimation EUR)') return 'iShares Silver (est. EUR)'
  return name.replace(/^iShares (?:Core )?/i, '').replace(/^SPDR /i, '').replace(/^Amundi /i, '').replace(/^Vanguard /i, '').replace(/\s+UCITS ETF(?:\s*\([^)]*\))?$/i, '').replace(/\s+ETP$/i, '')
}

function titleLines(ctx, title) {
  if (ctx.measureText(title).width <= 960) return [title]
  const words = title.split(' ')
  const lines = ['']
  for (const word of words) {
    const last = lines.length - 1
    const candidate = lines[last] ? `${lines[last]} ${word}` : word
    if (ctx.measureText(candidate).width > 960 && lines[last] && lines.length < 2) lines.push(word)
    else lines[last] = candidate
  }
  return lines.map((value) => fit(ctx, value, 960))
}

function drawPortfolio(ctx, portfolio, label, x, currency) {
  ctx.fillStyle = ACCENT
  ctx.font = '30px Georgia, serif'
  ctx.fillText(label, x, 328)
  ctx.fillStyle = INK
  ctx.font = 'bold 29px Georgia, serif'
  ctx.fillText(fit(ctx, portfolio.name.toUpperCase(), 374), x + 45, 328)
  line(ctx, x, 353, x + 452)

  portfolio.assets.forEach((asset, index) => {
    const y = 399 + index * 51
    ctx.fillStyle = INK
    ctx.font = 'bold 26px Arial, sans-serif'
    ctx.fillText(`${asset.pct} %`, x, y)
    ctx.fillStyle = MUTED
    ctx.font = 'bold 27px Arial, sans-serif'
    ctx.fillText(fit(ctx, shortName(asset.name), 340), x + 100, y)
  })
  if (portfolio.assets.length === 2) {
    const barY = 535
    ctx.fillStyle = '#ddd9d0'
    ctx.fillRect(x, barY, 452, 32)
    ctx.fillStyle = ACCENT
    ctx.fillRect(x, barY, 452 * portfolio.assets[0].pct / 100, 32)
    ctx.fillStyle = INK
    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.fillText(`${portfolio.assets[0].pct} % communs`, x, barY + 70)
    ctx.textAlign = 'right'
    ctx.fillText(`${portfolio.assets[1].pct} % choix ${label}`, x + 452, barY + 70)
    ctx.textAlign = 'left'
  }

  line(ctx, x, 665, x + 452)
  ctx.fillStyle = MUTED
  ctx.font = '19px Arial, sans-serif'
  ctx.fillText('VALEUR FINALE', x, 713)
  ctx.fillStyle = INK
  let size = 81
  do { ctx.font = `${size}px Georgia, serif`; size -= 2 } while (ctx.measureText(formatCapital(portfolio.final, currency)).width > 452 && size > 57)
  ctx.fillText(formatCapital(portfolio.final, currency), x, 802)
}

export function renderDuelImage(duel) {
  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = 2700
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = '#f8f7f3'
  ctx.fillRect(0, 0, 1080, 1350)

  line(ctx, 60, 62, 1020, ACCENT, 2)
  ctx.fillStyle = ACCENT
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText('DUEL DE PORTEFEUILLES', 60, 106)
  ctx.fillStyle = INK
  ctx.font = 'bold 58px Georgia, serif'
  titleLines(ctx, duel.title).forEach((part, index) => ctx.fillText(part, 60, 178 + index * 62))
  const years = duel.years ?? YEARS
  const symbol = duel.currency === 'USD' ? '$' : '€'
  ctx.fillStyle = MUTED
  ctx.font = '23px Arial, sans-serif'
  ctx.fillText(`Deux allocations · 10 000 ${symbol} au départ · ${years[0]}–${years.at(-1)}`, 60, 263)

  drawPortfolio(ctx, duel.a, 'A', 60, duel.currency)
  drawPortfolio(ctx, duel.b, 'B', 568, duel.currency)
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(540, 310)
  ctx.lineTo(540, 815)
  ctx.stroke()

  line(ctx, 60, 845, 1020)
  ctx.fillStyle = INK
  ctx.font = 'bold 19px Arial, sans-serif'
  ctx.fillText('PERFORMANCES ANNUELLES · A / B', 60, 878)
  years.forEach((year, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = 60 + col * 508
    const y = 934 + row * 91
    ctx.fillStyle = MUTED
    ctx.font = 'bold 25px Arial, sans-serif'
    ctx.fillText(String(year), x, y)
    ctx.font = 'bold 27px Arial, sans-serif'
    ctx.fillStyle = '#226963'
    ctx.fillText(`A ${formatPercent(duel.a.annual[year])}`, x + 102, y)
    ctx.fillStyle = '#a85140'
    ctx.fillText(`B ${formatPercent(duel.b.annual[year])}`, x + 275, y)
    line(ctx, x, y + 16, x + 452)
  })

  ctx.fillStyle = MUTED
  ctx.font = '19px Arial, sans-serif'
  ctx.fillText('PIRE ANNÉE', 60, 1222)
  ctx.fillStyle = INK
  ctx.font = '23px Arial, sans-serif'
  ctx.fillText(`A  ${formatPercent(duel.a.worst)} (${duel.a.worstYear})`, 60, 1260)
  ctx.fillText(`B  ${formatPercent(duel.b.worst)} (${duel.b.worstYear})`, 568, 1260)
  line(ctx, 60, 1280, 1020, ACCENT)
  ctx.fillStyle = MUTED
  ctx.font = '18px Arial, sans-serif'
  ctx.fillText(`Performances historiques en ${duel.currency} · Résultats indicatifs`, 60, 1320)
  return canvas.toDataURL('image/png')
}
