#!/usr/bin/env node
// Inventaire des bases de performances du Générateur. Un accord entre outils ne vérifie pas
// une source primaire : seuls les fonds recoupés avec l'émetteur sont marqués « confirmé ».
import { ASSETS } from '../src/pages/portfolio-generator/data.js'

const groups = {
  'Fonds confirmé chez l’émetteur': `msci_world sp500 nasdaq100 nasdaq100_ishares cac40 eurostoxx50 eurostoxx50_ishares msci_em_amundi actions_coree actions_taiwan oblig_etat_eur_short oblig_etat_eur oblig_corp_ig oblig_hy oblig_inflation sp500_ishares lqq cl2 sect_sante mp_large strat_dividendes strat_dividendes_dist high_dividend high_dividend_dist quality_dividend_dist tech_europe sect_energie sect_tech sect_robotique sect_cybersecurite dividend_leaders immo_gpr oblig_etat_us actions_japon actions_value sect_financieres smallcap_monde ftse_em_vanguard mp_large_icom oblig_corp_amundi oblig_corp_vanguard oblig_corp_spdr sect_energie_propre sect_conso_defensive sect_utilities foncieres_etf foncieres_etf_dist ftse_allworld_vanguard msci_europe msci_em or or_ishares or_amundi msci_world_ishares msci_acwi msci_em_spdr or_wisdomtree bitcoin_wisdomtree`,
  'Indice ou cours du sous-jacent': `bitcoin bitcoin_21shares ethereum msci_world_amundi_pea smallcap_europe`,
  'Autre fonds ou historique mixte': `argent jepq oblig_hy_amundi actions_asie_ex_japon quality_dividend bitcoin_etcgroup`,
  'Hypothèse non liée à un titre précis': `fonds_euros scpi`,
}
const tagged = new Map()
let errors = 0
for (const [basis, list] of Object.entries(groups)) {
  for (const id of list.split(' ').filter(Boolean)) {
    if (tagged.has(id)) { console.error(`Deux bases déclarées pour ${id}`); errors++ }
    tagged.set(id, basis)
  }
}
const byId = new Map(ASSETS.map(asset => [asset.id, asset]))
const requiresNote = new Set(['Indice ou cours du sous-jacent', 'Autre fonds ou historique mixte', 'Hypothèse non liée à un titre précis'])
// Les séries en USD ou d'origine partiellement incertaine doivent aussi expliquer leur limite
// visible dans l'interface ; la liste est fermée pour éviter un ajout silencieux.
const additionalNotes = new Set('nasdaq100_ishares sp500_ishares ftse_em_vanguard actions_coree actions_taiwan actions_japon actions_value oblig_etat_us sect_energie sect_tech sect_robotique sect_cybersecurite sect_financieres sect_sante smallcap_monde mp_large high_dividend high_dividend_dist quality_dividend quality_dividend_dist strat_dividendes strat_dividendes_dist'.split(' '))
// Devise de la série effectivement utilisée, indépendamment de la place où la part se cote.
// Les autres lignes restent « à documenter » tant qu'une fiche ne l'établit pas clairement.
const usdReturns = new Set(`nasdaq100_ishares actions_coree actions_taiwan actions_asie_ex_japon
  ftse_em_vanguard or or_wisdomtree or_ishares or_amundi bitcoin bitcoin_wisdomtree
  bitcoin_etcgroup bitcoin_21shares ethereum sect_energie_propre sect_conso_defensive
  sect_utilities sect_energie sect_tech sect_robotique sect_cybersecurite oblig_etat_us
  actions_japon actions_value sect_financieres sect_sante smallcap_monde mp_large mp_large_icom
  jepq sp500_ishares ftse_allworld_vanguard msci_em msci_world_ishares msci_acwi msci_em_spdr or or_ishares or_amundi
  high_dividend high_dividend_dist quality_dividend quality_dividend_dist strat_dividendes
  strat_dividendes_dist`.trim().split(/\s+/))
