import { ANNIVERSARY_ART, loadArtImage } from '../tweet-midi/anniversaryArt.js'
import { NEON_ASSET_ART } from '../tweet-midi/stylizedArt.js'

// Verified silhouettes are reused unchanged; illustrations never become issuer logos.
export const INVESTMENT_ART = Object.freeze(Object.fromEntries(Object.entries(NEON_ASSET_ART).map(([id, art]) => [id,
  id === 'apple' ? { kind: 'logo', background: 'emerald/apple.webp' }
    : art.mark ? { kind: 'logo', mark: art.mark }
      : id === 'berkshire' ? { kind: 'illustration', mark: ANNIVERSARY_ART.berkshire.mark }
        : { kind: 'illustration', scene: `neon/${art.scene}.webp` },
])))
export async function loadInvestmentArt(id) {
  const definition = id === 'custom' ? { kind: 'illustration', mark: 'holding.svg' } : INVESTMENT_ART[id]
  if (!definition) throw new Error(`Illustration du placement absente : ${id}`)
  return {
    background: await loadArtImage(definition.background || 'emerald/studio.webp'),
    mark: definition.mark ? await loadArtImage(definition.mark) : null,
    scene: definition.scene ? await loadArtImage(definition.scene) : null,
  }
}

// The glass face, highlights and extrusion are clipped to the source alpha mask.
// No generated lettering replaces ASML, Microsoft, Tesla or the crypto symbols.
export function drawEmeraldMark(ctx, image, x, y, w, h) {
  const mask = document.createElement('canvas'); mask.width = w; mask.height = h
  const m = mask.getContext('2d'), ratio = Math.min(w / image.width, h / image.height)
  const iw = image.width * ratio, ih = image.height * ratio
  m.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih)
  function layer(stops) {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
    const c = canvas.getContext('2d'); c.drawImage(mask, 0, 0); c.globalCompositeOperation = 'source-in'
    const gradient = c.createLinearGradient(0, 0, w, h)
    stops.forEach(([at, color]) => gradient.addColorStop(at, color))
    c.fillStyle = gradient; c.fillRect(0, 0, w, h)
    return canvas
  }
  const edge = layer([[0, '#fbebac'], [.24, '#4edca9'], [.6, '#075c46'], [1, '#dfbe62']])
  const face = layer([[0, '#d2ffe1'], [.12, '#379d70'], [.3, '#086142'], [.48, '#07392f'], [.52, '#5ac391'], [.75, '#094a38'], [1, '#b3edb2']])
  ctx.save(); ctx.shadowColor = '#6bffc487'; ctx.shadowBlur = 26
  for (let depth = 8; depth > 0; depth--) ctx.drawImage(edge, x + depth, y + depth)
  ctx.shadowBlur = 0; ctx.drawImage(face, x, y)
  ctx.globalAlpha = .12; ctx.translate(x, y + h + 18); ctx.scale(1, -.1); ctx.drawImage(face, 0, 0); ctx.restore()
}
export function drawInvestmentArt(ctx, art) {
  ctx.drawImage(art.background, 0, 0, 1600, 1040)
  if (art.scene) ctx.drawImage(art.scene, 40, 160, 550, 550)
  if (art.mark) drawEmeraldMark(ctx, art.mark, 95, 225, 420, 330)
}
