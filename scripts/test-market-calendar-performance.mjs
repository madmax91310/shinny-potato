import assert from 'node:assert/strict'
import { marketCalendarPerformance } from '../src/data/market-calendar-performance.js'
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js'
import { annualPerformanceInCurrency } from '../src/data/annual-performance-currency.js'
import { formatTweetPerformance, performanceImageHeading } from '../src/pages/etf-sheets/annualPerformance.js'
import {AUTOMATED_ETF as official} from '../src/data/automated-etf.js'
import {monthlyCalendarReturns} from './monthly-return-projection.mjs'

const isin='IE00BM8R0J59', now=new Date('2026-10-21')
const record={isin,basis:'market-price',currency:'EUR',checkedAt:'2026-10-20',
 listingEvidenceId:isin+'-XETR-QYLE-EUR',
 sourceUrls:['https://example.com/qualified-prices'],responseSha256:'a'.repeat(64),years:{2024:20,2025:10,2026:30}}
const series=marketCalendarPerformance(isin,{[isin]:record},now)
assert.equal(series.years[2026],undefined,'Unfinished year must never be published')
assert.equal(series.values.at(-1),10)
assert.equal(series.sourceKind,'adjusted-market-price')
assert.equal(marketCalendarPerformance(isin,{[isin]:{...record,isin:'WRONG'}},now),null)
assert.equal(marketCalendarPerformance(isin,{[isin]:{...record,responseSha256:null}},now),null)
assert.equal(marketCalendarPerformance(isin,{[isin]:{...record,basis:'proxy'}},now),null)
assert.equal(marketCalendarPerformance(isin,{[isin]:{...record,checkedAt:'2026-10-22'}},now),null)
assert.equal(marketCalendarPerformance(isin,{[isin]:{...record,listingEvidenceId:'WRONG'}},now),null)
assert.equal(marketCalendarPerformance(isin,{[isin]:{...record,years:{2026:30}}},now),null)
const converted=annualPerformanceInCurrency(series,'USD')
for(const [index,year]of series.calendarYears.entries())if(Number.isFinite(converted.values[index]))assert.equal(converted.years[year],converted.values[index])
assert.match(formatTweetPerformance(series),/cours ajustés, distributions réinvesties/)
assert.match(performanceImageHeading(series),/Cours ajustés/)
for(const id of ['IE00BLCHJB90','IE000NDWFGA5','IE00BMH5Y871','IE000UL6CLP7','IE0003R87OG3','IE0003Z9E2Y3',isin]) {
 const p=getInstrumentAnnualPerformance(id)
 const published=Object.entries(official[id]?.performance?.years??{}).some(([year,value])=>Number(year)<new Date().getUTCFullYear()&&Number.isFinite(value))
 assert.equal(p.sourceKind==='adjusted-market-price',!published,id)
 assert(p.values.some(Number.isFinite),id)
 assert(p.calendarYears.every(y=>y<new Date().getUTCFullYear()),id)
}
assert.notEqual(getInstrumentAnnualPerformance('IE00B4L5Y983').sourceKind,'adjusted-market-price','Published NAV calendar retains precedence')
const points=[['2024-12',100],...Array.from({length:12},(_,i)=>[`2025-${String(i+1).padStart(2,'0')}`,101+i])]
assert(Math.abs(monthlyCalendarReturns({points},now)[2025]-12)<1e-9)
for(const invalid of [[...points,points.at(-1)],[...points].reverse(),points.map((p,i)=>i===3?[p[0],NaN]:p),points.map((p,i)=>i===3?['2025-13',p[1]]:p)])assert.deepEqual(monthlyCalendarReturns({points:invalid},now),{})
console.log('Calculated share calendars: exact identity, completed years, source proof, currency, NAV precedence and publication labels verified.')
