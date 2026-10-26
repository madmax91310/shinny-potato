import { INFLATION_MONTHLY } from '../data/inflation-monthly.js'

// Annual average reconstructed from the same monthly INSEE variations in Node and Vite.
export function derivedAnnualInflation(monthly = INFLATION_MONTHLY) {
  const months = Object.keys(monthly).sort()
  let level = 100
  const levels = Object.fromEntries(months.map(month => [month, level *= 1 + monthly[month] / 100]))
  const average = year => { const values = months.filter(month => month.startsWith(year)).map(month => levels[month]); return values.length === 12 ? values.reduce((a, b) => a + b, 0) / 12 : null }
  const result = {}
  for (const year of new Set(months.map(month => month.slice(0, 4)))) {
    const current = average(year), previous = average(String(Number(year) - 1))
    if (current && previous) result[year] = Math.round((current / previous - 1) * 1000) / 10
  }
  return result
}
