import { getAnnualReturns } from './data/marketHistory.js'
import { getMarketAsset, MODES } from './lib.js'
import { loadNeonArt, drawNeonArt } from './stylizedArt.js'

const W = 1600
const INK = '#fff2cd', MUTED = '#a7c2c8', GREEN = '#84efca', RED = '#ff9b91'
export const cumulativePerformance = rows => (rows.reduce((acc, row) => acc * (1 + row.pct / 100), 1) - 1) * 100
const percentage = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
function text(ctx, value, x, y, size, { width = W, color = INK, align = 'left', weight = 700 } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px Arial, sans-serif`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 12)
  ctx.fillText(value, x, y)
}
function chart(ctx, rows, x, y, w, h) {
  const values = [0]; let capital = 1
  rows.forEach(row => { capital *= 1 + row.pct / 100; values.push((capital - 1) * 100) })
  let min = Math.min(0, ...values), max = Math.max(0, ...values)
  const range = Math.max(10, max - min); min -= range * .1; max += range * .1
  const plotX = x + 78, plotW = w - 100, plotY = y + 30, plotH = h - 110
  const px = i => plotX + i / (values.length - 1) * plotW, py = value => plotY + (max - value) / (max - min) * plotH
  for (let i = 0; i <= 4; i++) {
    const value = min + (max - min) * i / 4, lineY = py(value)
    ctx.strokeStyle = '#23444a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(plotX, lineY); ctx.lineTo(plotX + plotW, lineY); ctx.stroke()
    text(ctx, `${Math.round(value)} %`, plotX - 15, lineY - 9, 17, { width: 64, align: 'right', color: MUTED, weight: 400 })
  }
  const points = values.map((value, i) => [px(i), py(value)])
  ctx.beginPath(); ctx.moveTo(points[0][0], py(0)); points.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.lineTo(points.at(-1)[0], py(0)); ctx.closePath()
  const gradient = ctx.createLinearGradient(0, plotY, 0, plotY + plotH); gradient.addColorStop(0, '#49c99c44'); gradient.addColorStop(1, '#49c99c00')
  ctx.fillStyle = gradient; ctx.fill()
  ctx.save(); ctx.strokeStyle = values.at(-1) < 0 ? RED : GREEN; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 13; ctx.lineWidth = 4
  ctx.beginPath(); points.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke(); ctx.restore()
  const labels = [String(rows[0].year - 1), ...rows.map(row => String(row.year))]
  labels.forEach((label, i) => { if (labels.length <= 8 || i === 0 || i === labels.length - 1 || i % 2 === 0) text(ctx, label, px(i), plotY + plotH + 18, 20, { align: 'center', color: MUTED, weight: 400 }) })
  text(ctx, 'Performance cumulée · clôtures annuelles', x + w / 2, y + h - 27, 19, { align: 'center', color: MUTED, weight: 400 })
}
function panel(ctx, entry, image, y) {
  const { asset, returns } = entry, total = cumulativePerformance(returns)
  ctx.save(); ctx.translate(0, y)
  drawNeonArt(ctx, image, 0, 195, 600)
  text(ctx, asset.label.replace(/^Indice /, ''), 650, 165, 49, { width: 870, color: INK })
  text(ctx, percentage(total), 640, 242, 150, { width: 880, color: total < 0 ? RED : GREEN })
  text(ctx, 'PERFORMANCE CUMULÉE', 655, 420, 26, { color: MUTED })
  text(ctx, `Fin ${returns[0].year - 1} → Fin ${returns.at(-1).year} · ${asset.currency}`, 655, 465, 27, { width: 850, color: INK, weight: 400 })
  chart(ctx, returns, 635, 526, 900, 350)
  text(ctx, `EN ${asset.currency}${asset.currency === 'USD' ? ' · SANS CONVERSION EN EUR' : ''}`, 65, 829, 22, { width: 535, color: MUTED, weight: 400 })
  ctx.restore()
}
export async function renderPerformanceImage(item) {
  const comparative = item.mode === MODES.COMPARATIF
  const ids = comparative ? [item.assetIdA, item.assetIdB] : [item.assetId]
  const entries = ids.map(id => ({ asset: getMarketAsset(id), returns: getAnnualReturns(id, item.year) }))
  if (entries.some(entry => !entry.asset || !entry.returns.length)) throw new Error('Actif ou performances annuelles absents')
  if (comparative) {
    const commonYears = entries[0].returns.map(row => row.year).filter(year => entries[1].returns.some(row => row.year === year))
    entries.forEach(entry => { entry.returns = entry.returns.filter(row => commonYears.includes(row.year)) })
    if (!commonYears.length) throw new Error('Aucune année commune aux deux actifs')
  }
  const images = await Promise.all(ids.map(loadNeonArt)); await document.fonts.ready
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = comparative ? 1920 : 1040
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#061523'; ctx.fillRect(0, 0, W, canvas.height)
  text(ctx, 'PERFORMANCE DEPUIS', 65, 47, 70, { width: 1320 })
  ctx.fillStyle = '#ebc56d'; ctx.fillRect(65, 139, 1460, 2)
  entries.forEach((entry, i) => panel(ctx, entry, images[i], i * 880))
  const footerY = comparative ? 1780 : 900
  if (ids.includes('silver')) text(ctx, 'ARGENT : FUTURES COMEX CONTINUS, HORS FRAIS ET ROULEMENT', 65, footerY, 20, { width: 1460, color: MUTED, weight: 400 })
  const credits = [...new Set(entries.map(entry => entry.asset.sourceCredit).filter(Boolean))].flatMap(credit => credit.replace(' · Calculs Épargnant Libre', '').split('\n'))
  credits.forEach((credit, i) => text(ctx, credit, 65, footerY + 30 + i * 22, 18, { width: 1460, color: MUTED, weight: 400 }))
  text(ctx, 'Les performances passées ne préjugent pas des performances futures.', 65, canvas.height - 65, 20, { width: 1100, color: MUTED, weight: 400 })
  text(ctx, '@Epargnantlibre', 1525, canvas.height - 65, 24, { align: 'right', width: 340 })
  return canvas
}
export async function downloadPerformanceImage(item) {
  const canvas = await renderPerformanceImage(item)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `performance-depuis-${item.year}-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
