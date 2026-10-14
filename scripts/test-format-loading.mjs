import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as full from '../src/pages/tweet-midi/lib.js'
import { DATA_CATALOG, searchData } from '../src/data/catalog.js'
import { searchCatalog } from '../src/data/catalog-search.js'
import { projectReviewCatalog } from '../src/data/review-projection.js'
import { scheduledReview } from '../src/pages/data-review/lib.js'
import { maintenanceLinks } from '../src/data/maintenance-links.js'
const formats = { dilemme: 'dilemme', lexique: 'fiche-lexique', comparatif: 'comparatif-etf', anniversaire: 'anniversaire', performance: 'performance-depuis', pouvoir: 'pouvoir-achat' }
for (const [name, format] of Object.entries(formats)) {
  const engine = await import(`../src/pages/tweet-midi/engines/${name}.js`)
  assert(engine.ALL_ITEMS.every(item => item.format === format), `${name} loads another format's pool`)
  for (const mode of Object.values(full.MODES)) {
    const expected = full.poolForFormat(format, mode), actual = engine.poolForFormat(format, mode)
    assert.deepEqual(actual, expected, `${name}/${mode}: selection pools changed`)
    for (const i of new Set([0, Math.floor(actual.length / 2), actual.length - 1])) {
      if (i < 0) continue
      const item = actual[i]
      assert.equal(engine.buildTweetText(item), full.buildTweetText(item), `${name}/${mode}: text changed`)
      assert.deepEqual(engine.getSecondaryOptionsForFormat(format, mode, item.assetId ?? item.assetIdA, item.assetIdB), full.getSecondaryOptionsForFormat(format, mode, item.assetId ?? item.assetIdA, item.assetIdB))
    }
  }
  assert.deepEqual(engine.getSubjectsForFormat(format), full.getSubjectsForFormat(format))
}
const projected = projectReviewCatalog(DATA_CATALOG)
for (const [i, record] of DATA_CATALOG.entries()) {
  for (const [j, field] of record.fields.entries()) {
    for (const today of ['2026-10-14', '2027-01-01']) {
      const base = { checkedAt: field.metadata.checkedAt }
      assert.deepEqual(scheduledReview(base, projected[i].fields[j], today), scheduledReview(base, field, today), `Review deadline changed: ${record.id}`)
    }
    assert.deepEqual(maintenanceLinks(projected[i], projected[i].fields[j]), maintenanceLinks(record, field))
  }
}
const index = DATA_CATALOG.map(({ fields: _fields, ...record }) => record)
for (const q of ['', 'DCAM', 'MSCI World', 'IE00B4JNQZ49', 'inexistant']) {
  for (const type of ['all','instrument','index','series']) assert.deepEqual(searchCatalog(index,q,type).map(r=>r.id),searchData(q,type).map(r=>r.id))
}
if (process.argv.includes('--built')) {
  // Every exported fiche is an exact, complete projection, including archived evidence.
  for (const record of DATA_CATALOG) {
    const { createHash } = await import('node:crypto')
    const source = JSON.stringify(record), hash = createHash('sha256').update(source).digest('hex').slice(0,20)
    assert.equal(await readFile(`dist/data/catalog/${hash}.json`, 'utf8'), source)
  }
}
console.log('Independent format pools/text, review dates/links, search ordering and complete exported records verified.')
