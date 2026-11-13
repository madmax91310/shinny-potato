import assert from 'node:assert/strict'
import {parseExpressReport} from '../src/pages/etf-flows/report.js'
// Dated ETF Express excerpt, 9 Nov 2026, week 45; not a production observation.
const excerpt=`European ETF Market Wrap | Week 45, 2026\nNovember 9, 2026\nHere’s a recap of European ETF activity between November 2 and November 6, from our data partners, Trackinsight.
According to Trackinsight data, Equity ETFs attracted €10.79 billion and Fixed Income ETFs attracted €1.68 billion. Commodity products recorded €767.7 million in net outflows, while cryptocurrency products saw €93.2 million in net outflows.
Financials Lead Sector ETF Inflows as Industrials Record Largest Outflow
Financials ETFs recorded the largest sector inflow at €421.7 million.
Consumer Staples (€214.4 million), Health Care (€202.4 million), and Information Technology (€108.7 million) also attracted inflows.
Industrials (€79.4 million), Real Estate (€61.1 million), and Consumer Discretionary (€9.9 million) recorded the largest sector outflows.
Materials Lead Sector Returns While Energy Records Largest Decline
Materials led weekly sector returns at +8.24%, followed by Financials at +3.01% and Consumer Discretionary at +2.77%.
US Leads Geographic Equity ETF Inflows While China Sees Largest Outflow
US exposures recorded the largest geographic inflow at €3.82 billion, followed by Developed markets at €2.53 billion and World at €2.18 billion.
Emerging markets (€918.1 million), Europe (€772.7 million), and India (€317.9 million) also attracted inflows.
On the outflow side, China (€164.9 million), Latin America (€57.3 million), and Developed Pacific (€53.0 million) recorded the largest withdrawals.`
const r=parseExpressReport(excerpt)
assert.deepEqual(r.warnings,[])
assert.equal(r.rows.length,20)
assert.equal(r.start,'2026-11-02');assert.equal(r.end,'2026-11-06')
assert.equal(r.rows.find(r=>r.label==='China').amount,-164900000)
assert.equal(r.rows.find(r=>r.label==='Financials').amount,421700000)
assert.equal(r.rows.find(r=>r.label==='cryptocurrency products').amount,-93200000)
assert.equal(r.rows.filter(r=>r.group==='geography').length,9)
assert(!r.rows.some(r=>r.label==='Materials'))
for(const text of ['China saw €2 million','Unknown ETFs attracted €2 million','China attracted €2 million but saw outflows of €1 million','YTD China attracted €2 million'])assert(parseExpressReport(text).warnings.length)
assert.equal(parseExpressReport('China attracted $2 million.\nEurope attracted €1 million.').currency,null)
assert.throws(()=>parseExpressReport('a'.repeat(50001)))
console.log('ETF Express report: dated full excerpt, 20 flows, signs, categories, performance exclusions and ambiguity passed.')

assert.equal(parseExpressReport('European ETF activity between November 2 and November 6.').start,'')
assert(parseExpressReport('China attracted €2 million.\nEurope saw €1 million.').warnings.length)
