import * as performance from '../src/pages/tweet-midi/data/performanceHistory.js'
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
const candidates=performance.MARKET_ASSETS.filter(asset=>asset.isin&&performance.getAnnualReturnStartYears(asset.id).length)
assert.deepEqual(Object.keys(index).sort(),[...new Set(candidates.map(asset=>asset.isin))].sort(),'Every usable exact share has one shortcut')
for(const [isin,id] of Object.entries(index))assert(candidates.some(a=>a.isin===isin&&a.id===id),'Shortcut must select a qualified listing of that exact share')
assert.equal(index.IE00B579F325,'gold-invesco-usd','The qualified long London series remains separately labelled in USD')
assert.equal(ASSETS[index.IE00B579F325].currency,'USD')
assert(ASSETS.etfIE00B579F325,'The EUR listing and its independently valid windows are preserved')
for (const etf of ETFS) {
  const assetId = getPerformanceAssetId(etf.isin)
  if (!assetId) {
    assert.equal(getPerformanceHref(etf.isin), null)
    continue
  }
  assert.equal(performance.ASSETS[assetId].isin, etf.isin)
  assert.equal(new URL(getPerformanceHref(etf.isin), 'https://example.test').searchParams.get('isin'), etf.isin)
  const years = getSecondaryOptionsForFormat(FORMATS.PERFORMANCE_DEPUIS, MODES.SIMPLE, assetId)
  assert(years.length > 0)
  for (const year of years) {
    const { item } = pickForSelection({ format: FORMATS.PERFORMANCE_DEPUIS, subjectId: assetId, secondaryId: year, history: [] })
    assert.equal(item.assetId, assetId)
    assert.equal(item.year, year)
  }
}
// Same benchmark is insufficient: shares without their own usable history must
// never open a substitute index/older ETF. Derive absence as collection expands.
for (const isin of [...ETFS.filter(etf => !Object.hasOwn(index, etf.isin)).map(etf => etf.isin), 'unknown', '__proto__', null]) {
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

// Both tools offer the same source identities and selector labels, without
// changing publication labels or substituting an ETF for a benchmark.
const { MARKET_ASSETS } = await import('../src/pages/tweet-midi/data/marketHistory.js')
const { historyOptionLabel } = await import('../src/data/history-selection.js')
const { getSubjectsForFormat } = await import('../src/pages/tweet-midi/lib.js')
assert.deepEqual(MARKET_ASSETS.map(asset => asset.id), ASSET_ORDER)
const choices = getSubjectsForFormat(FORMATS.PERFORMANCE_DEPUIS).flatMap(group => group.items)
for (const id of ASSET_ORDER) {
  if(!performance.getAnnualReturnStartYears(id).length){assert(!choices.some(choice=>choice.id===id));continue}
  assert.equal(choices.find(choice => choice.id === id).label,
    `${ASSETS[id].icon} ${historyOptionLabel(id, ASSETS[id])}`)
  if (['ETC','ETN','ETP'].includes(ASSETS[id].instrumentType)) assert(historyOptionLabel(id, ASSETS[id]).startsWith(`${ASSETS[id].instrumentType} · `))
  else if (ASSETS[id].instrumentType === 'EQUITY') assert.equal(historyOptionLabel(id, ASSETS[id]), `${ASSETS[id].label} · ${ASSETS[id].currency}`)
  else if (ASSETS[id].isin) assert.match(historyOptionLabel(id, ASSETS[id]), /^ETF · /)
}
assert.match(historyOptionLabel('msciWorldMomentum', ASSETS.msciWorldMomentum), /^Indice · MSCI World Momentum/)
assert.match(historyOptionLabel('nasdaq100', ASSETS.nasdaq100), /^Indice · /)
assert.match(historyOptionLabel('soxx', ASSETS.soxx), /^ETF · /)
for(const asset of performance.MARKET_ASSETS.filter(a=>!ASSETS[a.id] && performance.getAnnualReturnStartYears(a.id).length)) assert(choices.some(c=>c.id===asset.id),'Annual-only series remains selectable')
console.log(`Same ${ASSET_ORDER.length} source identities and unambiguous index/ETF/ETC selection labels verified.`)
