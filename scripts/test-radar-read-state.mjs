import assert from 'node:assert/strict'
import { cachedSignalIds, readIds, markRead, cacheSignalGroups, READ_EVENT } from '../src/lib/radar-read-state.js'

const descriptors = Object.fromEntries(['localStorage', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
const data = new Map(), events = []
const READ = 'epargnantlibre-radar-read-v1', SIGNALS = 'epargnantlibre-radar-signals-v1'
try {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  } })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: event => events.push(event.type) } })
  data.set(READ, JSON.stringify(['read', 42]))
  assert.deepEqual(readIds(), ['read'])
  // Old scalar signals and the current grouped format remain compatible.
  cacheSignalGroups(['scalar', ['read', 'unread'], ['read'], null])
  assert.deepEqual(cachedSignalIds(), ['scalar', 'unread', 'read'])
  assert(markRead(['unread', 'unread']))
  assert.deepEqual(readIds(), ['read', 'unread'])
  assert.deepEqual(events, [READ_EVENT, READ_EVENT])
  assert(markRead(Array.from({length:2100}, (_, i) => `id-${i}`)))
  assert.equal(readIds().length, 2000)
  assert.equal(readIds()[0], 'id-100')
  data.set(READ, '{broken'); data.set(SIGNALS, '{broken')
  assert.deepEqual(readIds(), []); assert.deepEqual(cachedSignalIds(), [])
  assert.equal(data.get(READ), '{broken', 'read has no write side effect')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked') } })
  assert.deepEqual(readIds(), []); assert.deepEqual(cachedSignalIds(), [])
  assert.equal(markRead(['id']), false)
  assert.doesNotThrow(() => cacheSignalGroups([]))
  console.log('Radar read state: existing keys/scalar and grouped signals, unread identity, deduplication, 2000 limit, events, corrupt and unavailable storage verified.')
} finally {
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else delete globalThis[key]
  }
}
