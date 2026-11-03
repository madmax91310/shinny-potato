import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { compose, fallbackFiles, introducedIdentifiers, isIsin } from './compose-fallback-snapshot.mjs'
await import('./test-published-mentions.mjs')

assert.deepEqual(fallbackFiles(['src/data/a.json', 'src/app.js', 'public/data/x/1.json'], ['src/data/a.json', 'public/data/x']), ['src/data/a.json', 'public/data/x/1.json'])

const dir = mkdtempSync(path.join(tmpdir(), 'fallback-'))
try {
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()
  const write = (file, text) => { mkdirSync(path.dirname(path.join(dir, file)), { recursive: true }); writeFileSync(path.join(dir, file), text) }
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't')
  write('app.js', 'good code'); write('data/prices.json', '{"v":1}'); write('data/other.json', '{"o":1}')
  git('add', '.'); git('commit', '-qm', 'published')
  const published = git('rev-parse', 'HEAD')
  write('app.js', 'broken code'); write('data/prices.json', '{"v":2}'); write('data/new.json', '{"v":3}')
  git('add', '.'); git('commit', '-qm', 'code change + fresh data')
  const head = git('rev-parse', 'HEAD')
  const result = compose({ published, data: head, cwd: dir, allowed: ['data/prices.json', 'data/new.json'] })
  assert.equal(result.codeSha, published); assert.equal(result.dataSha, head)
  assert.equal(readFileSync(path.join(dir, 'app.js'), 'utf8'), 'good code', 'published code is kept')
  assert.equal(readFileSync(path.join(dir, 'data/prices.json'), 'utf8'), '{"v":2}', 'fresh automation data is overlaid')
  assert(existsSync(path.join(dir, 'data/new.json')))
  assert.equal(readFileSync(path.join(dir, 'data/other.json'), 'utf8'), '{"o":1}')
  // Unrelated history never composes.
  git('checkout', '-q', '--orphan', 'other'); git('rm', '-rqf', '.'); write('x', '1'); git('add', '.'); git('commit', '-qm', 'x')
  assert.throws(() => compose({ published: git('rev-parse', 'HEAD'), data: head, cwd: dir, allowed: [] }))
} finally { rmSync(dir, { recursive: true, force: true }) }

// ISIN check digits keep hashes from passing for assets.
assert(isIsin('IE00B4L5Y983')); assert(isIsin('IE000U9ODG19')); assert(isIsin('CA11271J1075'))
assert(!isIsin('IE00B4L5Y984')); assert(!isIsin('ABCDEFGHIJK1'))
assert.deepEqual(introducedIdentifiers('a.json', '{"IE00B4L5Y983":{"2026-10":1},"brookfield":{}}', '{"IE00B4L5Y983":{"2026-09":1}}'), ['brookfield'])

// 30/10: the first instrument:source-conflict counter blocked code/data
// promotion although the instrument and state were already supported.
const diagnosticReport = (status = 'unqualified', overrides = {}) => ({
  summary: { [`instrument:${status}`]: 1 },
  gaps: [{ type: 'instrument', status, id: 'IE00B4L5Y983' }], ...overrides,
})
const beforeSummary = JSON.stringify(diagnosticReport())
const afterSummary = JSON.stringify(diagnosticReport('source-conflict'))
assert.deepEqual(introducedIdentifiers('docs/automation-gaps.json', afterSummary, beforeSummary), [])
assert.deepEqual(introducedIdentifiers('src/data/financial.json', afterSummary, beforeSummary), ['instrument:source-conflict'])
for (const malformed of [
  diagnosticReport('source-conflict', { summary: { 'instrument:source-conflict': 0 } }),
  diagnosticReport('source-conflict', { summary: { 'instrument:source-conflict': '1' } }),
  diagnosticReport('source-conflict', { gaps: [] }),
  diagnosticReport('source-conflict', { gaps: [{ type: 'newInstrument', status: 'source-conflict' }] }),
  diagnosticReport('future-convention'),
]) assert.ok(introducedIdentifiers('docs/automation-gaps.json', JSON.stringify(malformed), beforeSummary).length)
assert.deepEqual(introducedIdentifiers('docs/automation-gaps.json', JSON.stringify(diagnosticReport('source-conflict', {
  gaps: [{ type: 'instrument', status: 'source-conflict', id: 'IE000U9ODG19' }],
})), beforeSummary), ['IE000U9ODG19'], 'unknown financial identity is still held back, including inside diagnostics')
assert.ok(introducedIdentifiers('docs/automation-gaps.json', JSON.stringify({ ...diagnosticReport('source-conflict'),
  nested: { summary: { 'instrument:source-conflict': 1 } },
}), beforeSummary).includes('instrument:source-conflict'), 'only the exact top-level reconciled counters are exempt')

