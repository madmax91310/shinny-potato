import assert from 'node:assert/strict'
import {TOPICS,FUND_GROUPS} from '../src/data/practical-sheet-topics.js'
import {buildSheet,buildTweet,calculateScenario} from '../src/pages/practical-sheets/lib.js'
import {getInstrumentPeaStatus} from '../src/data/instruments.js'
import {REGULATORY} from '../src/data/regulatory-data.js'
import refs from '../src/data/automated-practical-sheets.json' with {type:'json'}
assert.equal(new Set(TOPICS.map(t=>t.id)).size,44)
for(const topic of TOPICS) {
 const sheet=buildSheet(topic.id),tweet=buildTweet(sheet)
 assert(sheet.rows.length>0,topic.id)
 assert(sheet.rows.every(row=>row.length===sheet.columns.length+1),topic.id)
 assert(!/undefined|NaN/.test(tweet),topic.id)
 assert(tweet.startsWith('🔖 Sauvegarde ce tweet'))
 assert(sheet.sources.length>0,topic.id)
 assert(sheet.sources.every(s=>s.url?.startsWith('https://') && s.checkedAt),topic.id)
}
for(const isins of Object.values(FUND_GROUPS)) for(const isin of isins) assert.equal(getInstrumentPeaStatus(isin),true,isin)
assert.throws(()=>buildSheet('world-pea',{isins:['FR001400U5Q4']}))
assert.throws(()=>buildSheet('world-pea',{isins:['FR001400U5Q4','FR001400U5Q4']}))
assert.throws(()=>buildSheet('world-pea',{isins:['FR001400U5Q4','UNKNOWN']}))
assert(buildSheet('europe-pea').notes.some(n=>n.includes('indices diffèrent')))
assert(buildSheet('pea-cto').rows.flat().some(v=>String(v).includes(String(REGULATORY.ctoTotal).replace('.',','))))
const zero=calculateScenario('fees',{feeA:0,feeB:0});assert.equal(zero.a,zero.b)
const cost=calculateScenario('fees',{capital:10000,years:10,returnRate:0,feeA:0,feeB:1});assert.equal(cost.a,10000);assert(Math.abs(cost.b-10000*0.99**10)<1e-8)
assert.equal(calculateScenario('switch',{capital:10000,feeA:.2,feeB:1,tradeCost:30}).payback,.375)
assert.equal(calculateScenario('switch',{feeA:1,feeB:.2}).payback,null)
assert.equal(calculateScenario('delay',{years:5,delay:5}).b,10000)
assert.doesNotThrow(()=>calculateScenario('fees',{years:2}))
assert.doesNotThrow(()=>calculateScenario('switch',{years:NaN,returnRate:NaN,delay:NaN}))
assert.doesNotThrow(()=>calculateScenario('delay',{feeB:NaN}))
assert.throws(()=>calculateScenario('delay',{years:2,delay:5}))
assert.throws(()=>calculateScenario('fees',{capital:NaN}))
assert.throws(()=>calculateScenario('fees',{feeA:-1}))
const gold=buildSheet('gold-av-cto',{contractId:'linxea-spirit-2'});assert(gold.rows[0][1].includes('FR0013416716'));assert(gold.rows[2][1].includes(String(refs.sources['gold-contract'].transactionPct).replace('.',',')))
assert(!buildSheet('gold-av-cto',{contractId:'linxea-avenir-2'}).rows[0][1].includes('FR0013416716'))
const ref=refs.sources.etf,old={...ref}
try {ref.reviewRequired=true;assert(buildSheet('world-pea').blocked);ref.reviewRequired=false;ref.status='error';assert(buildSheet('world-pea').warnings.length);assert(!buildSheet('world-pea').blocked);delete ref.checkedAt;assert(buildSheet('world-pea').blocked)} finally {Object.assign(ref,old)}
console.log('44 fiches : sources, dimensions, PEA, fiscalité partagée, calculs, contrats et réserves validés.')
