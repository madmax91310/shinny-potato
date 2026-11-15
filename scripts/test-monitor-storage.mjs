import assert from 'node:assert/strict'
import {gzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {decodeMonitorStorage} from '../src/lib/monitor-storage.js'
const state = {schemaVersion: 1, workflows: {test: {status: 'failure', errors: [{id:'exact:field', checkedAt:null}]}}, monitoring: {active:{original:{cause:'échec'}}, resolved:[]}}
function envelope(value=state) {
  const raw = Buffer.from(JSON.stringify(value))
  return {schemaVersion:2, monitorStorage:'gzip+base64-v1', decodedBytes:raw.length, sha256:createHash('sha256').update(raw).digest('hex'), data:gzipSync(raw).toString('base64')}
}
assert.equal(await decodeMonitorStorage(state), state)
assert.deepEqual(await decodeMonitorStorage(envelope()), state)
for (const change of [{schemaVersion:3}, {sha256:'0'.repeat(64)}, {decodedBytes:1}, {decodedBytes:2**29}, {data:'!'}, {extra:true}, {monitorStorage:'unknown'}, {data:envelope().data+'\n'}]) await assert.rejects(decodeMonitorStorage({...envelope(), ...change}))
await assert.rejects(decodeMonitorStorage(envelope(envelope())))
for (const suffix of [Buffer.from('trailing'), gzipSync(Buffer.from('{}'))]) await assert.rejects(decodeMonitorStorage({...envelope(), data:Buffer.concat([Buffer.from(envelope().data,'base64'),suffix]).toString('base64')}))
const receipt = {evidence:{file:'observation.json',sha256:'a'.repeat(64)},recordedAt:'2026-11-01T10:00:00Z',runUrl:'https://github.com/owner/repo/actions/runs/123'}
const body = JSON.stringify(receipt), key = createHash('sha256').update(body).digest('hex')
const shared = {...state, proofCheckStorage:'sha256-records-v1', proofCheckRecords:{[key]:body}, workflows:{test:{...state.workflows.test,proofChecks:{first:{proofCheckRef:key},second:{proofCheckRef:key}}}}}
const expected = {...state,workflows:{test:{...state.workflows.test,proofChecks:{first:receipt,second:receipt}}}}
assert.deepEqual(await decodeMonitorStorage(envelope(shared)),expected)
assert.deepEqual(await decodeMonitorStorage(shared),expected)
for (const mutate of [x=>{x.proofCheckRecords[key]+=' '},x=>{x.proofCheckRecords={}},x=>{x.proofCheckStorage='unknown'},x=>{x.workflows.test.proofChecks={}},x=>{x.workflows.test.proofChecks.first.extra=true},x=>{x.proofCheckRecords[key]='null'},x=>{x.workflows.test.proofChecks.first.proofCheckRef=null}]) {
  const bad=structuredClone(shared); mutate(bad); await assert.rejects(decodeMonitorStorage(envelope(bad)))
}
for (const body of ['null','[]','{}','not json']) {
  const hash=createHash('sha256').update(body).digest('hex')
  const bad={...shared,proofCheckRecords:{[hash]:body},workflows:{test:{proofChecks:{invalid:{proofCheckRef:hash}}}}}
  await assert.rejects(decodeMonitorStorage(envelope(bad)))
}
const noRegistry=structuredClone(shared); delete noRegistry.proofCheckRecords; delete noRegistry.proofCheckStorage
await assert.rejects(decodeMonitorStorage(envelope(noRegistry)))
console.log('Monitor transport: exact legacy/compressed values, failures, clocks and scopes; corrupt/oversized/nested/trailing payloads rejected.')

const scope={expectedIds:['part:country','part:sector'],requestedIds:['part:country'],networkRequestedIds:[],reason:'cache sans contrôle source'}
const scopeRaw=Buffer.from(JSON.stringify(scope)),scopeKey=createHash('sha256').update(scopeRaw).digest('hex')
const scopeEntry={decodedBytes:scopeRaw.length,data:gzipSync(scopeRaw).toString('base64')}
const archivedScopes={...shared,reportScopeSchemaVersion:1,reportScopeStorage:'gzip-sha256-scopes-v1',reportScopeArchives:{[scopeKey]:scopeEntry}}
const expectedScopes={...expected,reportScopeSchemaVersion:1,reportScopes:{[scopeKey]:scope}}
assert.deepEqual(await decodeMonitorStorage(envelope(archivedScopes)),expectedScopes)
assert.deepEqual(await decodeMonitorStorage(archivedScopes),expectedScopes)
for(const mutate of [x=>delete x.reportScopeArchives,x=>x.reportScopeStorage='unknown',x=>x.reportScopes={},x=>x.reportScopeArchives[scopeKey].decodedBytes++,x=>x.reportScopeArchives[scopeKey].decodedBytes=8*1024*1024+1,x=>x.reportScopeArchives[scopeKey].data+='\n',x=>x.reportScopeArchives[scopeKey].extra=true,x=>x.reportScopeArchives={['0'.repeat(64)]:scopeEntry}]) {
 const bad=structuredClone(archivedScopes);mutate(bad);await assert.rejects(decodeMonitorStorage(envelope(bad)))
}
for(const suffix of [Buffer.from('trailing'),gzipSync(Buffer.from('{}'))]) {
 const bad=structuredClone(archivedScopes);bad.reportScopeArchives[scopeKey].data=Buffer.concat([Buffer.from(scopeEntry.data,'base64'),suffix]).toString('base64');await assert.rejects(decodeMonitorStorage(envelope(bad)))
}
console.log('Scope archives: exact Python-compatible scopes, partial/cache status, incidents and clocks; corrupt, unknown, mixed, oversized and trailing records rejected.')
