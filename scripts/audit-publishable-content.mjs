#!/usr/bin/env node
// Vérifie les champs éditoriaux partagés avant publication. Ce contrôle détecte des oublis
// et empêche le retour de deux erreurs factuelles corrigées ; il ne remplace jamais la
// confrontation des chiffres aux documents de l'émetteur.
import { FACTS } from '../src/pages/market-facts/data.js'
import { DEFAULT_THEMES } from '../src/pages/etf-tweets/data/themes.js'
import { ETFS } from '../src/pages/etf-sheets/data.js'
import { CASES } from '../src/pages/concrete-cases/data.js'
import { ASSETS } from '../src/pages/portfolio-generator/data.js'

const failures = []
function requireFields(label, entry, fields) {
  for (const field of fields) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) failures.push(`${label} : ${field} vide`)
  }
}
function uniqueIds(label, entries) {
  const seen = new Set()
  for (const entry of entries) {
    if (seen.has(entry.id)) failures.push(`${label} : identifiant dupliqué ${entry.id}`)
    seen.add(entry.id)
  }
}

uniqueIds('Faits', FACTS)
uniqueIds('Thèmes ETF', DEFAULT_THEMES)
uniqueIds('Fiches ETF', ETFS)
uniqueIds('Cas concrets', CASES)
for (const fact of FACTS) requireFields(`Fait ${fact.id}`, fact, ['hook', 'context', 'source', 'question'])
for (const etf of ETFS) requireFields(`Fiche ETF ${etf.id}`, etf, ['isin', 'ter', 'whatIs', 'whyInteresting', 'whatToKnow', 'verdict', 'question'])
for (const item of CASES) {
  requireFields(`Cas ${item.id}`, item, ['text'])
  if (!item.sources?.length || item.sources.some(source => !source.label || !/^https:\/\//.test(source.url))) {
    failures.push(`Cas ${item.id} : source absente ou URL non sécurisée`)
  }
}
for (const theme of DEFAULT_THEMES) {
  requireFields(`Thème ${theme.id}`, theme, ['transition', 'cloture', 'ctaEngagement'])
  if (!theme.etfs?.length) failures.push(`Thème ${theme.id} : aucun fonds`)
  for (const etf of theme.etfs ?? []) requireFields(`Fonds ${theme.id}/${etf.isin}`, etf, ['nom', 'isin', 'frais', 'differenciateur'])
}

// Deux erreurs déjà rencontrées : FTSE All-World couvre large/mid, et 2020 précède
// la création des ETP CoinShares (les cours spot ne peuvent représenter ces ETP en 2020).
const allWorld = DEFAULT_THEMES.flatMap(theme => theme.etfs).find(etf => etf.isin === 'IE00BK5BQT80')
if (!allWorld || /small.?cap|petites capitalisations/i.test(allWorld.differenciateur)) {
  failures.push('FTSE All-World : composition petites capitalisations erronée ou ISIN absent')
}
for (const id of ['bitcoin', 'ethereum']) {
  const asset = ASSETS.find(item => item.id === id)
  if (!asset || asset.r[0] !== null) failures.push(`${id} CoinShares : 2020 doit rester indisponible`)
}
const bearMarkets = FACTS.find(fact => fact.id === 'corrections-27-bear-markets')
if (!bearMarkets || /56 mois|5,1 ans/.test([bearMarkets.fact, bearMarkets.context].join(' '))) {
  failures.push('Bear markets : moyenne non attribuable réintroduite')
}

for (const failure of failures) console.error('ÉCHEC ' + failure)
console.log(`${FACTS.length} faits, ${DEFAULT_THEMES.length} thèmes ETF, ${ETFS.length} fiches ETF et ${CASES.length} cas vérifiés ; ${failures.length} erreur(s).`)
if (failures.length) process.exitCode = 1
