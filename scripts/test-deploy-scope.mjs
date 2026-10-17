import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { automationPaths, classify } from './classify-deploy-scope.mjs'

const allowed = automationPaths()
for (const required of ['src/data/automated-monthly.json', 'src/data/automated-indices.json', 'public/data/investors', 'src/pages/dca-profiles/exposures*.json']) {
  assert(allowed.includes(required), `automation path missing from the data lane: ${required}`)
}

const data = classify(['src/data/automated-monthly.json', 'public/data/investors/berkshire/2026-Q2.json', 'src/pages/dca-profiles/exposures-extra-7.json', 'docs/exposure-coverage.md'], allowed)
assert.deepEqual(data, { dataOnly: true, outside: [] })
assert.equal(classify([], allowed).dataOnly, true, 'an unchanged snapshot keeps its validated code')

for (const codeFile of ['src/pages/tweet-midi/engine.js', '.github/workflows/deploy-pages.yml', 'scripts/commit-validated-data.sh', 'package.json',
  'src/pages/dca-profiles/exposures/loader.js', 'src/data/automated-monthly.json.js', 'public/data/investors.js']) {
  const result = classify(['src/data/automated-monthly.json', codeFile], allowed)
  assert.equal(result.dataOnly, false, `${codeFile} must force the full gate`)
  assert.deepEqual(result.outside, [codeFile])
}

const script = new URL('./classify-deploy-scope.mjs', import.meta.url).pathname
const run = (...args) => execFileSync('node', [script, ...args], { encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: '' } })
assert.match(run('--published', 'not-a-commit'), /data_only=false/)
assert.match(run(), /Full gate: published commit unknown[\s\S]*data_only=false/)
assert.match(run('--published-url', 'http://127.0.0.1:9/build-info.json'), /data_only=false/)
assert.match(run('--published', 'HEAD', '--head', 'HEAD'), /data_only=true/)
console.log(`Deploy scope: ${allowed.length} automation paths, data-only and full-gate cases verified.`)
