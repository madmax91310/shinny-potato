import assert from 'node:assert/strict'
import {annualProjection} from './project-selected-data.mjs'
import {ASSETS} from '../src/data/market-history.js'
import {getAnnualReturnStartYears,getAnnualReturns,performanceBasis} from '../src/pages/tweet-midi/data/marketHistory.js'
import {derive} from '../src/pages/investment-calculator/lib.js'
const p=annualProjection()
for(const [id,asset] of Object.entries(ASSETS)){
 assert.deepEqual(p.years[id],getAnnualReturnStartYears(id))
 assert.equal(p.basis[id],performanceBasis(id))
 assert.equal(p.assets[id].isin,asset.isin)
 assert.equal(p.assets[id].points,undefined)
 for(const year of p.years[id]){
  const rows=[];for(let y=year;y<p.latestYear;y++){if(!p.returns[id][y])break;rows.push(p.returns[id][y])}
  assert.deepEqual(rows,getAnnualReturns(id,year))
 }
}
const result=derive({assetId:'apple',startYear:2020,startMonth:1,amountRaw:'1000',mode:'lump',overridePriceRaw:''})
assert(Number.isFinite(result.result.finalValue))
console.log(`Selected data: ${Object.keys(ASSETS).length} identities, every annual window and original calculator preserved.`)
