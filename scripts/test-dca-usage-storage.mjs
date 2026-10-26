import assert from 'node:assert/strict'
import { USED_KEY, readUsageHistory, toggleUsageHistory } from '../src/pages/dca-profiles/usage-history.js'

function fixture(raw = null) {
  const state = { raw, writes: 0, readDenied: false, writeDenied: false }
  const storage = {
    getItem(key) { assert.equal(key, USED_KEY); if (state.readDenied) throw Error('denied'); return state.raw },
    setItem(key, value) { assert.equal(key, USED_KEY); if (state.writeDenied) throw Error('quota'); state.writes++; state.raw = value },
  }
  return { state, storage }
}
for (const raw of ['{broken', '', 'null', '{}', '["julien",42]', '["julien",null]', JSON.stringify(['x'.repeat(100)])]) {
  const { state, storage } = fixture(raw), initial = readUsageHistory(storage)
  assert(!initial.readable)
  const next = toggleUsageHistory(initial, 'julien', storage)
  assert.equal(state.raw, raw); assert.equal(state.writes, 0); assert(next.error)
  state.raw = '[]' // external recovery must not unlock an unreadable mount
  assert(toggleUsageHistory(initial, 'julien', storage).error)
  assert.equal(state.writes, 0)
}
for (const raw of [null, '[]', '[ "older", "older" ]', '["", "future-route"]']) {
  const { state, storage } = fixture(raw), initial = readUsageHistory(storage)
  assert(initial.readable); assert.equal(state.writes, 0); assert.equal(state.raw, raw)
  const saved = toggleUsageHistory(initial, 'julien', storage)
  assert.equal(saved.error, ''); assert.deepEqual(JSON.parse(state.raw), [...initial.ids, 'julien'])
  const reload = readUsageHistory(storage)
  assert.deepEqual(reload.ids, saved.ids)
  assert.deepEqual(toggleUsageHistory(reload, 'julien', storage).ids, initial.ids)
}
{
  const { state, storage } = fixture('["older"]')
  state.readDenied = true
  const initial = readUsageHistory(storage)
  state.readDenied = false
  assert(toggleUsageHistory(initial, 'julien', storage).error)
  assert.equal(state.raw, '["older"]'); assert.equal(state.writes, 0)
}
for (const replacement of ['["other-tab"]', '{broken', null]) {
  const { state, storage } = fixture('["older"]'), initial = readUsageHistory(storage)
  state.raw = replacement
  const next = toggleUsageHistory(initial, 'julien', storage)
  assert(next.error); assert.deepEqual(next.ids, initial.ids)
  assert.equal(state.raw, replacement); assert.equal(state.writes, 0)
}
{
  const { state, storage } = fixture('["older"]'), initial = readUsageHistory(storage)
  state.writeDenied = true
  const failed = toggleUsageHistory(initial, 'julien', storage)
  assert(failed.error); assert.deepEqual(failed.ids, initial.ids); assert.equal(state.raw, initial.raw)
  state.writeDenied = false
  assert.equal(toggleUsageHistory(failed, 'julien', storage).error, '')
  state.readDenied = true
  assert(toggleUsageHistory(readUsageHistory(storage), 'julien', storage).error)
}
const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
try {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Storage unavailable') } })
  assert(!readUsageHistory().readable)
  assert(toggleUsageHistory({ readable: true, ids: [], raw: null }, 'julien').error)
} finally {
  if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
  else delete globalThis.localStorage
}
console.log('DCA usage storage: full validation, observed-snapshot conflicts, refused access/quota, retries and legacy compatibility OK.')
