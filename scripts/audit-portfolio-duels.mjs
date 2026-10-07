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
  assert.doesNotMatch(tweet, /📌 Simulation en euros|pondérations rétablies|Hors courtage/)
  assert.match(duel.hook, /\d/)
  assert.match(tweet, /🔎 Ce qui change/)
  assert.ok(duel.sources.length > 0)
}
for (const definition of DUELS) inspect(buildDuel(definition))
const original = DUELS.find((duel) => duel.id === 'world-em-ou-acwi')
const full = buildDuel(original)
assert.equal(full.b.assets.length, 1)
assert.equal(full.b.assets[0].pct, 100)
assert.equal(full.years[0], 2020)
const stoxxDefinition = DUELS.find((duel) => duel.id === 'world-stoxx-ou-acwi')
const limited = buildDuel(stoxxDefinition)
const selected = [...stoxxDefinition.left, ...stoxxDefinition.right].map(line => CATALOG.find(asset => asset.id === line.id))
const common = Object.keys(selected[0].calendarReturns).map(Number)
  .filter(year => selected.every(asset => Number.isFinite(euroReturn(asset, year))))
  .sort((a, b) => a - b).slice(-6)
assert.deepEqual(limited.years, common, 'Le duel utilise toute la dernière période commune publiée')
// A short controlled history still exercises the three-year fallback even
// after an issuer publishes more years for the active part.
const stoxx = selected.find(asset => asset.isin === 'FR0011550193')
const completeCalendar = stoxx.calendarReturns
try {
  const shortYears = common.slice(-3)
  stoxx.calendarReturns = Object.fromEntries(shortYears.map(year => [year, completeCalendar[year]]))
  const short = buildDuel(stoxxDefinition)
  assert.deepEqual(short.years, shortYears)
  for (const year of common.slice(0, -3)) assert.ok(!buildTweet(short).includes(`${year} :`))
} finally { stoxx.calendarReturns = completeCalendar }
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

// Accroches validées : chiffres issus des résultats, période commune et absence de méthode dans le tweet.
const cashDuel=buildDuel(DUELS.find(d=>d.id==='world-avec-monetaire_xeon'))
assert.match(cashDuel.hook,/40 %.*\?[\s\S]*2020[\s\S]*2025[\s\S]*3\s903 € de plus/)
const maturityDuel=buildDuel(DUELS.find(d=>d.id==='oblig-courtes-longues'))
assert.match(maturityDuel.hook,/\?[\s\S]*10 000 €[\s\S]*de plus/)
assert.match(buildTweet(maturityDuel),/cours peuvent beaucoup baisser lorsque les taux montent/)
const factorsDuel=buildDuel(DUELS.find(d=>d.id==='world-value-ou-world-quality'))
assert.match(factorsDuel.hook,/2020.*2025.*116 €/)
assert.match(buildTweet(factorsDuel),/peu chère peut le rester longtemps/)
assert.doesNotMatch(buildTweet(buildDuel(DUELS.find(d=>d.id==='em-bond-local-usd'))),/coupons émergents|sensibilité des obligations longues/)
assert.ok(limited.hook.includes(String(limited.years[0])) && limited.hook.includes(String(limited.years.at(-1))))
for (const definition of DUELS) {
 const duel=buildDuel(definition)
 assert.doesNotMatch(duel.hook,/Tu gardes 100 % de World|vous|votre|Qu’a changé cette répartition|comparons ces deux choix|performances annuelles à comparer/)
 assert.match(duel.hook,/\?\n\nAvec 10 000 € investis début \d{4},/)
 assert.ok(duel.hook.endsWith('Voici le détail du duel, année par année 👇'))
 assert.doesNotMatch(buildTweet(duel),/Simulation en euros|Hors courtage/)
}
// La conclusion doit suivre les résultats, même si A/B est inversé ou si les capitaux sont égaux.
const swapped={...cashDuel,a:cashDuel.b,b:cashDuel.a,id:'custom-swap'}
assert.match(resultReading(swapped),/portefeuille B termine/)
const flat={...identical,a:{...identical.a,annual:Object.fromEntries(identical.years.map(y=>[y,0]))},b:{...identical.b,annual:Object.fromEntries(identical.years.map(y=>[y,0]))}}
assert.doesNotMatch(resultReading(flat),/écart annuel|gagne|perd/)
assert.doesNotMatch(buildCustomDuel({left:[{id:'msci_world_ishares',pct:100}],right:[{id:'msci_world_ishares',pct:100}]}).hook, /Ajouter  à/)
console.log('Accroches de tous les duels, périodes courtes et conclusions inversées/égales vérifiées.')
