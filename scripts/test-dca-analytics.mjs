import assert from 'node:assert/strict'
import {flowAllocation,allocationAfterContributions,portfolioAnalytics,compareExposures} from '../src/pages/dca-profiles/analytics.js'
const a='US0378331005',b='US5949181045',now=new Date('2026-10-16')
const observation={asOf:'2026-10-15',basis:'fund',sourceUrl:'https://example.com',complete:true,rows:[{isin:a,name:'Apple',weightPct:60},{isin:b,name:'Microsoft',weightPct:40}]}
const geo={...observation,compatibility:'risk',rows:[{name:'United States',weightPct:100}]}
const refs={x:{isin:'IE00B4L5Y983',countries:geo,sectors:{...geo,compatibility:'gics',rows:[{name:'Technology',weightPct:100}]}},y:{isin:'IE00B5BMR087',countries:geo,sectors:{...geo,compatibility:'gics',rows:[{name:'Technology',weightPct:100}]}},apple:{isin:a,kind:'equity',name:'Apple',countries:geo}}
const lines=[{asset:'x',isin:refs.x.isin,label:'World',weight:50,amount:100},{asset:'y',isin:refs.y.isin,label:'USA',weight:30,amount:0},{asset:'apple',isin:a,label:'Apple',weight:20,amount:100}]
const result=portfolioAnalytics(lines,refs,{x:observation,y:observation},now)
assert.equal(result.groups[0].rows.find(r=>r.isin===a).weight,68)
assert.equal(result.groups[0].top5,100)
assert.equal(result.groups[0].complete,true)
assert.equal(flowAllocation(lines).reduce((s,l)=>s+l.weight,0),100)
assert.deepEqual(flowAllocation(lines).map(l=>l.weight),[50,50])
assert.deepEqual(flowAllocation(lines.map(l=>({...l,amount:0}))),[])
const future=allocationAfterContributions(lines,1000,5)
assert.deepEqual(future.map(l=>l.weight),[50,15,35])
assert.equal(lines[2].weight,20,'Original allocation must not mutate')
for(const [capital,months] of [[0,12],[1000,1.2],[1000,121],[NaN,12]])assert.throws(()=>allocationAfterContributions(lines,capital,months))
const partial=portfolioAnalytics(lines,refs,{x:{...observation,complete:false,rows:observation.rows.slice(0,1)}},now)
assert.equal(partial.groups[0].complete,false)
assert(partial.groups[0].coverage<100)
// A top-list remains partial even if its rounded weights happen to total 100%.
const roundedPartial=portfolioAnalytics(lines,refs,{x:{...observation,complete:false},y:observation},now)
assert.equal(roundedPartial.groups[0].coverage,100)
assert.equal(roundedPartial.groups[0].complete,false)
assert.equal(roundedPartial.pairs[0].overlap,null)
const mixedLines=[{asset:'a-index',isin:refs.y.isin,label:'Unknown index positions',weight:30},{asset:'x',isin:refs.x.isin,label:'Fund',weight:70}]
const mixedRefs={...refs,'a-index':refs.y},mixedHoldings={x:observation,'a-index':{...observation,basis:'index',complete:false,rows:[{name:'Unidentified issuer',weightPct:20}]}}
const mixed=portfolioAnalytics(mixedLines,mixedRefs,mixedHoldings,now)
assert.equal(mixed.groups[0].scope,'fund','An empty scope cannot hide available issuer positions')
assert.equal(mixed.groups[0].rows.find(r=>r.isin===a).weight,42,'Unknown positions are not redistributed')
assert.equal(mixed.groups.find(g=>g.scope==='index').portfolioWeight,30,'Keep the unidentifiable scope and its weight explicit')
assert.deepEqual(portfolioAnalytics([...mixedLines].reverse(),mixedRefs,mixedHoldings,now).groups,mixed.groups,'Scope choice is invariant to asset order')
const diff=compareExposures(result,result,'countries');assert(diff.compatible);assert(diff.rows.every(r=>r.delta===0))
const incompatible=structuredClone(result);incompatible.exposures.countries.groups[0].classification='registration'
assert.equal(compareExposures(result,incompatible,'countries').compatible,false)
const stale=structuredClone(result);stale.exposures.countries.groups[0].oldest='2025-01-01'
assert.equal(compareExposures(result,stale,'countries').compatible,false)
console.log('DCA analytics: contributions, direct/indirect totals, concentration, partial coverage and compatible comparisons verified.')

const {migrateProfile}=await import('../src/pages/dca-profiles/management.js')
const legacy={lines:[{asset:'moodys',weight:40},{asset:'linde',weight:60}]}
assert.deepEqual(migrateProfile(legacy).lines.map(l=>l.asset),['mco','lin'])
assert.equal(legacy.lines[0].asset,'moodys')
