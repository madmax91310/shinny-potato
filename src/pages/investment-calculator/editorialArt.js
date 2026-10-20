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
  const paper = await loadArtImage('approved/investment-reference-poster.webp')
  if (id === 'apple') return { poster: paper, paper }
  if (id === 'totalenergies') return { collage: await loadArtImage('approved/investment-energy-editorial.webp'), paper }
  const art = await loadInvestmentArt(id)
  const scene = NEON_ASSET_ART[id]
  return { paper, image: art.scene || (scene?.scene ? await loadArtImage(scene.sceneFile || `neon/${scene.scene}.webp`) : null), mark: art.mark }
}
// Deterministic paper grain; illustrations contain no financial data.
export function drawEditorialPaper(ctx, art) {
  ctx.fillStyle = '#f4eedf'; ctx.fillRect(0, 0, 1600, 2040)
  let seed = 31
  for (let i = 0; i < 48000; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const x = seed % 1600
    seed = (seed * 1664525 + 1013904223) >>> 0
    ctx.fillStyle = i % 2 ? '#44352308' : '#ffffff45'
    ctx.fillRect(x, seed % 2040, 1.5, 1.5)
  }
  if (art.paper) {
    ctx.save(); ctx.globalAlpha = .5
    for (let y = 0; y < 2040; y += 400) for (let x = 0; x < 1600; x += 400) ctx.drawImage(art.paper, 0, 0, 360, 360, x, y, 400, 400)
    ctx.restore()
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
  if (art.poster) { ctx.drawImage(art.poster, 0, 0, 1600, 2040); return }
  // Keep the approved illustration continuous, at poster scale: cutting it into
  // horizontal strips shrank the subject and broke the reference composition.
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(900, 0); ctx.lineTo(1600, 0); ctx.lineTo(1600, 2040)
  ctx.lineTo(700, 2040); ctx.lineTo(1040, 1520); ctx.lineTo(1080, 1150)
  ctx.lineTo(870, 790); ctx.lineTo(830, 400); ctx.closePath(); ctx.clip()
  ctx.globalCompositeOperation = 'multiply'
  if (art.collage) {
    ctx.drawImage(art.collage, 760, -20, 920, 2080)
  } else {
    ctx.fillStyle = '#d45b36'; ctx.beginPath(); ctx.arc(1260, 300, 440, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#173f33'; torn(ctx, 860, 570, 860, 1450, 1); ctx.fill()
    if (art.image) {
      const side = Math.min(art.image.width, art.image.height)
      ctx.save(); torn(ctx, 850, 120, 850, 1060); ctx.clip()
      ctx.filter = 'grayscale(.65) sepia(.2) contrast(1.08)'
      ctx.drawImage(art.image, art.image.width - side, 0, side, side, 850, 100, 850, 1100); ctx.restore()
    }
    if (art.mark) {
      const ratio = Math.min(390 / art.mark.width, 370 / art.mark.height)
      const w = art.mark.width * ratio, h = art.mark.height * ratio
      ctx.save(); ctx.translate(1300, 620); ctx.rotate(-.15)
      ctx.shadowColor = '#29251d55'; ctx.shadowBlur = 15; ctx.drawImage(art.mark, -w / 2, -h / 2, w, h); ctx.restore()
    }
  }
  ctx.restore()
}
