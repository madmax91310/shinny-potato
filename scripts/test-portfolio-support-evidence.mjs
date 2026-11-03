import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import {gunzipSync}from'node:zlib'
import {assertQualifiedManualSupport}from'./lib/portfolio-support-evidence.mjs'
const fixture=JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/portfolio-support/panx-ordinary-40981492633.json.gz',import.meta.url))))
const years=[2020,2021,2022,2023,2024,2025]
function inputs(){const{raw,projection}=structuredClone(fixture),asset={id:'manual-'+raw.isin,isin:raw.isin,automatedManual:true,manualOnly:true,returnCurrency:projection.currency,calendarReturns:projection.years,r:projection.values};return{asset,options:{candidates:[structuredClone(asset)],projections:{[asset.isin]:projection},histories:{[raw.id]:raw},calendarYears:years}}}
const check=i=>assertQualifiedManualSupport(i.asset,i.options)
assert.equal(check(inputs()).kind,'qualified-manual-market-history')
for(const kind of['unregistered','automatic','currency','isin','price','listing','digest','returns','source','excluded-window']){
 const i=inputs(),p=i.options.projections[i.asset.isin],r=Object.values(i.options.histories)[0]
 if(kind==='unregistered')i.options.candidates=[]
 if(kind==='automatic')i.asset.manualOnly=false
 if(kind==='currency')i.asset.returnCurrency='USD'
 if(kind==='isin')r.isin='FR0011871110'
 if(kind==='price')r.field='close'
 if(kind==='listing')r.listingEvidenceId=''
 if(kind==='digest')r.responseSha256=''
 if(kind==='returns')i.asset.calendarReturns['2025']+=.01
 if(kind==='source')p.source='https://unrelated.invalid/another-part'
 if(kind==='excluded-window')r.historyUnqualifiedReturnWindows=[{start:'2024-12',end:'2025-12',reason:'Isolated regression case'}]
 assert.throws(()=>check(i),undefined,kind)
}
// Reject the affected year, retain the independently qualified periods.
const i=inputs(),r=Object.values(i.options.histories)[0],p=i.options.projections[i.asset.isin]
r.historyUnqualifiedReturnWindows=[{start:'2024-12',end:'2025-12',reason:'Isolated regression case'}]
delete p.years['2025'];p.values[5]=null;i.asset.calendarReturns=structuredClone(p.years);i.asset.r=[...p.values];i.options.candidates=[structuredClone(i.asset)]
assert.equal(check(i).isin,'FR0013412269')
console.log('Manual support evidence: exact market record admitted;10invalid admissions rejected; valid years preserved.')
