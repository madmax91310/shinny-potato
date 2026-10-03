import assert from 'node:assert/strict'
import { monthlyDrawdown, HISTORY_FACTS, HISTORY_STATISTIC_IDS } from '../src/data/history-statistics.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { CATALOG } from '../src/data/duel-assets.js'
import { buildDuel } from '../src/pages/portfolio-duels/lib.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { FEE_COMPARISON_ASSETS } from '../src/data/fee-comparison-assets.js'
import { buildTweetText as fees, computeComparison } from '../src/pages/fee-impact/lib.js'
import { buildTweetText as factTweet } from '../src/pages/market-facts/lib.js'
import { ALLOCATION_CASES, weightedExposure } from '../src/data/allocation-cases.js'
import { PROFILES } from '../src/pages/portfolio-generator/theses.js'
// Cas fabriqué : baisse de 50 %, nouveau sommet ensuite, récupération six mois après le sommet.
const points = [['2020-01', 100], ['2020-02', 80], ['2020-03', 50], ['2020-04', 75], ['2020-07', 100], ['2020-08', 120]].map(([date, price]) => ({ date, price }))
const drawdown = monthlyDrawdown(points)
assert.equal(drawdown.drawdown, -50)
assert.equal(drawdown.peak.date, '2020-01')
assert.equal(drawdown.trough.date, '2020-03')
assert.equal(drawdown.recovery.date, '2020-07')
assert.equal(drawdown.monthsToRecovery, 6)
assert.equal(monthlyDrawdown(points.slice(0, 4)).recovery, null)
assert.equal(monthlyDrawdown([{ date: '2020-01', price: 100 }, { date: '2020-02', price: 101 }]).drawdown, 0)
assert.throws(() => monthlyDrawdown([{date: '2020-01', price: 0}]))
for (const fact of HISTORY_FACTS) {
  const text = factTweet(fact)
  assert.match(text, /mensuel/)
  assert.match(text, /(?:dividendes|revenus) (?:non )?réinvestis/)
  assert.match(text, /(?:Hors|hors) frais(?: du courtier)? et fiscalité/)
  assert(!/NaN|undefined/.test(text))
}
assert.equal(HISTORY_FACTS.length, HISTORY_STATISTIC_IDS.length * 2)
for (const item of ALLOCATION_CASES) {
  assert.equal(item.sources.length, 2)
  assert(item.sources.every(source => source.url.startsWith('https://')))
  assert.match(item.text, /Photographie des indices au \d{4}-\d{2}-\d{2}/)
}
assert.equal(buildDuel(DUELS.find(x => x.id === 'semiconducteurs_monde-contre-blockchain_ishares')).years[0], 2023)
assert.equal(buildDuel(DUELS.find(x => x.id === 'world-avec-quality_dividend')).years[0], 2021)
for (const record of DATA_CATALOG.filter(x => x.type === 'instrument')) {
  assert.equal(record.consumers.some(c => c.path === '/duels-portefeuilles'), CATALOG.some(x => x.isin === record.id))
  assert.equal(record.consumers.some(c => c.path === '/impact-frais'), FEE_COMPARISON_ASSETS.some(x => x.isin === record.id))
}
const a = FEE_COMPARISON_ASSETS.find(x => x.isin === 'FR001400U5Q4')
const b = FEE_COMPARISON_ASSETS.find(x => x.isin === 'IE00BP3QZ601')
const state = { amount: 100, years: 10, returnRate: 7, fee1: a.fee, fee2: b.fee, isin1: a.isin, isin2: b.isin }
assert.match(fees(state), /sans comparer leurs performances réelles/)
assert(fees(state).includes(a.isin) && fees(state).includes(b.isin))
assert.equal(computeComparison({...state, fee2: a.fee}).ecart, 0)
assert.equal(Number(weightedExposure(72.14, 63.59, .5).toFixed(2)), 67.87) // (72,14 + 63,59)/2 arrondi à deux décimales.
assert.equal(Number(weightedExposure(72.14, 0, .2).toFixed(2)), 57.71) // 80 % × 72,14 % + 20 % × 0 %.
const options = new Set(PROFILES.flatMap(p => Object.values(p.riskCombos).flatMap(c => c.assets.flatMap(a => a.idOptions ?? [a.id]))))
for (const id of ['monetaire_xeon', 'oblig_0_1_ishares', 'oblig_global_agg_eur_hedged', 'actions_india_ishares', 'infrastructure_ishares', 'sect_financieres', 'smallcap_monde', 'oblig_hy_ishares_acc', 'oblig_em_local_ishares_acc']) assert(options.has(id), `Option automatique absente : ${id}`)
console.log('Réutilisation : drawdown, récupération, séries courtes, frais, compositions, consommateurs et options automatiques OK.')
