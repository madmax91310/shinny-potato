import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import config from './index-company-sources.json' with { type: 'json' }

const indices = [
  'acwi', 'acwi-imi', 'sp500-equal-weight', 'world-ex-usa',
  'msci-world-health-care', 'msci-world-materials', 'msci-world-utilities',
  'msci-world-industrials', 'sp-euro-dividend-aristocrats',
]
const shares = indices.map(id => config.physicalProxies[id].isin)
assert(process.argv[2], 'Output directory required')
const output = resolve(process.argv[2])
mkdirSync(output, { recursive: true })
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const booksPath = 'src/data/dca-complete-holdings.json'
const before = read(booksPath)
const collection = resolve(output, 'dca-complete-holdings.json')
const qualification = resolve(output, 'index-company-qualification-observations.json')

execFileSync('python', ['scripts/collect_dca_complete_holdings.py', '--apply', '--only', ...shares, '--output', collection], { stdio: 'inherit' })
execFileSync(process.execPath, ['scripts/build-index-company-compositions.mjs', '--report', qualification], { stdio: 'inherit' })

const books = read(booksPath)
const { observations, errors } = read(collection)
assert.deepEqual(errors, [])
assert.deepEqual(Object.keys(observations).sort(), [...shares].sort())
for (const id of Object.keys(books)) {
  if (!shares.includes(id)) assert.deepEqual(books[id], before[id], id)
}

const qualified = read('src/data/index-company-qualified.json')
const projected = read('src/data/index-company-compositions.json')
const failures = read(qualification).errors
const results = indices.map((id, index) => {
  const isin = shares[index]
  const book = books[isin]
  const allocations = book.compositionFacts
  const result = projected[id]
  assert.equal(book.complete, true, id)
  assert.equal(book.sha256, observations[isin].sha256, id)
  assert(Date.parse(book.checkedAt) > Date.parse(before[isin].checkedAt), id)
  assert.equal(allocations?.countries?.asOf, book.asOf, id)
  assert.equal(allocations?.sectors?.asOf, book.asOf, id)
  assert.equal(result.available, true, id)
  if (id === 'sp-euro-dividend-aristocrats' && result.retained) {
    assert.equal(failures.find(row => row.sourceId === id)?.error, 'Somme des poids incohérente')
    const previous = qualified[id].companies
    assert.equal(result.asOf, previous.asOf)
    assert.equal(result.checkedAt, previous.checkedAt)
    assert.deepEqual(result.visualFacts, previous.visualFacts)
  } else {
    assert.notEqual(result.retained, true, id)
    assert.equal(result.asOf, book.asOf, id)
    assert.equal(result.sha256, book.sha256, id)
  }
  return { id, isin, observed: book.asOf, validated: result.asOf, retained: Boolean(result.retained),
    reason: failures.find(row => row.sourceId === id)?.error ?? null, sha256: book.sha256 }
})
writeFileSync(resolve(output, 'coulisses-qualification.json'), JSON.stringify(results, null, 2) + '\n')
console.log(JSON.stringify(results))
