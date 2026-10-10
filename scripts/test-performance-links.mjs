import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { ETFS } from '../src/data/etf-cards.js'
import { getPerformanceAssetId, getPerformanceHref } from '../src/data/performance-links.js'
import { FORMATS, MODES, getSecondaryOptionsForFormat, pickForSelection } from '../src/pages/tweet-midi/lib.js'
import { getAnnualReturnStartYears } from '../src/pages/tweet-midi/data/marketHistory.js'
import { SPARSE_MONTHLY_DATA_IDS, INCONSISTENT_MONTHLY_DATA_IDS, getAssetMinDate } from '../src/data/market-history.js'
import { getSimulationAssetId, getSimulationHref, getAnnualPerformanceHref } from '../src/data/simulation-links.js'

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

const simulationIds = JSON.parse(await readFile(new URL('../src/data/simulation-links.json', import.meta.url)))
assert.deepEqual(simulationIds, ASSET_ORDER.filter(id => getAnnualReturnStartYears(id).length
  && !SPARSE_MONTHLY_DATA_IDS.has(id) && !INCONSISTENT_MONTHLY_DATA_IDS.has(id)))
for (const id of simulationIds) {
  const points = ASSETS[id].points.filter(point => point.date >= getAssetMinDate(id))
  assert(points.length > 12, `Insufficient verified monthly history: ${id}`)
  assert(points.every(point => Number.isFinite(point.price) && point.price > 0))
  const monthIndex = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5))
  for (let i = 1; i < points.length; i++) {
    assert.equal(monthIndex(points[i].date) - monthIndex(points[i - 1].date), 1, `Missing monthly point: ${id}`)
  }
  for (const href of [getSimulationHref(id), getAnnualPerformanceHref(id)]) {
    const params = new URL(href, 'https://example.test').searchParams
    assert.equal(params.get('asset'), id)
    assert.deepEqual([...params.keys()], ['asset'], 'Transfer identity only, not a mismatched period or price')
  }
}
for (const id of ['unknown', '__proto__', 'custom', 'FR001400U5Q4', null]) {
  assert.equal(getSimulationAssetId(id), null)
  assert.equal(getSimulationHref(id), null)
  assert.equal(getAnnualPerformanceHref(id), null)
}
console.log(`Simulation links verified: ${simulationIds.length} exact shared histories, continuous verified monthly data and identity-only URLs.`)
