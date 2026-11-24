import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const runtime = () => ({
  node: process.version,
  icu: process.versions.icu,
  platform: process.platform,
  arch: process.arch,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})
const day = date => new Date(date).toISOString().slice(0, 10)
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const write = (path, value) => writeFileSync(path, JSON.stringify(value) + '\n')

function execute(bundle, args, env, marker) {
  const result = spawnSync(process.execPath, [resolve(bundle), ...args], {
    env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  })
  if (args.length === 0 || result.status !== 0) {
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
  }
  if (result.error) throw result.error
  assert.equal(result.status, 0, 'Tweet Midi verifier failed')
  const matches = result.stdout.split(/\r?\n/).filter(line => line.startsWith(marker + ' '))
  assert.equal(matches.length, 1, 'Expected exactly one verifier report')
  return JSON.parse(matches[0].slice(marker.length + 1))
}

export function createPlan(bundle, referenceDate) {
  assert.equal(new Date(referenceDate).toISOString(), referenceDate)
  const { poolSize } = execute(bundle, ['--scope-manifest'], {}, 'TWEET_MIDI_SCOPE')
  assert(Number.isSafeInteger(poolSize) && poolSize > 0, 'Missing exhaustive scope')
  return {
    version: 1,
    bundle: hash(bundle),
    runner: runtime(),
    referenceDate,
    poolSize,
    partitions: 4,
  }
}

function checkBundle(bundle, plan) {
  assert.equal(plan.version, 1)
  assert.equal(plan.partitions, 4)
  assert.deepEqual(plan.runner, runtime())
  assert.equal(plan.bundle, hash(bundle), 'Verifier bundle has changed')
}

function checkPartition(plan, result, index) {
  assert.deepEqual(result, {
    shardIndex: index,
    shardCount: plan.partitions,
    poolSize: plan.poolSize,
    checked: Math.max(0, Math.ceil((plan.poolSize - index) / plan.partitions)),
    failures: 0,
  })
}

export function runPartition(bundle, plan, index) {
  checkBundle(bundle, plan)
  assert(Number.isInteger(index) && index >= 0 && index < plan.partitions)
  const result = execute(bundle, [], {
    TWEET_MIDI_SHARD_INDEX: String(index), TWEET_MIDI_SHARD_COUNT: String(plan.partitions),
  }, 'TWEET_MIDI_RESULT')
  checkPartition(plan, result, index)
  checkBundle(bundle, plan)
  return { plan, result }
}

export function combine(plan, reports) {
  assert.equal(plan.version, 1)
  assert.equal(plan.partitions, 4)
  assert(Number.isSafeInteger(plan.poolSize) && plan.poolSize > 0)
  assert.equal(reports.length, plan.partitions)
  const results = reports.map(({ plan: actual, result }, index) => {
    assert.deepEqual(actual, plan, 'Partition used a different plan')
    checkPartition(plan, result, index)
    return result
  })
  assert.equal(results.reduce((sum, result) => sum + result.checked, 0), plan.poolSize)
  return { plan, results }
}

export function checkProof(bundle, proof, now = new Date()) {
  const { plan, results } = proof
  assert.equal(day(plan.referenceDate), day(now), 'Verifier reference date has expired')
  assert.deepEqual(createPlan(bundle, plan.referenceDate), plan)
  combine(plan, results.map(result => ({ plan, result })))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'plan') {
    const [bundle, date, output] = args
    write(output, createPlan(bundle, date))
  } else if (command === 'shard') {
    const [bundle, plan, index, output] = args
    write(output, runPartition(bundle, read(plan), Number(index)))
  } else if (command === 'combine') {
    const [plan, output, ...reports] = args
    const proof = combine(read(plan), reports.map(read))
    write(output, proof)
    console.log(`Tweet Midi verified every entry (${proof.plan.poolSize}).`)
  } else if (command === 'date') {
    const { plan } = read(args[0])
    assert.equal(day(plan.referenceDate), day(new Date()))
    process.stdout.write(new Date(plan.referenceDate).toISOString())
  } else if (command === 'reuse') {
    checkProof(args[0], read(args[1]))
    console.log('Existing exhaustive Tweet Midi proof matches this bundle and reference date.')
  } else {
    throw new Error('Unknown Tweet Midi CI command')
  }
}
