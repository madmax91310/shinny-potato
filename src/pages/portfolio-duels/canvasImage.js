import { YEARS } from '../portfolio-generator/data.js'
import { formatCapital, formatPercent } from './lib.js'

function box(ctx, x, y, w, h, color, radius = 20) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.fill()
}

function fitText(ctx, value, width) {
  let text = value
  while (ctx.measureText(text).width > width && text.length > 4) text = `${text.slice(0, -2)}…`
  return text
}

export function renderDuelImage(duel) {
  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = 2700
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350)
  gradient.addColorStop(0, '#111e36')
  gradient.addColorStop(1, '#091322')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.fillStyle = '#5eead4'
  ctx.font = 'bold 25px Arial, sans-serif'
  ctx.fillText('DUEL DE PORTEFEUILLES', 60, 75)
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.fillText(fitText(ctx, duel.title, 960), 60, 145)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '24px Arial, sans-serif'
  ctx.fillText(`${duel.years?.[0] ?? 2020}–${duel.years?.at(-1) ?? 2025} · deux allocations comparées`, 60, 193)

  for (const [i, portfolio] of [duel.a, duel.b].entries()) {
    const x = i ? 550 : 60
    const color = i ? '#e8ba69' : '#5eead4'
    box(ctx, x, 220, 470, 345, '#1a2b41')
    ctx.fillStyle = color
    ctx.font = 'bold 29px Arial, sans-serif'
    ctx.fillText(`${i ? 'B' : 'A'} · ${fitText(ctx, portfolio.name, 380)}`, x + 25, 267)
    ctx.fillStyle = '#dbeafe'
    ctx.font = '19px Arial, sans-serif'
    portfolio.assets.forEach((asset, index) => ctx.fillText(fitText(ctx, `${asset.pct} % ${asset.name}`, 416), x + 25, 307 + index * 39))
    ctx.fillStyle = color
    ctx.font = 'bold 39px Arial, sans-serif'
    ctx.fillText(formatCapital(portfolio.final, duel.currency), x + 25, 531)
  }

  ctx.fillStyle = '#94a3b8'
  ctx.font = '23px Arial, sans-serif'
  ctx.fillText(`Valeur finale de 10 000 ${duel.currency === 'USD' ? '$' : '€'} investis début ${duel.years?.[0] ?? 2020}`, 60, 607)
  box(ctx, 60, 636, 960, 480, '#14253a')
  ctx.fillStyle = '#f1f5f9'
  ctx.font = 'bold 27px Arial, sans-serif'
  ctx.fillText('ANNÉE', 88, 681)
  ctx.fillStyle = '#5eead4'
  ctx.fillText('A · ' + fitText(ctx, duel.a.name, 300), 345, 681)
  ctx.fillStyle = '#e8ba69'
  ctx.fillText('B · ' + fitText(ctx, duel.b.name, 300), 720, 681)
  ;(duel.years ?? YEARS).forEach((year, i) => {
    const y = 738 + i * 67
    ctx.strokeStyle = '#294059'
    ctx.beginPath()
    ctx.moveTo(88, y - 34)
    ctx.lineTo(992, y - 34)
    ctx.stroke()
    ctx.font = '26px Arial, sans-serif'
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText(String(year), 90, y)
    ctx.fillStyle = '#5eead4'
    ctx.fillText(formatPercent(duel.a.annual[year]), 345, y)
    ctx.fillStyle = '#e8ba69'
    ctx.fillText(formatPercent(duel.b.annual[year]), 720, y)
  })
  box(ctx, 60, 1142, 960, 92, '#213247')
  ctx.font = 'bold 24px Arial, sans-serif'
  ctx.fillStyle = '#f1f5f9'
  ctx.fillText(`Pire année · A ${formatPercent(duel.a.worst)} (${duel.a.worstYear})`, 85, 1197)
  ctx.fillText(`B ${formatPercent(duel.b.worst)} (${duel.b.worstYear})`, 615, 1197)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '21px Arial, sans-serif'
  ctx.fillText(`Simulation historique en ${duel.currency} · ${duel.years?.[0] ?? 2020}–${duel.years?.at(-1) ?? 2025}`, 60, 1295)
  return canvas.toDataURL('image/png')
}
