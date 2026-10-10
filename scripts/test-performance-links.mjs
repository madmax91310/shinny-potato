import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { ETFS } from '../src/data/etf-cards.js'
import { getPerformanceAssetId, getPerformanceHref } from '../src/data/performance-links.js'
import { FORMATS, MODES, getSecondaryOptionsForFormat, pickForSelection } from '../src/pages/tweet-midi/lib.js'
import { getAnnualReturnStartYears } from '../src/pages/tweet-midi/data/marketHistory.js'

const index = JSON.parse(await readFile(new URL('../src/data/performance-links.json', import.meta.url)))
const expected = Object.fromEntries(ASSET_ORDER.filter(id => ASSETS[id].isin && getAnnualReturnStartYears(id).length)
  .map(id => [ASSETS[id].isin, id]))
assert.deepEqual(index, expected, 'Shortcut index must match the usable share-class histories')
for (const etf of ETFS) {
  const assetId = getPerformanceAssetId(etf.isin)
  if (!assetId) {
    assert.equal(getPerformanceHref(etf.isin), null)
    continue
  }
  assert.equal(ASSETS[assetId].isin, etf.isin)
  assert.equal(new URL(getPerformanceHref(etf.isin), 'https://example.test').searchParams.get('isin'), etf.isin)
  const years = getSecondaryOptionsForFormat(FORMATS.PERFORMANCE_DEPUIS, MODES.SIMPLE, assetId)
  assert(years.length > 0)
  for (const year of years) {
    const { item } = pickForSelection({ format: FORMATS.PERFORMANCE_DEPUIS, subjectId: assetId, secondaryId: year, history: [] })
    assert.equal(item.assetId, assetId)
    assert.equal(item.year, year)
  }
}
// Same benchmark is insufficient: these World and S&P 500 share classes have
// no exact monthly history and must never open a substitute index/older ETF.
for (const isin of ['FR001400U5Q4', 'IE0002XZSHO1', 'FR0011550185', 'unknown', '__proto__', null]) {
  assert.equal(getPerformanceHref(isin), null)
}
console.log(`Performance links verified: ${Object.keys(index).length} exact histories; valid years and absent shares checked.`)
