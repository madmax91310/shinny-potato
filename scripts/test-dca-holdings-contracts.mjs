import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {projectDcaHoldings,isSyntheticReplication} from './lib/dca-holdings-projection.mjs'
import {portfolioAnalytics} from '../src/pages/dca-profiles/analytics.js'
const now=new Date('2026-10-29T12:00:00Z'),asOf='2026-10-28',sourceUrl='https://issuer.example/full'
const a='US0378331005',b='US5949181045'
const h={asOf,sourceUrl,checkedAt:'2026-10-29T10:00:00Z',sha256:'f'.repeat(64),method:'Official original NAV weights',basis:'fund',complete:true,rows:[{isin:a,name:'Apple',weightPct:60},{isin:b,name:'Microsoft',weightPct:40}]}
const refs={x:{isin:'IE00B4L5Y983'},y:{isin:'IE00B5BMR087'},z:{isin:a,name:'Apple',kind:'equity',countries:{asOf,sourceUrl}}}
const lines=[{asset:'x',isin:refs.x.isin,label:'X',weight:40},{asset:'y',isin:refs.y.isin,label:'Y',weight:40},{asset:'z',isin:a,label:'Apple',weight:20}]
const result=(x=h,y=h,r=refs)=>portfolioAnalytics(lines,r,{x,y},now)
assert.equal(result().pairs[0].overlap,100)
assert.equal(result().groups[0].coverage,100)
assert.equal(result().groups[0].rows.find(r=>r.isin===a).weight,68)
for(const bad of [{...h,complete:false},{...h,approximation:true},
 {...h,rows:[{isin:a,name:'Apple',weightPct:60},{isin:b,name:'Microsoft',weightPct:39.4}]},
 {...h,rows:[{isin:a,name:'Apple',weightPct:60},{isin:b,name:'Microsoft',weightPct:40.2}]},
 {...h,rows:[{isin:a,name:'Apple',weightPct:99.9},{isin:null,name:'Unidentified',weightPct:.1}]}]){
 const tested=result(bad)
 assert.equal(tested.pairs[0].overlap,null)
 assert.equal(tested.groups[0].complete,false,'Concentration and overlap share their source completeness gate')
}
const stale=result({...h,asOf:'2026-01-01'})
assert(stale.unavailable.includes('X'));assert.equal(stale.groups[0].coverage,60)
const incompatible=result({...h,asOf:'2026-08-20'})
assert(!incompatible.pairs.some(p=>p.left==='X'&&p.right==='Y'))
assert.equal(incompatible.groups.length,2)
const mixed=result({...h,basis:'index',scope:'equity-index',complete:false})
assert(!mixed.pairs.some(p=>p.left==='X'&&p.right==='Y'))
assert.equal(mixed.groups.length,2)
assert(result({...h,basis:'index',scope:'equity-index'}).unavailable.includes('X'),'An unqualified full index cannot be manufactured from a fund record')
const synthetic=result(h,h,{...refs,x:{...refs.x,synthetic:true}})
assert(synthetic.unavailable.includes('X'),'Reference-side synthetic flag cannot be bypassed by a supplied basket')
for(const name of ['Synthétique','Synthetic','Indirect(Swap Based)','indirect'])assert(isSyntheticReplication('',name))
assert.equal(isSyntheticReplication('World','Physical'),false)
assert.equal(projectDcaHoldings(h,true,sourceUrl),null)
const index={...h,basis:'index',scope:'equity-index',indexId:'topix',index:'TOPIX'}
assert.deepEqual(projectDcaHoldings(index,true,sourceUrl),{...index,synthetic:true})
const direct=projectDcaHoldings(h,false,sourceUrl)
for(const key of ['checkedAt','asOf','sha256','method'])assert.equal(direct[key],h[key])
const outside=result(h,h,{...refs,x:{...refs.x,outsideClassification:'Obligations'}})
assert.equal(outside.groups[0].coverage,60)
assert(!outside.pairs.some(p=>p.left==='X'))
// Exact securities remain distinct; company aggregation alone uses the reviewed registry.
const alphaA='US02079K3059',alphaC='US02079K1079'
const left={...h,rows:[{isin:alphaA,name:'Alphabet A',weightPct:100}]}
const right={...h,rows:[{isin:alphaC,name:'Alphabet C',weightPct:100}]}
const shares=result(left,right)
assert.equal(shares.pairs[0].common.length,0)
assert.equal(shares.pairs[0].companyCommon.length,1)
assert.equal(shares.pairs[0].overlap,100)
const adr=result({...h,rows:[{isin:'US8740391003',name:'TSMC ADR',weightPct:100}]},{...h,rows:[{isin:'TW0002330008',name:'TSMC ordinary',weightPct:100}]})
assert.equal(adr.pairs[0].common.length,0,'ADR and ordinary are distinct securities')
assert.equal(adr.pairs[0].companyCommon.length,1,'Only the independently reviewed TSMC issuer relationship groups them')
assert.equal(adr.pairs[0].overlap,100)
const sameName=result({...h,rows:[{isin:a,name:'Same company',weightPct:100}]},{...h,rows:[{isin:b,name:'Same company',weightPct:100}]})
assert.equal(sameName.pairs[0].overlap,0,'Names never establish security or company equivalence')
const canonical=JSON.parse(readFileSync('src/data/dca-complete-holdings.json'))
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const projection=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
for(const [asset,isin] of [['world','IE00B4L5Y983'],['sp500','IE00B5BMR087'],['nasdaq','IE00B53SZB19'],['cloud','IE00BJGWQN72']]){
 for(const key of ['asOf','checkedAt','sha256','method'])assert.equal(projection[asset][key],canonical[isin][key],`${asset}: ${key}`)
}
console.log('Holdings contracts: shared completeness, real source metadata, stale/incompatible/neutral/synthetic safeguards, exact identifiers and no double counting verified.')

