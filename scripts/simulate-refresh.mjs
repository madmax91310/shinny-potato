#!/usr/bin/env node
// Refresh rehearsal: simulates future routine collections in a throwaway checkout,
// so that a check frozen on today's data is caught before the real data arrives.
// Appends synthetic month-end closes (+0.5 %/month) to every automated monthly series,
// with their proof rows and collection date, and the matching ECB monthly rates
// unless the scenario simulates an ECB outage. Never run it on a branch you commit.
//
// Usage: node scripts/simulate-refresh.mjs --scenario next-month|ecb-outage|year-rollover [--repo <dir>]
//        node scripts/simulate-refresh.mjs --until YYYY-MM [--fx] [--repo <dir>]
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const nextMonth = ym => { let [y, m] = ym.split('-').map(Number); m++; if (m > 12) { m = 1; y++ } return `${y}-${String(m).padStart(2, '0')}` }
export const monthEnd = ym => { const [y, m] = ym.split('-').map(Number); return `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}` }

export function scenarioTarget(scenario, latest) {
  if (scenario === 'next-month') return { until: nextMonth(latest), fx: true }
  if (scenario === 'ecb-outage') return { until: nextMonth(latest), fx: false }
  if (scenario === 'year-rollover') return { until: `${Number(latest.slice(0, 4)) + 1}-01`, fx: true }
  throw new Error(`Unknown scenario: ${scenario}`)
}

export function simulate(repo, until, withFx) {
  const file = rel => path.join(repo, rel)
  const read = rel => JSON.parse(readFileSync(file(rel), 'utf8'))
  const write = (rel, data) => writeFileSync(file(rel), JSON.stringify(data, null, 2) + '\n')
  const checkedAt = `${nextMonth(until)}-03`
  const records = read('src/data/automated-monthly.json')
  const evidence = read('scripts/source-snapshots/monthly-automated.json')
  let added = 0
  for (const [id, record] of Object.entries(records)) {
    const proof = evidence[id]
    if (!record.points?.length || !proof) continue
    const digits = record.precision ?? 2
    let [ym] = record.points.at(-1)
    let value = proof.proofRows.at(-1).value
    while (ym < until) {
      ym = nextMonth(ym); value *= 1.005
      const price = Math.round(value * 10 ** digits) / 10 ** digits
      record.points.push([ym, price])
      if (record.anniversaryPoints?.length) record.anniversaryPoints.push([ym, price])
      const template = proof.proofRows.at(-1)
      const row = { ...template, date: monthEnd(ym), value }
      for (const key of ['close', 'monthlyClose', 'monthlyValue']) if (key in template) row[key] = value
      proof.proofRows.push(row)
      added++
    }
    record.periodEnd = proof.periodEnd = ym
    record.checkedAt = proof.checkedAt = checkedAt
  }
  write('src/data/automated-monthly.json', records)
  write('scripts/source-snapshots/monthly-automated.json', evidence)
  let fxAdded = 0
  if (withFx) {
    const fx = read('src/data/monthly-fx.json')
    let last = Object.keys(fx.months).sort().at(-1)
    while (last < until) {
      const previous = fx.months[last]
      last = nextMonth(last)
      fx.months[last] = { ...previous, asOf: monthEnd(last), rates: { ...previous.rates } }
      fxAdded++
    }
    fx.checkedAt = checkedAt
    write('src/data/monthly-fx.json', fx)
  }
  return { added, fxAdded, checkedAt }
}

export function latestMonth(repo) {
  const records = JSON.parse(readFileSync(path.join(repo, 'src/data/automated-monthly.json'), 'utf8'))
  return Object.values(records).map(r => r.points?.at(-1)?.[0]).filter(Boolean).sort().at(-1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
  const repo = option('--repo') ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const scenario = option('--scenario')
  const target = scenario ? scenarioTarget(scenario, latestMonth(repo)) : { until: option('--until'), fx: args.includes('--fx') }
  if (!/^\d{4}-\d{2}$/.test(target.until ?? '')) throw new Error('Missing --scenario or --until YYYY-MM')
  const result = simulate(repo, target.until, target.fx)
  console.log(`${scenario ?? 'custom'}: ${result.added} monthly closes and ${result.fxAdded} ECB months added up to ${target.until} (collected ${result.checkedAt}).`)
}
