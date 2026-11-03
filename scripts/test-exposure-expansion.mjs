import assert from 'node:assert/strict'
import config from './exposure-etf-expansion.json' with {type:'json'}
import records from '../src/data/exposure-etf-expansion-records.json' with {type:'json'}
import {references,analyzeProfile} from '../src/pages/dca-profiles/engine.js'
import {searchAssets} from '../src/pages/dca-profiles/management.js'
import {dcaExposure,exposureDisplay} from '../src/pages/dca-profiles/exposure.js'
assert.equal(config.instruments.length,36)
assert.equal(new Set(config.instruments.map(s=>s.isin)).size,36)
for(const s of config.instruments){
 assert(records[s.isin],`Missing validated record ${s.isin}`)
 assert(searchAssets(s.isin).includes(s.isin),`ISIN search missing ${s.isin}`)
 const ref=references[s.isin]
 assert.equal(ref.isin,s.isin)
 const lines=[{asset:s.isin,isin:s.isin,label:s.name,weight:100,amount:0}]
 const p={name:'',imageOnly:true,scope:'Portefeuille investi',lines}
 assert.deepEqual(analyzeProfile(p).errors,[],s.isin)
 for(const field of ['countries','sectors']){
  const e=dcaExposure(lines,references,field)
  assert.deepEqual(e.excluded,[],`${s.isin} ${field}`)
  if(s.isin==='FR0013346681'){
   assert.equal(e.neutralWeight,100)
   assert.equal(ref.outsideClassification,'Monétaire')
   assert.equal(ref[field],undefined)
  }else assert(exposureDisplay(e).coverage>=99,`${s.isin} ${field}: ${exposureDisplay(e).coverage}`)
 }
}
assert.equal(records.LU2903252349.countries.basis,'index')
assert.match(records.LU1681040223.characteristics.index,/ESG/i)
console.log('36 exact ISINs: catalogue search, dated country/sector donuts, monetary treatment and index identity verified.')

assert(searchAssets('PANX').includes('FR0013412269'))
assert.equal(references.FR0013412269.pea,true)
assert.equal(references.FR0013412269.synthetic,true)
assert.equal(records.FR0013412269.holdings.basis,'index')
assert.notEqual(records.FR0013412269.holdings.complete,true)
