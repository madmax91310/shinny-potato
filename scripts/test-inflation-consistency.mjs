import assert from 'node:assert/strict'
import { INFLATION, INFLATION_PUBLISHED, derivedAnnualInflation } from '../src/data/market-history.js'
import { INFLATION_MONTHLY } from '../src/data/inflation-monthly.js'

// The monthly INSEE series (collected) and the published annual averages (typed with their
// source) describe the same prices: a drift beyond the rounding of monthly variations means
// one of them is broken. Complete years without a published average are derived, so a new
// January never leaves a hole in the calculator's inflation benchmark.
const derived = derivedAnnualInflation()
const years = Object.keys(derived)
assert.ok(years.length >= 7, 'Au moins sept années complètes dérivées')
for (const year of years) {
  if (INFLATION_PUBLISHED[year] == null) continue
  const gap = Math.abs(derived[year] - INFLATION_PUBLISHED[year])
  assert.ok(gap <= 0.15, `${year} : moyenne dérivée ${derived[year]} vs publiée ${INFLATION_PUBLISHED[year]} (écart ${gap.toFixed(2)})`)
}
const months = Object.keys(INFLATION_MONTHLY).sort()
const completeYears = [...new Set(months.map(m => m.slice(0, 4)))].filter(year => months.filter(m => m.startsWith(year)).length === 12)
for (const year of completeYears.slice(1)) assert.ok(Number.isFinite(INFLATION[year]), `Année complète sans inflation annuelle : ${year}`)
// A simulated January: the new complete year gets a derived value until INSEE publishes it.
const simulated = { ...INFLATION_MONTHLY }
const last = months.at(-1)
for (let month = Number(last.slice(5)) + 1; month <= 12; month++) simulated[`${last.slice(0, 4)}-${String(month).padStart(2, '0')}`] = 0.1
const extended = derivedAnnualInflation(simulated)
assert.ok(Number.isFinite(extended[last.slice(0, 4)]), 'L’année qui se termine reçoit une moyenne dérivée')
for (const year of years) assert.equal(extended[year], derived[year], 'Les années passées ne bougent pas')
console.log(`Inflation : ${years.length} moyennes annuelles dérivées cohérentes avec les chiffres INSEE publiés (écart ≤ 0,15 point).`)
