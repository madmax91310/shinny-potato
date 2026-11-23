import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const checkout = mkdtempSync(join(tmpdir(), 'etf-flows-recording-'))
try {
  function git(...args) {
    const run = spawnSync('git', args, {cwd: checkout, encoding: 'utf8'})
    assert.equal(run.status, 0, run.stderr)
    return run.stdout.trim()
  }
  git('init', '--quiet')
  git('config', 'user.name', 'ETF flows fixture')
  git('config', 'user.email', 'fixture@example.invalid')
  mkdirSync(join(checkout, 'scripts'))
  copyFileSync(new URL('./validate-etf-flows-publication.sh', import.meta.url), join(checkout, 'scripts/validate-etf-flows-publication.sh'))
  const test = 'scripts/test-etf-flows-weekly.mjs'
  for (const path of ['scripts/test-etf-flows.mjs', test]) {
    writeFileSync(join(checkout, path), 'console.log("financial check replayed")\n')
  }
  git('add', '.')
  git('commit', '-qm', 'Collection base')
  const base = git('rev-parse', 'HEAD')

  function checkAfter(path, contents) {
    git('reset', '--hard', base)
    writeFileSync(join(checkout, path), contents)
    git('add', path)
    git('commit', '-qm', 'Concurrent change')
    git('commit', '--allow-empty', '-qm', 'Replay of the edition commit')
    return spawnSync('bash', ['scripts/validate-etf-flows-publication.sh'], {
      cwd: checkout, encoding: 'utf8', env: {...process.env, VALIDATED_DATA_ORIGINAL_BASE: base},
    })
  }

  const unrelated = checkAfter('scpi.json', '{}\n')
  assert.equal(unrelated.status, 0, unrelated.stderr)
  assert.equal(unrelated.stdout.trim().split('\n').length, 2)
  const changed = checkAfter('scripts/collect-etf-flows.mjs', 'throw new Error("new method")\n')
  assert.equal(changed.status, 1)
  assert.match(changed.stderr, /acquire from current master/)
  assert.equal(changed.stdout, '')

  const registry = JSON.parse(readFileSync(new URL('../src/data/etf-flows-weekly.json', import.meta.url)))
  const [edition] = registry.editions
  assert(edition, 'A retained edition is needed for the no-source regression')
  const report = join(checkout, 'retained.json')
  function runUpdate(...args) {
    return spawnSync(process.execPath, [
      '--import', 'data:text/javascript,globalThis.fetch=()=>{throw Error("unexpected source request")}',
      'scripts/update-etf-flows.mjs', ...args,
    ], {encoding: 'utf8'})
  }
  const plan = runUpdate('--plan', edition.monday)
  assert.equal(plan.status, 0, plan.stderr)
  assert.deepEqual(JSON.parse(plan.stdout), {monday: edition.monday, collect: false})
  const retained = runUpdate('--retained', report, edition.monday)
  assert.equal(retained.status, 0, retained.stderr)
  assert.deepEqual(JSON.parse(readFileSync(report, 'utf8')), {status: 'already-validated', edition})
  const missing = runUpdate('--retained', report, '2000-01-03')
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /validée introuvable/)
  assert.equal(JSON.parse(readFileSync(report, 'utf8')).status, 'unavailable')
} finally {
  rmSync(checkout, {recursive: true, force: true})
}
console.log('Écriture des flux ETF après concurrent et refus des entrées modifiées vérifiés.')
