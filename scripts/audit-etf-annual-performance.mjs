#!/usr/bin/env node
import { AUTOMATED_ETF } from '../src/data/automated-etf.js';
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js';
import { SIMULATION_PROXIES } from '../src/data/simulation-proxies.js';
import { getRecipes } from '../src/pages/portfolio-generator/recipes.js';
// Vérifie que les performances publiées dans les Fiches ETF correspondent à la part exacte
// du Générateur, sans proposer une part à historique incomplet dans ses choix.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INSTRUMENT_FACTS_BY_ISIN } from '../src/data/instrument-facts.js'
import { INSTRUMENT_AUM_BY_ISIN } from '../src/data/instrument-aum.js'
import { ETFS } from '../src/data/etf-cards.js'
import { ASSETS } from '../src/data/portfolio-assets.js'
import { getAnnualPerformance } from '../src/pages/etf-sheets/annualPerformance.js'
import { PROFILES } from '../src/pages/portfolio-generator/theses.js'
import { VERIFIED_RETURNS } from '../src/data/verified-returns.js'

let errors = 0
const known = new Map(ASSETS.filter((asset) => asset.isin).map((asset) => [asset.isin, asset]))
const cards = new Set(ETFS.map((etf) => etf.isin))
for (const etf of ETFS) {
  const series = getAnnualPerformance(etf)
  if (!series) continue
  if (series.values.length !== 6 || !series.values.every((v) => v === null || Number.isFinite(v))) {
    console.error(`Série annuelle invalide : ${etf.isin}`); errors++
  }
  const asset = known.get(etf.isin)
  if (series.values.every(Number.isFinite) && !asset) {
    console.error(`Part à historique complet absente de la composition manuelle : ${etf.isin}`); errors++
  }
  if (asset && series.values.every(Number.isFinite) && JSON.stringify(series.calendarYears ? series.calendarYears.map(year => asset.calendarReturns[year] ?? null) : asset.r) !== JSON.stringify(series.values)) {
    console.error(`Divergence Fiches / Générateur : ${etf.isin}`); errors++
  }
  if (asset && !series.values.every(Number.isFinite) && !SIMULATION_PROXIES[etf.isin] && !(REVIEWED_PERFORMANCE_META[etf.isin]?.portfolioHistoryBasis === 'proxy' && asset.confidenceNote)) {
    console.error(`Part à historique incomplet dans le Générateur : ${etf.isin}`); errors++
  }
}
const selectable = new Set()
function visit(value) {
  if (Array.isArray(value)) return value.forEach(visit)
  if (value && typeof value === 'object') {
    if (typeof value.id === 'string') selectable.add(value.id)
    if (Array.isArray(value.idOptions)) value.idOptions.forEach((id) => selectable.add(id))
    Object.values(value).forEach(visit)
  }
}
visit(PROFILES)
for (const p of PROFILES) for (const risk of Object.keys(p.riskCombos)) visit(getRecipes(p.id, risk))
for (const asset of ASSETS) {
  if (asset.manualOnly && selectable.has(asset.id)) {
    console.error(`Part manuelle ajoutée à un profil automatique : ${asset.id}`); errors++
  }
  if (cards.has(asset.isin) && VERIFIED_RETURNS[asset.isin] && !selectable.has(asset.id) && !asset.manualOnly) {
    console.error(`Part de fiche sans choix de portefeuille : ${asset.id}`); errors++
  }
}
console.log(`${ETFS.length} fiches, ${ETFS.filter((e) => getAnnualPerformance(e)?.values.every(Number.isFinite)).length} séries complètes, ${errors} erreur(s).`)
if (errors) process.exitCode = 1

// Les nouvelles fiches restent alignées sur le relevé conservé, y compris la
// devise de rendement et les années absentes avant le lancement de la part.
const snapshot = JSON.parse(readFileSync(new URL('./source-snapshots/etf-additions-2026-10-01.json', import.meta.url), 'utf8'))
assert.equal(snapshot.products.length, 7)
for (const product of snapshot.products) {
  const card = ETFS.find(e => e.isin === product.isin)
  assert(card, `Fiche absente : ${product.isin}`)
  assert.equal(card.ter, (AUTOMATED_ETF[product.isin]?.characteristics?.terPct.toFixed(2).replace('.', ',') ?? product.ter) + '%')
  assert.equal(card.pea, false)
  assert.equal(card.positions, product.positions)
  assert.equal(card.listing.ticker, product.ticker)
  assert.equal(card.listing.exchange, product.exchange)
  const facts = INSTRUMENT_FACTS_BY_ISIN[product.isin]
  assert.equal(facts.benchmark, product.benchmark)
  assert.equal(facts.incomePolicy, product.income)
  assert.equal(facts.characteristicsSource.checkedAt, snapshot.checkedAt)
  const aum = INSTRUMENT_AUM_BY_ISIN[product.isin]
  if (AUTOMATED_ETF[product.isin]?.aum) {
    const automated = AUTOMATED_ETF[product.isin].aum
    assert.equal(aum.source.amount, automated.amount)
    assert.equal(aum.source.asOf, automated.asOf)
    assert.equal(aum.source.currency, product.currency)
    assert.equal(aum.source.scope, automated.scope === 'fund' ? 'Actif net du fonds' : 'Actif net de la part exacte')
    assert.equal(aum.source.url, automated.sourceUrl ?? AUTOMATED_ETF[product.isin].sourceUrl)
    assert(automated.asOf >= product.asOf, 'La collecte ne doit pas régresser')
  } else if (product.isin !== 'IE00BMG6Z448') {
    assert.equal(aum.source.amount, product.amount)
    assert.equal(aum.source.asOf, product.asOf)
    assert.equal(aum.source.currency, product.currency)
    assert.equal(aum.source.scope, product.aumScope)
  } else assert.equal(aum.sheet, aum.index, 'Une part conserve le même relevé dans les deux vues')
  const series = getAnnualPerformance(card)
  assert.equal(series.currency, product.currency)
  if (product.returns) assert.deepEqual(series.values, AUTOMATED_ETF[product.isin]?.performance ? series.calendarYears.map(year => AUTOMATED_ETF[product.isin].performance.years[year] ?? null) : product.returns)
}
console.log('7 ajouts : frais, identité, cotation, encours datés et séries conformes aux sources conservées.')
