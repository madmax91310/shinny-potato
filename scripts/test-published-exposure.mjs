import assert from 'node:assert/strict'
import {references as liveReferences,analyzeProfile} from '../src/pages/dca-profiles/engine.js'
import {dcaExposure,publishedExposure,exposureDisplay} from '../src/pages/dca-profiles/exposure.js'
import {donutData} from '../src/pages/dca-profiles/image.js'
const now=new Date('2026-10-16T12:00:00Z')
// Frozen regression observations: daily collection must not invalidate dated expectations.
const references=structuredClone(liveReferences)
for(const [asset,country,countryWeight,tech,total,date] of [
 ['IE0002XZSHO1','United States',72.94,31.78,100.02,'2026-09-30'],
 ['europe','United Kingdom',18.46,9.16,100.01,'2026-09-30'],
 ['FR0013412020','Taiwan',29.747008,42.389722,100,'2026-10-14'],
]) {
 delete references[asset].equitySleeve // These frozen observations describe the whole fixture allocation.
 for(const field of ['countries','sectors'])references[asset][field]={
 ...references[asset][field],asOf:date,compatibility:`fixture-${asset}-${field}`,rows:field==='countries'
 ?[{name:country,weightPct:countryWeight},{name:'Other',weightPct:100-countryWeight}]
 :[{name:'Technology',weightPct:tech},{name:'Other',weightPct:total-tech}],
}
}
const lines=['IE0002XZSHO1','europe','FR0013412020'].map((asset,i)=>({asset,label:references[asset].name,isin:references[asset].isin,weight:[70,20,10][i]}))
const profile={imageOnly:true,name:'',scope:'Portefeuille investi',lines}
for(const field of ['countries','sectors']){
 const strict=dcaExposure(lines,references,field,now)
 assert.equal(exposureDisplay(strict).coverage,70,'Strict source comparisons remain separate')
 const result=publishedExposure(lines,references,field,now),group=result.groups[0]
 assert(Math.abs(group.coverage-100)<0.00001)
 assert.equal(group.observations.length,3)
 assert.equal(new Set(group.observations.map(o=>o.classification)).size,3)
 assert.equal(group.oldest,'2026-09-30');assert.equal(group.asOf,'2026-10-14')
 assert(group.indicative)
 assert(group.rows.every(row=>Math.abs(row.weight-row.contributions.reduce((s,r)=>s+r.weight,0))<1e-10))
 assert(!donutData({[field]:result},field).rows.some(row=>row.name==='Non ventilé ici'))
 assert(analyzeProfile(profile)[field].groups[0]?.indicative,'Production images use the published overview')
 // Missing, stale, signed or partial data must stay missing in the overview too.
 for(const patch of [undefined,{...references.europe[field],asOf:'2020-01-01'},{...references.europe[field],rows:[{name:'France',weightPct:-10}]}]){
  const refs={...references,europe:{...references.europe,[field]:patch}}
  const e=publishedExposure(lines,refs,field,now)
  assert(Math.abs(exposureDisplay(e).missing-20)<0.00001)
 }
 const refs={...references,europe:{...references.europe,[field]:{...references.europe[field],rows:[{name:field==='countries'?'France':'Technology',weightPct:50}]}}}
 assert(Math.abs(exposureDisplay(publishedExposure(lines,refs,field,now)).missing-10)<0.00001)
 const wrong=lines.map(l=>l.asset==='europe'?{...l,isin:'wrong'}:l)
 assert(Math.abs(exposureDisplay(publishedExposure(wrong,references,field,now)).missing-20)<0.00001)
 const delayed={...references,europe:{...references.europe,[field]:{...references.europe[field],asOf:'2026-07-20'}}}
 assert(Math.abs(exposureDisplay(publishedExposure(lines,delayed,field,now)).missing-20)<0.00001)
}
const geo=publishedExposure(lines,references,'countries',now).groups[0]
assert(Math.abs(geo.rows.find(r=>r.name==='États-Unis').weight-51.058)<0.00001)
assert(geo.rows.find(r=>r.name==='Taïwan').weight>2.97)
const sector=publishedExposure(lines,references,'sectors',now).groups[0]
assert(Math.abs(sector.rows.find(r=>r.name==='Technologie').weight-(70*31.78/100.02+20*9.16/100.01+10*42.389722/100))<0.0001)
// Every selectable exact support must conserve weight in both presentations.
for(const [asset,r] of Object.entries(references).filter(([,r])=>r.isin))for(const field of ['countries','sectors']){
 const result=publishedExposure([{asset,isin:r.isin,weight:100}],references,field,now)
 assert(Math.abs(donutData({[field]:result},field).rows.reduce((s,r)=>s+r.weight,0)-100)<1e-6,asset)
}
console.log('Published portfolio synthesis: 70/20/10 fully represented, provenance, exact weighted results, missing data and catalog mass conservation verified.')

