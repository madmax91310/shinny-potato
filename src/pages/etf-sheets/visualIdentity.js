// Explicit exposure illustrations, never issuer/index logos. Review: public/asset-art/etf-night/README.md.
const groups = {
  world: 'acwi_imi_spdr world_ex_usa pea_global_amundi msci-world msci-em msci-acwi ftse-all-world em-ex-chine low-volatility value small-caps quality momentum dividendes covered-call support-msci_world support-msci_world_ishares support-msci_acwi support-msci_em_amundi support-ftse_em_vanguard support-msci_em_spdr support-strat_dividendes_dist support-high_dividend support-high_dividend_dist support-quality_dividend support-quality_dividend_dist support-dividend_leaders',
  america: 'sp500_equal_weight russell2000_spdr sp500-spea sp500 nasdaq100 support-sp500_ishares support-nasdaq100_ishares support-lqq support-cl2',
  europe: 'eurostoxx50 support-cac40 support-eurostoxx50_ishares support-msci_europe support-smallcap_europe',
  asia: 'inde topix-pea-hedged support-actions_japon support-actions_coree support-actions_taiwan support-actions_asie_ex_japon',
  bonds: 'oblig_em_usd_ishares oblig_eur_long_ishares monetaire-eur obligations-etat-0-1 obligations-globales-eur obligations-inflation obligations-etat high-yield corp-bond-ig high-yield-acc em-local-bond support-oblig_corp_amundi support-oblig_corp_vanguard support-oblig_corp_spdr support-oblig_etat_eur_short support-oblig_hy_amundi support-oblig_etat_us',
  property: 'immobilier-reit support-foncieres_etf support-foncieres_etf_dist support-immo_gpr',
  chip: 'semiconducteurs technologie quantique ia blockchain support-tech_europe support-sect_tech',
  health: 'sante-biotech support-sect_sante',
  energy: 'energie support-sect_energie',
  defense: 'defense',
  security: 'cybersecurite support-sect_cybersecurite',
  water: 'eau',
  luxury: 'luxe',
  finance: 'financieres support-sect_financieres',
  robotics: 'robotique',
  nuclear: 'nucleaire',
  batteries: 'batteries-ve',
  space: 'spatial',
  commodities: 'support-mp_large support-mp_large_icom',
  renewables: 'support-sect_energie_propre',
  infrastructure: 'infrastructures',
  utilities: 'support-sect_utilities',
  resources: 'basic-resources-pea',
  consumer: 'support-sect_conso_defensive',
}
const entries = Object.entries(groups).flatMap(([theme, ids]) => ids.split(' ').map(id => [id, { theme, scene: `etf-night/${theme}.webp`, kind: 'illustration' }]))
entries.push(...'or support-or support-or_wisdomtree support-or_amundi'.split(' ').map(id => [id, { theme: 'gold', scene: 'etf-night/gold.webp', kind: 'illustration' }]))
entries.push(['support-argent', { theme: 'silver', scene: 'etf-night/silver.webp', kind: 'illustration' }])
entries.push(...'bitcoin support-bitcoin_wisdomtree support-bitcoin_etcgroup support-bitcoin_21shares'.split(' ').map(id => [id, { theme: 'bitcoin', mark: 'bitcoin.svg', kind: 'asset-symbol' }]))
entries.push(['support-ethereum', { theme: 'ethereum', mark: 'ethereum.svg', kind: 'asset-symbol' }])
if (new Set(entries.map(([id]) => id)).size !== entries.length) throw new Error('Identité ETF dupliquée')
export const ETF_ART = Object.freeze(Object.fromEntries(entries))
export function getETFArt(id) {
  const art = ETF_ART[id]
  if (!art) throw new Error(`Illustration non vérifiée pour ${id}`)
  return art
}
