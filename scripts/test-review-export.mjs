import assert from 'node:assert/strict'
import {reviewExportBlob, reviewExportChunks} from '../src/pages/data-review/review-export.js'

const scope = Object.freeze({expectedIds: ['ISIN/field/2025', 'ISIN/field/2026'], attemptedIds: ['ISIN/field/2025'], status: 'partial'})
const rows = Array.from({length: 300}, (_, i) => ({id: `incident-${i}`, kind: i % 2 ? 'archive' : 'failure', cause: 'Échec réseau — € / 日本語', asOf: null, proof: 'x'.repeat(16_384), signals: [{scopeRef: 'exact-run/2', sourceAttempted: false}]}))
const document = {generatedAt: '2026-11-03T06:00:00Z', absent: undefined, reportScopes: {'exact-run/2': scope}, filters: {kind: 'all'}, summary: {total: 300, absent: undefined}, rows}
const original = JSON.stringify(document)
const chunks = [...reviewExportChunks(document)]
assert(chunks.length > rows.length)
assert(Math.max(...chunks.map(v => v.length)) < original.length / 100, 'No full-report string is materialized')
assert.deepEqual(JSON.parse(chunks.join('')), JSON.parse(original))
assert.deepEqual(scope.expectedIds, ['ISIN/field/2025', 'ISIN/field/2026'], 'No scope or omitted result is rewritten')

// Guard the actual async Blob path against a future global stringify regression.
const stringify = JSON.stringify
JSON.stringify = function(value, ...args) {
  assert.notEqual(value, document, 'Do not stringify the complete report')
  assert.notEqual(value, rows, 'Do not stringify the full list')
  assert.notEqual(value, document.reportScopes, 'Do not stringify all scopes at once')
  return stringify(value, ...args)
}
let blob
try { blob = await reviewExportBlob(document) } finally { JSON.stringify = stringify }
assert.equal(blob.type, 'application/json')
assert.deepEqual(JSON.parse(await blob.text()), JSON.parse(original), 'All identities, UTF-8, dates, scopes, failures and unattempted proofs survive')
for (const value of [{rows: [], reportScopes: {}, filters: {kind: 'failure'}}, {rows: [null, undefined, NaN], version: 1}]) {
  assert.deepEqual(JSON.parse(await (await reviewExportBlob(value)).text()), JSON.parse(JSON.stringify(value)))
}
const cycle = {}; cycle.self = cycle
await assert.rejects(reviewExportBlob({rows: [cycle]}), /circular/i, 'An incomplete serialization must fail rather than export a partial success')
console.log('Review export: bounded chunks, lossless UTF-8/schema/scope parity, filtered/empty/failed exports verified')
