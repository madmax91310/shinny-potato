import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { runBounded } from './lib/bounded-command.mjs'
import { planShards } from './browser-shards.mjs'
import { firstError } from './browser-check-error.mjs'
const durations = JSON.parse(readFileSync(new URL('./ci-browser-durations.json', import.meta.url))).seconds
const commands = JSON.parse(readFileSync(new URL('./ci-browser-checks.json', import.meta.url)))
const shard = Number(process.argv[2] ?? 0), total = Number(process.argv[3] ?? 1)
if (!Number.isInteger(shard) || !Number.isInteger(total) || shard < 0 || shard >= total) throw new Error('Invalid browser shard')
const planned = planShards(commands, total, durations)[shard]
const measured = {shard,total,checks:[]}
console.log(`Browser shard ${shard + 1}/${total}: ${planned.commands.length} checks, estimated ${planned.seconds.toFixed(1)}s`)
for (const command of planned.commands) {
  console.log(`::group::${command}`)
  const started = Date.now()
  const result = await runBounded(command, {timeoutMs:Math.max(300,Math.min(1800,(durations[command]||60)*3))*1000,
    env: process.env })
  const stdout = result.stdout?.toString() ?? ''
  const stderr = result.stderr?.toString() ?? ''
  process.stdout.write(stdout)
  process.stderr.write(stderr)
  measured.checks.push({command,seconds:(Date.now()-started)/1000,status:result.status,error:result.error})
  writeFileSync(`test-artifacts/browser-durations-${shard}.json`,JSON.stringify(measured,null,2)+'\n')
  console.log(`Completed in ${((Date.now() - started) / 1000).toFixed(1)}s\n::endgroup::`)
  if (result.status !== 0) {
    // Annotation read by the monitoring: the incident names the failed check and its first error.
    console.log(`::error title=Échec ${command}::${result.error || firstError(stderr, stdout)}`)
    process.exit(result.status ?? 1)
  }
}
