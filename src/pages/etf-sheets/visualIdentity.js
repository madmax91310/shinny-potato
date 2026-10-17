import { LIFESTRATEGY_SHEETS } from '../../data/lifestrategy.js';
import {ROUND3_FUND_SHEETS} from '../../data/round3-fund-sheets.js';
import { QUALIFIED_EXPOSURE_SHEETS } from '../../data/qualified-exposure-sheets.js'
import { NON_BOND_SHEETS } from '../../data/non-bond-expansion.js'
// Explicit exposure illustrations, never issuer/index logos. Review: public/asset-art/etf-night/README.md.
const groups = {
  world: 'small-value-world-avantis pea-emergents-amundi em-small-cap-ishares global-premium-income-jpm quality-dividend-growth-wisdomtree acwi_imi_spdr world_ex_usa pea_global_amundi msci-world msci-em msci-acwi ftse-all-world em-ex-chine low-volatility value small-caps quality momentum dividendes covered-call support-msci_world support-msci_world_ishares support-msci_acwi support-msci_em_amundi support-ftse_em_vanguard support-msci_em_spdr support-strat_dividendes_dist support-high_dividend support-high_dividend_dist support-quality_dividend support-quality_dividend_dist support-dividend_leaders',
  america: 'sp500_equal_weight russell2000_spdr sp500-spea sp500 nasdaq100 support-sp500_ishares support-nasdaq100_ishares support-lqq support-cl2',
  europe: 'pea-europe-amundi euro-dividend-aristocrats eurostoxx50 support-cac40 support-eurostoxx50_ishares support-msci_europe support-smallcap_europe',
  asia: 'pea-inde-amundi pacific-ex-japan-ishares inde topix-pea-hedged support-actions_japon support-actions_coree support-actions_taiwan support-actions_asie_ex_japon',
  bonds: 'oblig_em_usd_ishares oblig_eur_long_ishares monetaire-eur obligations-etat-0-1 obligations-globales-eur obligations-inflation obligations-etat high-yield corp-bond-ig high-yield-acc em-local-bond support-oblig_corp_amundi support-oblig_corp_vanguard support-oblig_corp_spdr support-oblig_etat_eur_short support-oblig_hy_amundi support-oblig_etat_us',
  property: 'immobilier-reit support-foncieres_etf support-foncieres_etf_dist support-immo_gpr',
  chip: 'pea-tech-europe cloud-wisdomtree ia-big-data-xtrackers semiconducteurs technologie quantique ia blockchain support-tech_europe support-sect_tech',
  gaming: 'gaming_vaneck',
  health: 'world-healthcare-xtrackers pea-health-europe medical_innovation_ishares sante-biotech support-sect_sante',
  energy: 'energie support-sect_energie',
  defense: 'defense',
  security: 'cybersecurite support-sect_cybersecurite',
  water: 'eau',
  luxury: 'luxe pea-luxe-monde',
  finance: 'financieres support-sect_financieres',
  robotics: 'robotique',
  nuclear: 'nucleaire',
  batteries: 'batteries-ve',
  space: 'spatial',
  commodities: 'support-mp_large support-mp_large_icom',
  renewables: 'new-energy-amundi clean-energy-lg support-sect_energie_propre',
  infrastructure: 'world-industrials-xtrackers infrastructures',
  utilities: 'support-sect_utilities',
  resources: 'copper-miners-globalx basic-resources-pea mines-mondiales-vaneck',
  consumer: 'support-sect_conso_defensive',
}
const entries = Object.entries(groups).flatMap(([theme, ids]) => ids.split(' ').map(id => [id, { theme, scene: `etf-night/${theme}.webp`, kind: 'illustration' }]))
entries.push(...'gold-miners-vaneck or support-or support-or_wisdomtree support-or_amundi'.split(' ').map(id => [id, { theme: 'gold', scene: 'etf-night/gold.webp', kind: 'illustration' }]))
entries.push(['support-argent', { theme: 'silver', scene: 'etf-night/silver.webp', kind: 'illustration' }])
entries.push(...'bitcoin support-bitcoin_wisdomtree support-bitcoin_etcgroup support-bitcoin_21shares'.split(' ').map(id => [id, { theme: 'bitcoin', mark: 'bitcoin.svg', kind: 'asset-symbol' }]))
entries.push(['support-ethereum', { theme: 'ethereum', mark: 'ethereum.svg', kind: 'asset-symbol' }])
// Exact-share presentations reuse the reviewed exposure scenes.
const routingScenes = {
 america: 'LU1681038672 IE00B3XXRP09 IE00BFMXXD54 IE000XZSV718 FR0011550185 FR0013412004 IE00B52SFT06 FR0007056841 IE000QDFFK00',
 europe: 'LU3180074463 FR0007054358 LU0380865021 IE0008471009 IE00B4K6B022 LU1681040223 LU0328475792 DE0002635307 LU0908500753 FR0011550193 IE0008470928 IE00B1YZSC51 IE00BKWQ0Q14 LU0274209237 IE00BK5BQX27 IE00B945VV12',
 world: 'IE0003XJA0J9 IE0009HF1MK9 IE00BFY0GT14 IE00BJ0KDQ92 IE00BK1PV551 IE0002XZSHO1 IE00BD4TXV59 IE000716YHJ7 IE0000QLH0G6 IE00B3RBWM25 IE000L6ZMMC4 IE00BK5BQV03 LU2903252349 FR0011440478 IE00BTJRMP35 IE00B3VVMM84 FR001400ZGO4',
 asia: 'FR0011871078 FR0013411980 FR0013412012 LU2089238385 LU1875395870 LU2196470426 IE00B02KXK85 IE00BJ5JPG56 IE00BQT3WG13',
 property: 'FR0011869304', bonds: 'FR0013346681', finance: 'LU1829219390',
 chip: 'IE00BDVPNG13 IE00BMC38736 IE000C6ITGC8 IE000W8WMSL2 DE000A0H08Q4',
 batteries: 'IE00BKLF1R75', robotics: 'IE00BLCHJB90', nuclear: 'IE000NDWFGA5', security: 'IE00BMH5Y871',
 resources: 'LU1834983634 IE000UL6CLP7', defense: 'LU3038520774 IE0002Y8CX98',
 commodities: 'GB00B15KXQ89 IE00B4556L06 IE00B4LHWP62',
}
for (const [theme, isins] of Object.entries(routingScenes))
 entries.push(...isins.split(' ').map(isin => [`presentation-${isin.toLowerCase()}`, {theme,scene:`etf-night/${theme}.webp`,kind:'illustration'}]))
if (new Set(entries.map(([id]) => id)).size !== entries.length) throw new Error('Identité ETF dupliquée')
export const ETF_ART = Object.freeze(Object.fromEntries([...entries, ...ROUND3_FUND_SHEETS.map(r=>[r.id,{theme:r.scene,scene:`etf-night/${r.scene}.webp`,kind:'illustration'}]), ...[...QUALIFIED_EXPOSURE_SHEETS, ...LIFESTRATEGY_SHEETS, ...NON_BOND_SHEETS].map(r=>[r.id,{theme:r.scene,scene:`etf-night/${r.scene}.webp`,kind:'illustration'}])]))
export function getETFArt(id) {
  const art = ETF_ART[id]
  if (!art) throw new Error(`Illustration non vérifiée pour ${id}`)
  return art
}
