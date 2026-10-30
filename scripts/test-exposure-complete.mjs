import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {equityUniverse} from './dca-equity-universe.mjs'
import {references,validateProfile} from '../src/pages/dca-profiles/engine.js'
import {sharedPositions} from '../src/pages/dca-profiles/verification.js'
import {allocationRows} from '../src/pages/dca-profiles/image.js'
import {searchAssets} from '../src/pages/dca-profiles/management.js'
import {selectDcaHoldings} from './select-dca-holdings.mjs'
const completeSample={asOf:'2026-10-14',complete:true,rows:[{name:'Full source'}]}
const newerTopTen={asOf:'2026-10-15',complete:false,rows:[{name:'Top ten'}]}
const selectionDate=new Date('2026-10-16')
assert.equal(selectDcaHoldings(completeSample,newerTopTen,selectionDate),completeSample)
assert.equal(selectDcaHoldings({...completeSample,asOf:'2026-01-01'},newerTopTen,selectionDate),newerTopTen)
const newerComplete={...newerTopTen,complete:true}
assert.equal(selectDcaHoldings(completeSample,newerComplete,selectionDate),newerComplete)
assert.equal(selectDcaHoldings(undefined,newerTopTen,selectionDate),newerTopTen)
assert.equal(selectDcaHoldings(completeSample,{...newerComplete,asOf:'2027-01-01'},selectionDate),completeSample)
assert.equal(selectDcaHoldings(completeSample,{...newerComplete,asOf:'2026-02-30'},selectionDate),completeSample)
const universe=equityUniverse()
for(const [asset,r] of Object.entries(universe)){
 assert.equal(references[asset].kind,'equity')
 for(const ticker of r.tickers)assert(searchAssets(ticker).includes(asset))
 // The overlap tool needs a dated, sourced sector and country for every individual stock.
 for(const field of ['countries','sectors']){
  const observation=references[asset][field]
  assert(observation?.rows?.length&&observation.rows.every(row=>row.name&&row.weightPct>0),`${asset} (${r.isin}): missing ${field} for the overlap tool`)
  assert(/^\d{4}-\d{2}-\d{2}$/.test(observation.asOf)&&observation.sourceUrl&&observation.method,`${asset}: ${field} without date, source or method`)
 }
}
const lines=Object.entries(references).slice(0,50).map(([asset,r])=>({asset,isin:r.isin,label:r.name,weight:2,amount:0}))
assert.deepEqual(validateProfile({imageOnly:true,scope:'Portefeuille investi',lines}),[])
assert(validateProfile({imageOnly:true,scope:'Portefeuille investi',lines:[...lines,lines[0]]}).length)
const visible=allocationRows(lines)
assert.equal(visible.length,8)
assert.equal(visible.reduce((s,r)=>s+r.weight,0),100)
assert.deepEqual(visible.map(r=>r.weight),[86,2,2,2,2,2,2,2],'Grouped allocations retain every weight and follow descending display order')
assert.equal(visible[0].name,'43 autres positions')
const now=new Date('2026-10-16'),a='US0378331005',b='US5949181045'
const o={asOf:'2026-10-14',sourceUrl:'https://example.com/full',basis:'fund',complete:true,rows:[{name:'Apple',isin:a,weightPct:50},{name:'Microsoft',isin:b,weightPct:50}]}
const refs={x:{isin:'IE00B4L5Y983'},y:{isin:'IE00B5BMR087'},z:{isin:a,name:'Apple',kind:'equity',countries:o}}
const positions=[{asset:'x',isin:refs.x.isin,label:'ETF X',weight:40},{asset:'y',isin:refs.y.isin,label:'ETF Y',weight:40},{asset:'z',isin:a,label:'Apple',weight:20}]
const result=sharedPositions(positions,refs,now,{x:o,y:o})
assert.equal(result.totals[0].rows.find(r=>r.isin===a).weight,60,'No double counting across three pairs')
assert.equal(result.totals[0].rows.find(r=>r.isin===a).direct,20)
assert.equal(result.totals[0].coverage,100)
assert.equal(result.pairs.length,3)
assert.equal(sharedPositions(positions,refs,now,{x:{...o,complete:false},y:o}).pairs[0].overlap,null)
const unidentified={...o,rows:[{name:'Apple',isin:a,weightPct:99.9},{name:'Published stock without ISIN',isin:null,weightPct:.1}]}
assert.equal(sharedPositions(positions,refs,now,{x:unidentified,y:o}).pairs[0].overlap,null,'A full issuer file with an unidentified position cannot claim complete overlap')
assert.equal(sharedPositions(positions,refs,now,{x:{...o,synthetic:true},y:o}).unavailable.length,1)
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const observations=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
const liveLines=[{asset:'world',isin:references.world.isin,label:'World',weight:50},{asset:'sp500',isin:references.sp500.isin,label:'S&P 500',weight:50}]
const live=sharedPositions(liveLines,references,new Date(),observations)
// A newer top-ten publication legitimately supersedes an older full snapshot.
// Never require a complete overlap from that partial publication.
if (observations.world.complete && observations.sp500.complete) {
 assert(live.pairs[0].common.length>10,'Full positions must exceed editorial top ten')
 assert(live.totals[0].coverage>95)
} else {
 assert.equal(live.pairs[0].overlap,null,'Partial publications must not claim a complete overlap')
 assert.equal(live.pairs[0].full,false)
}
// Independently exercise the complete, sourced snapshots even after a newer
// partial publication arrives; this preserves the full-position regression.
const full=JSON.parse(readFileSync('src/data/dca-complete-holdings.json'))
const completeObservations=Object.fromEntries(liveLines.map(line=>[line.asset,full[line.isin]]))
assert(Object.values(completeObservations).every(o=>o?.complete && o.rows.length>10))
const snapshotDate=new Date(Object.values(completeObservations).map(o=>o.asOf).sort().at(-1))
const completeResult=sharedPositions(liveLines,references,snapshotDate,completeObservations)
assert(completeResult.pairs[0].common.length>10,'Full positions must exceed editorial top ten')
assert(completeResult.totals[0].coverage>95)
console.log(`Complete exposures: ${Object.keys(universe).length} equity entries, 50 positions, complete holdings, direct/indirect totals and missing-data guards verified.`)

// Portfolio order cannot affect consolidation, coverage, or pair direction.
assert.deepEqual(sharedPositions([...positions].reverse(),refs,now,{x:o,y:o}),result)
const partial={...o,complete:false,rows:[{name:'Apple',isin:a,weightPct:8},{name:'Microsoft',isin:b,weightPct:2}]}
const partialResult=sharedPositions(positions,refs,now,{x:partial,y:o})
assert.equal(partialResult.pairs.find(p=>p.left==='ETF X'&&p.right==='ETF Y').overlap,null)
assert.equal(partialResult.pairs.find(p=>p.left==='ETF X'&&p.right==='ETF Y').identifiedCoverage[0],10)
const rounding={...o,rows:[{name:'Apple',isin:a,weightPct:50.2},{name:'Microsoft',isin:b,weightPct:50}]}
const rounded=sharedPositions(positions,refs,now,{x:rounding,y:o}).pairs.find(p=>p.left==='ETF X'&&p.right==='ETF Y')
assert.equal(rounded.common.find(r=>r.isin===a).leftWeight,50.2,'Published weights stay unchanged')
assert.equal(rounded.overlap,null,'Rounding excess cannot produce a silently normalized full score')
