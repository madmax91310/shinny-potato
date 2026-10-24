import {withHistoryVisuals} from '../../data/history-visual-identities.js'
import { EQUITY_HISTORY_IDENTITIES } from '../../data/equity-history-identities.js'
import { loadArtImage } from '../../lib/art-resources.js'
import { MARKET_ART_MARKS } from '../../lib/market-art-marks.js'
import { ETF_HISTORY_IDENTITIES } from '../../data/etf-history-identities.js'

// Explicit market identities. Index illustrations depict geography, never an ETF issuer.
const groups = {
  world: ['world-net','acwi-gross','ftseAllWorld','msciWorld', 'msciWorldSmallCap','msciAcwi','msciAcwiImi','msciWorldExUsa', 'msciWorldMomentum', 'msciWorldQuality', 'msciWorldValue'], america: ['sp500', 'nasdaq100', 'msciUsa', 'russell2000'],
  europe: ['stoxx600', 'cac40', 'msciEurope'], asia: ['emerging-net','msciEmerging', 'msciIndia', 'msciEmergingExChina'], chip: ['soxx', 'nvidia', 'google', 'meta', 'adobe','sap', 'intel'],
  bonds: ['euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond'],
  finance: ['mastercard','jpmorgan', 'euroMoney', 'visa', 'paypal'], luxury: ['lvmh', 'hermes', 'loreal'],
  consumer: ['pepsico','booking','home-depot','nike','disney','procter-gamble', 'amazon', 'costco', 'nestle', 'cocacola', 'mcdonalds', 'netflix'],
  health: ['unitedhealth','sanofi','johnson-johnson'], energy:['totalenergies','exxonmobil'], infrastructure: ['vinci','airliquide','caterpillar','waste-management'], utilities: ['schneider'], silver: ['silver'],
}
const BASE_PERFORMANCE_ART = Object.freeze({
  'japan-net': { scene:'paper/japan.webp' },
  ...Object.fromEntries(Object.entries(EQUITY_HISTORY_IDENTITIES).map(([id, asset]) => [id, {scene:`etf-night/${asset.scene}.webp`}])),
  ...Object.fromEntries(Object.entries(ETF_HISTORY_IDENTITIES).map(([id, asset]) => [id, {
    scene: `etf-night/${id === 'etfIndustrials' ? 'infrastructure' : id === 'etfEpra' ? 'property' : id === 'etfCmod' ? 'commodities' : id === 'etfLock' ? 'security' : asset.scene === 'industry' ? 'silver' : asset.scene}.webp`,
  }])),
  ...Object.fromEntries(Object.entries(groups).flatMap(([scene, ids]) => ids.map(id => [id, { scene: `etf-night/${scene}.webp` }]))),
  // Keep the existing performance/duel artwork independent of anniversary
  // logos: its text-only fallbacks do not provide an illustration to export.
  ...Object.fromEntries(Object.entries(MARKET_ART_MARKS).map(([id, mark]) => [id, { mark }])),
  or: { scene: 'approved/performance-gold-glass.webp' },
})
export const PERFORMANCE_ART = Object.freeze(withHistoryVisuals(BASE_PERFORMANCE_ART))
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
