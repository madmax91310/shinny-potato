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
const old = [0, 0, 0, 0]
commands.forEach((command, i) => old[i % 4] += durations[command] || 15)
const next = planShards(commands, 4, durations).map(s => s.seconds)
assert.ok(Math.max(...next) < Math.max(...old))
console.log('All checks preserved; measured baseline estimates:', { before: old, after: next })