// Same actual World Small Cap photograph before/after the documented Akero
// cash-only right qualification. Never zero, renormalise or map it to Novo.
{
 const {gunzipSync}=await import('node:zlib')
 const fixture=JSON.parse(gunzipSync(readFileSync('scripts/fixtures/qualified-cash-rights/IE00BF4RFH31-qualified.json.gz')))
 const {qualifyHoldings}=await import('../src/pages/dca-profiles/holdings-qualification.js')
 const now=new Date('2026-11-13T15:00:00Z'),isin='IE00BF4RFH31',ref={isin},line={isin}
 const previous=qualifyHoldings(fixture.previous,line,ref,now),qualified=qualifyHoldings(fixture.record,line,ref,now)
 assert.equal(previous.complete,false);assert.equal(qualified.complete,true)
 assert.equal(qualified.unidentifiedCoverage,0)
 assert.ok(Math.abs(previous.sourceCoverage-qualified.sourceCoverage-.0003)<1e-9)
 assert.ok(Math.abs(qualified.sourceCoverage-99.58645)<1e-9)
 assert.equal(fixture.record.navReconciliation.normalizationApplied,false)
 assert.equal(fixture.record.qualifiedExcludedPositions[0].sourcePosition.weightPct,.0003)
 const refs={x:ref,y:{isin:'IE00BSPLC413'}},lines=[{asset:'x',isin,label:'Small',weight:50},{asset:'y',isin:refs.y.isin,label:'Value',weight:50}],observations={x:fixture.record,y:canonical[refs.y.isin]}
 const a=portfolioAnalytics(lines,refs,observations,now),b=portfolioAnalytics([...lines].reverse(),refs,observations,now)
 assert.equal(a.pairs[0].full,true);assert.ok(Number.isFinite(a.pairs[0].overlap));assert.deepEqual(a.pairs,b.pairs)
 assert(!a.pairs[0].companyCommon.some(row=>row.name==='AKERO THERAPEUTICS CVR'))
 console.log('World Small Cap: qualified cash right retained with original NAV; full company overlap restored on the real source fixture; order invariant.')
}

{
 const {gunzipSync}=await import('node:zlib')
 const fixture=JSON.parse(gunzipSync(readFileSync('scripts/fixtures/qualified-cash-rights/IE00BYXG2H39-qualified.json.gz')))
 const {qualifyHoldings}=await import('../src/pages/dca-profiles/holdings-qualification.js')
 const now=new Date('2026-11-13T15:00:00Z'),isin='IE00BYXG2H39',ref={isin}
 assert.equal(qualifyHoldings(fixture.previous,{isin},ref,now).complete,false)
 assert.equal(qualifyHoldings(fixture.record,{isin},ref,now).complete,true)
 assert.equal(fixture.record.qualifiedExcludedPositions.length,2)
 assert.equal(fixture.record.navReconciliation.normalizationApplied,false)
 const refs={x:ref,y:{isin:'IE00BYZK4776'}},lines=[{asset:'x',isin,label:'Biotech',weight:50},{asset:'y',isin:refs.y.isin,label:'Healthcare',weight:50}],observations={x:fixture.record,y:canonical[refs.y.isin]}
 const a=portfolioAnalytics(lines,refs,observations,now),b=portfolioAnalytics([...lines].reverse(),refs,observations,now)
 assert.equal(a.pairs[0].full,true);assert.ok(Number.isFinite(a.pairs[0].overlap));assert.deepEqual(a.pairs,b.pairs)
 console.log('Biotech: both documented cash-only rights retained outside company shares; complete overlap restored on exact native fixture.')
}
