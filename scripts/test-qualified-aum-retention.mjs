import assert from 'node:assert/strict'
import fs from 'node:fs'
import {newerCompatibleAum} from '../src/data/aum-observations.js'
import {AUTOMATED_ETF,AUTOMATED_AUM} from '../src/data/automated-etf.js'
import base from '../src/data/automated-etf.json' with {type:'json'}
import qualified from '../src/data/qualified-exposure-etfs.json' with {type:'json'}
const pairs=JSON.parse(fs.readFileSync('scripts/fixtures/qualified-aum-retention.json')).pairs
assert.equal(pairs.length,12)
for(const{preferred:a,candidate:b}of pairs){
 assert.equal(newerCompatibleAum(a,b),b);assert.equal(newerCompatibleAum(b,a),b)
 for(const x of [{...a,amount:a.amount*2,checkedAt:'2026-10-27'},{...b,scope:'fund'},{...b,currency:'EUR'}])assert.equal(newerCompatibleAum(a,x),a)
 assert.equal(newerCompatibleAum(newerCompatibleAum(a,b),b),b)
 const unchanged={...a,checkedAt:'2026-10-27'};assert.equal(newerCompatibleAum(a,unchanged),unchanged);assert.equal(unchanged.asOf,a.asOf)
}
for(const q of Object.values(qualified)){
 const a=AUTOMATED_ETF[q.isin]?.aum,b=base[q.isin]?.aum,c=q.automatedRecord.aum
 if(!a||!b||!c||b.scope!==c.scope||b.currency!==c.currency)continue
 assert(a.asOf>=b.asOf&&a.asOf>=c.asOf,'Consumer cannot regress behind a compatible published observation')
 assert.equal(AUTOMATED_AUM[q.isin].source.asOf,a.asOf)
 assert.equal(AUTOMATED_AUM[q.isin].source.amount,a.amount)
}
console.log('Twelve exact saved AUM pairs: consumer and producer date retention, no scope/currency substitution or same-date conflict arbitration; dated common projection verified.')
