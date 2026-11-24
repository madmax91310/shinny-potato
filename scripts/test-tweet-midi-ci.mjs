import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPlan, runPartition, combine, checkProof } from './tweet-midi-ci.mjs'

const directory = mkdtempSync(join(tmpdir(), 'tweet-midi-ci-test-'))
const bundle = join(directory, 'verifier.mjs')
try {
  writeFileSync(bundle, `
    if (process.argv.includes('--scope-manifest')) {
      console.log('TWEET_MIDI_SCOPE {"poolSize":7}')
    } else {
      const shardIndex = Number(process.env.TWEET_MIDI_SHARD_INDEX)
      const shardCount = Number(process.env.TWEET_MIDI_SHARD_COUNT)
      console.log('TWEET_MIDI_RESULT ' + JSON.stringify({
        shardIndex, shardCount, poolSize: 7,
        checked: Math.ceil((7 - shardIndex) / shardCount), failures: 0,
      }))
    }
  `)
  const date = new Date().toISOString()
  const plan = createPlan(bundle, date)
  const results = [0, 1, 2, 3].map(index => runPartition(bundle, plan, index))
  const proof = combine(plan, results)
  assert.deepEqual(proof.results.map(result => result.checked), [2, 2, 2, 1])
  checkProof(bundle, proof, date)
  assert.throws(() => combine(plan, results.slice(0, -1)))
  assert.throws(() => combine(plan, [results[0], results[0], ...results.slice(2)]))
  assert.throws(() => combine(plan, [{ ...results[0], plan: { ...plan, poolSize: 8 } }, ...results.slice(1)]))
  assert.throws(() => combine(plan, [
    { ...results[0], result: { ...results[0].result, failures: 1 } },
    ...results.slice(1),
  ]))
  assert.throws(() => checkProof(bundle, proof, new Date(Date.parse(date) + 86400000)), /expired/)
  assert.throws(() => checkProof(bundle, { ...proof, results: [] }, date))
  writeFileSync(bundle, 'console.log(\'TWEET_MIDI_SCOPE {"poolSize":7}\')')
  assert.throws(() => runPartition(bundle, plan, 0), /bundle has changed/)
  assert.throws(() => checkProof(bundle, proof, date))
} finally {
  rmSync(directory, { recursive: true, force: true })
}
console.log('Tweet Midi CI validates the complete scope, partition identities, the bundle and the reference date.')
