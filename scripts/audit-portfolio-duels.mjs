#!/usr/bin/env node
import assert from 'node:assert/strict'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { buildCustomDuel, buildDuel, buildTweet, CATALOG, resultReading } from '../src/pages/portfolio-duels/lib.js'
import { EUR_USD, euroReturn } from '../src/pages/portfolio-duels/catalog.js'
import { generateDuel } from '../src/pages/portfolio-duels/generate.js'

assert.equal(new Set(DUELS.map((duel) => duel.id)).size, DUELS.length)
assert.ok(DUELS.length >= 9)
const bases = CATALOG.filter((asset) => asset.role === 'base')
assert.equal(new Set(bases.map((asset) => asset.exposure)).size, bases.length, 'Une seule part par exposition de base')
assert.equal(new Set(CATALOG.map((asset) => asset.isin)).size, CATALOG.length)
const inspect = (duel) => {
  assert.equal(duel.currency, 'EUR')
  assert.ok(duel.years.length >= 3)
  assert.equal(duel.years.at(-1), 2025)
  assert.ok(duel.sources.every((source) => source.url?.startsWith('https://')))
  for (const portfolio of [duel.a, duel.b]) {
    assert.equal(portfolio.assets.reduce((sum, asset) => sum + asset.pct, 0), 100)
    assert.equal(portfolio.assets.filter((asset) => asset.role === 'base').length, 1)
    assert.equal(new Set(portfolio.assets.map((asset) => asset.role)).size, portfolio.assets.length)
    const expected = duel.years.reduce((capital, year) => {
      const annual = portfolio.assets.reduce((sum, asset) => sum + euroReturn(asset, year) * asset.pct / 100, 0)
      assert.ok(Math.abs(annual - portfolio.annual[year]) < 1e-9)
      return capital * (1 + annual / 100)
    }, 10000)
    assert.ok(Math.abs(expected - portfolio.final) < 1e-8)
    assert.equal(portfolio.worst, Math.min(...duel.years.map((year) => portfolio.annual[year])))
  }
  const tweet = buildTweet(duel)
  assert.ok(!/NaN|undefined|\[.*saisir.*\]|70 % dans.*pour les deux/.test(tweet))
  assert.ok(tweet.includes(`début ${duel.years[0]}`) && tweet.includes(`fin ${duel.years.at(-1)}`))
  assert.ok(tweet.includes('Simulation en euros') && tweet.includes('pondérations rétablies'))
}
for (const definition of DUELS) inspect(buildDuel(definition))
const original = DUELS.find((duel) => duel.id === 'world-em-ou-acwi')
const full = buildDuel(original)
assert.equal(full.b.assets.length, 1)
assert.equal(full.b.assets[0].pct, 100)
assert.equal(full.years[0], 2020)
const limited = buildDuel(DUELS.find((duel) => duel.id === 'world-stoxx-ou-acwi'))
assert.deepEqual(limited.years, [2023, 2024, 2025])
assert.ok(!/2020 :|2021 :|2022 :/.test(buildTweet(limited)))
const usd = CATALOG.find((item) => item.id === 'msci_world_ishares')
const converted = ((1 + usd.values[0] / 100) * EUR_USD[2019] / EUR_USD[2020] - 1) * 100
assert.ok(Math.abs(euroReturn(usd, 2020) - converted) < 1e-9)
// Changer l’ordre des lignes ne change ni la période, ni le capital final.
const reversed = buildCustomDuel({ left: [...original.left].reverse(), right: original.right })
assert.equal(reversed.a.final, full.a.final)
const identical = buildCustomDuel({ left: original.right, right: original.right })
assert.match(resultReading(identical), /même montant/)
assert.ok(!/de plus pour|termine devant/.test(buildTweet(identical)))
const reinforced = buildCustomDuel({ left: [{ id: 'msci_acwi_ishares', pct: 80 }, { id: 'msci_em', pct: 20 }], right: DUELS[0].right })
assert.match(reinforced.readings[0], /renforcent une zone déjà présente/)
const invalid = [
  [], [{ id: 'msci_em', pct: 100 }],
  [{ id: 'msci_world_ishares', pct: 50 }, { id: 'msci_acwi_ishares', pct: 50 }],
  [{ id: 'msci_world_ishares', pct: 60 }, { id: 'msci_em', pct: 20 }, { id: 'msci_europe', pct: 20 }],
  [{ id: 'msci_world_ishares', pct: 60 }, { id: 'sect_ai_lg', pct: 20 }, { id: 'sect_cyber_lg', pct: 20 }],
  [{ id: 'msci_world_ishares', pct: 99 }], [{ id: 'msci_world_ishares', pct: 100.5 }],
  [{ id: 'msci_world_ishares', pct: 101 }, { id: 'msci_em', pct: -1 }],
  [{ id: 'action_visa', pct: 100 }], [{ id: 'spot_bitcoin', pct: 100 }],
]
for (const left of invalid) assert.throws(() => buildCustomDuel({ left, right: DUELS[0].right }))
// Tous les types de construction et toutes les parts sont couverts, y compris les séries courtes.
for (const asset of CATALOG) {
  const left = asset.role === 'base' ? [{ id: asset.id, pct: 100 }]
    : [{ id: 'msci_world_ishares', pct: 80 }, { id: asset.id, pct: 20 }]
  inspect(buildCustomDuel({ left, right: DUELS[0].right }))
}
let previous = ''
for (let i = 0; i < 500; i++) {
  const duel = generateDuel(previous)
  assert.notEqual(duel.id, previous)
  assert.ok(duel.years.some((year) => Math.abs(duel.a.annual[year] - duel.b.annual[year]) >= .001))
  inspect(duel)
  previous = duel.id
}
console.log(`${DUELS.length} duels préparés, ${CATALOG.length} ETF, 500 générations : rôles, mono-ETF, historique commun, change, capitaux et textes vérifiés.`)
