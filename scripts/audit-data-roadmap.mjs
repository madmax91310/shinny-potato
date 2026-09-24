#!/usr/bin/env node
// Revue interne du lexique, des séries et de leur provenance. Une référence n'atteste
// jamais la vérification de chaque chiffre historique. Aucun statut ne va dans les tweets.
import { readFileSync } from 'node:fs'
import { TERMES } from '../src/pages/lexique-financier/data.js'
import { ASSETS as PORTFOLIO } from '../src/pages/portfolio-generator/data.js'
import { ASSETS as CALCULATOR } from '../src/pages/investment-calculator/data.js'

import { LEXICON_SOURCES as sources } from './lexicon-sources.mjs'
const fiscal = new Set(`pea cto assurance-vie per livret-a ldds pee-perco flat-tax abattement-pea prelevements-sociaux plus-value-imposable plus-value-immobiliere`.split(' '))
const inventory = JSON.parse(readFileSync(new URL('./source-inventory.json', import.meta.url), 'utf8'))
let errors = 0
const ids = new Set(TERMES.map(t => t.id))
for (const t of TERMES) {
  if (!sources[t.id]) { console.error(`Lexique non classé : ${t.id}`); errors++ }
  if (fiscal.has(t.id) && !sources[t.id]) { console.error(`Fiscalité sans référence : ${t.id}`); errors++ }
}
for (const id of [...Object.keys(sources), ...fiscal]) if (!ids.has(id)) { console.error(`Référence lexique orpheline : ${id}`); errors++ }
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
  `Lexique : ${TERMES.length} fiches ; ${Object.keys(sources).length} avec une référence primaire ciblée ; ${TERMES.length - Object.keys(sources).length} sans référence ciblée.`,
  'Références de travail repérées ou consultées le 24/09/2026 ; cela ne constitue pas un contrôle exhaustif de chaque phrase ou valeur.',
  '',
  '| Fiche | Référence de travail | État |', '| --- | --- | --- |',
  ...TERMES.map(t => `| ${t.id} | ${sources[t.id] || '—'} | ${fiscal.has(t.id) ? 'Fiscalité relue le 24/09/2026 ; exemples et exceptions à contrôler individuellement' : 'Source identifiée le 24/09/2026 ; détails à contrôler'} |`),
  '',
  `Portefeuilles : ${PORTFOLIO.length} supports, dont ${gaps.filter(x => x.tool === 'portefeuilles').length} sans date individuelle ; voir audit:portfolio-provenance pour les émetteurs, devises et années proxy.`,
  `Calculateur : ${Object.keys(CALCULATOR).length} actifs, dont ${gaps.filter(x => x.tool === 'calculateur').length} sans date individuelle ; les points de prix doivent être recoupés avec un export exact avant validation.`,
  '',
  'Les dates absentes restent absentes. Les sources trouvées ne sont pas une validation des valeurs de séries.',
]
if (process.argv.includes('--markdown')) console.log(lines.join('\n'))
else console.log(`${TERMES.length} fiches (${Object.keys(sources).length} références, ${TERMES.length - Object.keys(sources).length} à sourcer), ${PORTFOLIO.length} supports, ${Object.keys(CALCULATOR).length} actifs ; ${errors} erreur(s) structurelle(s).`)
if (errors) process.exitCode = 1
