import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {RANKING_ASSETS} from '../src/pages/performance-rankings/data.js'
import {periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import {derive} from '../src/pages/investment-calculator/lib.js'
import {ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const id='etcPalladiumMarket',market=ASSETS[id],nav=ASSETS.etcPalladium
assert(ASSET_ORDER.includes(id)&&RANKING_ASSETS[id])
assert.equal(market.isin,nav.isin);assert.equal(market.isin,'IE00B4556L06')
assert.equal(market.currency,'USD');assert.equal(market.mic,'XLON');assert.equal(market.ticker,'IPDM')
assert.notEqual(market.label,nav.label);assert.equal(market.priceMethod,'adjusted');assert.equal(nav.historyConvention,'fund-nav-total-return')
assert(qualifyHistoryWindow(market,'2014-11','2015-01').qualified,'The separately qualified market route restores this earlier monthly comparison')
assert.equal(qualifyHistoryWindow(nav,'2014-11','2015-01').code,'issuer-components-unreconciled','Original disputed NAV is not overwritten or requalified')
for(const a of [market,convertAsset(RANKING_ASSETS[id],'EUR',FX)]){
 assert.equal(qualifyHistoryWindow(a,'2024-12','2025-12').code,'financial-window-unconfirmed','A new ID or EUR conversion cannot bypass the existing IPDM.L2025 restriction')
 assert.throws(()=>periodReturn(a,'2024-12','2025-12'),/non résolu/)
}
assert(qualifyHistoryWindow(nav,'2024-12','2025-12').qualified,'The independently qualified NAV2025 remains usable')
assert.throws(()=>derive({assetId:id,startYear:2014,startMonth:12,amountRaw:'100',mode:'lump',currency:'USD',overridePriceRaw:''}),/non résolu/,'Do not advertise a current long investment path across the refused2025return')
assert(!qualifyHistoryWindow(market,'2011-04','2011-05').qualified,'Partial listing month is never invented')
assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===id),'No unsupported anniversary variant or daily obligation added')
const fixture=JSON.parse(gunzipSync(readFileSync('scripts/fixtures/palladium-london-market-20261110/collected.json.gz')))
const raw=fixture.rawResponse['1d'].chart.result[0],ends={}
for(let i=0;i<raw.timestamp.length;i++){
 const month=new Date(raw.timestamp[i]*1000).toISOString().slice(0,7),price=raw.indicators.adjclose[0].adjclose[i]
 if(price!=null)ends[month]=price
}
assert.equal(market.points.find(p=>p.date==='2014-12').price,23.799999)
const observed=periodReturn(RANKING_ASSETS[id],'2014-11','2015-01'),daily=(ends['2015-01']/ends['2014-11']-1)*100
assert(Math.abs(observed-daily)<.00001,'Consumer return reconciles to the actual raw daily endpoints, within six-decimal storage precision')
console.log('Palladium: earlier quoted monthly comparisons restored; NAV2014 and market2025 refusals, NAV2025, dates, currency conversion and unsupported anniversary scope preserved.')
