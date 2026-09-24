#!/usr/bin/env node
// Revue interne du lexique, des séries et de leur provenance. Une référence n'atteste
// jamais la vérification de chaque chiffre historique. Aucun statut ne va dans les tweets.
import { readFileSync } from 'node:fs'
import { TERMES } from '../src/pages/lexique-financier/data.js'
import { ASSETS as PORTFOLIO } from '../src/pages/portfolio-generator/data.js'
import { ASSETS as CALCULATOR } from '../src/pages/investment-calculator/data.js'

const SP = 'https://www.service-public.fr/particuliers/vosdroits/'
const AMF = 'https://www.amf-france.org/fr/espace-epargnants/'
const sources = {
  pea: 'https://www.impots.gouv.fr/particulier/questions/jai-un-plan-depargne-en-actions-pea-les-retraits-sont-ils-imposables',
  cto: 'https://www.impots.gouv.fr/particulier/les-cessions-mobilieres',
  'assurance-vie': 'https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0',
  per: SP + 'F34982', 'livret-a': SP + 'F2365', ldds: SP + 'F2368',
  'pee-perco': SP + 'F2142',
  etf: AMF + 'comprendre-les-produits-financiers/placements-collectifs/trackers-etf',
  trackers: AMF + 'comprendre-les-produits-financiers/placements-collectifs/trackers-etf',
  action: AMF + 'comprendre-les-produits-financiers/actions-obligations/actions/investir-en-actions-cotees-en-bourse',
  obligation: AMF + 'comprendre-les-produits-financiers/actions-obligations/obligations/comprendre-les-obligations-avant-dinvestir',
  fcp: AMF + 'lexique-simulateurs-et-outils-pratiques/faq-epargnants/mes-investissements-en-placements-collectifs-opc',
  scpi: AMF + 'comprendre-les-produits-financiers/placements-collectifs/scpiopci-un-placement-non-garanti-soumis-aux-fluctuations-du-marche-immobilier',
  opci: AMF + 'comprendre-les-produits-financiers/placements-collectifs/opci-siic-les-autres-produits-de-la-pierre-papier',
  diversification: AMF + 'savoir-bien-investir/cadrer-son-projet/rendement-et-risque-des-placements-en-actions-0',
  volatilite: AMF + 'savoir-bien-investir/cadrer-son-projet/volatilite-des-placements-ce-quil-faut-savoir-0',
  'effet-levier': 'https://www.amf-france.org/fr/effet-de-levier',
  'vente-a-decouvert': AMF + 'lexique-simulateurs-et-outils-pratiques/faq-epargnants/le-fonctionnement-des-marches',
  blockchain: AMF + 'proteger-son-epargne/crypto-actifs-bitcoin-etc/investir-dans-le-bitoin-prudence',
  'cold-hot-wallet': AMF + 'proteger-son-epargne/crypto-actifs-bitcoin-etc/investir-en-crypto-actifs-les-precautions-pratiques',
  ter: AMF + 'les-frais-des-placements-financiers/comprendre-les-frais-des-placements-financiers',
  'taux-sans-risque': 'https://esurfi.banque-france.fr/fr/comites-consultatifs/ccsf/glossaire-du-ccsf',
  lmnp: SP + 'F10864',
  stablecoin: 'https://www.amf-france.org/fr/crypto-actif-ou-crypto-monnaie',
  'indice-boursier': AMF + 'comprendre-les-marches-financiers/les-marches-dactions-et-les-principaux-indices-en-france',
  'reinvestissement-dividendes': AMF + 'comprendre-les-produits-financiers/placements-collectifs/trackers-etf',
  'rendement-vs-performance': AMF + 'comprendre-les-marches-financiers/les-marches-dactions-et-les-principaux-indices-en-france',
  'flat-tax': 'https://www.impots.gouv.fr/particulier/les-cessions-mobilieres',
  'abattement-pea': 'https://www.impots.gouv.fr/particulier/questions/jai-un-plan-depargne-en-actions-pea-les-retraits-sont-ils-imposables',
  'prelevements-sociaux': 'https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0',
  'plus-value-imposable': 'https://www.impots.gouv.fr/particulier/les-cessions-mobilieres',
  'plus-value-immobiliere': SP + 'F10864',
}
// Les thèmes sans source propre gardent une recherche explicite à effectuer. Ne pas
// réutiliser une page générale comme preuve d'un nombre, d'un exemple ou d'une formule.
const pending = new Set(`dca reequilibrage dca-vs-lumpsum dividende rendement-locatif effet-levier-immo drawdown ratio-sharpe capitalisation-boursiere inflation taux-interet halving`.split(' '))
const fiscal = new Set(`pea cto assurance-vie per livret-a ldds pee-perco flat-tax abattement-pea prelevements-sociaux plus-value-imposable plus-value-immobiliere`.split(' '))
const inventory = JSON.parse(readFileSync(new URL('./source-inventory.json', import.meta.url), 'utf8'))
let errors = 0
const ids = new Set(TERMES.map(t => t.id))
for (const t of TERMES) {
  if (pending.has(t.id) && sources[t.id]) { console.error(`Source et attente contradictoires : ${t.id}`); errors++ }
  if (!sources[t.id] && !pending.has(t.id)) { console.error(`Lexique non classé : ${t.id}`); errors++ }
  if (fiscal.has(t.id) && !sources[t.id]) { console.error(`Fiscalité sans référence : ${t.id}`); errors++ }
}
for (const id of [...Object.keys(sources), ...pending, ...fiscal]) if (!ids.has(id)) { console.error(`Référence lexique orpheline : ${id}`); errors++ }
const lexiconGaps = new Set(inventory.filter(x => x.tool === 'lexique').map(x => x.name))
for (const t of TERMES) if (!lexiconGaps.has(t.id)) { console.error(`Inventaire lexique à régénérer : ${t.id}`); errors++ }
const gaps = inventory.filter(x => x.tool === 'portefeuilles' || x.tool === 'calculateur')
const absentPortfolioUrls = gaps.filter(x => x.tool === 'portefeuilles' && !x.sourceUrls.length)
if (absentPortfolioUrls.length) { console.error(`Supports sans URL : ${absentPortfolioUrls.map(x => x.name).join(', ')}`); errors += absentPortfolioUrls.length }
for (const a of PORTFOLIO) {
  if (!Array.isArray(a.r) || a.r.length !== 6 || a.r.some(n => !Number.isFinite(n))) { console.error(`Années 2020-2025 incomplètes : ${a.id}`); errors++ }
}
for (const [id, a] of Object.entries(CALCULATOR)) {
  if (!['EUR', 'USD'].includes(a.currency)) { console.error(`Devise inconnue : ${id}`); errors++ }
  if (!a.points.every((p, i, arr) => /^\d{4}-\d{2}$/.test(p.date) && Number.isFinite(p.price) && p.price > 0 && (i === 0 || p.date > arr[i - 1].date))) { console.error(`Points mensuels invalides : ${id}`); errors++ }
}
const lines = [
  '# Audit des données — génération depuis le code',
  '',
  `Lexique : ${TERMES.length} fiches ; ${Object.keys(sources).length} avec une référence primaire ciblée ; ${pending.size} sans référence ciblée.`,
  'Références de la fiscalité consultées le 24/09/2026 ; cela ne constitue pas un contrôle exhaustif de chaque phrase.',
  '',
  '| Fiche | Référence de travail | État |', '| --- | --- | --- |',
  ...TERMES.map(t => `| ${t.id} | ${sources[t.id] || '—'} | ${fiscal.has(t.id) ? 'Fiscalité relue le 24/09/2026 ; exemples et exceptions à contrôler individuellement' : sources[t.id] ? 'Source de définition identifiée ; détails à contrôler' : 'Référence primaire à trouver'} |`),
  '',
  `Portefeuilles : ${PORTFOLIO.length} supports, dont ${gaps.filter(x => x.tool === 'portefeuilles').length} sans date individuelle ; voir audit:portfolio-provenance pour les émetteurs, devises et années proxy.`,
  `Calculateur : ${Object.keys(CALCULATOR).length} actifs, dont ${gaps.filter(x => x.tool === 'calculateur').length} sans date individuelle ; les points de prix doivent être recoupés avec un export exact avant validation.`,
  '',
  'Les dates absentes restent absentes. Les sources trouvées ne sont pas une validation des valeurs de séries.',
]
if (process.argv.includes('--markdown')) console.log(lines.join('\n'))
else console.log(`${TERMES.length} fiches (${Object.keys(sources).length} références, ${pending.size} à sourcer), ${PORTFOLIO.length} supports, ${Object.keys(CALCULATOR).length} actifs ; ${errors} erreur(s) structurelle(s).`)
if (errors) process.exitCode = 1
