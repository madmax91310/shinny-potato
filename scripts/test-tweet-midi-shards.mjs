import './test-tweet-midi-parallel.mjs'
import assert from 'node:assert/strict'
import { shardIndices } from './tweet-midi-shards.mjs'

for (const length of [0, 1, 3, 5, 100, 3328187]) for (const count of [1, 2, 4, 7]) {
  const visits = new Uint8Array(length)
  const sizes = []
  for (let shard = 0; shard < count; shard++) {
    let size = 0
    for (const index of shardIndices(length, shard, count)) { visits[index]++; size++ }
    sizes.push(size)
  }
  assert.ok(visits.every(value => value === 1), 'No entry omitted or checked twice')
  assert.equal(sizes.reduce((a, b) => a + b, 0), length)
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1)
}
for (const args of [[-1], [5, -1], [5, 1, 1], [5, 0, 0], [5, 0, 1.5], [NaN], [5, NaN, 4]]) {
  assert.throws(() => [...shardIndices(...args)], /Invalid Tweet Midi shard/)
}
console.log('Tweet Midi: exhaustive, disjoint and balanced partitions; invalid parameters rejected.')