const summaryDir = mkdtempSync(path.join(tmpdir(), 'fallback-summary-'))
try {
  const git = (...args) => execFileSync('git', args, { cwd: summaryDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't')
  mkdirSync(path.join(summaryDir, 'docs'))
  writeFileSync(path.join(summaryDir, 'app.js'), 'export const known = true\n')
  writeFileSync(path.join(summaryDir, 'docs/automation-gaps.json'), beforeSummary)
  git('add', '.'); git('commit', '-qm', 'Validated existing instrument')
  const published = git('rev-parse', 'HEAD')
  writeFileSync(path.join(summaryDir, 'docs/automation-gaps.json'), afterSummary)
  git('add', '.'); git('commit', '-qm', 'First conflict, same instrument')
  const result = compose({ published, data: git('rev-parse', 'HEAD'), cwd: summaryDir, allowed: ['docs/automation-gaps.json'] })
  assert.deepEqual(result.heldBack, [])
  assert.equal(readFileSync(path.join(summaryDir, 'docs/automation-gaps.json'), 'utf8'), afterSummary)
  assert.equal(readFileSync(path.join(summaryDir, 'app.js'), 'utf8'), 'export const known = true\n')
} finally { rmSync(summaryDir, { recursive: true, force: true }) }

// 18/10/2026: a code change configured new assets, collectors filled their data, then
// the full gate failed. The fallback overlaid that data on the published code, whose
// registry threw "Produit inconnu : IE000U9ODG19": nothing was published. Now the
// files naming assets the published code never mentions keep their published version,
// and every other refresh (new month, new history for a known ISIN) still goes out.
const unknown = mkdtempSync(path.join(tmpdir(), 'fallback-unknown-'))
try {
  const git = (...args) => execFileSync('git', args, { cwd: unknown, encoding: 'utf8' }).trim()
  const write = (file, value) => { mkdirSync(path.dirname(path.join(unknown, file)), { recursive: true }); writeFileSync(path.join(unknown, file), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`) }
  const read = file => JSON.parse(readFileSync(path.join(unknown, file), 'utf8'))
  // Published code: a closed registry, and a build that resolves every data key in it.
  write('registry.js', "export const KNOWN = { IE00B4L5Y983: 'MSCI World', CA11271J1075: 'Brookfield (holding)' }\n")
  write('build.mjs', [
    "import { readFileSync } from 'node:fs'",
    "import { KNOWN } from './registry.js'",
    "const returns = JSON.parse(readFileSync('data/returns.json', 'utf8'))",
    "for (const isin of Object.keys(returns)) if (!KNOWN[isin]) throw new Error(`Produit inconnu : ${isin}`)",
    "const equities = JSON.parse(readFileSync('data/equities.json', 'utf8'))",
    "for (const id of Object.keys(equities)) if (id !== 'apple') throw new Error(`Missing equity artwork: ${id}`)",
    '',
  ].join('\n'))
  write('data/returns.json', { IE00B4L5Y983: { '2026-08': 1.2 } })
  write('data/equities.json', { apple: { '2026-08': 3 } })
  write('data/levels.json', { etfIE00B4L5Y983: { '2026-08': 100 } })
  write('data/holdings.json', { IE00B4L5Y983: [{ isin: 'CA11271J1075', weight: 0.2 }] })
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't')
  git('add', '.'); git('commit', '-qm', 'published')
  const published = git('rev-parse', 'HEAD')
  // New code knows two more assets; collectors then fill their data alongside ordinary refreshes.
  write('registry.js', "export const KNOWN = { IE00B4L5Y983: 'MSCI World', CA11271J1075: 'Brookfield', IE000U9ODG19: 'Défense' }\n")
  write('data/returns.json', { IE00B4L5Y983: { '2026-08': 1.2, '2026-09': 0.4 }, IE000U9ODG19: { '2026-09': 2.1 } })
  write('data/equities.json', { apple: { '2026-08': 3, '2026-09': 2 }, brookfield: { '2026-09': 1 } })
  write('data/levels.json', { etfIE00B4L5Y983: { '2026-08': 100, '2026-09': 101 } })
  write('data/holdings.json', { IE00B4L5Y983: [{ isin: 'CA11271J1075', weight: 0.21 }] })
  write('data/new-asset.json', { isin: 'IE000U9ODG19', weight: 1 })
  git('add', '.'); git('commit', '-qm', 'new assets + fresh data')
  const head = git('rev-parse', 'HEAD')
  const result = compose({ published, data: head, cwd: unknown, allowed: ['data'] })
  assert.deepEqual(result.heldBack, [
    { file: 'data/equities.json', ids: ['brookfield'] },
    { file: 'data/new-asset.json', ids: ['IE000U9ODG19'] },
    { file: 'data/returns.json', ids: ['IE000U9ODG19'] },
  ])
  assert.deepEqual(result.files, ['data/holdings.json', 'data/levels.json'])
  assert.deepEqual(read('data/returns.json'), { IE00B4L5Y983: { '2026-08': 1.2 } }, 'a file naming an unknown asset keeps its published version')
  assert.equal(existsSync(path.join(unknown, 'data/new-asset.json')), false, 'a new file naming an unknown asset stays absent')
  assert.deepEqual(read('data/levels.json'), { etfIE00B4L5Y983: { '2026-08': 100, '2026-09': 101 } }, 'a refresh of a known asset is published')
  assert.equal(read('data/holdings.json').IE00B4L5Y983[0].weight, 0.21, 'a holding already mentioned is not mistaken for a new asset')
  assert.match(readFileSync(path.join(unknown, 'registry.js'), 'utf8'), /Brookfield \(holding\)/, 'published code is kept')
  execFileSync('node', ['build.mjs'], { cwd: unknown, stdio: 'pipe' }) // the published build accepts the composed data
  // The same composition without holding back reproduces the 18/10 failure.
  git('checkout', '-q', head, '--', 'data')
  assert.throws(() => execFileSync('node', ['build.mjs'], { cwd: unknown, stdio: 'pipe' }), /Produit inconnu : IE000U9ODG19/)
} finally { rmSync(unknown, { recursive: true, force: true }) }
console.log('Fallback snapshot: published code + fresh automation data composed; unrelated history refused; assets unknown to the published code wait for it.')
