import assert from 'node:assert/strict'
import {workflowRetirement} from '../src/lib/automation-retirement.js'
import {buildInbox} from '../src/pages/data-review/review-inbox.js'

const workflow='update-editorial-radar.yml'
const service={id:'collection:radar:insee',workflow,dataId:'radar:insee',name:'Radar source',tools:['Radar éditorial'],kind:'collection',cause:'HTTP 403'}
const shared={...service,id:'collection:shared',tools:['Radar éditorial','Pouvoir d’achat']}
const unknown={...service,id:'collection:unknown',dataId:'fund:holdings',tools:[]}
const conflict={...shared,id:'radar:shared',workflow:undefined,kind:'conflict',impactScope:'asset'}
for (const row of [service,{...service,dataId:'radar-source:insee-studies'},{id:'monitor:radar'},{id:'monitor:radar-proofs',tools:['Données à revoir']},{workflow,id:'workflow:'+workflow},{workflow:'update-ai-portfolios.yml'}]) assert(workflowRetirement(row),JSON.stringify(row))
for (const row of [shared,unknown,conflict,{...service,impactScope:'asset'},{workflow:'active.yml',tools:['Radar éditorial']}]) assert.equal(workflowRetirement(row),null,JSON.stringify(row))

const active=Object.fromEntries([service,shared,unknown,conflict,{...service,id:'monitor:radar',workflow:undefined}].map(r=>[r.id,r]))
const status={schemaVersion:1,workflows:{},monitoring:{schemaVersion:1,checkedAt:'2026-11-10T12:00:00Z',active,resolved:[]}}
const before=JSON.stringify(status)
const result=buildInbox({status,now:Date.parse('2026-11-10T12:01:00Z')})
const signals=result.issues.flatMap(r=>r.signals)
for (const row of [shared,unknown,conflict]) assert(signals.some(r=>r.id===row.id&&r.kind!=='not-applicable'),row.id)
for (const row of [service,active['monitor:radar']]) assert(signals.some(r=>r.id==='retired:'+row.id&&r.kind==='not-applicable'),row.id)
assert.equal(JSON.stringify(status),before,'Rendering a withdrawal must preserve source observations')
console.log('Radar retirement: service withdrawal, shared and unknown fields, financial conflicts, historical visibility passed.')
