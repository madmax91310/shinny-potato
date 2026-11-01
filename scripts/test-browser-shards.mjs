import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { planShards } from './browser-shards.mjs'
const commands = JSON.parse(readFileSync(new URL('./ci-browser-checks.json', import.meta.url)))
const durations = JSON.parse(readFileSync(new URL('./ci-browser-durations.json', import.meta.url))).seconds
for (const count of [1, 2, 4, commands.length + 1]) {
  const shards = planShards(commands, count, durations)
  assert.deepEqual(shards.flatMap(s => s.commands).sort(), [...commands].sort())
  assert.deepEqual(planShards(commands, count, durations), shards)
}
assert.equal(planShards(['new check'], 1, {}).at(0).seconds, 15)
assert.throws(() => planShards(commands, 0))
assert.throws(() => planShards(['duplicate', 'duplicate'], 2))
// A hand-checkable scheduling example is independent of live catalogue growth.
assert.deepEqual(planShards(['a','b','c','d'],2,{a:8,b:7,c:6,d:5}),[
  {commands:['a','d'],seconds:13}, {commands:['b','c'],seconds:13},
])
console.log('Every check preserved exactly once; deterministic assignment and hand-checked schedule passed. Current estimates:',planShards(commands,4,durations).map(s=>s.seconds))
