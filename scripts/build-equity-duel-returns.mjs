import { writeFileSync } from 'node:fs'
import RECORDS from '../src/data/automated-monthly.json' with { type: 'json' }
import { ASSETS } from '../src/data/market-history.js'
import { COMPANY_HISTORY } from '../src/data/company-history.js'
import { PERFORMANCE_ART } from '../src/pages/tweet-midi/performanceArt.js'
import { annualEquityReturns } from './lib/equity-duel-returns.mjs'
const legacy = new Set(['apple','microsoft','broadcom','tesla','berkshire','asml', ...Object.keys(COMPANY_HISTORY)])
const items = []
for (const [id, record] of Object.entries(RECORDS)) {
  if (!(record.consumerScope === 'equity' || legacy.has(id))) continue
  const allReturns = annualEquityReturns(record)
  // Duels use at most the six latest full calendar years.
  const lastYear = Math.max(...Object.keys(allReturns).map(Number))
  const calendarReturns = Object.fromEntries(Object.entries(allReturns).filter(([year]) => Number(year) > lastYear - 6))
  const years = Object.keys(calendarReturns).map(Number).sort((a,b)=>a-b)
  if (!years.some(y => [y-2,y-1,y].every(year => Number.isFinite(calendarReturns[year])))) continue
  const art = PERFORMANCE_ART[id]
  if (!art) throw new Error(`Missing equity artwork: ${id}`)
  items.push({ id: `equity-${id}`, historyId: id, label: ASSETS[id].label,
    currency: record.currency, calendarReturns,
    values: Array.from({length:6},(_,i)=>calendarReturns[2020+i]??null),
    source: record.sourceUrls[0], checkedAt: record.checkedAt, art: {scene: art.scene || art.mark},
 })
}
items.sort((a,b)=>a.label.localeCompare(b.label,'fr'))
writeFileSync(new URL('../src/data/equity-duel-returns.json',import.meta.url),JSON.stringify(items,null,2)+'\n')
console.log(`Duel: ${items.length} actions automatisées compatibles EUR/USD.`)
