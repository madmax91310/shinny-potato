import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { performanceBasis } from './data/marketHistory.js'
import { getPerformanceEntries, MODES } from './lib.js'
import { loadPerformanceArt, drawPerformanceArt } from './performanceArt.js'

import { loadArtImage } from './anniversaryArt.js'

const W = 1600
const INK = '#f4f5ff', MUTED = '#b7cbdc', GREEN = '#9ee8ff', RED = '#ffaaa0', GOLD = '#ecd8b0'
export const cumulativePerformance = rows => (rows.reduce((acc, row) => acc * (1 + row.pct / 100), 1) - 1) * 100
const assetTitle = asset => {
  const name = (asset.tweetPhrase || asset.label).replace(/^l['’]indice /i, 'le ')
  return name.charAt(0).toUpperCase() + name.slice(1)
}
const percentage = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
function text(ctx, value, x, y, size, { width = W, color = INK, align = 'left', weight = 700, serif = false } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 12)
  ctx.fillText(value, x, y)
}
// Same glass materials as the approved investor portraits; financial values stay in code.
function glass(ctx, x, y, w, h) {
  ctx.save()
  const body = ctx.createLinearGradient(x,y,x+w,y+h)
  body.addColorStop(0,'rgba(49,107,151,.38)'); body.addColorStop(.4,'rgba(7,24,44,.86)'); body.addColorStop(1,'rgba(17,42,66,.94)')
  ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(x,y,w,h,20); ctx.fill()
  const rim = ctx.createLinearGradient(x,y,x+w,y+h)
  rim.addColorStop(0,'#e6faff'); rim.addColorStop(.18,'#58bcff'); rim.addColorStop(.44,'#172d51'); rim.addColorStop(.67,'#f5dbc0'); rim.addColorStop(.8,'#99ddff'); rim.addColorStop(1,'#5882a0')
  ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.shadowColor = '#34a4ff'; ctx.shadowBlur = 12; ctx.stroke()
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(215,241,255,.35)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect(x+6,y+6,w-12,h-12,15); ctx.stroke(); ctx.restore()
}
export function performanceLayout(count) {
  const columns = Math.min(count, count <= 6 ? 3 : 4)
  const rows = Math.ceil(count / columns)
  return { columns, rows, height: Math.max(1100, 660 + rows * 176 + 170) }
}
function panel(ctx, entry, image, studio, goldStudio, y) {
  const { asset, returns } = entry, total = cumulativePerformance(returns)
  const { columns, height } = performanceLayout(returns.length)
  ctx.save(); ctx.translate(0, y)
  ctx.drawImage(asset.id === 'or' && height === 1100 ? goldStudio : studio, 0, 0, W, height)
  if (asset.id !== 'or' || height !== 1100) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(95,160,485,height-320,18); ctx.clip()
    ctx.fillStyle = 'rgba(7,26,48,.28)'; ctx.fillRect(95,160,485,height-320)
    if (asset.id === 'or') {
      // Keep the bullion's proportions on long histories, rather than stretching it.
      const h = Math.min(780,height-360), w = h * .56
      ctx.drawImage(goldStudio,120,180,400,650,337-w/2,(height-h)/2,w,h)
    } else {
      drawPerformanceArt(ctx, image, 95, 175, 485, height - 350)
    }
    ctx.restore()
  }
  text(ctx, assetTitle(asset), 670, 120, 98, { width: 830, color: GOLD, serif: true })
  text(ctx, `Fin ${returns[0].year - 1} → Fin ${returns.at(-1).year}`, 670, 252, 48, { width: 825, serif: true })
  text(ctx, `EN ${asset.currency}`, 675, 327, 27, { color: MUTED })
  text(ctx, performanceBasis(asset.id).replace(`${asset.currency} · `, '').replace(` · ${asset.currency}`, ''), 1500, 329, 23, { width: 600, align: 'right', color: MUTED, weight: 400 })
  ctx.save(); ctx.shadowColor = total < 0 ? '#b02d38' : '#2f9fe6'; ctx.shadowBlur = 14
  text(ctx, percentage(total), 1080, 385, 151, { width: 825, align: 'center', color: total < 0 ? RED : GREEN, serif: true })
  ctx.restore()
  text(ctx, 'Cumul sur la période', 1080, 558, 38, { width: 815, align: 'center', serif: true })
  text(ctx, 'Rendements annuels', 1080, 620, 36, { width: 815, align: 'center', color: GOLD, serif: true })
  const gap = 18, cellW = (850 - gap * (columns - 1)) / columns
  returns.forEach(({ year, pct }, i) => {
    const row = Math.floor(i / columns), col = i % columns
    const count = Math.min(columns, returns.length - row * columns)
    const left = 650 + (850 - count * cellW - (count - 1) * gap) / 2
    const x = left + col * (cellW + gap), top = 690 + row * 176
    glass(ctx, x, top, cellW, 150)
    text(ctx, String(year), x + cellW / 2, top + 22, 35, { width: cellW - 24, align: 'center', color: GOLD, serif: true })
    text(ctx, percentage(pct), x + cellW / 2, top + 80, columns <= 3 ? 52 : 39, { width: cellW - 24, align: 'center', color: pct < 0 ? RED : GREEN, serif: true })
  })
  ctx.restore()
}
export async function renderPerformanceImage(item) {
  const entries = getPerformanceEntries(item)
  const ids = entries.map(entry => entry.asset.id)
  const [images, studio, goldStudio] = await Promise.all([
    Promise.all(ids.map(loadPerformanceArt)), loadArtImage('approved/investor-glass.webp'), loadArtImage('approved/performance-gold-glass.webp'),
  ]); await document.fonts.ready
  const credits = [...new Set(entries.map(entry => entry.asset.sourceCredit).filter(Boolean))].flatMap(credit => credit.replace(' · Calculs Épargnant Libre', '').split('\n'))
  const bodyHeight = entries.reduce((sum, entry) => sum + performanceLayout(entry.returns.length).height, 0)
  const footerHeight = Math.max(140, 85 + credits.length * 24 + (ids.includes('silver') ? 24 : 0))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = bodyHeight + footerHeight
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#061523'; ctx.fillRect(0, 0, W, canvas.height)
  let panelY = 0
  entries.forEach((entry, i) => { panel(ctx, entry, images[i], studio, goldStudio, panelY); panelY += performanceLayout(entry.returns.length).height })
  let creditY = bodyHeight + 20
  if (ids.includes('silver')) { text(ctx, 'ARGENT : FUTURES COMEX CONTINUS, HORS FRAIS ET ROULEMENT', 45, creditY, 19, { width: 1500, color: MUTED, weight: 400 }); creditY += 24 }
  credits.forEach(credit => { text(ctx, credit, 45, creditY, 18, { width: 1500, color: MUTED, weight: 400 }); creditY += 24 })
  text(ctx, 'Les performances passées ne préjugent pas des performances futures.', 45, canvas.height - 45, 20, { width: 1120, color: MUTED, weight: 400 })
  text(ctx, '@Epargnantlibre', 1535, canvas.height - 48, 26, { align: 'right', width: 340, color: GOLD, serif: true })
  return canvas
}
export async function downloadPerformanceImage(item) {
  const canvas = await renderPerformanceImage(item)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `performance-depuis-${item.year}-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`
  document.body.appendChild(link); startPublicationDownload(link); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
