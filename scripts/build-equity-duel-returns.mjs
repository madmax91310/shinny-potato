import { writeFileSync } from 'node:fs'
import RECORDS from '../src/data/automated-monthly.json' with { type: 'json' }
import { ASSETS } from '../src/data/market-history.js'
import { COMPANY_HISTORY } from '../src/data/company-history.js'
import { PERFORMANCE_ART } from '../src/pages/tweet-midi/performanceArt.js'
import { annualEquityReturns } from './lib/equity-duel-returns.mjs'
import MONTHLY_FX from '../src/data/monthly-fx.json' with { type: 'json' }
import GLOBAL from '../src/data/global-equities.json' with { type: 'json' }
import { fxRate } from '../src/lib/fx-rate.js'
// One build-derived year-end view of the ECB collector, shared by publication tools.
const fx = Object.fromEntries(Object.entries(MONTHLY_FX.months).filter(([month]) => month.endsWith('-12')).map(([month, row]) => [month.slice(0, 4), row]))
function inEuros(value, year, currency) {
  if (currency === 'EUR') return value
  const start = fxRate(fx[year-1]?.rates, currency), end = fxRate(fx[year]?.rates, currency)
  return start && end ? ((1 + value / 100) * start / end - 1) * 100 : null
}
const legacy = new Set(['apple','microsoft','broadcom','tesla','berkshire','asml', ...Object.keys(COMPANY_HISTORY)])
const items = []
for (const [id, record] of Object.entries(RECORDS)) {
  if (!(record.consumerScope === 'equity' || legacy.has(id) || GLOBAL.some(a => a.id === id))) continue
  const allReturns = annualEquityReturns(record)
  // Duels use at most the six latest full calendar years.
  const lastYear = Math.max(...Object.keys(allReturns).map(Number))
  const calendarReturns = Object.fromEntries(Object.entries(allReturns).filter(([year]) => Number(year) > lastYear - 6))
  const euroCalendarReturns = Object.fromEntries(Object.entries(calendarReturns).flatMap(([year, value]) => {
    const eur = inEuros(value, Number(year), record.currency)
    return Number.isFinite(eur) ? [[year, eur]] : []
  }))
  const years = Object.keys(calendarReturns).map(Number).sort((a,b)=>a-b)
  if (!years.some(y => [y-2,y-1,y].every(year => Number.isFinite(calendarReturns[year])))) continue
  if (!years.some(y => [y-2,y-1,y].every(year => Number.isFinite(euroCalendarReturns[year])))) continue
  const art = PERFORMANCE_ART[id]
  if (!art) throw new Error(`Missing equity artwork: ${id}`)
  items.push({ id: `equity-${id}`, historyId: id, label: ASSETS[id].label, isin: ASSETS[id].isin,
    currency: record.currency, calendarReturns, euroCalendarReturns,
    fxSource: record.currency === 'EUR' ? null : MONTHLY_FX.sourceUrl,
    values: Array.from({length:6},(_,i)=>calendarReturns[2020+i]??null),
    source: record.sourceUrls[0], checkedAt: record.checkedAt, art: {scene: art.scene || art.mark},
 })
}
items.sort((a,b)=>a.label.localeCompare(b.label,'fr'))
writeFileSync(new URL('../src/data/equity-duel-returns.json',import.meta.url),JSON.stringify(items,null,2)+'\n')
console.log(`Duel: ${items.length} actions automatisées, années communes et change BCE contrôlés.`)
