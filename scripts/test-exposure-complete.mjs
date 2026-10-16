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
const universe=equityUniverse()
for(const [asset,r] of Object.entries(universe)){
 assert.equal(references[asset].kind,'equity')
 for(const ticker of r.tickers)assert(searchAssets(ticker).includes(asset))
}
const lines=Object.entries(references).slice(0,50).map(([asset,r])=>({asset,isin:r.isin,label:r.name,weight:2,amount:0}))
assert.deepEqual(validateProfile({imageOnly:true,scope:'Portefeuille investi',lines}),[])
assert(validateProfile({imageOnly:true,scope:'Portefeuille investi',lines:[...lines,lines[0]]}).length)
const visible=allocationRows(lines);assert.equal(visible.length,8);assert.equal(visible.reduce((s,r)=>s+r.weight,0),100);assert.equal(visible.at(-1).weight,86)
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
assert.equal(sharedPositions(positions,refs,now,{x:{...o,synthetic:true},y:o}).unavailable.length,1)
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const observations=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
const live=sharedPositions([{asset:'world',isin:references.world.isin,label:'World',weight:50},{asset:'sp500',isin:references.sp500.isin,label:'S&P 500',weight:50}],references,new Date(),observations)
assert(live.pairs[0].common.length>10,'Full positions must exceed editorial top ten')
assert(live.totals[0].coverage>95)
console.log(`Complete exposures: ${Object.keys(universe).length} equity entries, 50 positions, complete holdings, direct/indirect totals and missing-data guards verified.`)
