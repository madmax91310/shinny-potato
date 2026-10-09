import { money } from './lib.js'

// The export shares the exact scenario points and styles used by the on-screen chart.
export function renderProjectionImage(plan, curves) {
  const canvas = document.createElement('canvas')
  canvas.width = 1600; canvas.height = 1000
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#101e2a'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  const left = 200, top = 65, width = 1320, height = 770
  const max = Math.max(1, ...curves.flatMap(c => c.points.map(p => p.capital))) * 1.08
  const x = year => left + year / plan.years * width
  const y = value => top + height - value / max * height
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 4; i++) {
    const value = max * i / 4
    ctx.strokeStyle = '#344855'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(left, y(value)); ctx.lineTo(left + width, y(value)); ctx.stroke()
    ctx.fillStyle = '#c4d3dc'; ctx.textAlign = 'right'; ctx.font = '26px Arial'
    const label = money(value)
    if (ctx.measureText(label).width > left - 30) ctx.font = `${Math.max(14, 26 * (left - 30) / ctx.measureText(label).width)}px Arial`
    ctx.fillText(label, left - 22, y(value))
  }
  ctx.font = '26px Arial'
  for (let i = 0; i <= 4; i++) {
    const year = plan.years * i / 4
    ctx.fillStyle = '#c4d3dc'; ctx.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center'
    ctx.fillText(`${year.toLocaleString('fr-FR')} ans`, x(year), top + height + 45)
  }
  for (const curve of curves) {
    ctx.strokeStyle = curve.color; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.setLineDash(curve.dash); ctx.beginPath()
    curve.points.forEach((p, i) => { if (i) ctx.lineTo(x(p.year), y(p.capital)); else ctx.moveTo(x(p.year), y(p.capital)) })
    ctx.stroke()
  }
  curves.forEach((curve, i) => {
    const start = 310 + i * 400
    ctx.strokeStyle = curve.color; ctx.lineWidth = 7; ctx.setLineDash(curve.dash)
    ctx.beginPath(); ctx.moveTo(start, 945); ctx.lineTo(start + 85, 945); ctx.stroke()
    ctx.fillStyle = curve.color; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'left'
    ctx.fillText(curve.label, start + 105, 945)
  })
  ctx.setLineDash([])
  return canvas
}
