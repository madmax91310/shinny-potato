import assert from 'node:assert/strict'
import {outsideEquityClassification} from './lib/dca-asset-scope.mjs'
import {buildAssetFieldReport} from './report-asset-fields.mjs'
import {references} from '../src/pages/dca-profiles/engine.js'
import {portfolioCompanies} from '../src/pages/dca-profiles/companies.js'
import {publishedExposure} from '../src/pages/dca-profiles/exposure.js'

for(const r of Object.values(references)) {
 if(r.outsideClassification)assert.equal(outsideEquityClassification(r.isin,r.name),r.outsideClassification)
}
const rows=buildAssetFieldReport('2026-10-29').rows
for(const isin of ['IE0008UEVOE0','IE000SNLFDR7']) {
 assert.equal(outsideEquityClassification(isin,'Exact share'),'Obligations')
 assert.equal(references[isin].outsideClassification,'Obligations','Producer must regenerate the actual consumer')
}
const outsideRows=rows.filter(r=>r.field==='completeHoldings'&&outsideEquityClassification(r.id,r.name))
assert(outsideRows.length>=43)
for(const r of outsideRows) {
 assert.equal(r.state,'not-applicable');assert.equal(r.checkedAt,null);assert.equal(r.asOf,null)
 assert.equal(r.present,false);assert.equal(r.automationConfigured,false)
 assert.deepEqual(r.tools,['dca-profiles'])
 assert(rows.some(o=>o.id===r.id&&o.field==='monthly'&&o.state!=='not-applicable'),'Other financial capabilities stay in scope')
}
for(const isin of ['IE000UL6CLP7','IE00B5BMR087','IE00BK5BQT80']) {
 assert.equal(outsideEquityClassification(isin,'Equity fund'),null)
 assert.notEqual(rows.find(r=>r.id===isin&&r.field==='completeHoldings')?.state,'not-applicable')
}
// Even supplied company-like bond rows must not enter the equity-company view.
const now=new Date('2026-10-29T12:00:00Z'),asOf='2026-10-28',sourceUrl='https://example.com/isolated-fixture'
const stock={isin:'IE00B5BMR087',name:'Stock',countries:{asOf,sourceUrl,basis:'fund',compatibility:'fixture',rows:[{name:'France',weightPct:100}]}}
const refs={stock,...Object.fromEntries(['IE0008UEVOE0','IE000SNLFDR7'].map(i=>[i,references[i]]))}
const lines=[{asset:'stock',isin:stock.isin,label:'Stock',weight:60},...['IE0008UEVOE0','IE000SNLFDR7'].map(i=>({asset:i,isin:i,label:i,weight:20}))]
const holdings=Object.fromEntries(Object.entries(refs).map(([id])=>[id,{asOf,sourceUrl,basis:'fund',complete:true,rows:[{isin:'US0378331005',name:'Apple',weightPct:100}]}]))
const companies=portfolioCompanies(lines,refs,holdings,now)
assert.equal(companies.coverage,60);assert.equal(companies.rows[0].weightPct,60)
assert.deepEqual(portfolioCompanies([...lines].reverse(),refs,holdings,now),companies)
const exposure=publishedExposure(lines,refs,'countries',now)
assert.equal(exposure.neutralWeight,40)
assert.equal(exposure.groups[0].rows[0].weight,60)
console.log(`Equity scope: ${outsideRows.length} retained non-applicable field rows; exact iBonds classified, weights and unrelated requirements preserved.`)
