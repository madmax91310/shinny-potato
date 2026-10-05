import { loadArtImage, ANNIVERSARY_ART } from './anniversaryArt.js'

// Explicit market identities. Index illustrations depict geography, never an ETF issuer.
const groups = {
  world: ['msciWorld', 'msciWorldSmallCap','msciAcwi','msciAcwiImi','msciWorldExUsa'], america: ['sp500', 'nasdaq100'],
  europe: ['stoxx600', 'cac40'], asia: ['msciEmerging'], chip: ['soxx', 'nvidia', 'google', 'meta', 'sap', 'intel'],
  bonds: ['euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond'],
  finance: ['euroMoney', 'visa', 'paypal'], luxury: ['lvmh', 'hermes', 'loreal'],
  consumer: ['amazon', 'costco', 'nestle', 'cocacola', 'mcdonalds', 'netflix'],
  infrastructure: ['airliquide'], utilities: ['schneider'], silver: ['silver'],
}
export const PERFORMANCE_ART = Object.freeze({
  ...Object.fromEntries(Object.entries(groups).flatMap(([scene, ids]) => ids.map(id => [id, { scene: `etf-night/${scene}.webp` }]))),
  ...Object.fromEntries(['bitcoin', 'ethereum', 'apple', 'microsoft', 'broadcom', 'tesla', 'berkshire', 'asml'].map(id => [id, { mark: ANNIVERSARY_ART[id].mark }])),
  or: { scene: 'approved/performance-gold-glass.webp' },
})
export async function loadPerformanceArt(id) {
  const art = PERFORMANCE_ART[id]
  if (!art) throw new Error(`Illustration de performance absente : ${id}`)
  return { ...art, image: await loadArtImage(art.mark || art.scene) }
}
export function drawPerformanceArt(ctx, art, x, y, w, h) {
  if (art.mark) {
    // Use the verified SVG silhouette with restrained metallic shading, no invented logo.
    const side = Math.min(w * .72, h * .7), layer = document.createElement('canvas')
    layer.width = side; layer.height = side
    const c = layer.getContext('2d'), scale = Math.min(side / art.image.width, side / art.image.height)
    c.drawImage(art.image, (side - art.image.width * scale) / 2, (side - art.image.height * scale) / 2, art.image.width * scale, art.image.height * scale)
    c.globalCompositeOperation = 'source-in'
    const metal = c.createLinearGradient(0, 0, side, side)
    metal.addColorStop(0, '#fff4d1'); metal.addColorStop(.3, '#d2ab68'); metal.addColorStop(.5, '#fff7e5'); metal.addColorStop(.75, '#819eb4'); metal.addColorStop(1, '#eedbb3')
    c.fillStyle = metal; c.fillRect(0, 0, side, side)
    ctx.save(); ctx.shadowColor = '#052139'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 10
    ctx.drawImage(layer, x + (w - side) / 2, y + (h - side) / 2); ctx.restore()
  } else {
    // Existing night-studio objects sit on the right of their source images.
    const sourceX = art.image.width * .34, sourceW = art.image.width * .65
    const scale = Math.min(w / sourceW, h / art.image.height)
    const dw = sourceW * scale, dh = art.image.height * scale
    const layer = document.createElement('canvas'); layer.width = dw; layer.height = dh
    const c = layer.getContext('2d')
    c.drawImage(art.image, sourceX, 0, sourceW, art.image.height, 0, 0, dw, dh)
    c.globalCompositeOperation = 'destination-in'
    const fade = c.createLinearGradient(0, 0, 0, dh)
    fade.addColorStop(0, 'transparent'); fade.addColorStop(.12, '#000'); fade.addColorStop(.86, '#000'); fade.addColorStop(1, 'transparent')
    c.fillStyle = fade; c.fillRect(0, 0, dw, dh)
    ctx.drawImage(layer, x + (w - dw) / 2, y + (h - dh) / 2)

  }
}
