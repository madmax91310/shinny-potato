import { loadArtImage } from '../../lib/art-resources.js'
import { loadInvestmentArt } from './emeraldArt.js'
import { NEON_ASSET_ART } from '../tweet-midi/stylizedArt.js'
let displayReady
async function loadDisplay() {
  if (!displayReady) displayReady = new FontFace('InvestmentCondensed', `url("${import.meta.env.BASE_URL}asset-art/purchasing-power/anton.ttf")`).load().then(font => document.fonts.add(font)).catch(error => { displayReady = undefined; throw error })
  return displayReady
}

export async function loadInvestmentEditorialArt(id) {
  await loadDisplay()
  if (id === 'apple') return { collage: await loadArtImage('approved/investment-apple-editorial.webp') }
  if (id === 'totalenergies') return { collage: await loadArtImage('approved/investment-energy-editorial.webp') }
  const art = await loadInvestmentArt(id)
  const scene = NEON_ASSET_ART[id]
  return { image: art.scene || (scene?.scene ? await loadArtImage(scene.sceneFile || `neon/${scene.scene}.webp`) : null), mark: art.mark }
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
// Torn shapes assemble the subject into the poster, without a photo frame.
function torn(ctx, x, y, w, h, seed = 0) {
  ctx.beginPath()
  for (let i = 0; i <= 24; i++) {
    const xx = x + w * i / 24, rough = Math.sin(i * 2.1 + seed) * 9
    if (!i) ctx.moveTo(xx, y + rough); else ctx.lineTo(xx, y + rough + i * 1.7)
  }
  for (let i = 24; i >= 0; i--) ctx.lineTo(x + w * i / 24, y + h + Math.sin(i * 1.9 + seed) * 10 - i * 1.1)
  ctx.closePath()
}
export function drawEditorialCollage(ctx, art) {
  ctx.save(); ctx.beginPath(); ctx.rect(1000, 0, 600, 560); ctx.clip()
  if (art.collage) {
    ctx.globalCompositeOperation = 'multiply'
    // Three overlapping cutouts fill the poster's illustration column without
    // stretching a portrait into a landscape or adding a framed-photo border.
    const source = art.collage, ratio = 600 / source.width, band = source.height / 3
    for (let i = 0; i < 3; i++) {
      const h = 220, y = i * 170, sh = Math.min(band, h / ratio)
      ctx.save(); torn(ctx, 1000, y, 600, h, i); ctx.clip()
      ctx.drawImage(source, 0, i * band + (band - sh) / 2, source.width, sh, 1000, y - 12, 600, h + 24)
      ctx.restore()
    }
  } else {
    ctx.fillStyle = '#d45b36'; ctx.beginPath(); ctx.arc(1310, 165, 250, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#173f33'; torn(ctx, 1060, 180, 650, 350, 1); ctx.fill()
    if (art.image) {
      const side = Math.min(art.image.width, art.image.height)
      ctx.save(); torn(ctx, 1045, 55, 550, 365); ctx.clip()
      ctx.filter = 'grayscale(.8) sepia(.2) contrast(1.08)'
      ctx.drawImage(art.image, art.image.width - side, 0, side, side, 1045, 40, 560, 405); ctx.restore()
      ctx.save(); torn(ctx, 1005, 355, 550, 185, 3); ctx.clip()
      ctx.filter = 'grayscale(1) sepia(.4)'
      ctx.drawImage(art.image, 0, art.image.height * .25, art.image.width, art.image.height * .6, 1005, 330, 550, 235); ctx.restore()
    }
    if (art.mark) {
      const ratio = Math.min(220 / art.mark.width, 200 / art.mark.height)
      const w = art.mark.width * ratio, h = art.mark.height * ratio
      ctx.save(); ctx.translate(1410, 400); ctx.rotate(-.15)
      ctx.shadowColor = '#29251d55'; ctx.shadowBlur = 15; ctx.drawImage(art.mark, -w / 2, -h / 2, w, h); ctx.restore()
    }
  }
  ctx.restore()
}
