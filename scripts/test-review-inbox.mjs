import assert from 'node:assert/strict'
import './test-review-reliability-report.mjs'
import fs from 'node:fs'
import {reviewInboxProjection} from './build-data-review-inbox.mjs'
import {buildInbox,monitorHealth,projectionHealth,monitorExecutionHealth,inboxDiagnostic}from '../src/pages/data-review/review-inbox.js'
const read=p=>JSON.parse(fs.readFileSync(p))
const inventory=read('public/data/data-automation-inventory.json'),coverage=read('public/data/asset-field-coverage.json'),financial=read('public/data/financial-reconciliation.json')
const status={schemaVersion:1,workflows:{},monitoring:{schemaVersion:1,checkedAt:'2026-10-24T12:00:00Z',active:{},resolved:[]}}
const now=Date.parse('2026-10-24T12:30:00Z'),args={status,inventory,coverage,financial,now}
const result=buildInbox(args),signals=result.issues.flatMap(r=>r.signals)
assert(result.health.ok)
for(const r of inventory.backlog)assert(signals.some(s=>s.id===`connection:${r.type}:${r.id}:${r.field}`),`Missing backlog case ${r.id}:${r.field}`)
for(const t of inventory.consumerUsage.tools)for(const r of t.rows)if(r.required&&!['connected','not-required'].includes(r.state))assert(signals.some(s=>s.id===`usage:${t.path}:${r.id}:${r.key}`))
for(const r of financial.rows)if(r.open||r.residualOpen)assert(signals.some(s=>s.id==='financial:'+r.id))
for(const r of coverage.rows)if(r.state==='not-applicable')assert(signals.some(s=>s.id===`coverage:${r.type}:${r.id}:${r.field}`&&s.kind==='not-applicable'))
assert(!monitorHealth({...status,monitoring:null},now).ok)
assert(!monitorHealth({...status,monitoring:{...status.monitoring,checkedAt:'2026-10-20'}},now).ok)
assert(!monitorHealth({...status,monitoring:{...status.monitoring,active:[]}},now).ok)
assert(!monitorHealth({...status,reportArchiveSchemaVersion:99},now).ok,'Unknown archive formats cannot produce reassuring supervision')
assert(buildInbox({...args,failures:{financial:'Rapport illisible'}}).issues.some(r=>r.id==='health:financial'))
assert(result.issues.some(r=>r.id.startsWith('coverage:')&&r.kind==='qualification'))
assert.equal(monitorExecutionHealth({workflow_runs:[{id:1,head_branch:'master',event:'schedule',status:'completed',conclusion:'success'}]}),null)
assert.match(monitorExecutionHealth({workflow_runs:[{id:2,head_branch:'master',event:'schedule',status:'completed',conclusion:'failure',html_url:'run'}]}),/échec/)
assert.match(monitorExecutionHealth({}),/invalide/)
const r=result.issues.find(r=>r.signals.some(s=>s.asOf));assert(inboxDiagnostic(r).includes('Dernière donnée valide'))
assert.equal(result.examinedFields,coverage.rows.length)
console.log(JSON.stringify({issues:result.issues.length,signals:signals.length,coverageFields:coverage.rows.length,financialCases:financial.rows.filter(r=>r.open||r.residualOpen).length,consumerTools:inventory.consumerUsage.tools.length}))

const compact=reviewInboxProjection(inventory),projected=buildInbox({...args,inventory:compact})
assert.deepEqual(projected,result,'The compact consumer document preserves every issue, signal, date, cause, tool and source')
assert(Buffer.byteLength(JSON.stringify(compact))<2_000_000,'Primary review payload stays below 2 MB without truncating records')
console.log('Compact review projection: exhaustive model parity and payload budget verified.')

assert.equal(projectionHealth({inventoryBlobSha:'a'.repeat(40)},{files:{'public/data/data-automation-inventory.json':'a'.repeat(40)}}),null)
assert.match(projectionHealth({inventoryBlobSha:'b'.repeat(40)},{files:{'public/data/data-automation-inventory.json':'a'.repeat(40)}}),/différente/)

const merged=buildInbox({...args,status:{...status,monitoring:{...status.monitoring,active:{
 a:{id:'field:gap:instrument:IE0000000000:completeHoldings',name:'Fund',kind:'review',tools:['Tool'],field:'Composition',cause:'Qualification générale'},
 b:{id:'collection:update-qualified-exposures.yml:dca-holdings:IE0000000000',dataId:'dca-holdings:IE0000000000',name:'Fund',kind:'collection',tools:['Tool'],field:'Composition',cause:'Exact HTTP 403'}
}}}}).issues.filter(r=>r.id==='instrument:IE0000000000:completeHoldings')
assert.equal(merged.length,1);assert.equal(merged[0].signals.length,2);assert.equal(merged[0].cause,'Exact HTTP 403')

const pending=buildInbox({...args,status:{...status,inFlightRuns:{'101:1':{workflow:'update-scpi.yml',run:{id:101,status:'in_progress',html_url:'https://github.com/test/repo/actions/runs/101'},sourceProofCaptured:true,checkedAt:'2026-10-24T12:00:00Z'}}}}).issues.find(r=>r.id==='running:101:1')
assert.equal(pending.kind,'waiting');assert.equal(pending.asOf,undefined);assert.match(pending.cause,/terminée/)

const selfRecord={runUrl:'https://github.com/test/repo/actions/runs/1',completedAt:'2026-10-24T10:00:00Z',failedChecks:{write:{step:'Initialise current statuses',failedAt:'2026-10-24T10:00:00Z'}}}
const selfModel=record=>buildInbox({...args,status:{...status,monitorSelf:{schemaVersion:1,failures:{'1:1':record}}}}).issues.find(r=>r.id==='self-history:1:1')
assert.equal(selfModel(selfRecord).kind,'monitoring')
assert.equal(selfModel({...selfRecord,resolvedAt:'2026-10-24T11:00:00Z',resolutionEvidence:{kind:'matching-ordinary-monitor-steps',checks:[{runId:2,kind:'ordinary-monitor-step',step:'Initialise current statuses',checkedAt:'2026-10-24T11:00:00Z',runUrl:'https://github.com/test/repo/actions/runs/2'}]}}).kind,'history')

assert.equal(selfModel({...selfRecord,resolvedAt:'2026-10-24T11:00:00Z',resolutionEvidence:{kind:'matching-ordinary-monitor-steps',checks:[]}}).kind,'monitoring')

assert(buildInbox({...args,status:{...status,monitorSelf:{schemaVersion:1,failures:{bad:{failedChecks:{x:null}}}}}}).issues.some(r=>r.id==='health:self-history:bad'))

assert.equal(selfModel({...selfRecord,qualificationPending:true}).kind,'qualification')

const malformedProducer=buildInbox({...args,status:{...status,workflows:{'update-bitcoin-monthly.yml':{reportEvidenceHistory:[null],legacyReportCoverage:{wrong:'shape'}}}}})
assert(malformedProducer.issues.some(r=>r.id==='legacy-coverage:update-bitcoin-monthly.yml:0'),'An unreadable producer contract stays visible without stopping financial or consumer diagnostics')
assert(malformedProducer.issues.some(r=>r.signals.some(s=>s.id.startsWith('financial:'))))
