import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { auditPublishedData } from './audit-published-data.mjs'

const root = mkdtempSync(join(tmpdir(), 'published-data-'))
try {
  mkdirSync(join(root, 'data'))
  const catalog = join(root, 'data/tweet-bank-catalog.json')
  const manifest = join(root, 'data/publication-manifest.json')
  const writeCatalog = generatedAt => writeFileSync(catalog, JSON.stringify({ generatedAt, tweets: [{ id: 'archive:1', text: 'Texte archivé', review: { locked: true } }] }))
  const seal = () => {
    const body = readFileSync(catalog)
    const hash = createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')
    writeFileSync(manifest, JSON.stringify({ schemaVersion: 1, files: { 'public/data/tweet-bank-catalog.json': hash } }))
  }
  writeCatalog('2026-10-27T10:00:00Z'); seal()
  assert.equal(auditPublishedData(root).publicFilesVerified, 1)
  // Exact production defect: only the projection timestamp changes after sealing.
  writeCatalog('2026-10-27T11:00:00Z')
  assert.throws(() => auditPublishedData(root), /tweet-bank-catalog/)
  seal()
  assert.equal(auditPublishedData(root).publicFilesVerified, 1)
  rmSync(catalog)
  assert.throws(() => auditPublishedData(root), /ENOENT/)
  writeFileSync(manifest, JSON.stringify({ schemaVersion: 1, files: {} }))
  assert.throws(() => auditPublishedData(root), /declares no public data/)
  console.log('Publication: exact bytes, late projection, resealing, missing file and empty manifest verified.')
} finally {
  rmSync(root, { recursive: true, force: true })
}
