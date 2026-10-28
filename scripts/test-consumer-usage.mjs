import './test-consumer-field-evidence.mjs'
import assert from 'node:assert/strict'
import {consumerUsage} from './lib/consumer-usage.mjs'
import {groupIncidents,incidentPresentations} from '../src/pages/data-review/incident-priority.js'
import {buildDataAutomationInventory} from './data-automation-inventory.mjs'
import {hasPhysicalPortfolio} from './lib/physical-replication.mjs'

const field={key:'price',label:'Cours',state:'blocked',consumers:['investment-calculator',{path:'/calculateur-investissement'}],sourceUrls:[],workflows:[]}
const result=consumerUsage([{id:'A',name:'Fixture',fields:[field,{...field,key:'editorial',state:'excluded'}]}])
assert.equal(result.summary.usages,2,'Aliases of the same tool must not duplicate a field obligation')
assert.equal(result.summary.required,1,'Editorial parameters are not market observations')
assert.equal(result.summary.blocked,1,'An uncollected price cannot disappear from the usage report')
assert.equal(consumerUsage([{id:'A',fields:[{...field,consumers:['unknown-tool']}]}]).summary.unmapped,1)
const steps=[{job:'collect',step:'Read shared response'}]
const rows=[{runId:1,failedSteps:steps,id:'a',workflow:'x',field:'Cours',kind:'collection',cause:'HTTP 403: issuer.example',tools:['A']},{runId:1,failedSteps:steps,id:'b',workflow:'x',field:'Cours',kind:'collection',cause:'HTTP 403: issuer.example',tools:['B']}]
assert.equal(groupIncidents(rows).length,1)
assert.deepEqual(groupIncidents(rows)[0].tools,['A','B'])
assert.equal(groupIncidents([...rows,{...rows[0],id:'c',runId:2,cause:'HTTP 403: other.example'}]).length,2,'Different producer attempts remain separate')
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

const duplicateSignals = ['IE00BJGWQN72','IE00BDVPNG13'].flatMap(isin=>[
 {...rows[0],id:`collection:update-qualified-exposures.yml:dca-holdings:${isin}`,tools:['A'],sourceUrls:['https://issuer.example/a']},
 {...rows[1],id:`field:instrument:${isin}:completeHoldings`,tools:['B'],cause:'Different diagnostic retained',sourceUrls:['https://issuer.example/b']}
])
const presentations=incidentPresentations(duplicateSignals)
assert.equal(presentations.length,2)
assert.deepEqual(presentations.flatMap(r=>r.signals.map(s=>s.id)).sort(),duplicateSignals.map(r=>r.id).sort())
assert(presentations.every(r=>r.tools.length===2&&r.sourceUrls.length===2))
assert.equal(incidentPresentations([...duplicateSignals,{...rows[0],id:'field:instrument:IE00BJGWQN72:topHoldings'}]).length,3)
assert(duplicateSignals.every(r=>!r.signals),'No mutation of monitoring history')
