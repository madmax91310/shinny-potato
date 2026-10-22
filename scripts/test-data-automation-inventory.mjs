import assert from 'node:assert/strict'
import {workflowInfo,peaInventory,buildDataAutomationInventory} from './data-automation-inventory.mjs'
const workflow=workflowInfo('.github/workflows/test.yml',`name: Test
on:
  schedule:
    - cron: '0 9 * * *'
  pull_request:
    paths: ['src/data/manual.json']
jobs:
  collect:
    steps:
      - run: python scripts/collect.py
      - run: bash scripts/commit-validated-data.sh 'Refresh' src/data/automatic.json
`)
assert.deepEqual(workflow.outputs,['src/data/automatic.json'],'a PR path filter must not certify an automatic writer')
assert.deepEqual(workflow.crons,['0 9 * * *'])
const proof={value:false,sourceUrl:'https://example.com/exact',checkedAt:'2026-10-19',sha256:'a'.repeat(64)}
const rows=peaInventory({a:{pea:proof},b:{pea:{...proof,value:null}},c:{pea:{...proof,sha256:null}},d:{}},{d:{errors:[{field:'pea',qualificationRequired:true,sources:[{value:true},{value:false}]}]}})
assert.equal(rows[0].qualified,true,'explicit false is a qualified statement')
assert.equal(rows[0].value,false)
assert.equal(rows[1].qualified,false,'null is not a negative statement')
assert.equal(rows[2].qualified,false,'a proof without a digest is unqualified')
assert.equal(rows[3].state,'source-conflict')
assert.equal(rows[3].value,null)
const report=buildDataAutomationInventory()
assert.equal(report.fields.length,report.summary.catalogFields)
assert.equal(report.summary.peaQualified+report.summary.peaRemaining,report.pea.length)
assert(report.fields.every(f=>f.qualification==='source-configuration-only'))
assert(report.registries.some(r=>r.path==='src/data/automated-instrument-metadata.json'&&r.mode==='scheduled-output'))
assert(report.registries.some(r=>r.path==='src/pages/portfolio-generator/theses.js'))
assert(report.registries.some(r=>r.path==='src/pages/dca-profiles/catalog.json'),'page-specific projections must remain in the inventory')
const held=peaInventory({a:{pea:proof}},{a:{errors:[{field:'pea',qualificationRequired:true,sources:[{value:true},{value:false}]}]}})[0]
assert.equal(held.qualified,false,'a retained proof cannot resolve a known conflict')
assert.equal(held.value,null)
for(const field of report.fields)assert.equal(new Set(field.numericPaths).size,field.numericPaths.length)
assert(report.fields.some(f=>f.numericPaths.some(p=>p.includes('[]'))),'array paths must be compacted without losing their numeric nature')
console.log('Inventory: writer allowlists, null/false/proof semantics, source conflicts, coverage and array paths passed.')

assert.equal(report.assets.length,report.summary.assetAutomation.profiles,'read-only inventory and written inventory share the same field certification')

for (const r of report.registries.filter(r=>/holdings-\d+\.json$/.test(r.path))) assert(r.consumers.length>0, `Dynamic fragment has real consumers: ${r.path}`)
assert(report.registries.find(r=>r.path==='src/data/dca-complete-holdings.json').dynamicBindings.length)
assert(report.fields.filter(f=>f.consumers.some(c=>c.path==='/impact-frais')).every(f=>['Identité','Frais annuels (%)'].includes(f.field)))
const {sourceConditions}=await import('./lib/source-conditions.mjs')
assert.equal(sourceConditions('https://new-source.test/http-200').reuseStatus,'unverified')
assert.equal(sourceConditions('https://new-source.test/http-200').license,null)
assert(report.fields.every(f=>Array.isArray(f.sourceConditions)))

const gold=JSON.parse((await import('node:fs')).readFileSync('src/data/worldbank-gold-monthly.json'))
assert.equal(sourceConditions(gold.url).license,gold.license)
assert.equal(sourceConditions('https://thedocs.worldbank.org/another-dataset').license,null,'A dataset licence cannot be generalized to a whole domain')
