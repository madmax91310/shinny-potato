import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function auditPublishedData(directory) {
  const root = resolve(directory)
  const manifest = JSON.parse(readFileSync(join(root, 'data/publication-manifest.json')))
  assert.equal(manifest.schemaVersion, 1, 'Unsupported publication manifest')
  const files = Object.entries(manifest.files ?? {}).filter(([name]) => name.startsWith('public/data/'))
  assert(files.length, 'Publication manifest declares no public data')
  for (const [name, expected] of files) {
    const body = readFileSync(join(root, name.slice('public/'.length)))
    const actual = createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')
    assert.equal(actual, expected, `Published bytes differ from the sealed manifest: ${name}`)
  }
  return { publicFilesVerified: files.length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(auditPublishedData(process.argv[2] ?? 'dist')))
}
