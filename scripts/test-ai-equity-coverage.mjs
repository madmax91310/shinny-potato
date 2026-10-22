// Exercise the real financial engine with EVERY price-qualified selectable listing.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {hydrateMarketSeries} from './ai-series-store.mjs'
import {admission,coverage,quoteAt,planDecision,emptyPortfolio} from '../src/pages/ai-portfolios/lib.js'
import {STOCK_REGIONS,marketRegion} from '../src/pages/ai-portfolios/data.js'
const market=JSON.parse(fs.readFileSync('data/ai-portfolios/market.json'))
const selected=JSON.parse(fs.readFileSync('data/ai-portfolios/selectable-equities.json'))
const equities=market.universe.filter(a=>a.status==='qualified'&&!a.selectionBlock&&a.instrumentType==='EQUITY'&&!a.leveraged&&STOCK_REGIONS.includes(marketRegion(a))&&['ordinary','depositary-receipt','REIT','legacy-equity'].includes(a.shareType??'legacy-equity'))
assert.equal(new Set(equities.map(a=>a.instrumentId)).size,selected.instrumentCount)
assert.equal(equities.length,selected.qualifiedListingCount)
const assetExport=JSON.parse(fs.readFileSync('data/ai-portfolios/selectable-assets.json')),byId=new Map(market.universe.map(a=>[a.id,a]))
const listings=assetExport.listings.map(r=>byId.get(r.id));assert(listings.every(Boolean))
assert.equal(listings.length,assetExport.listingCount)
assert.equal(new Set(listings.map(a=>a.instrumentId)).size,assetExport.instrumentCount)
hydrateMarketSeries(market,process.cwd(),listings.map(a=>a.id))
const config={initialCapital:10000,currency:'EUR',assetTypes:['EQUITY','ETF','CRYPTOCURRENCY','ETC','ETN','ETP'],admissionPolicy:'instrument-types-v2',stockRegions:STOCK_REGIONS,requireUcits:true,minLines:1,maxLines:1,maxWeight:100,feeBps:0}
const currencies=new Set(),markets=new Set()
for(const a of listings){
 const one={...market,universe:[a]}
 assert(admission(a,config).ok,a.id)
 const series=market.series[a.id]
 assert.equal(a.observedSourceCurrency,series.sourceCurrency,`${a.id}: certified source unit`)
 assert.equal(a.priceScale??1,series.priceScale??1,`${a.id}: pence / currency normalization survived persistence`)
 const asOf=a.coverageThrough
 assert(asOf&&asOf<=market.asOf,`${a.id}: invalid certified cutoff`)
 const state=coverage(a.id,one,asOf)
 assert(state.ok,`${a.id}: ${state.reason}`)
 const price=quoteAt(a.id,asOf,'EUR',one).price
 assert(Number.isFinite(price)&&price>0,a.id)
 // Fractional synthetic purchase, valuation and complete liquidation at the same close.
 const cost=123.45
 const buy=planDecision(emptyPortfolio(config),{kind:'trades',amounts:{[a.id]:cost}},asOf,config,one)
 assert(Math.abs(buy.portfolio.positions[a.id]-cost/price)<1e-9,a.id)
 assert(Math.abs(buy.after.value-10000)<1e-7,a.id)
 const sell=planDecision(buy.portfolio,{kind:'trades',amounts:{[a.id]:-cost}},asOf,config,one)
 assert(Math.abs(sell.after.value-10000)<1e-7,a.id)
 assert.equal(sell.after.positions.length,0,a.id)
 currencies.add(a.currency);markets.add(a.mic)
}
console.log(`${selected.instrumentCount} distinct selectable equity instruments; ${assetExport.instrumentCount} instruments / ${listings.length} listings including ETFs, spot crypto and commodity products: all actual histories, EUR valuations, fractional purchases and liquidations validated across ${markets.size} MICs and ${currencies.size} currencies.`)
