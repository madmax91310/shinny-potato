import assert from 'node:assert/strict'
import { aggregateCompanies, calculateConcentration, roundedComposition, retainQualifiedComposition } from '../src/data/index-concentration-core.js'
import { getIndexConcentration, compositionImageSheet } from '../src/data/index-company-compositions.js'
import identities from '../src/data/index-company-identities.json' with { type: 'json' }
import records from '../src/data/index-company-compositions.json' with { type: 'json' }
import full from '../src/data/dca-complete-holdings.json' with { type: 'json' }
import { SHEETS } from '../src/data/index-factsheets.js'
const grouped = aggregateCompanies([
  {isin:'US02079K3059',name:'Alphabet A',weightPct:3.14159}, {isin:'US02079K1079',name:'Different class label',weightPct:2.71828},
  {isin:'KR7005930003',name:'Samsung Electronics',weightPct:4}, {isin:'KR7005931001',name:'Preferred',weightPct:1},
  {isin:'KR7009150004',name:'Samsung Electro-Mechanics',weightPct:3},
], identities)
assert.equal(grouped.length, 3)
assert.equal(grouped[0].weightPct, 3.14159 + 2.71828)
assert.equal(grouped.find(r=>r.name==='Samsung Electronics').weightPct, 5)
assert.equal(grouped.find(r=>r.id==='KR7009150004').weightPct, 3, 'Similar names remain distinct')
for (const id of ['cac40','dow-jones','dax','world','acwi','sp500-pea','nasdaq-pea']) assert.ok(records[id].available, id)
assert.equal(records['msci-korea'].available, false)
assert.match(records['msci-korea'].reason, /neuf entreprises/)
assert.match(records['dow-jones'].method, /prix/)
assert.equal(records['dow-jones'].approximation, false)
assert.ok(Math.abs(records['dow-jones'].topWeight - 55.39) < 1e-10)
assert.equal(records.dax.topWeight, records.dax.top.reduce((s,r)=>s+r.weightPct,0))
assert.equal(records.world.top.find(r=>r.name==='Alphabet').securities.length, 2)
assert.equal(records.world.topWeight, aggregateCompanies(full.IE00B4L5Y983.rows, identities).slice(0,10).reduce((s,r)=>s+r.weightPct,0))
assert.ok(records.world.top.some(r=>r.name==='ELI LILLY'), 'Eleventh security supplies the tenth company')
for(const [id, record] of Object.entries(records)) {
  const c=getIndexConcentration(id)
  if(!c.available) continue
  assert.equal(c.top.length,10,id)
  assert.equal(c.topWeight+c.otherWeight,100,id)
  assert.ok(c.visualFacts.countries.length && c.visualFacts.sectors.length,id)
  assert.equal(c.asOf,c.visualFacts.asOf,id)
  const display=roundedComposition(c)
  assert.equal(Math.round(display.reduce((s,v)=>s+v,0)*100),10000,id)
  assert.equal(Math.round(display.slice(0,10).reduce((s,v)=>s+v,0)*100),Math.round(c.topWeight*100),id)
  assert.ok(c.top.every((r,i)=>!i || c.top[i-1].weightPct>=r.weightPct),id)
}
const rows=Array.from({length:12},(_,i)=>({isin:`US0000000${String(i).padStart(3,'0')}`,name:`Same name ${i}`,weightPct:1.234567}))
const record={asOf:'2026-09-30',checkedAt:'2026-10-21',sourceUrl:'https://example.com',sha256:'a'.repeat(64),rows,complete:false}
assert.equal(calculateConcentration(record).available,false,'A partial list is not certified merely by its length')
assert.ok(Math.abs(calculateConcentration({...record,topCompaniesCertified:true}).topWeight-12.34567)<1e-10,'No renormalisation')
assert.equal(calculateConcentration({...record,rows:rows.slice(0,9),topCompaniesCertified:true}).available,false)
assert.equal(calculateConcentration({...record,complete:true}).available,false,'Incomplete full composition rejected')
assert.equal(calculateConcentration({...record,rows:rows.map(r=>({...r,weightPct:10})),complete:true}).available,false)
assert.equal(calculateConcentration({...record,rows:[{...rows[0],weightPct:NaN}],complete:true}).available,false)
assert.equal(calculateConcentration(null).available,false)
assert.equal(getIndexConcentration('world',new Date('2030-01-01')).status,'stale')
assert.equal(getIndexConcentration('not-an-index').status,'unavailable')
const sheet=SHEETS.find(s=>s.id==='world'), visual=compositionImageSheet(sheet,records.world)
assert.strictEqual(visual.returns,sheet.returns)
assert.strictEqual(visual.performance,sheet.performance)
assert.strictEqual(compositionImageSheet(sheet,{available:false}),sheet)
console.log('Concentration: company identities, complete/partial/absent data, own weights, Dow price weighting, precision, rounding, freshness and unchanged performance verified.')

const retained=retainQualifiedComposition({available:false,reason:'Transport or validation failed'},records.world)
assert.equal(retained.asOf,records.world.asOf)
assert.equal(retained.checkedAt,records.world.checkedAt)
assert.equal(retained.topWeight,records.world.topWeight)
assert.equal(retained.refresh.status,'failed')
assert.equal(retainQualifiedComposition({available:false},null).available,false)
