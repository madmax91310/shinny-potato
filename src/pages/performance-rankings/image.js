import { COLORS } from './data.js'
import { basisLabel, formatMonth, formatPercent, supportLabel, rebalanceLabel } from './engine.js'

function text(ctx, value, x, y, size, color = '#f2f5f3', align = 'left', weight = 600) {
  ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.fillText(value, x, y)
}
function fit(ctx, value, x, y, size, width, color, align = 'left') {
  while (size > 15) { ctx.font = `600 ${size}px Arial, sans-serif`; if (ctx.measureText(value).width <= width) break; size-- }
  ctx.font = `600 ${size}px Arial, sans-serif`
  if (ctx.measureText(value).width > width) {
    while (value.length > 1 && ctx.measureText(`${value}…`).width > width) value = value.slice(0, -1)
    value += '…'
  }
  text(ctx, value, x, y, size, color, align)
}
function card(ctx, x, y, w, h, color, alpha = .09) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.strokeStyle = color; ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 17); ctx.fill(); ctx.globalAlpha = .35; ctx.stroke(); ctx.globalAlpha = 1
}
function lines(ctx, value, x, y, width, size, color, maxLines = 3) {
  ctx.font = `600 ${size}px Arial, sans-serif`
  const wrapped = []; let line = ''
  for (const word of value.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) {
      wrapped.push(line); line = word
    } else line = next
  }
  if (line) wrapped.push(line)
  wrapped.slice(0, maxLines).forEach((line, i) => fit(ctx, i === maxLines - 1 ? wrapped.slice(i).join(' ') : line, x, y + i * (size + 6), size, width, color))
}
export function renderRankingImage(result, title, regularity) {
  const columns = result.columns, single = columns.length === 1
  const width = single ? 1440 : Math.max(1500, columns.length * 225 + 100)
  const canvas = document.createElement('canvas'); canvas.width = width
  const measure = canvas.getContext('2d'); measure.font = '600 19px Arial, sans-serif'
  const portfolioDetails = []
  for (const asset of result.assets.filter(a => a.portfolio)) {
    const description = `${asset.shortLabel} : ${asset.portfolio.lines.map(l => `${l.pct} % ${l.asset.shortLabel ?? l.asset.label}`).join(' + ')} · ${rebalanceLabel(asset.portfolio.rebalance)}`
    let line = ''
    for (const word of description.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (line && measure.measureText(next).width > width - 120) { portfolioDetails.push(line); line = word } else line = next
    }
    if (line) portfolioDetails.push(line)
  }
  if (portfolioDetails.length) portfolioDetails.push('Sans flux · frais des fonds inclus · hors courtage, coûts de rééquilibrage et fiscalité')
  const detailLines = (result.assets.some(a => a.fxConverted) ? 1 : 0) + portfolioDetails.length
  const height = (single ? 310 + result.assets.length * 110 + (regularity ? 150 : 0) : 380 + result.assets.length * 145 + (regularity ? 170 : 0)) + detailLines * 28
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, width, height); bg.addColorStop(0, '#102a2a'); bg.addColorStop(.55, '#111f29'); bg.addColorStop(1, '#1b192b'); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height)
  const glow = ctx.createRadialGradient(width * .2, 0, 0, width * .2, 0, width * .7); glow.addColorStop(0, '#3aa28a30'); glow.addColorStop(1, '#3aa28a00'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height)
  text(ctx, 'ÉPARGNANT LIBRE', width / 2, 35, 24, '#94b8b1', 'center')
  fit(ctx, title, width / 2, 89, 46, width - 120, '#f5f4ec', 'center')
  const period = result.mode === 'period' ? `${formatMonth(result.start, true)} → ${formatMonth(result.end, true)}` : columns.length === 1 ? columns[0].label : `${columns[0].label} → ${columns.at(-1).label}`
  text(ctx, `${period}   ·   ${result.coverage.currency}   ·   ${result.annualized ? 'Performance annualisée' : result.mode === 'period' ? 'Performance cumulée' : 'Performances annuelles'}`, width / 2, 154, 24, '#afc4c3', 'center')
  const color = id => COLORS[result.assets.findIndex(a => a.id === id) % COLORS.length]
  if (single) {
    columns[0].rows.forEach((row, i) => {
      const y = 215 + i * 110, accent = color(row.id)
      card(ctx, 65, y, width - 130, 94, accent)
      text(ctx, String(row.rank).padStart(2, '0'), 88, y + 26, 34, accent)
      fit(ctx, row.label, 170, y + 22, 32, width - 550, '#f5f4ec')
      fit(ctx, formatPercent(row.value), width - 92, y + 26, 38, 230, accent, 'right')
    })
  } else {
    const gap = 14, cw = (width - 100 - gap * (columns.length - 1)) / columns.length
    columns.forEach((col, i) => {
      const x = 50 + i * (cw + gap)
      text(ctx, col.label, x + cw / 2, 218, 31, '#f5f4ec', 'center')
      col.rows.forEach((row, rank) => {
        const y = 268 + rank * 145, accent = color(row.id)
        card(ctx, x, y, cw, 132, accent)
        text(ctx, `${row.rank}`, x + 15, y + 13, 18, '#b8c9c6')
        lines(ctx, row.label, x + 15, y + 39, cw - 30, 22, accent, 2)
        fit(ctx, formatPercent(row.value), x + 15, y + 99, 25, cw - 30, '#f5f4ec')
      })
    })
  }
  if (regularity) {
    const y = height - 215 - detailLines * 28
    text(ctx, `Première place sur ${regularity.count} périodes glissantes de ${regularity.months / 12} an${regularity.months > 12 ? 's' : ''}`, 60, y, 23, '#d9e4df')
    const w = (width - 120) / regularity.stats.length
    regularity.stats.forEach((s, i) => {
      fit(ctx, s.label, 60 + i * w, y + 42, 21, w - 15, color(s.id))
      text(ctx, `${(100 * s.wins / regularity.count).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`, 60 + i * w, y + 73, 28, '#f5f4ec')
    })
    text(ctx, `Historique ${regularity.start} → ${regularity.end} · périodes qui se chevauchent · égalités partagées`, 60, y + 112, 18, '#a7bcba')
  }
  let extraY = height - 73 - detailLines * 28
  if (result.assets.some(a => a.fxConverted)) { fit(ctx, 'Conversion aux références BCE de fin de mois · sans couverture de change', width / 2, extraY, 19, width - 100, '#a7bcba', 'center'); extraY += 28 }
  for (const line of portfolioDetails) { text(ctx, line, width / 2, extraY, 19, '#a7bcba', 'center'); extraY += 28 }
  fit(ctx, `${supportLabel(result.assets)} · ${basisLabel(result.coverage.basis)}${result.assets.some(a => a.isin) ? ' · Frais des fonds inclus' : ''}`, width / 2, height - 73, 21, width - 100, '#a7bcba', 'center')
  text(ctx, 'Performances passées · Pas un conseil financier', width / 2, height - 39, 18, '#819b98', 'center')
  return canvas
}
