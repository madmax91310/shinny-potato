import { getETFArt } from '../etf-sheets/visualIdentity.js'
import { loadArtImage } from '../tweet-midi/anniversaryArt.js'

// Each exposure reuses its reviewed ETF illustration. These are exposure scenes,
// never fund-provider logos; names distinguish geographic/factor variants.
const references = {
  gaming: 'gaming_vaneck', medical: 'medical_innovation_ishares',
  world: 'support-msci_world_ishares', 'acwi-imi': 'acwi_imi_spdr', acwi: 'msci-acwi', 'acwi-pea': 'pea_global_amundi', allworld: 'ftse-all-world',
  exusa: 'world_ex_usa', equalweight: 'sp500_equal_weight', sp500: 'support-sp500_ishares', 'us-small': 'russell2000_spdr',
  'em-ex-china': 'em-ex-chine', em: 'msci-em', europe: 'support-msci_europe', smallcap: 'small-caps', nasdaq: 'nasdaq100', japan: 'support-actions_japon', india: 'inde',
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
  const c = layer.getContext('2d'), side = Math.min(width-6,height-6), cx=width/2,cy=height/2
  c.save(); c.beginPath(); c.arc(cx,cy,side/2,0,Math.PI*2); c.clip()
  const scale=side/(image.height*.88),w=image.width*scale,h=image.height*scale
  c.drawImage(image,cx-w*.69,cy-h*.44,w,h); c.restore()
  const rim=c.createLinearGradient(0,0,width,height);rim.addColorStop(0,'#fff3ce');rim.addColorStop(.3,'#a18554');rim.addColorStop(.55,'#f7d69c');rim.addColorStop(1,'#46534d')
  c.lineWidth=3;c.strokeStyle=rim;c.beginPath();c.arc(cx,cy,side/2,0,Math.PI*2);c.stroke()
  ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=12;ctx.shadowOffsetY=8;ctx.drawImage(layer,x,y);ctx.restore()
}