const partialOrSyntheticYears = new Map(Object.entries({
  bitcoin: '2020 : ETP non lancé', ethereum: '2020 : ETP non lancé',
  bitcoin_etcgroup: '2020 : cours spot, part lancée en juin',
  msci_world_amundi_pea: '2020-2025 : fonds lancé en 2025 sans année calendaire complète',
  smallcap_europe: '2020-2025 : part lancée en 2026', jepq: '2020-2024 : part UCITS sans année complète',
  oblig_hy_amundi: '2020-2024 : part non lancée', actions_asie_ex_japon: '2020 : part lancée en avril',
  quality_dividend: '2020 : rendement de la part Dist du même fonds',
  scpi: '2020 : ancienne mesure de performance globale, pas le RGI ASPIM',
}))
const issuerSources = {
  msci_europe: 'https://www.ishares.com/gls-download/literature/fact-sheet/smea-ishares-core-msci-europe-ucits-etf-eur-acc-fund-fact-sheet-en-gb.pdf',
  or_wisdomtree: 'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/MSL/EU/EN-GB/JE00B1VS3770',
  bitcoin_wisdomtree: 'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/WIXL/EU/EN-GB/GB00BJYDH287',
  msci_em: 'https://www.ishares.com/de/privatanleger/de/literature/fact-sheet/eimi-ishares-core-msci-em-imi-ucits-etf-fund-fact-sheet-de-de.pdf',
  or: 'https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE00B579F325_factsheet_en.pdf',
  or_ishares: 'https://www.ishares.com/uk/individual/en/products/258441/ishares-physical-gold-etc-fund',
  or_amundi: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013416716/ENG/FRA/INSTITUTIONNEL/AMUNDI',
  msci_world_ishares: 'https://www.ishares.com/gls-download/literature/fact-sheet/swda-ishares-core-msci-world-ucits-etf-fund-fact-sheet-en-gb.pdf',
  msci_acwi: 'https://www.ssga.com/ie/en_gb/intermediary/etfs/state-street-spdr-msci-all-country-world-ucits-etf-acc-spyy-gy',
  msci_em_spdr: 'https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-msci-emerging-markets-ucits-etf-spym-gy',
  ftse_allworld_vanguard: 'https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf',
  msci_world: 'Fiche Amundi CW8 au 31/08/2026',
  sp500: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871128/FRA/FRA/RETAIL/ETF/20260630',
  nasdaq100: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/RETAIL/ETF',
  nasdaq100_ishares: 'https://www.blackrock.com/fr/particuliers/products/253741/ishares-nasdaq-100-ucits-etf',
  cac40: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013380607/FRA/FRA/RETAIL/ETF',
  eurostoxx50: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/FRA/FRA/INSTITUTIONNEL/ETF',
  eurostoxx50_ishares: 'https://www.ishares.com/gls-download/literature/fact-sheet/cssx5e-ishares-core-euro-stoxx-50-ucits-etf-fund-fact-sheet-en-gb.pdf',
  msci_em_amundi: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681045370/FRA/FRA/INSTITUTIONNEL/ETF',
  actions_coree: 'https://www.ishares.com/uk/individual/en/products/253733',
  actions_taiwan: 'https://www.ishares.com/ch/professionals/en/products/251878/ishares-msci-taiwan-ucits-etf',
  oblig_etat_eur_short: 'https://www.ishares.com/uk/individual/en/literature/fact-sheet/ibgs-ishares-govt-bond-1-3yr-ucits-etf-fund-fact-sheet-en-gb.pdf',
  oblig_etat_eur: 'https://www.ishares.com/uk/individual/en/literature/fact-sheet/iega-ishares-core-govt-bond-ucits-etf-fund-fact-sheet-en-gb.pdf',
  oblig_corp_ig: 'https://www.ishares.com/uk/individual/en/products/251726/',
  oblig_hy: 'https://www.ishares.com/gls-download/literature/fact-sheet/ihyg-ishares-high-yield-corp-bond-ucits-etf-fund-fact-sheet-en-gb.pdf',
  oblig_inflation: 'https://www.ishares.com/uk/individual/en/products/251739/',
  sp500_ishares: 'https://www.ishares.com/gls-download/literature/fact-sheet/cspx-ishares-core-s-p-500-ucits-etf-fund-fact-sheet-en-gb.pdf',
  lqq: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010342592/FRA/FRA/RETAIL/ETF/20260331',
  cl2: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010755611/FRA/FRA/INSTITUTIONNEL/ETF/20251231',
  sect_sante: 'https://www.ishares.com/gls-download/literature/fact-sheet/iuhc-ishares-s-p-500-health-care-sector-ucits-etf-fund-fact-sheet-en-gb.pdf',
  mp_large: 'https://www.invesco.com/content/dam/invesco/uk/en/product-documents/etf/share-class/factsheet/IE00BD6FTQ80_factsheet_en-uk.pdf',
  strat_dividendes: 'https://www.ssga.com/lu/fr/intermediary/etfs/state-street-spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy',
  strat_dividendes_dist: 'https://www.ssga.com/lu/fr/intermediary/etfs/state-street-spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy',
  high_dividend: 'https://fund-docs.vanguard.com/ie00bk5br626-en.pdf',
  high_dividend_dist: 'https://fund-docs.vanguard.com/ie00b8gkdb10-en.pdf',
  quality_dividend_dist: 'https://www.ishares.com/gls-download/literature/fact-sheet/wqdv-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf',
  tech_europe: 'https://www.ishares.com/uk/individual/en/products/315818/',
  sect_energie: 'https://www.ishares.com/uk/individual/en/products/280503/',
  sect_tech: 'https://www.ishares.com/gls-download/literature/fact-sheet/iuit-ishares-s-p-500-information-technology-sector-ucits-etf-fund-fact-sheet-en-gb.pdf',
  sect_robotique: 'https://www.ishares.com/gls-download/literature/fact-sheet/rbot-ishares-automation-robotics-ucits-etf-fund-fact-sheet-en-gb.pdf',
  sect_cybersecurite: 'https://www.ishares.com/uk/individual/en/products/297843/',
  dividend_leaders: 'https://www.vaneck.com/uk/en/blog/etf-insights/vaneck-dividend-leaders-ucits-etf-turns-10--a-decade-of-dividends/',
  immo_gpr: 'https://www.vaneck.com/ch/fr/blog/etf-insights/ans-dimmobilier-cote-linteret-des-reit-dans-le-cadre-dune-allocation-immobiliere-diversifiee/',
  oblig_etat_us: 'https://www.ishares.com/uk/individual/en/products/309947/',
  actions_japon: 'https://www.ishares.com/uk/individual/en/products/251867/',
  actions_value: 'https://www.ishares.com/uk/individual/en/products/270048/',
  sect_financieres: 'https://www.ishares.com/uk/individual/en/products/280523/',
  smallcap_monde: 'https://www.ishares.com/gls-download/literature/fact-sheet/wsml-ishares-msci-world-small-cap-ucits-etf-fund-fact-sheet-en-gb.pdf',
  ftse_em_vanguard: 'https://fund-docs.vanguard.com/ie00bk5br733-en.pdf',
  mp_large_icom: 'https://www.ishares.com/gls-download/literature/fact-sheet/icom-ishares-diversified-commodity-swap-ucits-etf-fund-fact-sheet-en-gb.pdf',
  oblig_corp_amundi: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1931975079/FRA/FRA/INSTITUTIONNEL/ETF/20260331',
  oblig_corp_vanguard: 'https://fund-docs.vanguard.com/ie00bz163g84-en.pdf',
  oblig_corp_spdr: 'https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-bloomberg-euro-corporate-bond-ucits-etf-dist-sybc-gy',
  sect_energie_propre: 'https://www.ishares.com/ch/privatkunden/de/literature/fact-sheet/inrg-ishares-global-clean-energy-transition-ucits-etf-fund-fact-sheet-de-ch.pdf',
  sect_conso_defensive: 'https://www.ishares.com/gls-download/literature/fact-sheet/iucs-ishares-s-p-500-consumer-staples-sector-ucits-etf-fund-fact-sheet-en-gb.pdf',
  sect_utilities: 'https://www.ishares.com/gls-download/literature/fact-sheet/iuus-ishares-s-p-500-utilities-sector-ucits-etf-fund-fact-sheet-en-gb.pdf',
  foncieres_etf: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20251231',
  foncieres_etf_dist: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20251231',
}
const partialIssuerSources = {
  bitcoin_etcgroup: 'https://bitwiseinvestments.eu/de/products/bitwise-physical-bitcoin-etp/ (NAV 2021-2025) + https://www.slickcharts.com/currency/BTC/returns (2020)',
  jepq: 'https://indexes.nasdaq.com/docs/FS_XNDX.pdf (2020-2022) + https://am.jpmorgan.com/content/dam/jpm-am-aem/americas/us/en/literature/fact-sheet/etfs/FS-JEPQ.PDF (2023-2024) + https://am.jpmorgan.com/content/dam/jpm-am-aem/emea/ch/en/regulatory/annual-report/jpm-icav-etf-annual-report-ch-en.pdf (2025)',
  actions_asie_ex_japon: 'https://www.ishares.com/gls-download/literature/fact-sheet/iffi-ishares-msci-ac-far-east-ex-japan-ucits-etf-fund-fact-sheet-en-gb.pdf + https://www.ishares.com/uk/professionals/en/products/251848/ishares-msci-ac-far-east-ex-japan-ucits-etf',
  quality_dividend: 'https://www.ishares.com/gls-download/literature/fact-sheet/wqda-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf + https://www.ishares.com/gls-download/literature/fact-sheet/wqdv-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf',
}
const proxySources = {
  argent: 'https://www.ishares.com/uk/individual/en/products/258443/ + https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2025/12/20251231.pdf',
  oblig_hy_amundi: 'https://etf.dws.com/en/AssetDownload/Index/1ebf0fe4-b1c2-4d0f-a165-da75e3bcca7e/DWS-PASTPERF-LU1109943388-LU-en-2026-02-16.pdf + https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU2970735911/FRA/FRA/RETAIL/ETF',
}
const genericSources = {
  fonds_euros: 'ACPR : études n°126 (2020), n°140 (2021), n°149 (2022), n°163 (2023), n°175 (2024) et n°180 (2025) ; https://acpr.banque-france.fr/fr/publications-acpr/etudes-et-recherches/analyses-et-syntheses',
  scpi: 'ASPIM : https://www.aspim.fr/storage/documents/le-bilan-de-l-annee-2020-pour-les-scpi-et-les-opci-60263f3b06256.pdf (2020, ancienne méthode), https://www.aspim.fr/storage/documents/aspim-infos-la-lettre-d-information-des-fonds-immobiliers-non-cotes-n017-64b7a9122bb3f.pdf (2021-2022), https://www.aspim.fr/actualites/les-fonds-immobiliers-grand-public-au-1er-trimestre-2025-les-indicateurs-de-performance-2024-des-scpi/ (2023-2024), https://www.aspim.fr/actualites/collecte-et-performance-des-fonds-immobiliers-grand-public-au-premier-trimestre-2026-et-principaux-indicateurs-des-scpi-en-2025/ (2025)',
}
const indexSources = {
  msci_world_amundi_pea: 'https://www.msci.com/documents/10199/1ee87397-6313-4f46-87ae-6761f666558e',
  smallcap_europe: 'https://www.ssga.com/ie/en_gb/intermediary/etfs/state-street-spdr-msci-europe-small-cap-ucits-etf-smc-fp',
  // Clôtures annuelles du fournisseur ; ces chiffres ne sont pas les NAV des ETP.
  bitcoin: 'https://www.slickcharts.com/currency/BTC/returns + https://coinshares.com/etp/physical-bitcoin/',
  bitcoin_21shares: 'https://www.slickcharts.com/currency/BTC/returns + https://www.21shares.com/fr-eu/product/abtc',
  ethereum: 'https://www.slickcharts.com/currency/ETH/returns + https://coinshares.com/etp/physical-ethereum/',
}
// Garde les corrections chiffrées issues des tableaux annuels du fournisseur indiqué.
// Les cours crypto proviennent de Slickcharts, les rendements d'ETF de leur émetteur.
const primarySeries = new Map(Object.entries({
  msci_world_amundi_pea: [6.33, 31.07, -12.78, 19.60, 26.60, 6.77],
  smallcap_europe: [4.37, 23.72, -22.11, 12.86, 5.70, 16.62],
  bitcoin: [303.16, 59.67, -64.27, 155.42, 121.05, -6.34],
  bitcoin_21shares: [303.16, 59.67, -64.27, 155.42, 121.05, -6.34],
  ethereum: [469.25, 399.13, -67.50, 90.64, 46.07, -10.97],
}))
// Contrôle fermé des séries remplacées dans ce passage : rendements de la part exacte
// publiés par l'émetteur, plus deux moyennes de marché dont la définition est documentée.
const verifiedSeries = new Map(Object.entries({
  msci_europe: [-3.17, 25.46, -9.25, 16.14, 8.84, 19.72],
  msci_em: [18.35, -0.24, -19.79, 11.58, 7.21, 31.58],
  msci_world_ishares: [15.95, 21.90, -18.03, 23.86, 18.70, 21.16],
  msci_acwi: [15.70, 18.59, -18.30, 22.01, 17.36, 22.81],
  msci_em_spdr: [18.00, -2.50, -20.39, 9.80, 7.62, 33.80],
  or: [23.95, -3.90, -0.54, 13.66, 26.44, 64.80],
  or_ishares: [23.9, -3.9, -0.5, 13.7, 26.4, 64.8],
  or_amundi: [23.98, -3.89, -0.54, 13.66, 26.44, 64.80],
  or_wisdomtree: [23.69, -4.13, -0.81, 13.35, 26.10, 64.36],
  bitcoin_wisdomtree: [295.13, 65.77, -65.94, 156.24, 122.57, -7.91],
  tech_europe: [11.61, 36.57, -28.76, 35.04, 7.93, 9.64],
  bitcoin_etcgroup: [303.16, 55.46, -64.67, 150.42, 120.73, -9.68],
  fonds_euros: [1.28, 1.28, 1.91, 2.60, 2.63, 2.63],
  scpi: [5.30, 5.85, 2.1, -5.78, -1.1, 3.1],
}))
// Historique mixte : figer les années déjà recoupées et les absences intentionnelles.
// Les sources et la raison du mélange figurent dans partialIssuerSources/proxySources.
const mixedSeries = new Map(Object.entries({
  argent: [33.84, -5.74, 9.90, -4.25, 29.02, 119.80],
  jepq: [48.88, 27.51, -32.38, 36.28, 24.82, 15.40],
  oblig_hy_amundi: [1.50, 3.10, -9.60, 11.60, 6.80, 4.70],
  actions_asie_ex_japon: [25.10, -8.92, -21.95, 2.30, 11.67, 39.91],
  quality_dividend: [0.12, 15.79, -7.28, 17.16, 9.76, 23.97],
  bitcoin_etcgroup: [303.16, 55.46, -64.67, 150.42, 120.73, -9.68],
}))
const requiredDisclosures = new Map(Object.entries({
  argent: /convertis.*euros|conversion.*euros/i,
  jepq: /2020-2022.*Nasdaq-100.*2023-2024.*américain.*2025.*UCITS/i,
  tech_europe: /2020.*indice MSCI.*2021-2025.*iShares/i,
  oblig_hy_amundi: /2020-2025.*Xtrackers.*même indice.*Amundi/i,
  smallcap_europe: /2020-2025.*SPDR.*même indice.*iShares/i,
  actions_asie_ex_japon: /2020.*part distribuante/i,
  quality_dividend: /2020.*part distribuante/i,
  bitcoin_etcgroup: /2020.*spot.*2021-2025.*NAV/i,
}))
for (const asset of ASSETS) {
  const basis = tagged.get(asset.id)
  if (!basis) { console.error(`Sans provenance : ${asset.id}`); errors++; continue }
  if (asset.id !== 'fonds_euros' && asset.id !== 'scpi' && !asset.isin) { console.error(`ISIN absent : ${asset.id}`); errors++ }
  if (basis !== 'Fonds confirmé chez l’émetteur' && (requiresNote.has(basis) || additionalNotes.has(asset.id)) && !asset.confidenceNote) {
    console.error(`Limite invisible dans l'interface : ${asset.id} (${basis})`); errors++
  }
  if (!Array.isArray(asset.r) || asset.r.length !== 6) { console.error(`Série incomplète : ${asset.id}`); errors++ }
  if (usdReturns.has(asset.id) && !asset.confidenceNote) { console.error(`Devise USD non signalée : ${asset.id}`); errors++ }
  if (partialOrSyntheticYears.has(asset.id) && !asset.confidenceNote) { console.error(`Années simulées sans réserve : ${asset.id}`); errors++ }
  if (primarySeries.has(asset.id) && JSON.stringify(asset.r) !== JSON.stringify(primarySeries.get(asset.id))) {
    console.error(`Série indicielle en contradiction avec la source recoupée : ${asset.id}`); errors++
  }
  if (verifiedSeries.has(asset.id) && JSON.stringify(asset.r) !== JSON.stringify(verifiedSeries.get(asset.id))) {
    console.error(`Série émetteur ou hypothèse vérifiée divergente : ${asset.id}`); errors++
  }
  if (mixedSeries.has(asset.id) && JSON.stringify(asset.r) !== JSON.stringify(mixedSeries.get(asset.id))) {
    console.error(`Historique mixte modifié sans révision de ses sources : ${asset.id}`); errors++
  }
  if (requiredDisclosures.has(asset.id) && !requiredDisclosures.get(asset.id).test(asset.confidenceNote ?? '')) {
    console.error(`Limite spécifique de l'historique mixte non visible : ${asset.id}`); errors++
  }
  if (!asset.r.every(Number.isFinite)) {
    console.error(`Année manquante pour un actif sélectionnable : ${asset.id}`); errors++
  }
}
for (const id of tagged.keys()) if (!byId.has(id)) { console.error(`Entrée obsolète : ${id}`); errors++ }
for (const id of [...usdReturns, ...partialOrSyntheticYears.keys(), ...Object.keys(issuerSources), ...Object.keys(partialIssuerSources), ...Object.keys(proxySources), ...Object.keys(indexSources)]) {
  if (!byId.has(id)) { console.error(`Référence obsolète : ${id}`); errors++ }
}
for (const id of groups['Fonds confirmé chez l’émetteur'].split(' ')) {
  if (!issuerSources[id]) { console.error(`Source émetteur absente : ${id}`); errors++ }
}
for (const id of Object.keys(issuerSources)) {
  if (tagged.get(id) !== 'Fonds confirmé chez l’émetteur') { console.error(`Source émetteur mal classée : ${id}`); errors++ }
}
for (const id of Object.keys(partialIssuerSources)) {
  if (tagged.get(id) !== 'Autre fonds ou historique mixte') { console.error(`Source partielle mal classée : ${id}`); errors++ }
}
for (const id of Object.keys(proxySources)) {
  if (tagged.get(id) !== 'Autre fonds ou historique mixte') { console.error(`Proxy mal classé : ${id}`); errors++ }
}
for (const id of Object.keys(indexSources)) {
  if (tagged.get(id) !== 'Indice ou cours du sous-jacent') { console.error(`Indice mal classé : ${id}`); errors++ }
}
for (const id of groups['Indice ou cours du sous-jacent'].split(' ')) {
  if (!indexSources[id]) { console.error(`Source indicielle absente : ${id}`); errors++ }
}
for (const id of groups['Autre fonds ou historique mixte'].split(' ')) {
  if (!mixedSeries.has(id)) { console.error(`Historique mixte non verrouillé : ${id}`); errors++ }
}
for (const id of groups['Hypothèse non liée à un titre précis'].split(' ')) {
  if (!genericSources[id]) { console.error(`Source de moyenne absente : ${id}`); errors++ }
}
for (const [basis, list] of Object.entries(groups)) console.log(`${basis} : ${list.split(' ').filter(Boolean).length}`)
console.log(`${ASSETS.length} supports inventoriés ; ${errors} erreur(s) de traçabilité structurelle.`)
console.log(`${usdReturns.size} séries USD signalées, ${partialOrSyntheticYears.size} historiques partiels ou synthétiques, ${Object.keys(issuerSources).length} fonds complets et ${Object.keys(partialIssuerSources).length} fonds partiels recoupés auprès de l'émetteur.`)
console.log('« Fonds confirmé » désigne une lecture des performances calendaires de l’émetteur ; les arrondis suivent la précision publiée dans chaque fiche.')
if (errors) process.exitCode = 1
