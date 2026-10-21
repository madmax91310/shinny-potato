import assert from 'node:assert/strict'
import {consumerUsage} from './lib/consumer-usage.mjs'
import {groupIncidents} from '../src/pages/data-review/incident-priority.js'
import {buildDataAutomationInventory} from './data-automation-inventory.mjs'
import {hasPhysicalPortfolio} from './lib/physical-replication.mjs'

const field={key:'price',label:'Cours',state:'blocked',consumers:['investment-calculator',{path:'/calculateur-investissement'}],sourceUrls:[],workflows:[]}
const result=consumerUsage([{id:'A',name:'Fixture',fields:[field,{...field,key:'editorial',state:'excluded'}]}])
assert.equal(result.summary.usages,2,'Aliases of the same tool must not duplicate a field obligation')
assert.equal(result.summary.required,1,'Editorial parameters are not market observations')
assert.equal(result.summary.blocked,1,'An uncollected price cannot disappear from the usage report')
assert.equal(consumerUsage([{id:'A',fields:[{...field,consumers:['unknown-tool']}]}]).summary.unmapped,1)
const rows=[{id:'a',workflow:'x',field:'Cours',kind:'collection',cause:'HTTP 403: issuer.example',tools:['A']},{id:'b',workflow:'x',field:'Cours',kind:'collection',cause:'HTTP 403: issuer.example',tools:['B']}]
assert.equal(groupIncidents(rows).length,1)
assert.deepEqual(groupIncidents(rows)[0].tools,['A','B'])
assert.equal(groupIncidents([...rows,{...rows[0],id:'c',cause:'HTTP 403: other.example'}]).length,2,'Different issuer failures remain separate')
const report=buildDataAutomationInventory()
assert(hasPhysicalPortfolio('Optimised','Physical (Optimised sampling)',{issuer:'ssga'}))
assert(!hasPhysicalPortfolio('Optimised','Unknown',{issuer:'ssga'}))
assert(!hasPhysicalPortfolio('Optimised','Synthetic',{issuer:'ssga'}))
assert(!hasPhysicalPortfolio('Synthetic','Physical',{issuer:'ssga'}))
assert(!hasPhysicalPortfolio('Unknown','Physical',{issuer:'ssga'}))
assert.equal(report.consumerUsage.summary.unmapped,0)
assert(!report.fields.some(f=>f.type==='company'),'Retired company accounts must leave the active catalogue')
assert(!report.workflows.some(w=>w.path.endsWith('/update-company-analysis.yml')))
assert(report.consumerUsage.tools.some(t=>t.path==='/france-100-menages'))
assert(report.consumerUsage.tools.some(t=>t.path==='/portefeuilles-investisseurs'))
assert(report.consumerUsage.tools.flatMap(t=>t.rows).some(r=>r.id.startsWith('lexicon:')&&r.required),'Variable regulatory data remain required')
assert(report.consumerUsage.tools.every(t=>!t.path.includes('analyse-entreprise')))
console.log('Consumed fields: required observations, alias deduplication, unknown consumers, retired financial accounts, household/regulatory/13F coverage and incident roots passed.')
