// Reproduce automatic financial promotion without inventing an exposure identity.
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root=mkdtempSync(path.join(tmpdir(),'equity-exposure-qualification-'))
const write=(name,value)=>{const target=path.join(root,name);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,typeof value==='string'?value:JSON.stringify(value))}
try {
 write('package.json',{type:'module'})
 write('scripts/dca-equity-universe.mjs',readFileSync(new URL('dca-equity-universe.mjs',import.meta.url),'utf8'))
 const profiles=[
  {id:'known',name:'Qualified fixture',symbol:'KNOWN',currency:'USD',sourceUrl:'https://example.com/known'},
  {id:'new-company',name:'Newly promoted financial profile',symbol:'NEW',currency:'USD',qualifiedAt:'2026-10-19',sourceUrl:'https://example.com/accounts'},
 ]
 write('src/data/company-profiles.json',profiles)
 // Historical aliases all resolve to the one synthetic qualified fixture.
 write('src/data/market-history.js',"export const ASSETS=new Proxy({}, {get:(_target,key)=>({label:String(key),currency:'USD',isin:'US0378331005'})})")
 write('src/data/company-history.js','export const COMPANY_HISTORY={}')
 for(const file of ['monthly-automation.json','non-bond-monthly-sources.json'])write('scripts/'+file,{series:[]})
 write('scripts/dca-equity-identities.json',{known:'US0378331005'})
 write('scripts/dca-equity-extra-identities.json',{})
 write('scripts/global-equity-candidates.json',{candidates:[]})
 write('src/data/dca-security-classifications.json',{})
 write('src/data/global-equities.json',[])
 const {equityUniverse,equityExposureGaps}=await import(pathToFileURL(path.join(root,'scripts/dca-equity-universe.mjs')).href)
 const eligible=equityUniverse(),all=equityUniverse({includeUnqualified:true})
 assert(eligible.known,'Existing qualified identities remain available')
 assert(all['new-company'],'The promoted financial profile remains discoverable')
 assert(!eligible['new-company'],'Financial-account qualification alone cannot admit an unnamed security to exposures')
 const gap=equityExposureGaps().find(r=>r.id==='new-company')
 assert.equal(gap.state,'unqualified')
 assert.equal(gap.field,'identity')
 assert.equal(gap.sourceUrl,'https://example.com/accounts')
 assert(gap.tools.includes('dca-profiles'))
 assert.deepEqual(JSON.parse(readFileSync(path.join(root,'src/data/company-profiles.json'))),profiles,'The financial-analysis catalogue is preserved')
 write('scripts/dca-equity-extra-identities.json',{'new-company':'US5949181045'})
 assert.equal(equityUniverse()['new-company'].isin,'US5949181045','An explicitly qualified identity can join automatically')
 assert(!equityExposureGaps().some(r=>r.id==='new-company'),'The identity gap resolves once the source mapping exists')
 assert.equal(equityUniverse()['new-company'].countries,undefined,'No country is guessed from the financial profile')
 const report=readFileSync(new URL('report-asset-fields.mjs',import.meta.url),'utf8')
 assert.match(report,/const rows=\[\.\.\.equityExposureGaps\(\)\]/,'Pending identities reach the published data-quality report')
 console.log('Financial promotion preserves company analysis; exposure admission requires an exact identity and reports the pending connection.')
} finally {rmSync(root,{recursive:true,force:true})}
