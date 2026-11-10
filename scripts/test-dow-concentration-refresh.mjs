import assert from 'node:assert/strict'
import {copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync} from 'node:child_process'
import fixture from './fixtures/index-companies/dow-refresh-20261109.json' with {type:'json'}

// Exercise the real builder and --apply retention/history in an isolated register.
// Other inputs are read-only links; the checkout's observations never change.
const root = fileURLToPath(new URL('../', import.meta.url))
const sandbox = mkdtempSync(join(tmpdir(), 'dow-concentration-'))
const read = path => JSON.parse(readFileSync(join(sandbox, path), 'utf8'))
const write = (path, value) => writeFileSync(join(sandbox, path), JSON.stringify(value))
try {
  for (const dir of ['scripts', 'src/data']) {
    mkdirSync(join(sandbox, dir), {recursive:true})
    for (const name of readdirSync(join(root, dir))) {
      if (['index-company-observations.json', 'index-company-qualified.json', 'index-company-compositions.json', 'index-company-sources.json'].includes(name)) continue
      if (name === 'build-index-company-compositions.mjs') copyFileSync(join(root, dir, name), join(sandbox, dir, name))
      else symlinkSync(join(root, dir, name), join(sandbox, dir, name))
    }
  }
  const config = JSON.parse(readFileSync(join(root, 'scripts/index-company-sources.json'), 'utf8'))
  const run = labels => {
    write('scripts/index-company-sources.json', {...config, reviewedSecurityLabels:labels})
    write('src/data/index-company-observations.json', {'dow-jones':fixture.observation})
    write('src/data/index-company-qualified.json', {'dow-jones':fixture.previous})
    execFileSync(process.execPath, ['scripts/build-index-company-compositions.mjs', '--apply', '--report', join(sandbox, 'report.json')], {cwd:sandbox, stdio:'pipe'})
    return read('src/data/index-company-compositions.json')['dow-jones']
  }
  const labels = {...config.reviewedSecurityLabels}
  delete labels['APPLE INC']
  const retained = run(labels)
  assert.equal(retained.retained, true)
  assert.equal(retained.refresh.status, 'failed')
  assert.match(retained.refresh.error, /Identifiant/)
  for (const key of ['top', 'topWeight', 'otherWeight', 'asOf', 'checkedAt', 'visualFacts']) {
    assert.deepEqual(retained[key], fixture.previous.companies[key], `Retain qualified ${key}`)
  }
  assert.deepEqual(read('src/data/index-company-qualified.json')['dow-jones'], fixture.previous, 'Rejected observation must not rewrite qualification or history')
  assert.notEqual(retained.topWeight, fixture.observation.facts.holdings.reduce((s, [,w]) => s+w, 0), 'The old assertion compared September with October')
  assert.equal(retained.topWeight, retained.visualFacts.holdings.reduce((s, [,w]) => s+w, 0))
  assert.ok(read('report.json').errors.some(row => row.id === 'qualification:dow-jones'))

  assert.equal(config.reviewedSecurityLabels['APPLE INC'], 'US0378331005')
  const current = run(config.reviewedSecurityLabels)
  assert.equal(current.available, true)
  assert.ok(!current.retained)
  assert.equal(current.asOf, '2026-10-31')
  assert.equal(current.checkedAt, '2026-11-09')
  assert.equal(current.approximation, false)
  assert.equal(current.top.length, 10)
  assert.equal(new Set(current.top.flatMap(row => row.securities)).size, 10)
  assert.deepEqual(current.top.map(row => [row.name, row.weightPct]), fixture.observation.facts.holdings, 'Published weights and order stay unchanged; no renormalisation or issuer merge')
  assert.deepEqual(current.top.find(row => row.name === 'APPLE INC').securities, ['US0378331005'])
  assert.ok(Math.abs(current.topWeight - 54.59) < 1e-10)
  assert.ok(Math.abs(current.otherWeight - 45.41) < 1e-10)
  assert.deepEqual(current.visualFacts, fixture.observation.facts)
  const saved = read('src/data/index-company-qualified.json')['dow-jones']
  assert.deepEqual(saved.companies, current)
  assert.deepEqual(saved.companiesHistory['2026-09-30'], fixture.previous.companiesHistory['2026-09-30'])
  assert.deepEqual(saved.companiesHistory['2026-10-31'], current)
  assert.ok(!read('report.json').errors.some(row => row.id === 'qualification:dow-jones'))
  console.log('Dow refresh: missing Apple identity retains September; reviewed identity qualifies October unchanged and preserves history.')
} finally {
  rmSync(sandbox, {recursive:true, force:true})
}
