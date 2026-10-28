import assert from 'node:assert/strict'
import {packRadarState,unpackRadarState} from './lib/radar-state-codec.mjs'
import {advanceRadar} from './lib/editorial-radar.mjs'
const now=new Date('2026-10-28T15:00:00Z'),evidence={version:1,identity:'fund',basis:'fund',currency:'USD',unit:'%',asOf:'2026-10-26',sourceHash:'a'.repeat(64),method:'Published NAV allocation',categories:[{name:'Financials',weightPct:99.5},{name:'Cash',weightPct:.5}],rowCount:2,categoryCount:2,total:100,onlyResidual:false,weightConvention:'net-asset-value'}
const row={family:'etf',entity:'fund',field:'sectors:Financials',fieldLabel:'Poids du secteur Finance',label:'ETF',value:99.5,period:evidence.asOf,checkedAt:now.toISOString(),scope:'Exact fund',sourceUrl:'https://www.ishares.com/fund',unit:'%',compositionEvidence:evidence}
const plain=advanceRadar(null,[row],{now}).state
plain.publications={documents:{archive:{firstSeenAt:'2026-10-20',status:'pending',attempts:3}}}
plain.comparisonReviews={migration:{before:row,after:row,recordedAt:now.toISOString()}}
const packed=packRadarState(plain),disk=JSON.parse(JSON.stringify(packed))
assert.deepEqual(unpackRadarState(disk),plain,'Every proof, observation, date, archive queue and review survives serialization')
assert.deepEqual(packRadarState(disk),packed,'Packing an existing encoded state is idempotent')
assert.deepEqual(advanceRadar(disk,[row],{now}),advanceRadar(plain,[row],{now}),'Same classification/history after an ordinary restart from disk')
assert.deepEqual(unpackRadarState(plain),plain,'Legacy unencoded states need no migration/reset')
const missing=structuredClone(packed);delete missing.compositionEvidencePool[Object.keys(missing.compositionEvidencePool)[0]]
assert.throws(()=>unpackRadarState(missing),/Référence/, 'Missing evidence blocks a write, never silently discards the proof')
const altered=structuredClone(packed);Object.values(altered.compositionEvidencePool)[0].currency='EUR';assert.throws(()=>unpackRadarState(altered),/altérée/)
assert.throws(()=>unpackRadarState({...packed,compositionEvidenceEncoding:99}),/non reconnu/)
const many={...plain,current:Object.fromEntries(Array.from({length:300},(_,i)=>['category-'+i,{...row,field:'sectors:category-'+i}]))}
assert(Buffer.byteLength(JSON.stringify(packRadarState(many)))<Buffer.byteLength(JSON.stringify(many))*.8,'Repeated proofs have bounded storage without removing any observation')
assert.deepEqual(plain,unpackRadarState(packed),'Input objects were not mutated')
console.log('Radar state storage: lossless restart, unchanged legacy history/queues, nested reviews, deduplicated evidence, idempotence and rejection of missing/altered/unknown proofs passed.')
