import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS } from '../src/pages/tweet-midi/data/marketHistory.js'

// Keep provenance in public/; only filenames and optical bounds enter the JS bundle.
const root = new URL('../', import.meta.url)
const sources = JSON.parse(readFileSync(new URL('public/asset-art/official-logos/sources.json', root)))
const runtime = {}
const eligible = new Set(ANNIVERSAIRE_ELIGIBLE_ASSETS.map(asset => asset.id))
for (const [id, source] of Object.entries(sources)) {
  assert.ok(eligible.has(id), `${id}: logo must belong to an eligible asset`)
  assert.match(source.page, /^https:\/\//, `${id}: official publication page missing`)
  assert.match(source.source, /^https:\/\//, `${id}: original download missing`)
  assert.ok(!source.file.includes('..') && !source.file.startsWith('/'), `${id}: non-local logo path`)
  const bytes = readFileSync(new URL(`public/asset-art/${source.file}`, root))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, `${id}: logo file changed without provenance update`)
  if (source.file.endsWith('.svg')) assert.doesNotMatch(bytes.toString(), /<foreignObject\b|<image\b[^>]*(?:href=["']https?:)|@import|url\(["']?https?:/i, `${id}: externally dependent SVG`)
  runtime[id] = { file: source.file }
  for (const key of ['maxWidth', 'maxHeight']) if (source[key] != null) {
    assert.ok(Number.isFinite(source[key]) && source[key] > 0, `${id}: invalid ${key}`)
    runtime[id][key] = source[key]
  }
}
assert.ok(Object.keys(runtime).length >= 100, 'At least 100 verified asset logos are required')
assert.ok(new Set(Object.values(sources).map(s => s.sha256)).size >= 100, 'Logo variants must not inflate the coverage count')
assert.ok(new Set(Object.values(sources).map(s => s.page)).size >= 100, 'At least 100 distinct official publication pages are required')
const output = `${JSON.stringify(runtime, null, 2)}\n`
const destination = new URL('src/pages/tweet-midi/officialAnniversaryLogos.json', root)
if (process.argv.includes('--check')) assert.equal(readFileSync(destination, 'utf8'), output, 'Run node scripts/sync-anniversary-logo-registry.mjs')
else writeFileSync(destination, output)
console.log(`${Object.keys(runtime).length} verified local logos: provenance, hashes, local dependencies and runtime registry agree.`)
