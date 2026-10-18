import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BENCHMARK_CHANGES, currentStrategyFirstYear, withCurrentStrategyYears } from '../src/data/benchmark-changes.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js'

const ranking = JSON.parse(readFileSync(new URL('../src/data/ranking-annual.json', import.meta.url)))
const flat = value => (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
for (const [isin, change] of Object.entries(BENCHMARK_CHANGES)) {
  assert.match(change.effectiveDate, /^\d{4}-\d{2}-\d{2}$/, `${isin}: effective date`)
  assert(change.sourceUrl?.startsWith('https://') && change.corroborationUrl?.startsWith('https://'), `${isin}: two sources`)
  const first = currentStrategyFirstYear(isin)
  // The registry describes the benchmark the collector reads today.
  const collected = AUTOMATED_ETF[isin]?.characteristics?.index
  if (collected) assert.equal(flat(collected), flat(change.currentBenchmark), `${isin}: current benchmark differs from the collected one`)
  // No consumer may publish a calendar year of the previous strategy.
  for (const [label, record] of [['AUTOMATED_ETF', AUTOMATED_ETF[isin]?.performance], ['instrument returns', getInstrumentAnnualPerformance(isin)], ['ranking', ranking[`annual-${isin}`]]]) {
    if (!record) continue
    const years = record.years ? Object.keys(record.years) : (record.calendarYears ?? []).filter((y, i) => Number.isFinite(record.values[i]))
    assert(years.every(year => Number(year) >= first), `${isin} ${label}: year before ${first} published`)
  }
}
const sample = withCurrentStrategyYears('FR0013346681', { years: { 2022: -18.98, 2024: 2.31, 2025: 2.26 } })
assert.deepEqual(sample.years, { 2025: 2.26 })
assert.equal(withCurrentStrategyYears('IE00B4L5Y983', { years: { 2022: -1 } }).years[2022], -1)
console.log(`Benchmark changes: ${Object.keys(BENCHMARK_CHANGES).length} share(s); previous-strategy years never published.`)
