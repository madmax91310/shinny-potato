import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// Check the bytes Vite will actually publish, before an upload can succeed.
const manifest = JSON.parse(readFileSync('dist/data/publication-manifest.json'))
const entries = Object.entries(manifest.files).filter(([path]) => path.startsWith('public/data/'))
assert(entries.length > 0, 'The publication manifest must certify public data files')
for (const [path, expected] of entries) {
  const body = readFileSync(`dist/${path.slice('public/'.length)}`)
  const actual = createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')
  assert.equal(actual, expected, `Built public bytes differ from the publication manifest: ${path}`)
}
console.log(`Publication manifest matches all ${entries.length} built public data files.`)
