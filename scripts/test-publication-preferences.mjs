import assert from 'node:assert/strict'
import { readPreference, writePreference } from '../src/lib/publication-preferences.js'
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
globalThis.localStorage = { getItem() { throw Error('blocked') }, setItem() { throw Error('quota') } }
assert.equal(readPreference('selection', 'world', valid), 'world')
assert.doesNotThrow(() => writePreference('selection', 'acwi'))
console.log('Publication preferences: restore, removed asset, invalid JSON and unavailable storage verified.')
