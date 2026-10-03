import { loadArtImage, ANNIVERSARY_ART } from './anniversaryArt.js'

const paperGroups = {
  world: ['monde'], america: ['usa'], europe: ['europe'], emerging: ['emergents'],
  luxury: ['luxe'], robotics: ['ia-robotique'], health: ['sante'], renewables: ['renouvelables'],
  dividends: ['dividendes'], japan: ['japon'], defense: ['defense'], quantum: ['quantique'],
  space: ['spatial'], resources: ['ressources-naturelles'], finance: ['financieres'],
  chip: ['tech-europe', 'semiconducteurs-tech'], blockchain: ['blockchain'], gold: ['etc-metaux'],
}
export const PAPER_THEME_ART = Object.freeze(Object.fromEntries(Object.entries(paperGroups).flatMap(([scene, ids]) => ids.map(id => [id, scene]))))
export function getPaperArt(themeId, isin) {
  if (themeId === 'etc-metaux') return isin === 'IE00B4NCWG09' ? 'silver' : isin === 'GB00B15KXQ89' ? 'copper' : 'gold'
  const scene = PAPER_THEME_ART[themeId]
  if (!scene) throw new Error(`Illustration de comparatif absente : ${themeId}`)
  return scene
}

const neonGroups = {
  world: ['msciWorld', 'msciWorldSmallCap'], america: ['sp500', 'nasdaq100'], france: ['cac40'], europe: ['stoxx600'], emerging: ['msciEmerging'],
  chip: ['soxx', 'apple', 'microsoft', 'broadcom', 'nvidia', 'google', 'meta', 'sap', 'asml', 'intel'],
  gold: ['or'], silver: ['silver'], money: ['euroMoney'], bonds: ['euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond', 'berkshire'],
  luxury: ['lvmh', 'hermes'], car: ['tesla'], shopping: ['amazon', 'costco'], cinema: ['netflix'], payments: ['visa', 'paypal'], groceries: ['nestle', 'cocacola'],
  industry: ['airliquide'], electricity: ['schneider'], cosmetics: ['loreal'], food: ['mcdonalds'],
  // Crypto use the existing verified vector symbols, illuminated in Canvas.
  crypto: ['bitcoin', 'ethereum'],
}
export const NEON_ASSET_ART = Object.freeze(Object.fromEntries(Object.entries(neonGroups).flatMap(([scene, ids]) => ids.map(id => [id, { scene: scene === 'crypto' ? null : scene, mark: ANNIVERSARY_ART[id]?.kind === 'logo' ? ANNIVERSARY_ART[id].mark : null }]))))

export async function loadNeonArt(id) {
  const art = NEON_ASSET_ART[id]
  if (!art) throw new Error(`Illustration néon absente : ${id}`)
  return { scene: art.scene ? await loadArtImage(`neon/${art.scene}.webp`) : null, mark: art.mark ? await loadArtImage(art.mark) : null }
}

export function drawNeonArt(ctx, images, x, y, size) {
  ctx.save()
  if (images.scene) ctx.drawImage(images.scene, x, y, size, size)
  if (images.mark) {
    const side = images.scene ? size * .38 : size * .65
    const layer = document.createElement('canvas'); layer.width = side; layer.height = side
    const c = layer.getContext('2d'), ratio = Math.min(side / images.mark.width, side / images.mark.height)
    const w = images.mark.width * ratio, h = images.mark.height * ratio
    c.drawImage(images.mark, (side - w) / 2, (side - h) / 2, w, h)
    c.globalCompositeOperation = 'source-in'
    const gradient = c.createLinearGradient(0, 0, side, side); gradient.addColorStop(0, '#95ffdc'); gradient.addColorStop(1, '#ffe096')
    c.fillStyle = gradient; c.fillRect(0, 0, side, side)
    ctx.shadowColor = '#6df6c5'; ctx.shadowBlur = 24
    ctx.drawImage(layer, x + (size - side) / 2, images.scene ? y + size * .62 : y + (size - side) / 2)
  }
  ctx.restore()
}
