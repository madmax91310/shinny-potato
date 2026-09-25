#!/usr/bin/env node
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { buildCustomDuel, buildDuel, buildTweet, CATALOG } from '../src/pages/portfolio-duels/lib.js'
import { EUR_USD } from '../src/pages/portfolio-duels/catalog.js'
import { generateDuel } from '../src/pages/portfolio-duels/generate.js'
import { YEARS } from '../src/pages/portfolio-generator/data.js'

if (DUELS.length !== 4 || new Set(DUELS.map((duel) => duel.id)).size !== DUELS.length) {
  throw new Error('Les quatre duels pilotes doivent être distincts')
}
for (const definition of DUELS) {
  const duel = buildDuel(definition)
  const tweet = buildTweet(duel)
  if (!duel.sources.every((source) => source.url?.startsWith('https://'))) {
    throw new Error(`Source officielle absente : ${duel.id}`)
  }
  if ([duel.a, duel.b].some((portfolio) =>
    portfolio.assets.reduce((total, asset) => total + asset.pct, 0) !== 100 ||
    YEARS.some((year) => !Number.isFinite(portfolio.annual[year])) ||
    !Number.isFinite(portfolio.final) || !Number.isFinite(portfolio.worst))) {
    throw new Error(`Résultat incomplet : ${duel.id}`)
  }
  if (/NaN|undefined|Méthode\s*:|rebalanc|proxy/i.test(tweet)) {
    throw new Error(`Texte non publiable : ${duel.id}`)
  }
  console.log(`${duel.id}: A ${duel.a.final.toFixed(0)} ${duel.currency}, B ${duel.b.final.toFixed(0)} ${duel.currency}`)
}
// L'ajout d'une part avec une série incomplète ou une devise différente doit échouer.
for (const [change, reason] of [
  [{ right: 'sect_financieres' }, 'historique partiel'],
  [{ right: 'oblig_hy_ishares_acc' }, 'devises distinctes'],
]) {
  try {
    buildDuel({ ...DUELS[0], ...change })
    throw new Error(`Garde-fou absent : ${reason}`)
  } catch (error) {
    if (error.message.startsWith('Garde-fou absent')) throw error
  }
}
console.log('4 duels et garde-fous vérifiés.')

const a = [{ id: 'msci_acwi_ishares', pct: 70 }, { id: 'action_visa', pct: 10 }, { id: 'action_microsoft', pct: 10 }, { id: 'action_cocacola', pct: 10 }]
const b = [{ id: 'sp500_ishares', pct: 60 }, { id: 'sect_tech_world_ishares', pct: 20 }, { id: 'or', pct: 10 }, { id: 'spot_bitcoin', pct: 10 }]
const custom = buildCustomDuel({ left: a, right: b })
if (custom.years[0] !== 2020 || custom.currency !== 'EUR' || !/Apple|Visa/.test(CATALOG.map((item) => item.name).join(' '))) {
  throw new Error('Composition ou catalogue incomplet')
}
const visa = CATALOG.find((item) => item.id === 'action_visa')
const visaUsd = visa.values[0]
const visaEur = ((1 + visaUsd / 100) * EUR_USD[2019] / EUR_USD[2020] - 1) * 100
const expected = a.reduce((sum, line) => {
  const item = CATALOG.find((candidate) => candidate.id === line.id)
  const result = item.currency === 'USD' ? ((1 + item.values[0] / 100) * EUR_USD[2019] / EUR_USD[2020] - 1) * 100 : item.values[0]
  return sum + line.pct * result / 100
}, 0)
if (!Number.isFinite(visaEur) || Math.abs(custom.a.annual[2020] - expected) > 1e-9 || /NaN|undefined/.test(buildTweet(custom))) {
  throw new Error('Conversion ou rendu de la composition incorrect')
}
const lvmh = buildCustomDuel({ left: [{ id: 'msci_acwi_ishares', pct: 70 }, { id: 'action_lvmh', pct: 30 }], right: b })
if (lvmh.years[0] !== 2021 || lvmh.years.at(-1) !== 2025) throw new Error('Historique partiel de LVMH ignoré')
const scpi = buildCustomDuel({ left: [{ id: 'msci_acwi_ishares', pct: 70 }, { id: 'scpi', pct: 30 }], right: b })
if (scpi.years[0] !== 2021) throw new Error('Ancienne méthode SCPI de 2020 incluse')
for (const invalid of [[{ ...a[0], pct: 71 }, ...a.slice(1)], [{ ...a[0] }, { ...a[0], pct: 30 }]]) {
  try { buildCustomDuel({ left: invalid, right: b }); throw new Error('Composition invalide acceptée') }
  catch (error) { if (error.message === 'Composition invalide acceptée') throw error }
}
for (let i = 0; i < 60; i++) {
  const duel = generateDuel()
  if (duel.years.length < 3 || !Number.isFinite(duel.a.final) || !Number.isFinite(duel.b.final) || duel.currency !== 'EUR') {
    throw new Error('Duel généré invalide')
  }
}
console.log(`${CATALOG.length} actifs, composition manuelle, change et 60 duels générés vérifiés.`)
