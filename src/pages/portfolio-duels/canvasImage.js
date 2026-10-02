import { YEARS } from '../../data/portfolio-assets.js'
import { DUELS } from './data.js'
import { formatCapital, formatPercent, ROLES } from './lib.js'

const W = 1080
const NAVY = '#132830'
const PAPER = '#F4F0E9'
const INK = '#152C33'
const MUTED = '#627078'
const RULE = '#D5D9D3'
const A = '#136E66'
const B = '#AF5943'

function write(ctx, value, x, y, size, color = INK, weight = 700, align = 'left') {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px Arial, sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.fillText(String(value), x, y)
  ctx.textAlign = 'left'
}

function fit(ctx, value, x, y, size, width, color = INK, weight = 700, align = 'left', min = 16) {
  let font = size
  while (font > min) {
    ctx.font = `${weight} ${font}px Arial, sans-serif`
    if (ctx.measureText(String(value)).width <= width) break
    font--
  }
  let label = String(value)
  while (ctx.measureText(label).width > width && label.length > 2) label = `${label.slice(0, -2).trimEnd()}…`
  write(ctx, label, x, y, font, color, weight, align)
}

function rule(ctx, x, y, width, color = RULE) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, 2)
}

function title(ctx, value) {
  // Deux lignes au maximum : les compositions longues restent lisibles sans troncature.
  let lines
  let size = 52
  do {
    ctx.font = `700 ${size}px Arial, sans-serif`
    lines = ['']
    for (const word of value.split(' ')) {
      const last = lines.length - 1
      const next = [lines[last], word].filter(Boolean).join(' ')
      if (lines[last] && ctx.measureText(next).width > 1000) lines.push(word)
      else lines[last] = next
    }
    if (lines.length <= 2) break
    size--
  } while (size > 24)
  lines.forEach((line, i) => write(ctx, line, 540, 112 + i * (size + 5), size, PAPER, 700, 'center'))
}

function portfolio(ctx, item, letter, x, currency, accent, extra) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x, 312, 480, 535 + extra)
  ctx.fillStyle = accent
  ctx.fillRect(x, 312, 480, 9)
  ctx.fillRect(x + 27, 340, 70, 70)
  write(ctx, letter, x + 62, 346, 52, '#FFFFFF', 800, 'center')
  fit(ctx, item.name.toUpperCase(), x + 116, 357, 33, 340)
  write(ctx, 'VALEUR FINALE', x + 28, 454, 20, MUTED)
  fit(ctx, formatCapital(item.final, currency), x + 28, 483, 66, 440, accent, 700, 'left', 40)
  rule(ctx, x + 28, 582, 424)
  write(ctx, 'ALLOCATION', x + 28, 608, 19, MUTED)
  item.assets.forEach((asset, i) => {
    const y = 651 + i * 75
    fit(ctx, `${asset.pct} %`, x + 28, y + 13, 35, 120, accent)
    write(ctx, ROLES[asset.role].toUpperCase(), x + 170, y, 15, MUTED)
    fit(ctx, asset.label, x + 170, y + 24, 26, 275, INK, 700, 'left', 18)
    rule(ctx, x + 28, y + 55, 424, RULE)
    ctx.fillStyle = accent
    ctx.fillRect(x + 28, y + 55, 424 * asset.pct / 100, 7)
  })
}

export function renderDuelImage(duel) {
  const years = duel.years ?? YEARS
  const extra = Math.max(0, Math.max(duel.a.assets.length, duel.b.assets.length) - 2) * 75
  const height = 1350 + extra
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, height)

  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, W, 280)
  write(ctx, 'ÉPARGNANT LIBRE', 540, 28, 27, PAPER, 700, 'center')
  const seriesIndex = DUELS.findIndex((entry) => entry.id === duel.id)
  const edition = seriesIndex >= 0 ? ` · ${String(seriesIndex + 1).padStart(2, '0')}` : ' · ÉDITION LIBRE'
  write(ctx, `DUEL DE PORTEFEUILLES${edition}`, 540, 76, 19, '#7FD3C1', 700, 'center')
  title(ctx, duel.title.toUpperCase().replace(' OU ', '  VS  ').replace(' ?', ''))
  const symbol = duel.currency === 'USD' ? '$' : '€'
  write(ctx, `10 000 ${symbol} investis en ${years[0]}  ·  valeur fin ${years.at(-1)}`, 540, 236, 27, '#DCE7E2', 400, 'center')

  portfolio(ctx, duel.a, 'A', 50, duel.currency, A, extra)
  portfolio(ctx, duel.b, 'B', 550, duel.currency, B, extra)

  ctx.fillStyle = NAVY
  ctx.fillRect(50, 872 + extra, 980, 95)
  write(ctx, 'ÉCART À L’ARRIVÉE', 78, 890 + extra, 19, '#B7D2CD')
  const difference = duel.b.final - duel.a.final
  const winner = difference >= 0 ? 'B' : 'A'
  fit(ctx, Math.abs(difference) < .5 ? 'Même montant à l’euro près' : `+${formatCapital(Math.abs(difference), duel.currency)} pour ${winner}`, 78, 917 + extra, 36, 925, PAPER)

  write(ctx, 'LE PARCOURS, ANNÉE PAR ANNÉE', 50, 996 + extra, 30)
  rule(ctx, 50, 1041 + extra, 980)
  years.forEach((year, i) => {
    const x = 50 + i % 3 * 335
    const y = 1061 + extra + Math.floor(i / 3) * 95
    write(ctx, year, x, y, 21, MUTED)
    fit(ctx, `A ${formatPercent(duel.a.annual[year])}`, x, y + 32, 25, 154, A, 700, 'left', 18)
    fit(ctx, `B ${formatPercent(duel.b.annual[year])}`, x + 162, y + 32, 25, 160, B, 700, 'left', 18)
  })
  rule(ctx, 50, 1260 + extra, 980)
  write(ctx, 'PIRE ANNÉE', 50, 1274 + extra, 21, MUTED)
  fit(ctx, `A ${formatPercent(duel.a.worst)} (${duel.a.worstYear})`, 260, 1274 + extra, 22, 360, A)
  fit(ctx, `B ${formatPercent(duel.b.worst)} (${duel.b.worstYear})`, 632, 1274 + extra, 22, 390, B)
  write(ctx, `En ${duel.currency} · Rééquilibrage annuel · Hors courtage et fiscalité`, 50, 1320 + extra, 16, MUTED, 400)
  return canvas.toDataURL('image/png')
}
