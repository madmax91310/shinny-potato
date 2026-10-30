import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export async function verifyPartitions({ bundle, count = 2, env = process.env, receipt, log = line => console.log(line) }) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 4) throw Error('Invalid verifier partition count')
  const digest = createHash('sha256').update(await readFile(bundle)).digest('hex')
  const results = await Promise.all(Array.from({ length: count }, (_, index) => new Promise(resolveResult => {
    const reports = [], issues = []
    let pending = ''
    const child = spawn(process.execPath, [resolve(bundle)], { env: { ...env, TWEET_MIDI_SHARD_INDEX: String(index), TWEET_MIDI_SHARD_COUNT: String(count) }, stdio: ['ignore', 'pipe', 'pipe'] })
    const consume = line => {
      log(`[${index + 1}/${count}] ${line}`)
      if (line.startsWith('TWEET_MIDI_RESULT ')) {
        try { reports.push(JSON.parse(line.slice('TWEET_MIDI_RESULT '.length))) }
        catch { issues.push('Malformed verifier receipt') }
      }
    }
    child.stdout.on('data', bytes => {
      pending += bytes.toString()
      let at
      while ((at = pending.indexOf('\n')) >= 0) { consume(pending.slice(0, at)); pending = pending.slice(at + 1) }
      if (pending.length > 65536) { issues.push('Verifier output line exceeds bound'); pending = '' }
    })
    child.stderr.on('data', bytes => log(`[${index + 1}/${count}] ${bytes.toString().slice(0, 65536)}`))
    child.on('error', error => issues.push(error.message))
    child.on('close', (code, signal) => { if (pending) consume(pending); resolveResult({ index, code, signal, reports, issues }) })
  })))
  const errors = []
  let poolSize
  for (const result of results) {
    if (result.code !== 0 || result.signal || result.issues.length) errors.push(`Partition ${result.index}: process failed or interrupted`)
    if (result.reports.length !== 1) { errors.push(`Partition ${result.index}: exactly one explicit receipt required`); continue }
    const r = result.reports[0]
    if (r.shardIndex !== result.index || r.shardCount !== count || !Number.isSafeInteger(r.poolSize) || r.poolSize < 1 || !Number.isSafeInteger(r.checked) || r.failures !== 0) errors.push(`Partition ${result.index}: invalid identity, scope or failures`)
    if (poolSize === undefined) poolSize = r.poolSize
    if (r.poolSize !== poolSize) errors.push('Partitions used different pool sizes')
    const expected = Math.max(0, Math.ceil((r.poolSize - result.index) / count))
    if (r.checked !== expected) errors.push(`Partition ${result.index}: omitted or duplicated entries`)
  }
  const totalChecked = results.reduce((sum, r) => sum + (r.reports[0]?.checked ?? 0), 0)
  if (totalChecked !== poolSize) errors.push('Complete pool not covered')
  if (createHash('sha256').update(await readFile(bundle)).digest('hex') !== digest) errors.push('Verifier bundle changed during validation')
  const proof = { schemaVersion: 1, checkedAt: new Date().toISOString(), bundleSha256: digest, partitionCount: count, poolSize, totalChecked, results, errors, succeeded: !errors.length }
  if (receipt) { await mkdir(dirname(receipt), { recursive: true }); await writeFile(receipt, JSON.stringify(proof, null, 2)) }
  if (errors.length) throw Error(errors.join('; '))
  return proof
}
