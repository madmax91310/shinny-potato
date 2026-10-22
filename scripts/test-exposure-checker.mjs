import assert from 'node:assert/strict'
import holdings from '../src/pages/dca-profiles/holdings.json' with {type:'json'}
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'
import {ASSETS} from '../src/pages/dca-profiles/data.js'
import {references,analyzeProfile,validateProfile} from '../src/pages/dca-profiles/engine.js'
import {dcaExposure,exposureDisplay} from '../src/pages/dca-profiles/exposure.js'
import {catalogCoverage,sharedPositions} from '../src/pages/dca-profiles/verification.js'
import {searchAssets} from '../src/pages/dca-profiles/management.js'
import {donutData} from '../src/pages/dca-profiles/image.js'
const now=new Date('2026-10-15T12:00:00Z'),liveNow=new Date()
const line=(asset,weight)=>({asset,label:references[asset].name,isin:references[asset].isin,weight})
const all=catalogCoverage(references,liveNow)
assert.equal(new Set(Object.values(references).filter(r=>r.isin).map(r=>r.isin)).size,Object.values(references).filter(r=>r.isin).length)
for(const isin of Object.keys(AUTOMATED_ETF)){
 const [asset,r]=Object.entries(references).find(([,r])=>r.isin===isin)||[]
 assert(r,`Not connected: ${isin}`);assert(ASSETS[asset]);assert(searchAssets(isin).includes(asset))
 for(const ticker of r.tickers)assert(searchAssets(ticker).includes(asset))
 if(r.synthetic)for(const field of ['countries','sectors'])assert.notEqual(r[field]?.basis,'fund','Synthetic basket must not become economic exposure')
 const p={name:'',imageOnly:true,mode:'participant',scope:'Portefeuille investi',lines:[line(asset,100)]}
 assert.deepEqual(validateProfile(p),[])
 for(const field of ['countries','sectors']){
  const e=dcaExposure(p.lines,references,field,liveNow),d=exposureDisplay(e)
  assert(Math.abs(d.coverage+d.missing+e.neutralWeight-100)<1e-6)
  assert(Math.abs(donutData({[field]:e},field).rows.reduce((s,r)=>s+r.weight,0)-100)<1e-6)
  for(const row of e.groups.flatMap(g=>g.rows))assert(Math.abs(row.contributions.reduce((s,c)=>s+c.weight,0)-row.weight)<1e-8)
 }
}
assert(searchAssets('', 'pea').every(k=>references[k].pea===true))
assert(searchAssets('WPEA').includes('IE0002XZSHO1'))
const trio=[line('world',34),line('nasdaq',33),line('sp500',33)]
for(const field of ['countries','sectors']){
 const a=dcaExposure(trio,references,field,liveNow),b=dcaExposure([...trio].reverse(),references,field,liveNow)
 const sorted=e=>e.groups.map(g=>[g.classification,g.coverage,g.rows.map(r=>[r.name,r.weight]).sort()])
 assert.deepEqual(sorted(a),sorted(b))
 assert(exposureDisplay(a).coverage>99.5)
}
const pairs=sharedPositions(trio,references,liveNow,holdings)
assert(pairs.pairs.some(p=>p.common.some(r=>r.isin==='US67066G1040')))
assert(pairs.pairs.every(p=>!p.full&&p.overlap===null),'Top ten is not complete holdings')
const obs=(rows,extra={})=>({asOf:'2026-10-14',sourceUrl:'https://example.com/holdings',basis:'fund',rows,...extra})
const holding=(isin,weightPct)=>({isin,name:isin,weightPct})
const positions=[line('world',60),line('sp500',40)]
const fixture={world:obs([holding('US67066G1040',80),holding('US0378331005',20)],{complete:true}),sp500:obs([holding('US67066G1040',50),holding('US5949181045',50)],{complete:true})}
let pair=sharedPositions(positions,references,now,fixture).pairs[0]
assert.equal(pair.overlap,50);assert.equal(pair.common[0].portfolioWeight,68)
const rounded=obs([holding('US67066G1040',100.2)],{complete:true})
assert.equal(sharedPositions(positions,references,now,{world:rounded,sp500:rounded}).pairs.length,0,'A single position above 100% is invalid, never silently normalized')
assert.equal(sharedPositions(positions,references,now,{...fixture,world:{...fixture.world,synthetic:true}}).pairs.length,0)
assert.equal(sharedPositions(positions,references,now,{...fixture,world:{...fixture.world,asOf:'2020-01-01'}}).pairs.length,0)
assert.equal(sharedPositions(positions,references,now,{...fixture,world:{...fixture.world,rows:[holding('US67066G1040',-5)]}}).pairs.length,0)
assert.equal(sharedPositions(positions,references,now,{...fixture,world:{...fixture.world,rows:[{name:'NVIDIA',weightPct:100}]}}).pairs[0].common.length,0)
const profile={name:'',imageOnly:true,scope:'Portefeuille investi',lines:trio}
assert.deepEqual(analyzeProfile(profile).errors,[])
assert(validateProfile({...profile,lines:trio.map(l=>({...l,weight:30}))}).length)
console.log(`Exposure checker: ${Object.keys(AUTOMATED_ETF).length} exact supports connected; ${all.length} coverage records; conservation, contributions, permutations, sources, synthetic safeguards and partial holdings verified.`)
