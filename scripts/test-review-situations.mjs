import assert from 'node:assert/strict'
import {buildInbox,issueKind,projectionHealth} from '../src/pages/data-review/review-inbox.js'
import {initialIssue,financialImpact,summarizeInbox} from '../src/pages/data-review/review-summary.js'
import {groupReviewIssues} from '../src/pages/data-review/review-causes.js'

const now=Date.parse('2026-11-02T06:00:00Z')
const monitoring={schemaVersion:1,checkedAt:'2026-11-02T05:46:00Z',active:{},resolved:[]}
const status={schemaVersion:1,workflows:{},monitoring}
const run=extra=>buildInbox({status,now,...extra})
const archive={id:'old',name:'Old source',field:'Value',resolvedAt:'2026-10-30',cause:'Old failure'}
let report=run({status:{...status,monitoring:{...monitoring,resolved:[archive]}}})
const old=report.issues.find(r=>r.id==='history:old:2026-10-30')
assert.equal(old.kind,'archive');assert(!initialIssue(old));assert.equal(old.signals.length,1)
assert.equal(issueKind('check-overdue'),'due')
assert.equal(issueKind('collection-error'),'failure')

const failed={id:'attempt:1',kind:'collection',name:'Current source',field:'Value',tools:['Unproven tool'],cause:'HTTP 403',asOf:'2026-09',lastSuccessAt:'2026-10-01',attemptedAt:'2026-11-02T05:00:00Z',runId:12,attempt:2}
const due={id:'field:instrument:IE0000000000:aum',kind:'freshness',category:'check-overdue',name:'Current source',field:'Value',asOf:'2026-09',cause:'Due'}
report=run({status:{...status,monitoring:{...monitoring,active:{failed,due}}}})
const failure=report.issues.find(r=>r.signals.some(s=>s.id===failed.id))
assert.equal(failure.kind,'failure');assert.equal(failure.asOf,'2026-09');assert.equal(failure.lastSuccessAt,'2026-10-01')
assert.deepEqual(failure.tools,[],'The collector perimeter does not establish affected tools')
assert.deepEqual(failure.signals[0].collectorTools,['Unproven tool'])
assert.equal(report.issues.filter(r=>r.kind==='due').length,1,'A failed attempt does not absorb the freshness problem')
assert.equal(run({status:{...status,monitoring:{...monitoring,active:{due}}}}).issues.filter(r=>r.kind==='failure').length,0)

const financial={id:'IE0000000000/2014',isin:'IE0000000000',year:2014,name:'Old year',open:true,currentConsumer:{windows:[{id:'nav',currency:'EUR',convention:'fund-nav-total-return',qualification:{qualified:false,reason:'2014-12 missing'}}]}}
assert.equal(financialImpact(financial).state,'blocked')
report=run({financial:{rows:[financial]}})
assert.equal(report.issues.find(r=>r.id==='financial:'+financial.id).kind,'qualification','An old year can still block current calculations')
const valid={id:'independent',qualification:{qualified:true}}
assert.equal(financialImpact({...financial,currentConsumer:{windows:[...financial.currentConsumer.windows,valid]}}).state,'partial')
assert.equal(financialImpact({...financial,currentConsumer:{windows:[valid]}}).kind,'archive')
assert.equal(financialImpact({...financial,currentConsumer:null}).state,'unqualified')

const field={key:'coverage:aum',label:'AUM',present:false,actionState:'missing',asOf:'2026-09',currency:'EUR',scope:'Exact share',method:'Net assets',checkedAt:'2026-10-01'}
const inventory={assets:[{id:'IE0000000000',name:'Fund',fields:[field]}],consumerUsage:{tools:['/one','/two'].map(path=>({path,name:path,rows:[{id:'IE0000000000',key:field.key,required:true,state:'blocked'}]}))}}
report=run({inventory})
const consumer=report.issues.filter(r=>r.signals.some(s=>s.consumerContract))
assert.equal(consumer.length,1,'Same typed field and snapshot consumed by two tools is one point')
assert.equal(consumer[0].signals.length,2);assert.equal(report.summary.consumerContracts,2)
assert.deepEqual(report.summary.consumerStates,{blocked:2})
assert.equal(summarizeInbox(consumer).points,1)

const coverageRow={id:'IE0000000000',type:'instrument',field:'aum',name:'Fund',state:'missing',asOf:'2026-09',currency:'EUR',scope:'Exact share',method:'Net assets',checkedAt:'2026-10-01'}
report=run({coverage:{rows:[coverageRow]},inventory:{backlog:[{...coverageRow,actionState:'missing'}]}})
const same=report.issues.filter(r=>r.signals.some(s=>s.asset===coverageRow.id))
assert.equal(same.length,1);assert.equal(same[0].signals.length,2,'Backlog and coverage with the exact full identity keep both signals')
for(const different of [{asOf:'2026-10'},{currency:'USD'},{method:'Gross assets'},{scope:'Fund, not share'}]){
 const split=run({coverage:{rows:[coverageRow]},inventory:{backlog:[{...coverageRow,...different,actionState:'missing'}]}})
 assert.equal(split.issues.filter(r=>r.signals.some(s=>s.asset===coverageRow.id)).length,2,'Different identity dimensions stay separate')
}
assert.equal(groupReviewIssues([{id:'a',cause:'HTTP 403'},{id:'b',cause:'HTTP 403'}]).size,2)
const common={kind:'failure',workflow:'one.yml',runId:7,stage:'Validation',failedSteps:[{job:'validate',step:'Check exact input'}]}
assert.equal(summarizeInbox(['a','b'].map(id=>({...common,id,signals:[{id}]}))).commonInterventions,1)

assert(run({status:{...status,monitoring:{...monitoring,checkedAt:'2020-01-01'}}}).issues.some(r=>r.id==='health:monitor'&&initialIssue(r)))
assert(projectionHealth({inventoryBlobSha:'a'.repeat(40)},{files:{'public/data/data-automation-inventory.json':'b'.repeat(40)}}))
console.log('Review situations: archive/current window, due/attempt, retained value, strict identities, consumer denominators, common interventions and stale monitoring verified.')
