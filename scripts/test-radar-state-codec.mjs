import assert from 'node:assert/strict'
import {packRadarState,unpackRadarState,radarStateContent} from './lib/radar-state-codec.mjs'
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

const compact=radarStateContent(many),pretty=JSON.stringify(packRadarState(many),null,2)+'\n'
assert.deepEqual(JSON.parse(compact),packRadarState(many))
assert.deepEqual(unpackRadarState(JSON.parse(compact)),many,'Compact persistence preserves every value and proof')
const request=content=>JSON.stringify({content,encoding:'utf-8'})
assert(Buffer.byteLength(request(compact))<Buffer.byteLength(request(pretty))*.95,'Measure the actual escaped REST envelope, not only the JSON file')
assert.equal(compact.split('\n').length,2,'Only the final newline is literal; text/source newlines remain escaped and intact')

// A compact state can still exceed the API limit as source text accumulates.
// Quotes/backslashes/newlines also grow when JSON is escaped a second time.
const large=structuredClone(plain)
large.retainedSourceText='"\\\n'.repeat(4_000_000)
const uncompressed=JSON.stringify(packRadarState(large))+'\n'
assert(Buffer.byteLength(request(uncompressed))>32*1024*1024)
const metrics=[],bounded=radarStateContent(large,row=>metrics.push(row)),transport=JSON.parse(bounded)
assert.equal(metrics[0].originalRequestBytes,Buffer.byteLength(request(uncompressed)))
assert.equal(metrics[0].requestBytes,Buffer.byteLength(request(bounded)))
assert.equal(transport.radarStateTransport,1)
assert.deepEqual(transport.conflicts,packRadarState(large).conflicts,'Python supervision reads the same durable conflict ledger without a format migration')
const badPreview=structuredClone(transport);badPreview.conflicts={unexpected:true};assert.throws(()=>unpackRadarState(badPreview),/altéré/)
const missingPreview=structuredClone(transport);delete missingPreview.conflicts;assert.throws(()=>unpackRadarState(missingPreview),/altéré/)
assert(Buffer.byteLength(request(bounded))<32*1024*1024)
assert.deepEqual(unpackRadarState(transport),large,'Lossless transport preserves source text, financial proofs, queues and history')
assert.equal(radarStateContent(transport),bounded,'Repeated persistence is idempotent')
assert.deepEqual(advanceRadar(transport,[row],{now}),advanceRadar(large,[row],{now}),'Storage migration produces no new classification/signal')
for(const change of [{radarStateTransport:99},{encoding:'unknown'},{originalBytes:transport.originalBytes+1},{originalBytes:257*1024*1024},{sha256:'0'.repeat(64)},{data:transport.data.slice(0,-4)},{data:transport.data+'!'}])assert.throws(()=>unpackRadarState({...transport,...change}),/Radar|historique/)
assert.equal(large.retainedSourceText.length,12_000_000,'Input data remains untouched')
console.log('Large Radar state: bounded escaped request, full restoration, legacy compatibility, idempotence, corruption rejection and unchanged restart/signals verified.')
