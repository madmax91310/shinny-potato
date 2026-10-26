import assert from 'node:assert/strict'
import { DRAFTS_KEY, LAST_PUBLICATION_KEY, readBankRecord, saveBankRecord } from '../src/pages/tweet-bank/storage.js'

const data = new Map(), writes = []
const storage = { getItem: key => data.get(key) ?? null, setItem: (key, raw) => { writes.push([key,raw]); data.set(key,raw) } }
const legacy = {
  '1': { text: 'Mon ancien texte', asOf: '2026-09-01', checkedAt: null, verifiedText: null, verifiedAsOf: null },
  'unknown-future-id': { text: 'Ne pas supprimer', futureField: { preserved: true } },
}
data.set(DRAFTS_KEY, JSON.stringify(legacy))
data.set(LAST_PUBLICATION_KEY, JSON.stringify({'1':'2026-09-01',unknown:'2026-09-02'}))
const drafts = readBankRecord(DRAFTS_KEY, storage), dates = readBankRecord(LAST_PUBLICATION_KEY, storage)
assert.deepEqual(drafts.value, legacy); assert.equal(drafts.error, '')
assert.equal(writes.length, 0, 'loading never writes')
const changed = { ...drafts.value, '1': {...drafts.value['1'], text:'Modifié'} }
const saved = saveBankRecord(DRAFTS_KEY, changed, drafts.raw, storage)
assert.equal(saved.error, ''); assert.deepEqual(JSON.parse(saved.raw), changed)
assert.deepEqual(readBankRecord(DRAFTS_KEY, storage).value['unknown-future-id'], legacy['unknown-future-id'])
assert.equal(data.get(LAST_PUBLICATION_KEY), dates.raw, 'maps remain independent')
assert(saveBankRecord(DRAFTS_KEY, legacy, drafts.raw, storage).error, 'stale tab is rejected')
assert.equal(data.get(DRAFTS_KEY), saved.raw)
for (const key of [DRAFTS_KEY, LAST_PUBLICATION_KEY]) for(const raw of ['{broken', 'null', '[]', '42', '"text"', '{"id":17}']) {
  data.set(key, raw)
  assert(readBankRecord(key, storage).error, `${key}: reject ${raw}`)
  const count=writes.length
  assert(saveBankRecord(key, {}, raw, storage).error)
  assert.equal(data.get(key), raw, 'unreadable original bytes retained')
  assert.equal(writes.length, count)
}
data.set(DRAFTS_KEY, '{"id":{"text":null}}')
assert(readBankRecord(DRAFTS_KEY, storage).error, 'invalid text must not reach .trim() in the editor')
data.delete(DRAFTS_KEY)
const empty=readBankRecord(DRAFTS_KEY, storage)
assert.deepEqual(empty.value, {}); assert.equal(empty.raw, null)
assert.equal(saveBankRecord(DRAFTS_KEY, legacy, empty.raw, storage).error, '')
const blocked = { getItem() {throw new Error('denied')}, setItem() {throw new Error('denied')} }
assert(readBankRecord(DRAFTS_KEY, blocked).error)
assert(saveBankRecord(DRAFTS_KEY, {}, null, blocked).error)
const quota = { getItem: storage.getItem, setItem() {throw new Error('quota')} }
const before = data.get(DRAFTS_KEY)
assert(saveBankRecord(DRAFTS_KEY, changed, before, quota).error)
assert.equal(data.get(DRAFTS_KEY), before)
const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage')
try {
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('getter denied')}})
  assert(readBankRecord(DRAFTS_KEY).error)
  assert(saveBankRecord(DRAFTS_KEY,{},null).error)
} finally {if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage}
console.log('Tweet bank storage: existing draft/review/date maps, unknown fields/IDs, no read writes, corrupt/blocked/quota preservation and observed cross-tab conflicts verified.')
