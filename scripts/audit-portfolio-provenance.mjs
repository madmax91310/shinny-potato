#!/usr/bin/env node
// Inventaire des bases de performances du Générateur. Un accord entre outils ne vérifie pas
// une source primaire : seuls les fonds recoupés avec l'émetteur sont marqués « confirmé ».
import { ASSETS } from '../src/pages/portfolio-generator/data.js'

const groups = {
  'Fonds confirmé chez l’émetteur': `msci_world sp500 nasdaq100 nasdaq100_ishares cac40 eurostoxx50 eurostoxx50_ishares msci_em_amundi actions_coree actions_taiwan oblig_etat_eur_short`,
  'Autre fonds / série attribuée à une part': `oblig_etat_eur oblig_corp_ig oblig_hy oblig_inflation sp500_ishares lqq cl2 sect_sante mp_large strat_dividendes strat_dividendes_dist high_dividend high_dividend_dist quality_dividend quality_dividend_dist tech_europe sect_energie sect_tech sect_robotique sect_cybersecurite dividend_leaders immo_gpr oblig_etat_us actions_japon actions_value sect_financieres smallcap_monde ftse_em_vanguard`,
  'Indice ou cours du sous-jacent': `msci_europe msci_em or or_wisdomtree or_ishares or_amundi bitcoin bitcoin_wisdomtree bitcoin_etcgroup bitcoin_21shares ethereum foncieres_etf foncieres_etf_dist msci_world_ishares msci_world_amundi_pea msci_acwi ftse_allworld_vanguard msci_em_spdr`,
  'Autre fonds ou historique mixte': `mp_large_icom argent oblig_corp_amundi oblig_corp_vanguard oblig_corp_spdr sect_semi smallcap_europe jepq sect_energie_propre sect_conso_defensive sect_utilities oblig_hy_amundi actions_asie_ex_japon`,
  'Hypothèse non liée à un titre précis': `fonds_euros scpi`,
}
const tagged = new Map()
let errors = 0
for (const [basis, list] of Object.entries(groups)) {
  for (const id of list.split(' ')) {
    if (tagged.has(id)) { console.error(`Deux bases déclarées pour ${id}`); errors++ }
    tagged.set(id, basis)
  }
}
const byId = new Map(ASSETS.map(asset => [asset.id, asset]))
const requiresNote = new Set(['Indice ou cours du sous-jacent', 'Autre fonds ou historique mixte', 'Hypothèse non liée à un titre précis'])
// Les séries en USD ou d'origine partiellement incertaine doivent aussi expliquer leur limite
// visible dans le tweet ; la liste est fermée pour éviter un ajout silencieux.
const additionalNotes = new Set('nasdaq100_ishares sp500_ishares ftse_em_vanguard actions_coree actions_taiwan actions_japon actions_value oblig_etat_us sect_energie sect_tech sect_robotique sect_cybersecurite sect_financieres'.split(' '))
// Devise de la série effectivement utilisée, indépendamment de la place où la part se cote.
// Les autres lignes restent « à documenter » tant qu'une fiche ne l'établit pas clairement.
const usdReturns = new Set(`nasdaq100_ishares actions_coree actions_taiwan actions_asie_ex_japon
  ftse_em_vanguard or or_wisdomtree or_ishares or_amundi bitcoin bitcoin_wisdomtree
  bitcoin_etcgroup bitcoin_21shares ethereum sect_energie_propre sect_conso_defensive
  sect_utilities sect_energie sect_tech sect_robotique sect_cybersecurite oblig_etat_us
  actions_japon actions_value sect_financieres`.trim().split(/\s+/))
const partialOrSyntheticYears = new Map(Object.entries({
  bitcoin: '2020 : ETP non lancé', ethereum: '2020 : ETP non lancé',
  sect_semi: '2020 : autre ETF', msci_world_amundi_pea: '2020-2025 : fonds lancé en 2025 sans année calendaire complète',
  smallcap_europe: '2020-2025 : part lancée en 2026', jepq: '2020-2023 : part UCITS non lancée',
  oblig_hy_amundi: '2020-2024 : part non lancée', actions_asie_ex_japon: '2020 : part lancée en avril',
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
}
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
}
for (const id of tagged.keys()) if (!byId.has(id)) { console.error(`Entrée obsolète : ${id}`); errors++ }
for (const id of [...usdReturns, ...partialOrSyntheticYears.keys(), ...Object.keys(issuerSources)]) {
  if (!byId.has(id)) { console.error(`Référence obsolète : ${id}`); errors++ }
}
for (const id of groups['Fonds confirmé chez l’émetteur'].split(' ')) {
  if (!issuerSources[id]) { console.error(`Source émetteur absente : ${id}`); errors++ }
}
for (const id of Object.keys(issuerSources)) {
  if (tagged.get(id) !== 'Fonds confirmé chez l’émetteur') { console.error(`Source émetteur mal classée : ${id}`); errors++ }
}
for (const [basis, list] of Object.entries(groups)) console.log(`${basis} : ${list.split(' ').length}`)
console.log(`${ASSETS.length} supports inventoriés ; ${errors} erreur(s) de traçabilité structurelle.`)
console.log(`${usdReturns.size} séries USD signalées, ${partialOrSyntheticYears.size} historiques partiels ou synthétiques et ${Object.keys(issuerSources).length} fonds recoupés auprès de l'émetteur.`)
console.log('« Autre fonds » signifie une attribution dans le code, pas une vérification indépendante des six rendements.')
if (errors) process.exitCode = 1
