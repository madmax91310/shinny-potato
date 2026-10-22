import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import {monthlyCalendarReturns} from './monthly-return-projection.mjs'
import {DISTINCT_ASSET_SELECTIONS} from '../src/data/distinct-asset-selections.js'
import {DEFAULT_THEMES} from '../src/data/etf-themes.js'
import {buildTweetText} from '../src/pages/etf-tweets/lib/tweetFormat.js'
import {buildSheet,buildTweet} from '../src/pages/practical-sheets/lib.js'
import {ETFS} from '../src/data/etf-cards.js'
import {references} from '../src/pages/dca-profiles/engine.js'
import {CATALOG} from '../src/data/duel-assets.js'
import {DUELS} from '../src/pages/portfolio-duels/data.js'
import {buildDuel} from '../src/pages/portfolio-duels/lib.js'
import {getDuelArt,DUEL_EXPOSURE_ART} from '../src/pages/portfolio-duels/visualIdentity.js'
import {ASSETS} from '../src/data/portfolio-assets.js'
import {computeYearlyPerf} from '../src/pages/portfolio-generator/performance.js'
import {getComparisonYears} from '../src/pages/tweet-midi/comparisonPerformance.js'
assert.deepEqual(Object.keys(DUEL_EXPOSURE_ART).sort(),[...new Set(CATALOG.map(a=>a.exposure))].sort())
for(const asset of CATALOG)assert(existsSync('public/asset-art/'+getDuelArt(asset).scene),`Duel illustration missing: ${asset.id}`)
const read=p=>JSON.parse(readFileSync(p))
const sources=[...read('scripts/monthly-automation.json').series,...read('scripts/non-bond-monthly-sources.json').series]
assert.deepEqual(getComparisonYears(['IE00BF4RFH31','UNKNOWN']),[],'A missing fund must not be dropped from the common period')
for(const selection of DISTINCT_ASSET_SELECTIONS) {
 const theme=DEFAULT_THEMES.find(t=>t.id===selection.id)
 assert(theme,selection.id)
 const tweet=buildTweetText(theme),sheet=buildSheet(selection.id),practical=buildTweet(sheet)
 assert(!sheet.blocked,selection.id)
 assert(practical.includes(selection.cloture),selection.id)
 for(const isin of selection.funds) {
  assert(ETFS.some(e=>e.isin===isin)||isin==='GB00B15KXQ89',`Presentation ${isin}`)
  assert(Object.values(references).some(a=>a.isin===isin),`DCA ${isin}`)
  assert(tweet.includes(isin)&&practical.includes(isin),isin)
 }
 assert(!/undefined|NaN/.test(tweet+practical) && !/non renseign|à confirmer/i.test(tweet+practical),selection.id)
}
// A gap, a partial first year or an unfinished year must never become a return.
const points=[['2023-12',100],...Array.from({length:12},(_,i)=>[`2024-${String(i+1).padStart(2,'0')}`,101+i])]
assert(Math.abs(monthlyCalendarReturns({currency:'EUR',field:'adjclose',points},new Date('2025-01-01'))[2024]-12)<1e-9)
assert.deepEqual(monthlyCalendarReturns({currency:'EUR',field:'adjclose',points},new Date('2024-12-31')), {})
assert.deepEqual(monthlyCalendarReturns({currency:'EUR',field:'adjclose',points:points.slice(1)},new Date('2025-01-01')), {})
assert.deepEqual(monthlyCalendarReturns({currency:'EUR',field:'adjclose',points:points.filter(([m])=>m!=='2024-06')},new Date('2025-01-01')), {})
const changed=points.map(([m,p])=>[m,m==='2024-12'?120:p])
assert(Math.abs(monthlyCalendarReturns({currency:'EUR',field:'adjclose',points:changed},new Date('2025-01-01'))[2024]-20)<1e-9)

for(const id of ['world-cloud-robotics','world-copper-miners']) {
 const d=buildDuel(DUELS.find(d=>d.id===id))
 assert(d.years.length>=3)
 assert(Number.isFinite(d.a.final)&&Number.isFinite(d.b.final))
 for(const a of [...d.a.assets,...d.b.assets])assert(existsSync('public/asset-art/'+getDuelArt(a).scene))
}
const miners=ASSETS.find(a=>a.isin==='IE0003Z9E2Y3')
assert(miners)
assert.equal(miners.manualOnly,Object.keys(miners.calendarReturns).filter(y=>Number(y)>=2020).length<6)
const world=ASSETS.find(a=>a.id==='msci_world_ishares')
const perf=computeYearlyPerf([{...world,pct:90},{...miners,pct:10}])
assert(Object.keys(perf).length>=3&&Object.values(perf).every(Number.isFinite))
const projected=read('src/data/monthly-duel-returns.json')
const records={...read('src/data/automated-etf-monthly.json'),...read('src/data/non-bond-monthly-records.json')}
for(const [isin,p] of Object.entries(projected)) {
 const r=Object.values(records).find(r=>r.isin===isin&&r.consumerScope==='catalog'&&r.currency===p.currency)
 assert(r && sources.some(s=>s.id===r.id||s.isin===isin),isin)
 assert.deepEqual(p.years,monthlyCalendarReturns(r),isin)
}
for(const isin of ['IE000L2SA8K5','IE0003R87OG3','IE0008UEVOE0','IE000SNLFDR7','IE0007Y8Y157'])
 if((Object.values(projected[isin]?.years ?? {}).filter(Number.isFinite).length ?? 0)<3) assert(!CATALOG.some(a=>a.isin===isin),'Short history must stay out of duels: '+isin)
console.log(`${DISTINCT_ASSET_SELECTIONS.length} selections: exact identities, automatic sources, shared years, gap rejection, manual portfolios and 2 duels verified.`)
