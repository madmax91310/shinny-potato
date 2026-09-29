#!/usr/bin/env node
// Revue interne du lexique, des séries et de leur provenance. Une référence n'atteste
// jamais la vérification de chaque chiffre historique. Aucun statut ne va dans les tweets.
import { readFileSync } from 'node:fs'
import { TERMES } from '../src/pages/lexique-financier/data.js'
import { ASSETS as PORTFOLIO } from '../src/pages/portfolio-generator/data.js'
import { ASSETS as CALCULATOR } from '../src/pages/investment-calculator/data.js'
import { INSTRUMENT_AUM_BY_ISIN } from '../src/data/instrument-aum.js'

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
for (const name of lexiconGaps) if (!ids.has(name)) { console.error(`Inventaire lexique orphelin : ${name}`); errors++ }
const verifiedToday = new Set(TERMES.map(t => t.id))
const lexiconText = readFileSync(new URL('../src/pages/lexique-financier/data.js', import.meta.url), 'utf8')
for (const id of verifiedToday) {
  const entry = new RegExp(`\\{\\s*((?://[^\\n]*\\n\\s*)*)id:"${id}"`).exec(lexiconText)
  if (!entry || !/Vérifié le 25\/09\/2026/.test(entry[1]) || !/https:\/\//.test(entry[1]) || !/confiance/i.test(entry[1])) {
    console.error(`Contrôle individuel source/date/confiance manquant : ${id}`); errors++
  }
}
const gaps = inventory.filter(x => x.tool === 'portefeuilles' || x.tool === 'calculateur')
const monthlyIds = ['bitcoin', 'or', 'apple', 'microsoft', 'broadcom', 'tesla']
const sharedAum = Object.entries(INSTRUMENT_AUM_BY_ISIN).filter(([, value]) => value.sheet && value.index)
const sourcedAum = Object.entries(INSTRUMENT_AUM_BY_ISIN).filter(([, value]) => value.source)
const absentPortfolioUrls = gaps.filter(x => x.tool === 'portefeuilles' && !x.sourceUrls.length)
if (absentPortfolioUrls.length) { console.error(`Supports sans URL : ${absentPortfolioUrls.map(x => x.name).join(', ')}`); errors += absentPortfolioUrls.length }
for (const a of PORTFOLIO) {
  if (!Array.isArray(a.r) || a.r.length !== 6 || a.r.some(n => !Number.isFinite(n))) { console.error(`Années 2020-2025 incomplètes : ${a.id}`); errors++ }
}
for (const [id, a] of Object.entries(CALCULATOR)) {
  if (!['EUR', 'USD'].includes(a.currency)) { console.error(`Devise inconnue : ${id}`); errors++ }
  if (!a.points.every((p, i, arr) => /^\d{4}-\d{2}$/.test(p.date) && Number.isFinite(p.price) && p.price > 0 && (i === 0 || p.date > arr[i - 1].date))) { console.error(`Points mensuels invalides : ${id}`); errors++ }
}
// La continuité des six séries est contrôlée ici. Pour cinq d'entre elles,
// audit:calculator-series compare aussi les prix à une capture Yahoo datée.
// L'or spot reste sans recoupement homogène des 140 points.
for (const id of monthlyIds) {
  const a = CALCULATOR[id]
  if (!a || a.currency !== 'USD') { console.error(`Série mensuelle ou devise changée : ${id}`); errors++; continue }
  let month = new Date(Date.UTC(2015, 0, 1))
  for (const p of a.points) {
    if (p.date !== month.toISOString().slice(0, 7)) { console.error(`Mois absent ou doublon : ${id}, attendu ${month.toISOString().slice(0, 7)}, obtenu ${p.date}`); errors++; break }
    month.setUTCMonth(month.getUTCMonth() + 1)
  }
  if (a.points.at(-1)?.date < '2026-08') { console.error(`Série historique tronquée : ${id}`); errors++ }
}
const lines = [
  '# Audit des données — génération depuis le code',
  '',
  `Lexique : ${TERMES.length} fiches ; ${Object.keys(sources).length} avec une référence primaire ciblée ; ${TERMES.length - Object.keys(sources).length} sans référence ciblée.`,
  `Contrôle individuel du 25/09/2026 : ${verifiedToday.size}/${TERMES.length} fiches relues. Les commentaires de data.js précisent la source et le degré de confiance ; les exemples indicatifs ne valent pas vérification d’un prix de marché actuel.`,
  '',
  '| Fiche | Référence de travail | État |', '| --- | --- | --- |',
  ...TERMES.map(t => `| ${t.id} | ${sources[t.id] || '—'} | ${verifiedToday.has(t.id) ? 'Points cités contrôlés le 25/09/2026 ; voir sources et réserves dans data.js' : fiscal.has(t.id) ? 'Fiscalité relue le 24/09/2026 ; exemples et exceptions à contrôler individuellement' : 'Source identifiée le 24/09/2026 ; détails à contrôler'} |`),
  '',
  `Portefeuilles : ${PORTFOLIO.length} supports, dont ${gaps.filter(x => x.tool === 'portefeuilles').length} sans date individuelle ; voir audit:portfolio-provenance pour les émetteurs, devises et années proxy.`,
  `Calculateur : ${Object.keys(CALCULATOR).length} actifs, dont ${gaps.filter(x => x.tool === 'calculateur').length} sans date individuelle ; cinq séries mensuelles ont été recoupées avec Yahoo le 29/09/2026, l'or spot reste non vérifié point par point.`,
  '',
  '| Série mensuelle | Devise | Période | Points | Contrôle externe |', '| --- | --- | --- | ---: | --- |',
  ...monthlyIds.map(id => { const a = CALCULATOR[id]; return `| ${id} | ${a.currency} | ${a.points[0].date} → ${a.points.at(-1).date} | ${a.points.length} | ${id === 'or' ? 'Source spot homogène introuvable ; série non vérifiée point par point' : 'Capture Yahoo datée et audit des 140 points dans scripts/source-snapshots/'} |` }),
  '',
  'La date de l’or reste absente. Les valeurs historiques ajustées des actions peuvent être révisées par le fournisseur.',
  '',
  `Encours ETF : ${Object.keys(INSTRUMENT_AUM_BY_ISIN).length} ISIN et ${Object.values(INSTRUMENT_AUM_BY_ISIN).reduce((n, value) => n + Number(Boolean(value.sheet)) + Number(Boolean(value.index)), 0)} affichages centralisés. ${sharedAum.length} ISIN apparaissent dans les deux outils. ${sourcedAum.length} ont une source individuelle contrôlée ; ${Object.keys(INSTRUMENT_AUM_BY_ISIN).length - sourcedAum.length} reprennent les libellés historiques sans nouveau recoupement.`,
  'SPEA : actif net exact de 54 413 013 EUR au 28/09/2026 chez BlackRock. Pour les 80 autres ISIN, taille en EUR relevée sur le profil ISIN justETF le 29/09/2026 et conservée dans scripts/source-snapshots/etf-aum-2026-09-29.json. justETF ne donne pas de date de valeur exploitable : la date de consultation n’est pas une date de VL. Le périmètre est celui du profil de la part : BlackRock distingue pour IE00B3F81R35 8,437 Md€ pour la part et 13,148 Md€ pour le fonds entier au 25/09/2026.',
  '',
  '| ISIN | Fiche ETF | Comparateur d’indices |', '| --- | --- | --- |',
  ...sharedAum.map(([isin, value]) => `| ${isin} | ${value.sheet} | ${value.index} |`),
]
if (process.argv.includes('--markdown')) console.log(lines.join('\n'))
else console.log(`${TERMES.length} fiches (${Object.keys(sources).length} références, ${TERMES.length - Object.keys(sources).length} à sourcer), ${PORTFOLIO.length} supports, ${Object.keys(CALCULATOR).length} actifs ; ${errors} erreur(s) structurelle(s).`)
if (errors) process.exitCode = 1
