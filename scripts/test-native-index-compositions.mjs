import assert from 'node:assert/strict'
import contracts from '../src/data/native-index-composition-contracts.json' with {type:'json'}
import {qualifiedNativeIndexComposition} from '../src/data/native-index-composition.js'
import {sharedPositions} from '../src/pages/dca-profiles/verification.js'
import {projectDcaHoldings} from './lib/dca-holdings-projection.mjs'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {qualifyHoldings} from '../src/pages/dca-profiles/holdings-qualification.js'
// Synthetic test values only. No record here is written to financial data.
const now=new Date('2026-10-29T18:00:00Z'),asOf='2026-08-31',index=contracts.indices.topix
const shares=Object.keys(contracts.shares),refs={x:{isin:shares[0],synthetic:true},y:{isin:shares[1],synthetic:true}}
const rows=Array.from({length:1000},(_,i)=>({isin:'JP'+String(i).padStart(9,'0')+'0',name:'Member '+i,weightPct:.1}))
const make=isin=>({subjectIsin:isin,indexId:'topix',index:'TOPIX',scope:'equity-index',basis:'index',complete:true,rows,asOf,
 checkedAt:'2026-10-29T12:00:00Z',sourceUrl:index.weightSourceUrl,sha256:'a'.repeat(64),method:'Original native index weights',
 shareSourceUrl:contracts.shares[isin].shareDocumentBase,shareAsOf:'2026-09-30',shareSha256:'b'.repeat(64),
 identityAsOf:asOf,identitySourceUrl:index.identitySourcePrefix+'1480664184455.ajax?fileType=json&asOfDate=20260831',identitySha256:'c'.repeat(64),
 coverageProof:{kind:'complete-native-index',endMarkerPresent:true,indexId:'topix',sourceRowCount:1000,originalPublishedWeights:true,normalizationApplied:false}})
const x=make(shares[0]),y=make(shares[1]),lines=[{asset:'x',isin:shares[0],label:'X',weight:50},{asset:'y',isin:shares[1],label:'Y',weight:50}]
const analyze=h=>sharedPositions(lines,refs,now,{x:h,y})
assert(qualifiedNativeIndexComposition(x,shares[0],now))
assert(qualifiedNativeIndexComposition(projectDcaHoldings(x,true,x.sourceUrl),shares[0],now),'Native proof survives lazy projection')
assert(analyze(x).pairs[0].full);assert(Math.abs(analyze(x).pairs[0].overlap-100)<1e-8)
for(const patch of [
 {subjectIsin:shares[1]},{indexId:'stoxx600'},{sourceUrl:'https://issuer.example/physical-etf-basket'},
 {shareSourceUrl:contracts.shares[shares[1]].shareDocumentBase},{shareAsOf:'2026-07-31'},
 {identityAsOf:'2026-10-28'},{identitySourceUrl:index.identitySourcePrefix+'fund.ajax?asOfDate=20261028'},
 {checkedAt:'2026-10-30T00:00:00Z'},{sha256:'not-a-proof'},{coverageProof:null},
 {coverageProof:{...x.coverageProof,normalizationApplied:true}},
 {coverageProof:{...x.coverageProof,sourceRowCount:999}},
 {coverageProof:{...x.coverageProof,endMarkerPresent:false}},
 {rows:[x.rows[0],x.rows[0],...x.rows.slice(2)]},
]){
 const bad={...x,...patch};assert.equal(qualifiedNativeIndexComposition(bad,shares[0],now),false,JSON.stringify(patch))
 assert(analyze(bad).unavailable.includes('X'),'Reject a complete index with incompatible or missing proof')
}
for(const isin of ['FR0011550193','FR0011869304','FR0011871110'])assert.equal(qualifiedNativeIndexComposition({...x,subjectIsin:isin},isin,now),false,'No physical fund proxy or different benchmark admitted for Europe/PEA')
const partial=analyze({...x,complete:false,coverageProof:null,rows:rows.slice(0,10)})
assert.equal(partial.pairs[0].full,false);assert.equal(partial.pairs[0].overlap,null)
assert(Math.abs(partial.pairs[0].identifiedCoverage[0]-1)<1e-10,'Partial original weights are never rescaled')
console.log('Native index contracts: exact share, benchmark, source, full census, original weights and same-date identities required; unsupported full Europe/PEA references refused; observed partial weights retained.')

const issuerFixtures=JSON.parse(gunzipSync(readFileSync('scripts/fixtures/invesco-economic-index/public-index-books.json.gz'))).books
// Test control clock only: the fixture does not fabricate a source checkedAt.
const issuerNow=new Date('2026-10-30T18:00:00Z')
for(const [isin,f]of Object.entries(issuerFixtures)){
 const h={...f.qualifiedRecord,checkedAt:'2026-10-30T17:00:00Z'},share=contracts.shares[isin],index=contracts.indices[share.indexId]
 assert(qualifiedNativeIndexComposition(h,isin,issuerNow),isin+' exact issuer-published index contract')
 assert(qualifiedNativeIndexComposition(projectDcaHoldings(h,true,h.sourceUrl),isin,issuerNow),'All benchmark and census evidence survives lazy projection')
 const q=qualifyHoldings(h,{isin},{isin,synthetic:true},issuerNow)
 assert.equal(q.valid,true);assert.equal(q.complete,false,'Original slight excess above 100% must still refuse full overlap')
 assert(q.reasons.some(r=>r.includes('dépasse 100')))
 assert.equal(q.sourceCoverage,h.rows.reduce((s,r)=>s+r.weightPct,0),'No rounding or scaling to obtain admission')
 for(const patch of [
  {basis:'fund'},{indexId:'topix'},{methodCode:'invesco-physical-fund-exposure-v1'},
  {sourceUrl:index.weightSourceUrl.replace('/index?','/fund?')},{metadataSourceUrl:'https://issuer.example/metadata'},
  {metadataSha256:null},{metadataAsOf:'2026-10-01'},{shareSha256:null},{shareAsOf:'2026-01-01'},
  {checkedAt:'2026-10-31T00:00:00Z'},{identityAsOf:'2026-10-01'},{identitySha256:'f'.repeat(64)},
  {rows:h.rows.slice(0,10)},{rows:[h.rows[0],h.rows[0],...h.rows.slice(2)]},
  {coverageProof:{...h.coverageProof,normalizationApplied:true}},
  {coverageProof:{...h.coverageProof,publisherRowCount:10}},
  {coverageProof:{...h.coverageProof,separateSubstituteBasketPublished:false}},
  ...(share.shareDocumentDiscoveryUrl?[{shareDiscoverySha256:null},{shareDiscoverySourceUrl:'https://another.example/'}]:[]),
 ])assert.equal(qualifiedNativeIndexComposition({...h,...patch},isin,issuerNow),false,JSON.stringify(patch))
}
console.log('Issuer economic-index references: 600/101 actual original rows, exact benchmarks, delayed dates and separate baskets; existing full-overlap excess guard unchanged.')
