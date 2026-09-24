#!/usr/bin/env node
// Inventaire des bases de performances du Générateur. Un accord entre outils ne vérifie pas
// une source primaire : seuls les fonds recoupés avec l'émetteur sont marqués « confirmé ».
import { ASSETS } from '../src/pages/portfolio-generator/data.js'

const groups = {
  'Fonds confirmé chez l’émetteur': `msci_world sp500 nasdaq100 nasdaq100_ishares cac40 eurostoxx50 eurostoxx50_ishares msci_em_amundi actions_coree actions_taiwan oblig_etat_eur_short oblig_etat_eur oblig_corp_ig oblig_hy oblig_inflation sp500_ishares lqq cl2 sect_sante mp_large strat_dividendes strat_dividendes_dist high_dividend high_dividend_dist quality_dividend quality_dividend_dist tech_europe sect_energie sect_tech sect_robotique sect_cybersecurite dividend_leaders immo_gpr oblig_etat_us actions_japon actions_value sect_financieres smallcap_monde ftse_em_vanguard mp_large_icom oblig_corp_amundi oblig_corp_vanguard oblig_corp_spdr sect_energie_propre sect_conso_defensive sect_utilities`,
  'Indice ou cours du sous-jacent': `msci_europe msci_em or or_wisdomtree or_ishares or_amundi bitcoin bitcoin_wisdomtree bitcoin_etcgroup bitcoin_21shares ethereum foncieres_etf foncieres_etf_dist msci_world_ishares msci_world_amundi_pea msci_acwi ftse_allworld_vanguard msci_em_spdr`,
  'Autre fonds ou historique mixte': `argent sect_semi smallcap_europe jepq oblig_hy_amundi actions_asie_ex_japon`,
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
// visible dans le tweet ; la liste est fermée pour éviter un ajout silencieux.
const additionalNotes = new Set('nasdaq100_ishares sp500_ishares ftse_em_vanguard actions_coree actions_taiwan actions_japon actions_value oblig_etat_us sect_energie sect_tech sect_robotique sect_cybersecurite sect_financieres sect_sante smallcap_monde mp_large high_dividend high_dividend_dist quality_dividend quality_dividend_dist strat_dividendes strat_dividendes_dist'.split(' '))
// Devise de la série effectivement utilisée, indépendamment de la place où la part se cote.
// Les autres lignes restent « à documenter » tant qu'une fiche ne l'établit pas clairement.
const usdReturns = new Set(`nasdaq100_ishares actions_coree actions_taiwan actions_asie_ex_japon
  ftse_em_vanguard or or_wisdomtree or_ishares or_amundi bitcoin bitcoin_wisdomtree
  bitcoin_etcgroup bitcoin_21shares ethereum sect_energie_propre sect_conso_defensive
  sect_utilities sect_energie sect_tech sect_robotique sect_cybersecurite oblig_etat_us
  actions_japon actions_value sect_financieres sect_sante smallcap_monde mp_large mp_large_icom
  sect_semi jepq smallcap_europe sp500_ishares
  high_dividend high_dividend_dist quality_dividend quality_dividend_dist strat_dividendes
  strat_dividendes_dist`.trim().split(/\s+/))
const partialOrSyntheticYears = new Map(Object.entries({
  bitcoin: '2020 : ETP non lancé', ethereum: '2020 : ETP non lancé',
  sect_semi: '2020 : part lancée en décembre', msci_world_amundi_pea: '2020-2025 : fonds lancé en 2025 sans année calendaire complète',
  smallcap_europe: '2020-2025 : part lancée en 2026', jepq: '2020-2024 : part UCITS sans année complète',
  oblig_hy_amundi: '2020-2024 : part non lancée', actions_asie_ex_japon: '2020 : part lancée en avril',
  quality_dividend: '2020 : part lancée en mai, aucun rendement calendaire publié',
}))
const issuerSources = {
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
  quality_dividend: 'https://www.ishares.com/gls-download/literature/fact-sheet/wqda-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf',
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
}
const partialIssuerSources = {
  sect_semi: 'https://www.vaneck.com/fr/fr/smh-supporting-doc.pdf',
  jepq: 'https://am.jpmorgan.com/content/dam/jpm-am-aem/emea/ch/en/regulatory/annual-report/jpm-icav-etf-annual-report-ch-en.pdf',
  actions_asie_ex_japon: 'https://www.ishares.com/gls-download/literature/fact-sheet/iffi-ishares-msci-ac-far-east-ex-japan-ucits-etf-fund-fact-sheet-en-gb.pdf',
}
const proxySources = {
  argent: 'https://www.ishares.com/uk/individual/en/products/258443/ + https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2025/12/20251231.pdf',
  smallcap_europe: 'https://www.ishares.com/us/literature/fact-sheet/ieus-ishares-msci-europe-small-cap-etf-fund-fact-sheet-en-us.pdf',
  oblig_hy_amundi: 'https://www.ishares.com/gls-download/literature/fact-sheet/ihyg-ishares-high-yield-corp-bond-ucits-etf-fund-fact-sheet-en-gb.pdf',
}
const expectedMissingYears = new Map([
  ['sect_semi', [2020]], ['actions_asie_ex_japon', [2020]],
  ['jepq', [2020, 2021, 2022, 2023, 2024]], ['quality_dividend', [2020]],
])
for (const asset of ASSETS) {
  const basis = tagged.get(asset.id)
  if (!basis) { console.error(`Sans provenance : ${asset.id}`); errors++; continue }
  if (asset.id !== 'fonds_euros' && asset.id !== 'scpi' && !asset.isin) { console.error(`ISIN absent : ${asset.id}`); errors++ }
  if (basis !== 'Fonds confirmé chez l’émetteur' && (requiresNote.has(basis) || additionalNotes.has(asset.id)) && !asset.confidenceNote) {
    console.error(`Limite invisible dans le tweet : ${asset.id} (${basis})`); errors++
  }
  if (!Array.isArray(asset.r) || asset.r.length !== 6) { console.error(`Série incomplète : ${asset.id}`); errors++ }
  if (usdReturns.has(asset.id) && !asset.confidenceNote) { console.error(`Devise USD non signalée : ${asset.id}`); errors++ }
  if (partialOrSyntheticYears.has(asset.id) && !asset.confidenceNote) { console.error(`Années simulées sans réserve : ${asset.id}`); errors++ }
  if (expectedMissingYears.has(asset.id)) {
    for (const year of expectedMissingYears.get(asset.id)) {
      if (asset.r[year - 2020] !== null) { console.error(`Performance inventée pour ${asset.id} en ${year}`); errors++ }
    }
  }
}
for (const id of tagged.keys()) if (!byId.has(id)) { console.error(`Entrée obsolète : ${id}`); errors++ }
for (const id of [...usdReturns, ...partialOrSyntheticYears.keys(), ...Object.keys(issuerSources), ...Object.keys(partialIssuerSources), ...Object.keys(proxySources)]) {
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
for (const [basis, list] of Object.entries(groups)) console.log(`${basis} : ${list.split(' ').filter(Boolean).length}`)
console.log(`${ASSETS.length} supports inventoriés ; ${errors} erreur(s) de traçabilité structurelle.`)
console.log(`${usdReturns.size} séries USD signalées, ${partialOrSyntheticYears.size} historiques partiels ou synthétiques, ${Object.keys(issuerSources).length} fonds complets et ${Object.keys(partialIssuerSources).length} fonds partiels recoupés auprès de l'émetteur.`)
console.log('« Fonds confirmé » désigne une lecture des performances calendaires de l’émetteur ; les arrondis suivent la précision publiée dans chaque fiche.')
if (errors) process.exitCode = 1
