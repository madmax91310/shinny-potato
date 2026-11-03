#!/usr/bin/env node
import { HISTORICAL_AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js'
// Vérifie les champs éditoriaux partagés avant publication. Ce contrôle détecte des oublis
// et empêche le retour de deux erreurs factuelles corrigées ; il ne remplace jamais la
// confrontation des chiffres aux documents de l'émetteur.
import { auditInstrumentListings } from './audit-instrument-listings.mjs'
import { FACTS } from '../src/pages/market-facts/data.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { ETFS } from '../src/data/etf-cards.js'
import { EDITORIAL_CASES as CASES } from '../src/data/editorial-cases.js'
import { ASSETS } from '../src/data/portfolio-assets.js'
import { FAMILIES } from '../src/data/index-comparisons.js'
import { PROFILES } from '../src/pages/portfolio-generator/theses.js'
import { TWEETS } from '../src/pages/tweet-bank/data.js'

const failures = auditInstrumentListings()
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
// Les récits fixes ont leur propre dossier de preuves ; l'ancien format reste contrôlé.
// Une question finale n'est une condition de publication dans aucun des deux formats.
for (const fact of FACTS) {
  const label = `Fait ${fact.id}`
  if (!Object.hasOwn(fact, 'text')) {
    requireFields(label, fact, ['hook', 'context', 'source'])
    continue
  }
  requireFields(label, fact, ['text', 'category', 'period', 'reviewedAt'])
  if (!fact.text?.endsWith('Pas un conseil financier.')) failures.push(`${label} : mention financière absente`)
  if (!Array.isArray(fact.sources) || fact.sources.length < (fact.kind === 'measured-reference' ? 1 : 2)) failures.push(`${label} : dossier de sources incomplet`)
  const sources = Array.isArray(fact.sources) ? fact.sources : []
  if (new Set(sources.map(source => source.url)).size !== sources.length) failures.push(`${label} : source dupliquée`)
  for (const source of sources) {
    requireFields(`${label}, source`, source, ['url', 'title', 'organization', 'checkedAt'])
    try {
      if (new URL(source.url).protocol !== 'https:') throw new Error('protocole')
    } catch { failures.push(`${label} : URL de source invalide ou non sécurisée`) }
    if (!Array.isArray(source.facts) || !source.facts.length || source.facts.some(proof => typeof proof !== 'string' || !proof.trim())) {
      failures.push(`${label} : faits vérifiables absents de la source`)
    }
    if (!Object.hasOwn(source, 'publishedAt') || (source.publishedAt !== null && (typeof source.publishedAt !== 'string' || !source.publishedAt.trim()))) {
      failures.push(`${label} : date de source ni renseignée ni explicitement inconnue`)
    }
  }
  if (!Array.isArray(fact.reserves) || !fact.reserves.length || fact.reserves.some(reserve => typeof reserve !== 'string' || !reserve.trim())) {
    failures.push(`${label} : conventions et réserves absentes`)
  }
}
for (const etf of ETFS) requireFields(`Fiche ETF ${etf.id}`, etf, ['isin', 'ter', 'hook', 'whatIs', 'whyInteresting', 'whatToKnow', 'verdict', 'question'])
if (new Set(ETFS.map(etf => etf.hook)).size !== ETFS.length) {
  failures.push('Fiches ETF : chaque produit doit avoir une accroche propre à son exposition')
}
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

// Un cours de sous-jacent antérieur au produit ne doit jamais être présenté comme
// une performance du produit ; sa provenance demeure visible dans l'interface.
const allWorld = DEFAULT_THEMES.flatMap(theme => theme.etfs).find(etf => etf.isin === 'IE00BK5BQT80')
if (!allWorld || /small.?cap|petites capitalisations/i.test(allWorld.differenciateur)) {
  failures.push('FTSE All-World : composition petites capitalisations erronée ou ISIN absent')
}
const allWorldSheet = ETFS.find(etf => etf.isin === 'IE00BK5BQT80')
const allWorldIndex = FAMILIES.find(family => family.id === 'monde')?.indices.find(index => index.name === 'FTSE All-World')
if (!allWorldSheet || /petites capitalisations comprises/i.test(allWorldSheet.whatIs)) {
  failures.push('Fiche FTSE All-World : petites capitalisations attribuées à tort à l’indice')
}
if (!allWorldIndex || /en plus les mid caps/i.test(allWorldIndex.desc)) {
  failures.push('Comparateur FTSE All-World : les mid caps figurent aussi dans le MSCI ACWI')
}
const europeFamily = FAMILIES.find(family => family.id === 'europe')
if (europeFamily?.verdict?.some(item => /sans UK\/Suisse/i.test(item.q))) {
  failures.push('Comparateur MSCI Europe : le Royaume-Uni et la Suisse font partie de l’indice')
}
const etz = europeFamily?.perfFunds?.find(item => item.key === 'stoxx600')
if (!etz || etz.y2023 !== 14.37 || etz.y2024 !== 8.41 || etz.y2025 !== 20.48) {
  failures.push('Comparateur ETZ : série 2023-2025 différente de la fiche BNP FR0011550193')
}
const europeArchive = TWEETS.find(tweet => tweet.id === 21)
if (!europeArchive || /sans UK\/Suisse|YTD \+9,21 %|2023 \+15,84 %/.test(europeArchive.text)) {
  failures.push('Banque tweet 21 : exposition MSCI Europe ou rendements historiques obsolètes')
}
for (const profile of PROFILES) for (const combo of Object.values(profile.riskCombos)) {
  for (const asset of combo.assets) for (const rationale of asset.pourquoi ?? []) {
    if (/ne (?:mette|mettre) jamais le capital en danger/i.test(rationale)) {
      failures.push(`Générateur ${profile.id} : sécurité du portefeuille entier promise par une seule ligne`)
    }
  }
}
// These two existing choices now consume exact CoinShares product series.
// Their first complete calendar year is2022; spot returns must never fill2020/21.
for (const id of ['bitcoin','ethereum']) {
  const asset=ASSETS.find(item=>item.id===id),source=asset&&HISTORICAL_AUTOMATED_PERFORMANCE[asset.isin]
  if(!asset || !source || source.basis!=='fund' || source.currency!=='USD'
    || !source.source?.startsWith('https://www-api.coinshares.com/api/v2/Widgets?')
    || !source.source.includes(asset.isin) || !/exact ETP return.*fees/i.test(source.method??'')
    || JSON.stringify(asset.r)!==JSON.stringify(source.values)
    || asset.r[0]!==null || asset.r[1]!==null || asset.calendarReturns?.[2020]!==undefined || asset.calendarReturns?.[2021]!==undefined
    || !/ETP CoinShares.*dollars.*années complètes/i.test(asset.confidenceNote??'')) {
      failures.push(`${id} CoinShares : calendrier exact, convention, années complètes ou provenance divergents`)
  }
}
const bearMarkets = FACTS.find(fact => fact.id === 'corrections-27-bear-markets')
if (!bearMarkets || /56 mois|5,1 ans/.test([bearMarkets.fact, bearMarkets.context].join(' '))) {
  failures.push('Bear markets : moyenne non attribuable réintroduite')
}

for (const failure of failures) console.error('ÉCHEC ' + failure)
console.log(`${FACTS.length} faits, ${DEFAULT_THEMES.length} thèmes ETF, ${ETFS.length} fiches ETF et ${CASES.length} cas vérifiés ; ${failures.length} erreur(s).`)
if (failures.length) process.exitCode = 1
