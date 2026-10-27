import { loadInvestmentArt } from './emeraldArt.js'
import { loadArtImage } from '../../lib/art-resources.js'

let displayReady
function loadDisplayFont() {
  if (!displayReady) displayReady = new FontFace('InvestmentDisplay',
    `url("${import.meta.env.BASE_URL}asset-art/purchasing-power/anton.ttf")`).load()
    .then(font => { document.fonts.add(font) })
    .catch(error => { displayReady = undefined; throw error })
  return displayReady
}

// Keep reviewed catalogue identities. Only the gold cutout is specific to this
// poster; it never changes a company mark or another tool's illustration.
export async function loadInvestmentEditorialArt(id) {
  const [art, cutout] = await Promise.all([
    loadInvestmentArt(id), id === 'or' ? loadArtImage('investment-obsidian/gold.webp') : null,
    loadDisplayFont(),
  ])
  return { ...art, cutout }
}

let backdrop
export function drawObsidianBackdrop(ctx, width, height) {
  if (!backdrop || backdrop.width !== width || backdrop.height !== height) {
    backdrop = document.createElement('canvas'); backdrop.width = width; backdrop.height = height
    const c = backdrop.getContext('2d')
    c.fillStyle = '#090a0b'; c.fillRect(0, 0, width, height)
    for (const [x, y, radius, opacity] of [[width, 0, width * .65, .17], [0, height, width * .45, .12]]) {
      const light = c.createRadialGradient(x, y, 0, x, y, radius)
      light.addColorStop(0, `rgba(188,124,39,${opacity})`); light.addColorStop(1, 'rgba(188,124,39,0)')
      c.fillStyle = light; c.fillRect(0, 0, width, height)
    }
    // Seeded edge grain: identical previews/exports, cached for the whole catalogue.
    let seed = 9187
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
    for (let i = 0; i < 21000; i++) {
      const x = random() * width, y = random() * height
      const edge = Math.min(x / width, 1 - x / width, y / height, 1 - y / height)
      c.fillStyle = `rgba(224,173,80,${(1 - Math.min(1, edge * 6)) * random() * .19})`
      const size = 1 + random() * 2; c.fillRect(x, y, size, size)
    }
    for (let i = 0; i < 36; i++) {
      const x = width * (.68 + random() * .32), y = random() * height * .36, r = 3 + random() * 13
      const glow = c.createRadialGradient(x, y, 0, x, y, r)
      glow.addColorStop(0, '#e4aa3d3b'); glow.addColorStop(1, '#e4aa3d00')
      c.fillStyle = glow; c.fillRect(x - r, y - r, r * 2, r * 2)
    }
  }
  ctx.drawImage(backdrop, 0, 0)
}

// Art blends into the poster: no tile, border or rounded card.
export function drawObsidianAsset(ctx, art, x, y, width, height) {
  const image = art.cutout || art.mark || art.scene || art.background
  if (!image) return
  ctx.save()
  if (art.cutout || art.mark) {
    const ratio = Math.min(width / image.width, height / image.height)
    const w = image.width * ratio, h = image.height * ratio
    ctx.shadowColor = '#e8ae4140'; ctx.shadowBlur = 40
    ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h)
  } else {
    const layer = document.createElement('canvas'); layer.width = width; layer.height = height
    const c = layer.getContext('2d'), ratio = Math.max(width / image.width, height / image.height)
    const w = image.width * ratio, h = image.height * ratio
    c.filter = 'saturate(.7) sepia(.25)'
    c.drawImage(image, (width - w) / 2, (height - h) / 2, w, h)
    c.filter = 'none'; c.globalCompositeOperation = 'destination-in'
    for (const vertical of [false, true]) {
      const fade = c.createLinearGradient(0, 0, vertical ? 0 : width, vertical ? height : 0)
      fade.addColorStop(0, '#ffffff00'); fade.addColorStop(.2, '#fff')
      fade.addColorStop(.8, '#fff'); fade.addColorStop(1, '#ffffff00')
      c.fillStyle = fade; c.fillRect(0, 0, width, height)
    }
    ctx.drawImage(layer, x, y)
  }
  ctx.restore()
}

export function drawMetricIcon(ctx, kind, x, y, color, loss = false) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = color
  ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  ctx.shadowColor = color + '55'; ctx.shadowBlur = 14
  if (kind === 0) {
    for (let row = 2; row >= 0; row--) {
      const cy = row * 15
      ctx.beginPath(); ctx.ellipse(24, cy, 22, 8, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(2, cy); ctx.lineTo(2, cy + 12)
      ctx.ellipse(24, cy + 12, 22, 8, 0, Math.PI, 0, true); ctx.lineTo(46, cy); ctx.stroke()
    }
  } else if (kind === 1) {
    for (let i = 0; i < 3; i++) ctx.strokeRect(i * 19, 30 - i * 18, 12, 28 + i * 18)
    ctx.beginPath(); ctx.moveTo(-4, 66); ctx.lineTo(60, 66); ctx.stroke()
  } else {
    const points = loss ? [[0, 0], [22, 24], [36, 14], [70, 54]] : [[0, 58], [24, 30], [38, 38], [70, 0]]
    ctx.beginPath(); points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(70, loss ? 54 : 0); ctx.lineTo(47, loss ? 47 : 7)
    ctx.lineTo(65, loss ? 31 : 23); ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

export function drawSignatureLeaves(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#edc46c'
  ctx.beginPath(); ctx.moveTo(32, 63); ctx.bezierCurveTo(2, 57, 1, 21, 0, 16)
  ctx.bezierCurveTo(29, 17, 43, 36, 32, 63); ctx.fill()
  ctx.beginPath(); ctx.moveTo(38, 53); ctx.bezierCurveTo(30, 20, 59, 9, 77, 0)
  ctx.bezierCurveTo(74, 33, 61, 57, 38, 53); ctx.fill()
  ctx.strokeStyle = '#edc46c'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(33, 77); ctx.quadraticCurveTo(32, 40, 61, 16); ctx.stroke(); ctx.restore()
}
