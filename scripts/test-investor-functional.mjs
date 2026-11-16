import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { INVESTORS, normalizePortfolio, holdingName } from '../src/pages/investor-portfolio/data.js'
import { publicationPlan, reportedAmount, cash, shortPosition } from '../src/pages/investor-portfolio/publication.js'
import { detailBlocks, paginateDetailBlocks } from '../src/pages/investor-portfolio/detail-pagination.js'
import { cachedImageRenderer } from '../src/pages/investor-portfolio/image-export.js'

let renders = 0
const render = cachedImageRenderer(() => { renders++; return 'same PNG' })
const first = render()
assert.equal(first, render(), 'concurrent callers share one render')
assert.deepEqual(await Promise.all([first, render(), render()]), ['same PNG', 'same PNG', 'same PNG'])
assert.equal(renders, 1)
let attempts = 0
const retry = cachedImageRenderer(() => { if (++attempts === 1) throw Error('Canvas unavailable'); return 'retried PNG' })
await assert.rejects(retry(), /Canvas unavailable/)
assert.equal(await retry(), 'retried PNG')
assert.equal(attempts, 2)
assert.equal(await cachedImageRenderer(() => 'new snapshot')(), 'new snapshot')

const korea = { issuerName: 'ISHARES INC', cusip: '464286772', shareClass: 'MSCI STH KOR ETF' }
assert.equal(holdingName(korea), 'ETF MSCI Corée du Sud')
assert.notEqual(holdingName({ ...korea, cusip: '000000001' }), 'ETF MSCI Corée du Sud')
assert.notEqual(holdingName({ ...korea, shareClass: 'OTHER ETF' }), 'ETF MSCI Corée du Sud')
assert.equal(holdingName({ issuerName: 'Monro,' }), 'Monro')
assert.equal(shortPosition({ issuerName: 'Centuri Holdings, Inc.' }), 'Centuri')
assert.equal(shortPosition({ issuerName: 'SandRidge Energy, Inc.' }), 'SandRidge Energy')

let ready = 0, blocked = 0, pages = 0
for (const [slug] of INVESTORS) {
  const payload = JSON.parse(await readFile(`public/data/investors/${slug}.json`, 'utf8'))
  const original = JSON.stringify(payload)
  const portfolio = normalizePortfolio(payload)
  if (portfolio.problem) {
    blocked++
    assert.throws(() => publicationPlan(portfolio))
  } else {
    ready++
    const plan = publicationPlan(portfolio)
    for (const row of plan.entries) {
      assert.equal(row.currency, portfolio.snapshot.currency)
      assert.equal(row.unit, 1)
      assert.equal(reportedAmount(row), cash(row.value, plan.currency))
    }
  }
  const blocks = detailBlocks(portfolio)
  for (const capacity of [24, 25]) {
    const paginated = paginateDetailBlocks(blocks, capacity)
    let blockIndex = 0
    for (const page of paginated) {
      assert(page.length <= capacity)
      let lineIndex = 0
      while (lineIndex < page.length) {
        const block = blocks[blockIndex++]
        assert.deepEqual(page.slice(lineIndex, lineIndex + block.lines.length), block.lines.map(text => ({ text, color: block.color })), `${slug}: complete position on one page`)
        lineIndex += block.lines.length
        if (lineIndex < page.length) assert.deepEqual(page[lineIndex++], { text: '' })
      }
    }
    assert.equal(blockIndex, blocks.length, `${slug}: all positions and options preserved`)
    pages += paginated.length
  }
  assert.equal(JSON.stringify(payload), original, 'raw financial observations unchanged')
}
assert.throws(() => paginateDetailBlocks([{ lines: Array(26).fill('long') }], 25), /JSON ou CSV/)
assert.throws(() => paginateDetailBlocks([], 0), /invalide/)
const option = { issuerName: 'Option test', putCall: 'CALL', shareClass: 'COM', cusip: '000000001', value: 3, currency: 'USD', unit: 1, weight: .00001 }
const blocks = detailBlocks({ holdings: [], snapshot: { holdings: [option] } })
assert(blocks[0].lines[0].startsWith('Options déclarées'))
assert(blocks[0].lines.some(line => line.includes('CALL')))
assert(blocks[0].lines.some(line => line.includes('< 0,1 %')))
console.log(`${ready} profils qualifiés, ${blocked} refus conservés ; ${pages} pages contrôlées à deux capacités, blocs intacts, unités et cache/réessai PNG.`)
