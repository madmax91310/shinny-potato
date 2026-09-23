#!/usr/bin/env node
// Audit croisé de performance annuelle (2023/2024/2025) entre les data.js qui décrivent le MÊME
// fonds (même ISIN) dans deux outils différents : portfolio-generator (tableau r = [2020..2025])
// et index-comparator (perfFunds y2023/y2024/y2025, un par indice/famille).
//
// Écrit le 23/09/2026 suite à un signalement utilisateur ayant révélé que le tweet "Dividendes
// (CTO)" du Comparateur d'indices portait deux séries de performance fausses depuis leur création,
// en désaccord silencieux avec les séries déjà vérifiées pour les MÊMES fonds dans
// portfolio-generator/data.js (cf. CLAUDE.md, section "Pas de duplication de données entre
// outils" — l'audit ISIN/TER existant, audit-etf-consistency.mjs, ne couvrait que le TER, jamais
// la performance). Complète ce script existant plutôt que de le dupliquer.
//
// Limite assumée : ne peut relier automatiquement un ISIN d'index-comparator à une entrée
// perfFunds que lorsque le groupe ETF de la famille ne contient qu'UN SEUL fonds pour cet indice
// (mapping non ambigu). Un groupe à plusieurs fonds (ex. Dividend Aristocrats mondial + US) est
// laissé de côté par ce script automatique — nécessite une lecture manuelle (cf. commentaire dans
// dividendes-cto pour l'exemple déjà traité à la main).
//
// Usage : npm run audit:performance-consistency
// Sort en code 1 si une divergence > 1,0 pt est trouvée sur un ISIN partagé.

import { FAMILIES } from '../src/pages/index-comparator/data.js'
import { ASSETS } from '../src/pages/portfolio-generator/data.js'

const THRESHOLD = 1.0 // points de pourcentage — au-delà, considéré comme une vraie divergence de donnée plutôt qu'un simple arrondi/écart de source

// portfolio-generator : isin -> { name, y2023, y2024, y2025 } (r = [2020,2021,2022,2023,2024,2025], convention documentée en tête de fichier)
const pgByIsin = new Map()
for (const a of ASSETS) {
  if (!a.isin || !Array.isArray(a.r) || a.r.length !== 6) continue
  pgByIsin.set(a.isin, { name: a.name, y2023: a.r[3], y2024: a.r[4], y2025: a.r[5] })
}

let hardFailures = 0
let disclosed = 0
let compared = 0
let skippedAmbiguous = 0

for (const fam of FAMILIES) {
  if (!fam.perfFunds || !fam.etfGroups) continue
  for (const group of fam.etfGroups) {
    if (!group.funds || group.funds.length !== 1) {
      if (group.funds?.some((f) => f.isin && pgByIsin.has(f.isin))) skippedAmbiguous++
      continue
    }
    const fund = group.funds[0]
    if (!fund.isin || !pgByIsin.has(fund.isin)) continue
    // Rattache ce fonds à SA ligne perfFunds via une correspondance de libellé (le nom du gérant
    // et/ou le nom de l'indice doivent se retrouver dans le label perfFunds — seule clé commune
    // disponible, les deux structures n'étant pas indexées par ISIN par construction).
    const perf = fam.perfFunds.find((p) => {
      const label = p.label.toLowerCase()
      const idx = group.indexName.toLowerCase()
      return label.includes(idx.split(' ')[0]) || fund.name.toLowerCase().includes(label.split(' ')[0])
    })
    if (!perf || perf.y2023 == null) continue
    compared++
    const pg = pgByIsin.get(fund.isin)
    const diffs = ['y2023', 'y2024', 'y2025']
      .map((k) => ({ k, xc: perf[k], pg: pg[k], gap: Math.abs(perf[k] - pg[k]) }))
      .filter((d) => d.gap > THRESHOLD)
    if (diffs.length) {
      // Une divergence n'est pas forcément une erreur : elle peut venir d'une devise différente
      // entre les deux séries (fonds coté en $ ici vs indice EUR net de dividendes côté
      // portfolio-generator, par ex.) — auquel cas elle DOIT être déclarée au lecteur via
      // family.perfMethodNote (cf. dividendes-cto, emergents-cto). Si cette déclaration existe,
      // l'écart est informationnel ; sinon, c'est une donnée non expliquée au lecteur = échec dur.
      const isDisclosed = !!fam.perfMethodNote
      if (isDisclosed) disclosed++
      else hardFailures++
      console.log(`[${isDisclosed ? 'ÉCART DÉCLARÉ' : 'ÉCART NON DÉCLARÉ'}] ${fund.isin} — ${fund.name}`)
      console.log(`  index-comparator (${fam.id} / ${perf.label}) vs portfolio-generator (${pg.name})`)
      for (const d of diffs) console.log(`  ${d.k} : ${d.xc} % (index-comparator) vs ${d.pg} % (portfolio-generator) — écart ${d.gap.toFixed(2)} pt`)
      if (!isDisclosed) console.log(`  → ajouter family.perfMethodNote à "${fam.id}" (devise/méthode) si l'écart est légitime, sinon corriger la donnée fausse.`)
    }
  }
}

console.log(`\n${compared} fonds comparés (correspondance non ambiguë), ${skippedAmbiguous} ignorés (groupe multi-fonds, à vérifier manuellement).`)
console.log(`${disclosed} écart(s) > ${THRESHOLD} pt mais déclaré(s) au lecteur (perfMethodNote présent) — informationnel, pas un échec.`)
console.log(`${hardFailures} écart(s) > ${THRESHOLD} pt NON déclaré(s) — à traiter avant de publier un tweet basé sur ces chiffres.`)
if (hardFailures) {
  process.exitCode = 1
} else {
  console.log('OK.')
}
