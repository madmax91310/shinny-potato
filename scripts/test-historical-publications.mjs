import assert from 'node:assert/strict'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { getAnnualReturns, getAnnualReturnStartYears, getHistoricalPrice, performanceBasis } from '../src/pages/tweet-midi/data/marketHistory.js'
import { getPerformanceEntries, buildPerformanceDepuisText, buildPerformanceDepuisComparatifText, buildAnniversaireComparatifText, MODES } from '../src/pages/tweet-midi/lib.js'
import { anniversaryComparisonNote } from '../src/pages/tweet-midi/anniversaryEditorial.js'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
import { derive, buildTweetText } from '../src/pages/investment-calculator/lib.js'

const state = { assetId:'apple', amountRaw:'1000', mode:'lump', startYear:2020, startMonth:1, overridePriceRaw:'' }
assert.match(buildTweetText(state, derive(state)), /dividendes réinvestis/i)
assert.match(performanceBasis('apple'), /USD.*revenus réinvestis/)
assert.match(performanceBasis('cac40'), /hors dividendes/)
assert.match(performanceBasis('msciWorld'), /bruts réinvestis/)
assert.match(performanceBasis('stoxx600'), /nets réinvestis/)
for (const id of ['apple','microsoft','broadcom','tesla']) {
  assert.equal(ASSETS[id].anniversaryPoints.length, ASSETS[id].points.length)
  for (const point of ASSETS[id].anniversaryPoints) assert.equal(getHistoricalPrice(id, point.date), point.price)
}
assert.notEqual(getHistoricalPrice('apple','2020-01'), ASSETS.apple.points.find(p=>p.date==='2020-01').price)
const growth = rows => rows.reduce((v, r) => v * (1 + r.pct / 100), 1)
let windows = 0
for (const assetId of ASSET_ORDER) for (const year of getAnnualReturnStartYears(assetId)) {
  const rows = getAnnualReturns(assetId, year)
  assert.equal(rows[0].year, year)
  rows.forEach((row, i) => {
    assert.equal(row.year, year+i)
    assert.equal(row.startDate, `${row.year-1}-12`)
    assert.equal(row.endDate, `${row.year}-12`)
  })
  const points = ASSETS[assetId].points
  const first = points.find(p => p.date === rows[0].startDate).price
  const last = points.find(p => p.date === rows.at(-1).endDate).price
  assert.ok(Math.abs(growth(rows) - last/first) < 1e-8)
  assert.ok(buildPerformanceDepuisText({assetId,year}).includes(performanceBasis(assetId)))
  windows++
}
// A missing December cannot become a November annual close or a skipped cumulative year.
const points = ASSETS.apple.points
try {
  ASSETS.apple.points = points.filter(p => p.date !== '2022-12')
  assert.deepEqual(getAnnualReturns('apple', 2020).map(r=>r.year), [2020,2021])
  assert(!getAnnualReturnStartYears('apple').includes(2022))
  assert.deepEqual(getAnnualReturns('apple',2022), [])
  const item = { mode:MODES.COMPARATIF, assetIdA:'apple', assetIdB:'microsoft', year:2020 }
  const entries = getPerformanceEntries(item)
  assert(entries.every(e=>e.returns.at(-1).year===2021))
  const text = buildPerformanceDepuisComparatifText(item)
  assert.equal([...text.matchAll(/^🟢 2020|^🔴 2020/gm)].length, 2)
  assert(!text.includes('2023 :'))
  assert(text.indexOf(entries[0].asset.label) < text.indexOf(entries[1].asset.label))
} finally { ASSETS.apple.points = points }
const usd = {currency:'USD'}, eur = {currency:'EUR'}
const a = {asOf:'2026-10-08'}, b = {asOf:'2026-10-07'}
assert.equal(anniversaryComparisonNote(usd,usd,a,a), '')
assert.match(anniversaryComparisonNote(usd,eur,a,a), /Devises différentes/)
assert.match(anniversaryComparisonNote(usd,usd,a,b), /Dates.*différentes/)
assert.match(anniversaryComparisonNote(usd,{...usd,anniversaryVariant:'dividendes nets réinvestis'},a,a), /dividendes différent/)
assert.equal(anniversaryComparisonNote(usd,usd,{manual:true},{manual:true}), '')
assert.match(anniversaryComparisonNote(usd,usd,{manual:true},a), /Dates/)
const mixed = buildAnniversaireComparatifText({assetIdA:'bitcoin',assetIdB:'asml',yearsBack:1},'100000','900')
assert.match(mixed,/Devises différentes/)
assert.doesNotMatch(mixed,/Écart :|meilleure variation|a moins baissé/)
const fixture = {bitcoin:{value:100,asOf:'2026-02-31',maxAgeDays:7}}
assert.equal(resolveAnniversaryLevel('bitcoin','',new Date('2026-03-04'),fixture),null)
fixture.bitcoin.asOf = '2026-03-03'; delete fixture.bitcoin.maxAgeDays
assert.equal(resolveAnniversaryLevel('bitcoin','',new Date('2026-03-04'),fixture),null)
console.log(`${windows} fenêtres annuelles : clôtures exactes, cumuls, devises et conventions ; lacunes, dates invalides et comparatifs vérifiés.`)
