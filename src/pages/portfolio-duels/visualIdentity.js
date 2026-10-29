import { NON_BOND_SHEETS } from '../../data/non-bond-expansion.js'
import { CATALOG } from '../../data/duel-assets.js'
import { ETFS } from '../../data/etf-cards.js'
import { getETFArt } from '../etf-sheets/visualIdentity.js'
import { loadArtImage } from '../tweet-midi/anniversaryArt.js'

// Each exposure reuses its reviewed ETF illustration. These are exposure scenes,
// never fund-provider logos; names distinguish geographic/factor variants.
const references = {
 'cloud-wisdomtree':'cloud-wisdomtree', 'small-value-world-avantis':'small-value-world-avantis',
 'ibonds-euro-2028':'ibonds-euro-2028','ibonds-euro-2029':'ibonds-euro-2029',
 'defense-vaneck':'defense','nuclear-vaneck':'nucleaire','quantum-vaneck':'quantique',
 'emerging-value':'em-value-ishares','euro-ultrashort':'euro-ultrashort-ishares',
 industrials:'world-industrials-xtrackers',staples:'world-staples',discretionary:'world-discretionary',
 'europe-food':'europe-food','europe-media':'europe-media','europe-retail':'europe-retail',
 'world-hedged':'world-eur-hedged', intermediatebond:'euro-govt-5-7', 'property-europe':'europe-property', 'utilities-europe':'europe-utilities', 'telecom-europe':'europe-telecom',
 'construction-europe':'europe-construction', 'em-smallcap':'em-small-cap-ishares', 'copper-miners':'copper-miners-globalx',
 'europe-banks':'europe-banks', 'europe-insurance':'europe-insurance',
  ...Object.fromEntries(NON_BOND_SHEETS.filter(sheet => CATALOG.some(asset => asset.exposure === sheet.id)).map(sheet => [sheet.id, sheet.id])),
  'world-islamic': 'world-islamic',
  ...Object.fromEntries([20,40,60,80].map(n=>[`lifestrategy${n}`,`lifestrategy${n}`])),
  'health-world':'sante-biotech','materials-world':'world-materials','utilities-world':'world-utilities-dws',
  'listed-private-equity': 'private-equity-ishares',
  gold: 'or', gaming: 'gaming_vaneck', medical: 'medical_innovation_ishares',
  world: 'support-msci_world_ishares', 'acwi-imi': 'acwi_imi_spdr', acwi: 'msci-acwi', 'acwi-pea': 'pea_global_amundi', allworld: 'ftse-all-world',
  exusa: 'world_ex_usa', equalweight: 'sp500_equal_weight', sp500: 'support-sp500_ishares', 'us-small': 'russell2000_spdr',
  'em-ex-china': 'em-ex-chine', em: 'msci-em', europe: 'support-msci_europe', smallcap: 'small-caps', nasdaq: 'nasdaq100', japan: 'support-actions_japon', india: 'inde',
  multifactor: 'world-multifactor',
  value: 'value', quality: 'quality', momentum: 'momentum', minvol: 'low-volatility', dividend: 'support-high_dividend',
  'em-bond': 'oblig_em_usd_ishares', 'em-local-bond': 'em-local-bond', longbond: 'oblig_eur_long_ishares',
  cash: 'monetaire-eur', shortbond: 'obligations-etat-0-1',
  short13bond: 'support-oblig_etat_eur_short', governmentbond: 'obligations-etat',
  corporatebond: 'corp-bond-ig', highyieldbond: 'high-yield', inflationbond: 'obligations-inflation',
  globalbond: 'obligations-globales-eur',
  financials: 'financieres', tech: 'technologie', energy: 'energie', health: 'sante-biotech', cyber: 'cybersecurite',
  ai: 'ia', robotics: 'robotique', biotech: 'sante-biotech', water: 'eau', timber: 'timber-ishares', agribusiness: 'agribusiness-ishares',
  copper: 'copper-miners-globalx', platinum: 'support-argent', palladium: 'support-argent', luxury: 'luxe', batteries: 'batteries-ve',
  cleanenergy: 'support-sect_energie_propre', infrastructure: 'infrastructures', property: 'immobilier-reit',
  semiconductors: 'semiconducteurs', blockchain: 'blockchain',
}
// PANX is already qualified in the shared catalogue/DCA but has no ETF sheet.
// Reuse the reviewed technology illustration, never an inferred provider logo.
const manualIllustrations = {'FR0013412269': 'technologie'}
export function getManualDuelArt(asset, cards=ETFS) {
 const card=cards.find(card=>card.isin===asset.isin)
 const art=getETFArt(card?.id ?? manualIllustrations[asset.isin])
 return art.scene?art:{...art,scene:art.mark}
}
const automaticArt = Object.fromEntries(CATALOG.filter(asset=>asset.id.startsWith('manual-') || asset.annualManual).map(asset=>{
 const art=getManualDuelArt(asset)
 return [asset.exposure,art.scene?art:{...art,scene:art.mark}]
}))
export const DUEL_EXPOSURE_ART = Object.freeze({...automaticArt,...Object.fromEntries(CATALOG.filter(asset => asset.art).map(asset => [asset.exposure, {kind: 'illustration', ...asset.art}])), ...Object.fromEntries(Object.entries(references).filter(([exposure])=>CATALOG.some(asset=>asset.exposure===exposure)).map(([exposure, id]) => [exposure, exposure === 'construction-europe' ? { kind: 'illustration', theme: 'construction', scene: 'duels/construction.webp' } : getETFArt(id)]))})
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
