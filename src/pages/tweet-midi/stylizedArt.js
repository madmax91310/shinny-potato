import {withHistoryVisuals} from '../../data/history-visual-identities.js'
import { EQUITY_HISTORY_IDENTITIES } from '../../data/equity-history-identities.js'
import { loadArtImage, ANNIVERSARY_ART } from './anniversaryArt.js'
import { ETF_HISTORY_IDENTITIES } from '../../data/etf-history-identities.js'

const paperGroups = {
  world: ['world-islamic','small-value-selection','world-listed-private-equity','world-midcap-equal-duel','world-consumption-duel','world-acwi-cto','world-quality','world-value','quality-momentum','world-momentum','world-minvol','monde','monde-toutes-tailles','world-avec-sans-usa','grandes-petites-monde','world-pea', 'world-meme-indice-pea'], america: ['nasdaq-equal-weight','sp500-equal-weight','nasdaq-sp500','usa','usa-pea','sp500-meme-indice-pea'], europe: ['europe','europe-pea'], emerging: ['emergents','emergents-avec-sans-chine','emergents-pea'], property: ['immobilier-infrastructures'],
  gaming: ['jeux-video'], luxury: ['luxe'], robotics: ['ia-robotique'], health: ['sante','innovation-medicale'], renewables: ['energy-or-clean-energy','renouvelables'],
  dividends: ['dividendes'], japan: ['japon'], defense: ['defense'], quantum: ['quantique'],
  space: ['spatial'], resources: ['brent-wti','agricultural-futures','energy-futures','gold-or-miners','ressources-naturelles'], finance: ['europe-banks-insurance','financieres', 'monetaire-obligations-courtes'],
  chip: ['tech-europe', 'semiconducteurs-tech'], blockchain: ['blockchain'], gold: ['etc-metaux'],
}
export const PAPER_THEME_ART = Object.freeze(Object.fromEntries(Object.entries(paperGroups).flatMap(([scene, ids]) => ids.map(id => [id, scene]))))
export function getPaperArt(themeId, isin) {
  // L'illustration asiatique ne représente pas l'Amérique latine ou l'EMEA.
  if (themeId === 'emergents-pea') return isin === 'FR0013412012' ? 'emerging' : 'world'
  if (themeId === 'etc-metaux') return isin === 'IE00B4NCWG09' ? 'silver' : isin === 'GB00B15KXQ89' ? 'copper' : 'gold'
  const scene = PAPER_THEME_ART[themeId]
  if (!scene) throw new Error(`Illustration de comparatif absente : ${themeId}`)
  return scene
}

const neonGroups = {
  world: ['world-net','acwi-gross','ftseAllWorld','msciWorld', 'msciWorldSmallCap', 'msciAcwi','msciAcwiImi','msciWorldExUsa', 'msciWorldMomentum', 'msciWorldQuality', 'msciWorldValue'], america: ['sp500', 'nasdaq100', 'msciUsa', 'russell2000'], france: ['cac40'], europe: ['stoxx600', 'msciEurope'], emerging: ['emerging-net','msciEmerging', 'msciIndia', 'msciEmergingExChina'],
  chip: ['soxx', 'apple', 'microsoft', 'broadcom', 'nvidia', 'google', 'meta', 'adobe','sap', 'asml', 'intel'],
  gold: ['or'], silver: ['silver'], money: ['euroMoney'], bonds: ['euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond', 'berkshire'],
  luxury: ['lvmh', 'hermes'], car: ['tesla'], shopping: ['booking','home-depot','nike', 'amazon', 'costco'], cinema: ['disney','netflix'], payments: ['mastercard','jpmorgan', 'visa', 'paypal'], groceries: ['pepsico','procter-gamble', 'nestle', 'cocacola'],
  industry: ['unitedhealth','totalenergies','vinci','sanofi','johnson-johnson','exxonmobil','caterpillar','waste-management','airliquide'], electricity: ['schneider'], cosmetics: ['loreal'], food: ['mcdonalds'],
  // Crypto use the existing verified vector symbols, illuminated in Canvas.
  crypto: ['bitcoin', 'ethereum'],
}
// These sectors already have reviewed night-studio illustrations. The neon
// collection has no corresponding files; retain their explicit asset paths.
const historicalEtfSceneFiles = Object.fromEntries(
  ['robotics', 'health', 'finance', 'infrastructure', 'renewables', 'energy', 'commodities'].map(scene => [scene, `etf-night/${scene}.webp`]),
)
const BASE_NEON_ASSET_ART = Object.freeze({
  'japan-net': { scene:'japan', sceneFile:'paper/japan.webp', mark:null },
  ...Object.fromEntries(Object.entries(EQUITY_HISTORY_IDENTITIES).map(([id, asset]) => [id, {scene:asset.scene, sceneFile:`etf-night/${asset.scene}.webp`, mark:null}])),
  ...Object.fromEntries(Object.entries(neonGroups).flatMap(([scene, ids]) => ids.map(id => [id, { scene: scene === 'crypto' ? null : scene, mark: ANNIVERSARY_ART[id]?.kind === 'logo' ? ANNIVERSARY_ART[id].mark : null }]))),
  ...Object.fromEntries(Object.entries(ETF_HISTORY_IDENTITIES).map(([id, asset]) => [id, {
    scene: id === 'etfCmod' ? 'industry' : asset.scene,
    ...(historicalEtfSceneFiles[asset.scene] ? { sceneFile: historicalEtfSceneFiles[asset.scene] } : {}), mark: null,
  }])),
})

export const NEON_ASSET_ART = Object.freeze(withHistoryVisuals(BASE_NEON_ASSET_ART))
export async function loadNeonArt(id) {
  const art = NEON_ASSET_ART[id]
  if (!art) throw new Error(`Illustration néon absente : ${id}`)
  return { scene: art.scene ? await loadArtImage(art.sceneFile ?? `neon/${art.scene}.webp`) : null, mark: art.mark ? await loadArtImage(art.mark) : null }
}

export function drawNeonArt(ctx, images, x, y, size) {
  ctx.save()
  if (images.scene) {
    const side = Math.min(images.scene.width, images.scene.height)
    ctx.drawImage(images.scene, images.scene.width - side, 0, side, side, x, y, size, size)
  }
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
