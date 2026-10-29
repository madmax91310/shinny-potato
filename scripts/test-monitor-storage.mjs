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
console.log('Monitor transport: exact legacy/compressed values, failures, clocks and scopes; corrupt/oversized/nested/trailing payloads rejected.')
