import assert from 'node:assert/strict'
import annualFx from '../src/data/annual-fx.json' with { type: 'json' }
import monthlyFx from '../src/data/monthly-fx.json' with { type: 'json' }
import { EUR_USD, euroReturn } from '../src/data/duel-assets.js'

// One ECB file feeds two registries: the annual year-end rate must be the final December
// observation of the monthly registry, and the duels must read it from there, with no table of
// their own.
assert.equal(annualFx.currency, 'USD per EUR')
let compared = 0
for (const [year, row] of Object.entries(annualFx.years)) {
  const december = monthlyFx.months[`${year}-12`]
  if (!december) continue
  assert.equal(row.value, december.rates.USD, `${year} : taux annuel ${row.value} ≠ dernière observation de décembre ${december.rates.USD}`)
  assert.equal(row.asOf.slice(0, 7), `${year}-12`)
  compared++
}
assert.ok(compared >= 20, `Années comparées : ${compared}`)
assert.deepEqual(Object.keys(EUR_USD).sort(), Object.keys(annualFx.years).sort(), 'Les duels ne gardent aucun taux de change en dur')
// A USD return converted to EUR follows the year-end rates: +10 % in USD with a 10 % stronger
// euro leaves 0 % in EUR.
const item = { currency: 'USD', values: [], calendarReturns: { 2024: 10 } }
const expected = ((1.1) * EUR_USD[2023] / EUR_USD[2024] - 1) * 100
assert.ok(Math.abs(euroReturn(item, 2024) - expected) < 1e-9)
console.log(`Change : ${compared} taux annuels BCE identiques à la dernière observation de décembre ; conversion des duels vérifiée.`)
