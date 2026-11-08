import assert from 'node:assert/strict'
import countries from './fixtures/wisdomtree-country-consumers-20261108.json' with {type:'json'}
import {publishedExposure,exposureDisplay} from '../src/pages/dca-profiles/exposure.js'
const now=new Date('2026-11-08T12:00:00Z')
const references=Object.fromEntries(Object.entries(countries).map(([isin,c])=>[isin,{isin,countries:{...c,compatibility:'wisdomtree-incorporated-country:fund'}}]))
const lines=Object.keys(countries).map((isin,i)=>({asset:isin,isin,label:isin,weight:i===0?70:30}))
const analyze=ls=>publishedExposure(ls,references,'countries',now)
const result=analyze(lines),group=result.groups[0]
const unknown=group.rows.find(r=>r.name==='Non classé')
// Only source rounding above 100 is treated by the existing display policy.
const expected=lines.reduce((n,l)=>n+l.weight*countries[l.isin].unclassifiedWeightPct/Math.max(100,countries[l.isin].rows.reduce((n,r)=>n+r.weightPct,0)),0)
assert(Math.abs(unknown.weight-expected)<1e-12)
assert(!group.rows.some(r=>r.name==='Unknown'))
assert(Math.abs(group.rows.reduce((n,r)=>n+r.weight,0)-100)<1e-10)
assert.equal(exposureDisplay(result).missing,0)
assert.deepEqual(analyze([...lines].reverse()),result,'country aggregation is invariant to asset order')
for(const l of lines){
 const c=countries[l.isin]
 assert(!c.complete,'A country allocation never declares a full securities portfolio')
 assert.equal(c.rankClassificationID,6,'Incorporated Country remains distinct from Aggregate Country')
 const expired=publishedExposure([l],references,'countries',new Date('2027-03-01T12:00:00Z'))
 assert.equal(expired.groups.length,0,'stale observations remain refused')
}
console.log('WisdomTree country residuals: exact raw weights, non-classified share, conserved portfolio mass, stable order and expiry verified.')
