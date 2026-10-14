import { readFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { planShards } from './browser-shards.mjs'
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
  const result = spawnSync(command, { shell: true, stdio: 'inherit', env: { ...process.env, COMPANY_QA_DIR: 'test-artifacts/company-analysis' } })
  console.log(`Completed in ${((Date.now() - started) / 1000).toFixed(1)}s\n::endgroup::`)
  if (result.status !== 0) process.exit(result.status ?? 1)
}
