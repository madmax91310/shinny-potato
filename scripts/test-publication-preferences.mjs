import assert from 'node:assert/strict'
import { readPreference, readPreferenceRecord, writePreference, readLocalPreference, writeLocalPreference, readLocalPreferenceRecord } from '../src/lib/publication-preferences.js'
const store = new Map()
globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key,value) => store.set(key,value) }
const valid = id => ['world', 'acwi'].includes(id)
assert.equal(readPreference('selection', 'world', valid), 'world')
writePreference('selection', 'acwi')
assert.equal(readPreference('selection', 'world', valid), 'acwi')
writePreference('selection', 'removed-asset')
assert.equal(readPreference('selection', 'world', valid), 'world')
store.set('epargnant-publication:v1:selection', '{broken')
assert.equal(readPreference('selection', 'world', valid), 'world')
for (const raw of ['{broken', '{"wrong":"shape"}', '42']) {
  store.set('epargnant-publication:v1:selection', raw)
  assert.equal(readPreferenceRecord('selection', 'world', valid).readable, false)
  assert.equal(writePreference('selection', 'acwi', valid), false)
  assert.equal(store.get('epargnant-publication:v1:selection'), raw, 'a rejected read cannot be overwritten by an effect')
}
store.set('home-favorites', '{broken')
assert.deepEqual(readLocalPreference('home-favorites', [], Array.isArray), [])
assert.equal(writeLocalPreference('home-favorites', ['/radar-editorial'], Array.isArray), false)
assert.equal(store.get('home-favorites'), '{broken', 'raw Home key and bytes retained')
store.delete('epargnant-publication:v1:selection')
assert.equal(readPreferenceRecord('selection', 'world', valid).readable, true)
assert.equal(writePreference('selection', 'acwi', valid), true)
assert.deepEqual(readPreferenceRecord('missing', 'world', valid), { value: 'world', readable: true }, 'Existing public shape stays exact')
const isolatedRaw = JSON.stringify(['a-route'])
const isolated = { getItem: () => isolatedRaw }
assert.deepEqual(readLocalPreferenceRecord('historical-raw-key', [], Array.isArray, isolated), { value: ['a-route'], readable: true, raw: isolatedRaw })
assert.equal(writeLocalPreference('historical-raw-key', [], Array.isArray, { getItem: () => '{corrupt', setItem() { throw Error('must never write') } }), false)
globalThis.localStorage = { getItem() { throw Error('blocked') }, setItem() { throw Error('quota') } }
assert.equal(readPreference('selection', 'world', valid), 'world')
assert.doesNotThrow(() => writePreference('selection', 'acwi'))
console.log('Publication preferences: restore, removed asset, invalid JSON and unavailable storage verified.')
