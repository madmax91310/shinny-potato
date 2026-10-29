import assert from 'node:assert/strict'
import './test-dca-asset-scope.mjs'
import {publishedExposure,exposureView} from '../src/pages/dca-profiles/exposure.js'
import {donutData,integerPercentages} from '../src/pages/dca-profiles/image.js'
import {references} from '../src/pages/dca-profiles/engine.js'
const now=new Date('2026-10-16T12:00:00Z')
const observation={asOf:'2026-10-15',sourceUrl:'https://example.com/official',compatibility:'fixture',basis:'fund',rows:[{name:'United States',weightPct:60},{name:'France',weightPct:40}]}
const refs={stock:{isin:'fixture',countries:observation,sectors:observation},broken:{isin:'missing'}}
const lines=[{asset:'stock',isin:'fixture',weight:80},{asset:'gold',weight:15},{asset:'btc',weight:5}]
for(const field of ['countries','sectors']){
 const e=publishedExposure(lines,refs,field,now),v=exposureView(e),d=donutData({[field]:e},field)
 assert.equal(v.eligible,80);assert.equal(e.neutralWeight,20)
 assert.equal(v.rows.find(r=>r.name==='France').weight,40)
 assert.equal(v.rows.find(r=>r.name==='France').portfolioWeight,32)
 assert(!d.rows.some(r=>/Or|Bitcoin|Hors classification/.test(r.name)))
 assert.equal(d.rows.reduce((s,r)=>s+r.weight,0),100)
 // Missing 20 points in the eligible 80-point pocket remains 25%, not erased.
 const partial=publishedExposure([{...lines[0],weight:60},{asset:'broken',isin:'missing',weight:20},...lines.slice(1)],refs,field,now)
 const pd=donutData({[field]:partial},field)
 assert.equal(pd.rows.find(r=>r.name==='Non ventilé ici').weight,25)
 const allOutside=publishedExposure([{asset:'gold',weight:50},{asset:'btc',weight:50}],refs,field,now)
 assert.equal(donutData({[field]:allOutside},field).rows[0].name,'Sans objet')
 assert.equal(exposureView(allOutside).eligible,0)
 // Every requested legend size conserves even small and residual slices.
 const many={...observation,rows:Array.from({length:12},(_,i)=>({name:`Catégorie ${i+1}`,weightPct:i===11?1:9}))}
 const multi=publishedExposure([{asset:'many',isin:'many',weight:100}],{many:{isin:'many',[field]:many}},field,now)
 for(const limit of [3,4,6]){
  const d=donutData({[field]:multi},field,limit)
  assert.equal(d.rows.length,limit+1)
  assert(Math.abs(d.rows.reduce((s,r)=>s+r.weight,0)-100)<1e-8)
  assert.equal(integerPercentages(d.rows).reduce((s,n)=>s+n,0),100)
 }
}
assert.equal(references.GB00B15KXQ89.outsideClassification,'Cuivre')
assert.equal(references.LU0290358497.outsideClassification,'Monétaire')
assert(!references.IE000UL6CLP7.outsideClassification,'Mining shares keep geography and sectors')
console.log('Exposure scope: metals/crypto excluded, 80/15/5, missing data, all-neutral, 3/4/6 categories and exact support classifications verified.')
// Published multi-asset sleeves contribute only their observed equity share.
for(const field of ['countries','sectors']){
 const mixedRefs={mix:{isin:'mix',equitySleeve:{weightPct:20,asOf:'2026-10-15',sourceUrl:'https://issuer'},[field]:observation},...refs}
 const e=publishedExposure([{asset:'mix',isin:'mix',weight:50},{asset:'stock',isin:'fixture',weight:40},{asset:'gold',weight:10}],mixedRefs,field,now)
 assert.equal(e.neutralWeight,50);assert.equal(exposureView(e).eligible,50)
 assert.equal(exposureView(e).rows.reduce((s,r)=>s+r.weight,0),100)
 const expired=structuredClone(mixedRefs);expired.mix.equitySleeve.asOf='2020-01-01'
 const missing=publishedExposure([{asset:'mix',isin:'mix',weight:100}],expired,field,now)
 assert.equal(missing.neutralWeight,0);assert.equal(exposureView(missing).missing,100)
}
