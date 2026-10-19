import { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'
import { loadInvestmentArt } from './emeraldArt.js'

export async function loadInvestmentEditorialArt(id) {
  await loadEditorialFont()
  if (id === 'apple') return { collage: await loadArtImage('approved/investment-apple-editorial.webp') }
  const art = await loadInvestmentArt(id)
  return { image: art.mark || art.scene, mark: Boolean(art.mark) }
}
// Deterministic paper grain; illustrations contain no financial data.
export function drawEditorialPaper(ctx) {
  ctx.fillStyle = '#f4eedf'; ctx.fillRect(0, 0, 1600, 1600)
  let seed = 31
  for (let i = 0; i < 19000; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const x = seed % 1600
    seed = (seed * 1664525 + 1013904223) >>> 0
    ctx.fillStyle = i % 2 ? '#44352308' : '#ffffff45'
    ctx.fillRect(x, seed % 1600, 1.5, 1.5)
  }
  ctx.strokeStyle = '#1d463b12'; ctx.lineWidth = 1
  for (let x = 1030; x < 1600; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 525); ctx.stroke() }
}
export function drawEditorialCollage(ctx, art) {
  ctx.save(); ctx.beginPath(); ctx.rect(1010, 0, 590, 525); ctx.clip()
  ctx.fillStyle = '#d45b36'; ctx.beginPath(); ctx.arc(1350, 180, 240, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#173f33'; ctx.save(); ctx.translate(1360, 390); ctx.rotate(-.16); ctx.fillRect(-240, -50, 600, 180); ctx.restore()
  if (art.collage) ctx.drawImage(art.collage, 1010, -60, 590, 738)
  else if (art.image) {
    ctx.save(); ctx.translate(1295, 255); ctx.rotate(.10)
    ctx.shadowColor = '#30281845'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 14
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(-235, -195, 470, 400)
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
    if (art.mark) {
      const ratio = Math.min(380 / art.image.width, 290 / art.image.height)
      const w = art.image.width * ratio, h = art.image.height * ratio
      ctx.drawImage(art.image, -w / 2, -h / 2, w, h)
    } else {
      const side = Math.min(art.image.width, art.image.height)
      ctx.filter = 'saturate(.35) contrast(.9)'; ctx.drawImage(art.image, art.image.width - side, 0, side, side, -215, -175, 430, 350)
    }
    ctx.restore()
  }
  ctx.restore()
}
