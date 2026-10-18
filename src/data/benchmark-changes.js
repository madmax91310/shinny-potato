import CHANGES from './benchmark-changes.json' with { type: 'json' }

export const BENCHMARK_CHANGES = CHANGES.shares

// First calendar year entirely under the current benchmark.
export function currentStrategyFirstYear(isin) {
  const change = BENCHMARK_CHANGES[isin]
  if (!change) return null
  const year = Number(change.effectiveDate.slice(0, 4))
  return change.effectiveDate.endsWith('-01-01') ? year : year + 1
}

// Calendar years of another strategy are never published as this share's performance.
export function withCurrentStrategyYears(isin, performance) {
  const first = currentStrategyFirstYear(isin)
  if (!first || !performance?.years) return performance
  const years = Object.fromEntries(Object.entries(performance.years).filter(([year]) => Number(year) >= first))
  const change = BENCHMARK_CHANGES[isin]
  return { ...performance, years, strategySince: change.effectiveDate,
    strategyNote: `Indice changé le ${change.effectiveDate.split('-').reverse().join('/')} (ancien : ${change.previousBenchmark}) ; seules les années complètes sous l’indice actuel sont publiées.` }
}
