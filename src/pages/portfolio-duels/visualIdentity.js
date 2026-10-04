import { getETFArt } from '../etf-sheets/visualIdentity.js'
import { loadArtImage } from '../tweet-midi/anniversaryArt.js'

// Each exposure reuses its reviewed ETF illustration. These are exposure scenes,
// never fund-provider logos; names distinguish geographic/factor variants.
const references = {
  world: 'support-msci_world_ishares', acwi: 'msci-acwi', 'acwi-pea': 'pea_global_amundi', allworld: 'ftse-all-world',
  exusa: 'world_ex_usa', equalweight: 'sp500_equal_weight', sp500: 'support-sp500_ishares', 'us-small': 'russell2000_spdr',
  em: 'msci-em', europe: 'support-msci_europe', smallcap: 'small-caps', nasdaq: 'nasdaq100', japan: 'support-actions_japon', india: 'inde',
  value: 'value', quality: 'quality', momentum: 'momentum', minvol: 'low-volatility', dividend: 'support-high_dividend',
  'em-bond': 'oblig_em_usd_ishares', 'em-local-bond': 'em-local-bond', longbond: 'oblig_eur_long_ishares',
  cash: 'monetaire-eur', shortbond: 'obligations-etat-0-1', globalbond: 'obligations-globales-eur',
  financials: 'financieres', tech: 'technologie', energy: 'energie', health: 'sante-biotech', cyber: 'cybersecurite',
  ai: 'ia', robotics: 'robotique', biotech: 'sante-biotech', water: 'eau', luxury: 'luxe', batteries: 'batteries-ve',
  cleanenergy: 'support-sect_energie_propre', infrastructure: 'infrastructures', property: 'immobilier-reit',
  semiconductors: 'semiconducteurs', blockchain: 'blockchain',
}
export const DUEL_EXPOSURE_ART = Object.freeze(Object.fromEntries(Object.entries(references).map(([exposure, id]) => [exposure, getETFArt(id)])))
export function getDuelArt(asset) {
  const art = DUEL_EXPOSURE_ART[asset.exposure]
  if (!art?.scene) throw new Error(`Illustration du duel non vérifiée : ${asset.id}`)
  return art
}
export async function loadDuelArt(asset) {
  return loadArtImage(getDuelArt(asset).scene)
}

// Scenes are landscape studio renders. Preserve their aspect and complete subject;
// the feathered perimeter merges them into the machined card, without stretching.
export function drawDuelArt(ctx, image, x, y, width, height) {
  const layer = document.createElement('canvas'); layer.width = Math.ceil(width); layer.height = Math.ceil(height)
  const c = layer.getContext('2d'), scale = Math.min(width / image.width, height / image.height)
  const w = image.width * scale, h = image.height * scale
  const left = (width - w) / 2, top = (height - h) / 2
  c.drawImage(image, left, top, w, h)
  c.globalCompositeOperation = 'destination-in'
  const mask = c.createLinearGradient(left, 0, left + w, 0)
  mask.addColorStop(0, 'transparent'); mask.addColorStop(.12, '#fff'); mask.addColorStop(.9, '#fff'); mask.addColorStop(1, 'transparent')
  c.fillStyle = mask; c.fillRect(0, 0, width, height)
  const vertical = c.createLinearGradient(0, top, 0, top + h)
  vertical.addColorStop(0, 'transparent'); vertical.addColorStop(.12, '#fff'); vertical.addColorStop(.85, '#fff'); vertical.addColorStop(1, 'transparent')
  c.fillStyle = vertical; c.fillRect(0, 0, width, height)
  ctx.drawImage(layer, x, y)
}
