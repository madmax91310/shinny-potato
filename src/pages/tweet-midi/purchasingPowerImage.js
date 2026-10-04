import { CURRENT_YEAR, fmtEUR, fmtPct, purchasingPowerStory } from '../purchasing-power/lib.js'
import { loadArtImage } from './anniversaryArt.js'

const W = 1200, H = 1500
const C = { navy: '#05172B', cream: '#FFF1D4', gold: '#E5B758', ink: '#07172A' }
export const PURCHASING_POWER_ART = Object.freeze({
  courses: 'purchasing-power/courses.webp', energie: 'purchasing-power/energie.webp',
  revenu: 'purchasing-power/revenu.webp', loyer: 'purchasing-power/loyer.webp',
})

let fontReady
function loadPurchasingFont() {
  if (!fontReady) fontReady = new FontFace('PurchasingDisplay',
    `url("${import.meta.env.BASE_URL}asset-art/purchasing-power/anton.ttf")`).load()
    .then(font => { document.fonts.add(font) })
    .catch(error => { fontReady = undefined; throw error })
  return fontReady
}

function fitted(ctx, value, x, y, size, width, color = C.cream, editorial = true) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  const font = editorial ? 'PurchasingDisplay, Arial, sans-serif' : 'Arial, sans-serif'
  while (size > 16) {
    ctx.font = `${editorial ? 400 : 700} ${size}px ${font}`
    if (ctx.measureText(value).width <= width) break
    size -= 1
  }
  ctx.fillStyle = color; ctx.fillText(value, x, y + ctx.measureText(value).actualBoundingBoxAscent)
}

// Text-free scenes are local. Every number and date comes from the shared story,
// including falling prices and inverse purchasing-power percentages.
export async function renderPurchasingPowerImage(item) {
  const d = purchasingPowerStory(item)
  const [art] = await Promise.all([loadArtImage(PURCHASING_POWER_ART[d.scene]), loadPurchasingFont()])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(art, 0, 0, W, H)
  fitted(ctx, d.headline[0], W / 2, 48, 112, 1080)
  fitted(ctx, d.headline[1], W / 2, 200, 115, 1080, C.gold)

  // Values sit on the blank physical tags, well within their front planes.
  fitted(ctx, fmtEUR(item.amount), 277, 1025, 88, 350, C.ink)
  fitted(ctx, d.startLabel, 277, 1130, 26, 330, C.ink, false)
  fitted(ctx, fmtEUR(d.endAmount), 1020, 654, 86, 225, C.ink)
  fitted(ctx, d.observation, 1020, 748, 19, 225, C.ink, false)

  const fade = ctx.createLinearGradient(0, 1195, 0, 1450)
  fade.addColorStop(0, 'rgba(5,23,43,0)'); fade.addColorStop(.3, 'rgba(5,23,43,.88)'); fade.addColorStop(1, C.navy)
  ctx.fillStyle = fade; ctx.fillRect(0, 1195, W, H - 1195)
  const a = fmtEUR(item.amount), b = fmtEUR(d.endAmount), arrow = ' → '
  let size = 128
  do {
    ctx.font = `400 ${size}px PurchasingDisplay, Arial, sans-serif`
    if (ctx.measureText(a + arrow + b).width <= 1080) break
    size -= 1
  } while (size > 20)
  const widths = [a, arrow, b].map(t => ctx.measureText(t).width)
  const heights = [a, arrow, b].map(t => { const m = ctx.measureText(t); return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent })
  const rowHeight = Math.max(...heights)
  let x = (W - widths.reduce((sum, n) => sum + n, 0)) / 2
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  for (const [i, value] of [a, arrow, b].entries()) {
    ctx.fillStyle = i === 2 ? C.gold : C.cream
    ctx.fillText(value, x, 1240 + (rowHeight - heights[i]) / 2 + ctx.measureText(value).actualBoundingBoxAscent); x += widths[i]
  }
  fitted(ctx, d.metricLabel, W / 2, 1370, 35, 1080, C.cream, false)
  fitted(ctx, `${d.period} · ${fmtPct(d.erosion ? d.equivalentPct : d.pricePct)}`, W / 2, 1422, 28, 1080, C.cream, false)
  fitted(ctx, '@epargnantlibre', W / 2, 1470, 24, 1080, C.gold, false)
  return canvas
}

export async function downloadPurchasingPowerImage(item) {
  const canvas = await renderPurchasingPowerImage(item)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url
  link.download = `pouvoir-achat-${item.startYear}-${CURRENT_YEAR}-${item.mode === 'par-poste' ? item.posteId : item.mode}.png`
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
