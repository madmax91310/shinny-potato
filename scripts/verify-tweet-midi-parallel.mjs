import { spawnSync } from 'node:child_process'
import { verifyPartitions } from './tweet-midi-parallel.mjs'
// Same immutable bundle and reference date as the existing exhaustive CI gate.
const build = spawnSync(process.execPath, ['scripts/build-tweet-midi-verifier.mjs'], { stdio: 'inherit' })
if (build.error) throw build.error
if (build.status !== 0) throw Error(`Verifier bundle failed: ${build.status ?? build.signal}`)
const proof = await verifyPartitions({ bundle: 'test-artifacts/tweet-midi-verifier.mjs', count: 2, receipt: 'test-artifacts/tweet-midi-parallel.json' })
console.log(`Complete verifier: ${proof.totalChecked}/${proof.poolSize} entries; both disjoint partitions succeeded.`)
