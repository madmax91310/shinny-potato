import { schedulingDurations } from './browser-check-config.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { planShards } from './browser-shards.mjs'
import { needsExtraEngines } from './browser-portability-engines.mjs'
const commands = JSON.parse(readFileSync(new URL('./ci-browser-checks.json', import.meta.url)))
const durations = schedulingDurations(JSON.parse(readFileSync(new URL('./ci-browser-durations.json', import.meta.url))))
for (const count of [1, 2, 4, 6, commands.length + 1]) {
  const shards = planShards(commands, count, durations)
  assert.deepEqual(shards.flatMap(s => s.commands).sort(), [...commands].sort())
  assert.deepEqual(planShards(commands, count, durations), shards)
  assert.equal(shards.filter((_,index)=>needsExtraEngines(index,count,commands,durations)).length,1)
}
assert.throws(()=>needsExtraEngines(-1,4,commands,durations))
assert.equal(planShards(['new check'], 1, {}).at(0).seconds, 15)
assert.throws(() => planShards(commands, 0))
assert.throws(() => planShards(['duplicate', 'duplicate'], 2))
// A hand-checkable scheduling example is independent of live catalogue growth.
assert.deepEqual(planShards(['a','b','c','d'],2,{a:8,b:7,c:6,d:5}),[
  {commands:['a','d'],seconds:13}, {commands:['b','c'],seconds:13},
])

// The workflow must install extra engines and execute the same complete plan.
const workflow=readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8')
const browserJob=workflow.split('  browser-checks:\n')[1].split('  exposure-browser-check:\n')[0]
const indices=JSON.parse(browserJob.match(/shard: (\[[^\]]+\])/)[1])
assert.deepEqual(indices,Array.from({length:indices.length},(_,index)=>index))
for(const script of ['browser-portability-engines','run-browser-checks'])assert(browserJob.includes(`node scripts/${script}.mjs \${{ matrix.shard }} ${indices.length}`))
assert.deepEqual(planShards(commands,indices.length,durations).flatMap(s=>s.commands).sort(),[...commands].sort())
console.log('Every check preserved exactly once; matching workflow/engine plans verified. Current estimates:',planShards(commands,indices.length,durations).map(s=>s.seconds))
