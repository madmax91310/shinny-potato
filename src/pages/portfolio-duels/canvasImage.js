import { YEARS } from '../portfolio-generator/data.js'
import { formatCapital, formatPercent } from './lib.js'

const INK = '#182524'
const PAPER = '#F2EBDD'
const A = '#176D63'
const B = '#C35437'
const MUTED = '#50615E'

function text(ctx, value, x, y, size, color = INK, weight = 700, align = 'left') {
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.font = `${weight} ${size}px Arial, sans-serif`
  ctx.fillText(value, x, y)
}

function fit(ctx, value, x, y, size, width, color = INK, min = 20) {
  while (size > min) {
    ctx.font = `700 ${size}px Arial, sans-serif`
    if (ctx.measureText(value).width <= width) break
    size -= 2
  }
  text(ctx, value, x, y, size, color)
}

function shortName(name) {
  if (name === 'iShares MSCI World Information Technology Sector Advanced UCITS ETF') return 'MSCI World Technologie'
  if (name === 'iShares Physical Silver ETC (estimation EUR)') return 'iShares Silver (est. EUR)'
  return name.replace(/^iShares (?:Core )?/i, '').replace(/^SPDR /i, '').replace(/^Amundi /i, '').replace(/^Vanguard /i, '').replace(/\s+UCITS ETF(?:\s*\([^)]*\))?$/i, '').replace(/\s+ETP$/i, '')
}

function portfolio(ctx, item, letter, y, currency, accent) {
  ctx.fillStyle = accent
  ctx.fillRect(60, y, 960, 5)
  ctx.fillRect(60, y + 19, 72, 72)
  text(ctx, letter, 96, y + 27, 50, '#FFFFFF', 800, 'center')
  fit(ctx, item.name.toUpperCase(), 152, y + 26, 40, 850, INK, 29)
  text(ctx, 'VALEUR FINALE', 60, y + 102, 22, MUTED)
  fit(ctx, formatCapital(item.final, currency), 60, y + 129, 75, 940, accent, 49)
  ctx.fillStyle = '#D0D2C7'
  ctx.fillRect(60, y + 218, 960, 2)
  item.assets.forEach((asset, i) => {
    const yy = y + 232 + i * 32
    text(ctx, `${asset.pct} %`, 61, yy, 27, accent)
    fit(ctx, shortName(asset.name), 185, yy, 27, 833, INK, 21)
  })
}

export function renderDuelImage(duel) {
  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = 2700
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, 1080, 19)
  text(ctx, 'ÉPARGNANT LIBRE  /  DUEL DE PORTEFEUILLES', 60, 53, 26, INK)
  fit(ctx, duel.title.toUpperCase(), 60, 105, 58, 960, INK, 38)
  const years = duel.years ?? YEARS
  const symbol = duel.currency === 'USD' ? '$' : '€'
  text(ctx, `10 000 ${symbol} investis · ${years[0]}–${years.at(-1)}`, 61, 182, 32, MUTED)

  portfolio(ctx, duel.a, 'A', 220, duel.currency, A)
  portfolio(ctx, duel.b, 'B', 615, duel.currency, B)

  ctx.fillStyle = '#D0D2C7'
  ctx.fillRect(60, 1043, 960, 2)
  text(ctx, 'RENDEMENT PAR ANNÉE', 60, 1051, 26, INK)
  years.forEach((year, i) => {
    const x = 60 + (i % 2) * 495
    const y = 1092 + Math.floor(i / 2) * 64
    text(ctx, String(year), x, y, 29, MUTED)
    text(ctx, `A ${formatPercent(duel.a.annual[year])}`, x + 112, y, 29, A)
    text(ctx, `B ${formatPercent(duel.b.annual[year])}`, x + 295, y, 29, B)
  })
  text(ctx, 'PIRE ANNÉE', 61, 1285, 22, MUTED)
  text(ctx, `A ${formatPercent(duel.a.worst)} (${duel.a.worstYear})`, 258, 1281, 26, A)
  text(ctx, `B ${formatPercent(duel.b.worst)} (${duel.b.worstYear})`, 650, 1281, 26, B)
  text(ctx, `Performances historiques en ${duel.currency} · Résultats indicatifs`, 61, 1322, 17, MUTED, 400)
  return canvas.toDataURL('image/png')
}
