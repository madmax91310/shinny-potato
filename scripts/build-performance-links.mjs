import { writeFile } from 'node:fs/promises'
import { ASSETS, ASSET_ORDER, SPARSE_MONTHLY_DATA_IDS, INCONSISTENT_MONTHLY_DATA_IDS, getAssetMinDate } from '../src/data/market-history.js'
import { ASSETS as PERFORMANCE_ASSETS, MARKET_ASSETS, getAnnualReturnStartYears } from '../src/pages/tweet-midi/data/performanceHistory.js'
import { getAnnualReturnStartYears as getMonthlyAnnualYears } from '../src/pages/tweet-midi/data/marketHistory.js'

// Only exact ETF share classes with usable annual histories. This small index
// keeps the presentation route from importing monthly prices or the tweet engine.
const links = {}
for (const asset of MARKET_ASSETS) {
  const id = asset.id
  if (!asset.isin || !getAnnualReturnStartYears(id).length) continue
  const previous=links[asset.isin]
  if(previous) {
    const a=PERFORMANCE_ASSETS[previous],b=PERFORMANCE_ASSETS[id]
    const exactHistory=r=>r?.currency&&((r.ticker&&r.mic)||((r.valuationBasis==='fund-nav-total-return'||r.frequency==='annual'&&r.basis==='fund-nav')&&r.isin===asset.isin&&r.sourceUrls?.some(url=>url.startsWith('https://'))))
    if(![a,b].every(exactHistory))throw new Error(`Ambiguous performance history: ${asset.isin}`)
    // Same exact share, explicitly labelled listings. Prefer the most qualified
    // annual windows; never splice prices or replace one currency's series.
    const score=key=>getAnnualReturnStartYears(key).length
    if(score(previous)>score(id)||(score(previous)===score(id)&&previous.localeCompare(id)<0))continue
  }
  links[asset.isin] = id
}
await writeFile(new URL('../src/data/performance-links.json', import.meta.url), `${JSON.stringify(links, null, 2)}\n`)
console.log(`Performance shortcuts: ${Object.keys(links).length} exact share classes.`)

// IDs only: both routes already use the same market-history module. Reject
// sparse or inconsistent monthly histories rather than suggesting a simulation.
const monthIndex = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5))
const simulationIds = ASSET_ORDER.filter(id => {
  if (!getMonthlyAnnualYears(id).length || SPARSE_MONTHLY_DATA_IDS.has(id) || INCONSISTENT_MONTHLY_DATA_IDS.has(id)) return false
  const points = ASSETS[id].points.filter(point => point.date >= getAssetMinDate(id))
  return points.length > 12 && points.every((point, i) => Number.isFinite(point.price) && point.price > 0
    && (i === 0 || monthIndex(point.date) - monthIndex(points[i - 1].date) === 1))
})
await writeFile(new URL('../src/data/simulation-links.json', import.meta.url), `${JSON.stringify(simulationIds, null, 2)}\n`)
console.log(`Simulation shortcuts: ${simulationIds.length} shared, consistent histories.`)
