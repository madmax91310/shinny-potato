import assert from 'node:assert/strict'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { ETF_MONTHLY_HISTORIES } from '../src/data/etf-monthly-history.js'
import { derive, buildTweetText as buildInvestmentText } from '../src/pages/investment-calculator/lib.js'
import { getPerformanceAssetId } from '../src/data/performance-links.js'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
import LEVELS from '../src/data/anniversary-levels.json' with { type: 'json' }
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, getHistoricalPrice, getValidYearsBackOptions, getAnnualReturnStartYears, getAnnualReturns, ymForYearsBack, performanceBasis } from '../src/pages/tweet-midi/data/marketHistory.js'
import { buildAnniversaireText, buildAnniversaireComparatifText, buildPerformanceDepuisText, FORMATS, MODES } from '../src/pages/tweet-midi/lib.js'
import { ANNIVERSARY_ART } from '../src/pages/tweet-midi/anniversaryArt.js'
import { PERFORMANCE_ART } from '../src/pages/tweet-midi/performanceArt.js'
import { INVESTMENT_ART } from '../src/pages/investment-calculator/emeraldArt.js'

const clock = new Date('2026-10-11T12:00:00Z')
const close = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} != ${b}`)
assert.equal(Object.keys(ETF_MONTHLY_HISTORIES).length, 10)
for (const [id, asset] of Object.entries(ETF_MONTHLY_HISTORIES)) {
  assert.equal(ASSETS[id], asset)
  assert(ASSET_ORDER.includes(id))
  assert(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a => a.id === id))
  assert(ANNIVERSARY_ART[id] && PERFORMANCE_ART[id] && INVESTMENT_ART[id])
  assert.equal(getPerformanceAssetId(asset.isin), id)
  assert.match(performanceBasis(id), /revenus réinvestis/)
  const start = asset.points[0].date
  for (const mode of ['lump', 'dca']) {
    const expected = (mode === 'lump' ? 100 / asset.points[0].price : asset.points.reduce((n, p) => n + 100 / p.price, 0)) * asset.points.at(-1).price
    const inputs = { assetId: id, amountRaw: '100', startYear: Number(start.slice(0, 4)), startMonth: Number(start.slice(5)), mode, overridePriceRaw: '' }
    const d = derive(inputs)
    close(d.result.finalValue, expected)
    assert.equal(d.endYm, asset.points.at(-1).date)
    if (asset.currency === 'USD') assert.equal(d.livretA, null)
    if (start < '2015-01' && asset.currency === 'EUR') {
      assert.equal(d.livretA, null)
      assert(!buildInvestmentText(inputs, d).includes('Livret A'))
    }
  }
  const years = getAnnualReturnStartYears(id)
  assert(years.length)
  assert.equal(years[0], Number(start.slice(0, 4)) + 1)
  const rows = getAnnualReturns(id, years[0])
  assert(rows.every(r => r.startDate.endsWith('-12') && r.endDate.endsWith('-12')))
  const annual = buildPerformanceDepuisText({ format: FORMATS.PERFORMANCE_DEPUIS, mode: MODES.SIMPLE, assetId: id, year: years[0] })
  assert(annual.includes(asset.currency) && annual.includes('revenus réinvestis'))
  const options = getValidYearsBackOptions(id, clock)
  assert(options.length)
  for (const back of options) {
    const ym = ymForYearsBack(back, clock)
    assert(ym >= start)
    close(getHistoricalPrice(id, ym), asset.anniversaryPoints.find(p => p.date === ym).price)
  }
  const latest = LEVELS[id]
  assert(latest, `${id}: automatically collected latest close required`)
  assert.equal(latest.isin, asset.isin)
  assert.equal(latest.ticker, asset.ticker)
  assert.equal(latest.mic, asset.mic)
  assert.equal(latest.currency, asset.currency)
  assert.match(latest.method, /cours brut/)
  assert.equal(resolveAnniversaryLevel(id, '', new Date(`${latest.asOf}T12:00:00Z`)).value, latest.value)
  const text = buildAnniversaireText({ format: FORMATS.ANNIVERSAIRE, mode: MODES.SIMPLE, assetId: id, yearsBack: 1 }, '100')
  assert(text.includes(asset.label))
  assert(!text.includes('[à saisir]'))
}
// Distributed income belongs to performance, never to the historical price story.
assert(ASSETS.etfWqdv.points.some((p, i) => Math.abs(p.price - ASSETS.etfWqdv.anniversaryPoints[i].price) > .01))
const comparative = buildAnniversaireComparatifText({ format: FORMATS.ANNIVERSAIRE, mode: MODES.COMPARATIF, assetIdA: 'etfImie', assetIdB: 'etfVwce', yearsBack: 1 }, '100', '200')
assert(comparative.includes(ASSETS.etfImie.label) && comparative.includes(ASSETS.etfVwce.label))
console.log('10 ETF: exact shares, lump/DCA, complete annual returns, raw anniversary prices, daily closes, comparisons and visual identities validated.')
