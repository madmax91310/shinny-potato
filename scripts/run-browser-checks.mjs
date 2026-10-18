import { readFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { planShards } from './browser-shards.mjs'
import { firstError } from './browser-check-error.mjs'
const durations = JSON.parse(readFileSync(new URL('./ci-browser-durations.json', import.meta.url))).seconds
const commands = JSON.parse(readFileSync(new URL('./ci-browser-checks.json', import.meta.url)))
const shard = Number(process.argv[2] ?? 0), total = Number(process.argv[3] ?? 1)
if (!Number.isInteger(shard) || !Number.isInteger(total) || shard < 0 || shard >= total) throw new Error('Invalid browser shard')
mkdirSync('test-artifacts/company-analysis', { recursive: true })
const planned = planShards(commands, total, durations)[shard]
console.log(`Browser shard ${shard + 1}/${total}: ${planned.commands.length} checks, estimated ${planned.seconds.toFixed(1)}s`)
for (const command of planned.commands) {
  console.log(`::group::${command}`)
  const started = Date.now()
  const result = spawnSync(command, { shell: true, stdio: ['inherit', 'inherit', 'pipe'], maxBuffer: 64 * 1024 * 1024, env: { ...process.env, COMPANY_QA_DIR: 'test-artifacts/company-analysis' } })
  const stderr = result.stderr?.toString() ?? ''
  process.stderr.write(stderr)
  console.log(`Completed in ${((Date.now() - started) / 1000).toFixed(1)}s\n::endgroup::`)
  if (result.status !== 0) {
    // Annotation read by the monitoring: the incident names the failed check and its first error.
    console.log(`::error title=Échec ${command}::${firstError(stderr)}`)
    process.exit(result.status ?? 1)
  }
}
