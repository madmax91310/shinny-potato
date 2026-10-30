import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { verifyPartitions } from './tweet-midi-parallel.mjs'
const dir = await mkdtemp(join(tmpdir(), 'tweet-verifier-contract-'))
try {
 const bundle = join(dir, 'probe.mjs'), receipt = join(dir, 'receipt.json')
 await writeFile(bundle, `import {appendFileSync} from 'node:fs';const i=Number(process.env.TWEET_MIDI_SHARD_INDEX),n=Number(process.env.TWEET_MIDI_SHARD_COUNT),mode=process.env.PROBE_DEFECT;let r={shardIndex:i,shardCount:n,poolSize:7,checked:Math.max(0,Math.ceil((7-i)/n)),failures:0};if(i===1){if(mode==='scope')r.poolSize=9;if(mode==='omission')r.checked--;if(mode==='duplicate')r.checked++;if(mode==='identity')r.shardIndex=0;if(mode==='failed')r.failures=1;if(mode==='empty')r.poolSize=0;if(mode==='truncated')process.exit(0);if(mode==='malformed'){console.log('TWEET_MIDI_RESULT {');process.exit(0)}}console.log('TWEET_MIDI_RESULT '+JSON.stringify(r));if(i===1&&mode==='duplicate-receipt')console.log('TWEET_MIDI_RESULT '+JSON.stringify(r));if(i===1&&mode==='exit')process.exit(2);if(i===1&&mode==='changed-bundle')appendFileSync(new URL(import.meta.url),'\\n// changed');`)
 const run = mode => verifyPartitions({ bundle, receipt, env: { ...process.env, PROBE_DEFECT: mode }, log() {} })
 const valid = await run('');assert.equal(valid.totalChecked,7);assert.equal(valid.succeeded,true)
 for (const mode of ['scope','omission','duplicate','identity','failed','empty','truncated','malformed','duplicate-receipt','exit','changed-bundle']) { await assert.rejects(run(mode),undefined,mode);assert.equal(JSON.parse(await readFile(receipt,'utf8')).succeeded,false) }
 console.log('Parallel verifier: actual child-process failures, omissions, duplicate/out-of-scope/truncated/empty receipts rejected; complete scope accepted.')
} finally { await rm(dir,{recursive:true,force:true}) }
