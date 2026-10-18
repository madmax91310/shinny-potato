import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { EQUITY_HISTORY_IDENTITIES } from '../src/data/equity-history-identities.js'
import { PERFORMANCE_ART } from '../src/pages/tweet-midi/performanceArt.js'
import { ANNIVERSARY_ART } from '../src/pages/tweet-midi/anniversaryArt.js'
import { NEON_ASSET_ART } from '../src/pages/tweet-midi/stylizedArt.js'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { MARKET_ASSETS, ANNIVERSAIRE_ELIGIBLE_ASSETS, getHistoricalPrice } from '../src/pages/tweet-midi/data/marketHistory.js'
import { derive, currencySymbol } from '../src/pages/investment-calculator/lib.js'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
const configs=JSON.parse(readFileSync('scripts/monthly-automation.json')).series.filter(s=>s.consumerScope==='equity')
const records=JSON.parse(readFileSync('src/data/automated-monthly.json'))
const levels=JSON.parse(readFileSync('src/data/anniversary-levels.json'))
assert(configs.length >= 89)
assert.equal(new Set(ASSET_ORDER).size,ASSET_ORDER.length)
for (const config of configs) {
  const {id}=config, record=records[id]
  assert(record,`${id}: initial collection must pass before release`)
  assert(EQUITY_HISTORY_IDENTITIES[id] && ANNIVERSARY_ART[id])
  assert(existsSync(`public/asset-art/${PERFORMANCE_ART[id].scene}`))
  assert(existsSync(`public/asset-art/${NEON_ASSET_ART[id].sceneFile}`))
  const asset=ASSETS[id]
  assert.equal(asset.currency,config.currency)
  assert.equal(asset.priceMethod,'adjusted')
  assert(ASSET_ORDER.includes(id) && MARKET_ASSETS.some(a=>a.id===id) && ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===id))
  const start=asset.points[0], end=asset.points.at(-1)
  const result=derive({assetId:id,amountRaw:'1000',mode:'lump',startYear:+start.date.slice(0,4),startMonth:+start.date.slice(5),overridePriceRaw:''})
  assert(Math.abs(result.result.finalValue-1000*end.price/start.price)<1e-6)
  const dca=derive({assetId:id,amountRaw:'100',mode:'dca',startYear:+start.date.slice(0,4),startMonth:+start.date.slice(5),overridePriceRaw:''})
  assert(Math.abs(dca.result.finalValue-asset.points.reduce((n,p)=>n+100/p.price,0)*end.price)<1e-6)
  assert.equal(getHistoricalPrice(id,end.date),record.anniversaryPoints.at(-1)[1])
  assert(levels[id], `${id}: automatic dated quote collected`)
  assert(resolveAnniversaryLevel(id,'',new Date(`${levels[id].asOf}T23:00:00Z`)),`${id}: automatic dated anniversary quote`)
}
assert.equal(currencySymbol('KRW'),'₩')
assert.equal(currencySymbol('EUR'),'€')
assert.equal(currencySymbol('USD'),'$')
for(const [code,symbol] of Object.entries({CHF:'CHF',DKK:'kr',JPY:'¥',HKD:'$',NOK:'kr',SEK:'kr',CAD:'$',AUD:'$',TWD:'NT$'})) assert.equal(currencySymbol(code),symbol)
console.log(`${configs.length} equities: automatic records, 3 consumers, lump sum/DCA, raw anniversary prices and currencies validated.`)
const { compactHistory }=await import('./compact-history.mjs')
for(const records of [ASSETS,{test:{points:[{date:'2025-01',price:1},{date:'2025-03',price:2}]}}]) {
  const decoded=(await import('data:text/javascript;base64,'+Buffer.from(compactHistory(records)).toString('base64'))).default
  assert.deepEqual(decoded,JSON.parse(JSON.stringify(records)))
}
console.log('Compressed browser history is lossless, including sparse dates.')
