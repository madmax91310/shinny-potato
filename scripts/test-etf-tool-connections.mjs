import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import {getManualDuelArt} from '../src/pages/portfolio-duels/visualIdentity.js'
import { getAnnualReturnStartYears as routedPerformanceYears, ASSETS as routedPerformanceAssets } from '../src/pages/tweet-midi/data/performanceHistory.js'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { ETF_MONTHLY_HISTORIES } from '../src/data/etf-monthly-history.js'
import { derive, buildTweetText as buildInvestmentText } from '../src/pages/investment-calculator/lib.js'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
import BASE_LEVELS from '../src/data/anniversary-levels.json' with { type: 'json' }
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, getHistoricalPrice, getValidYearsBackOptions, getAnnualReturnStartYears, getAnnualReturns, ymForYearsBack, performanceBasis } from '../src/pages/tweet-midi/data/marketHistory.js'
import { buildAnniversaireText, buildAnniversaireComparatifText, buildPerformanceDepuisText, FORMATS, MODES } from '../src/pages/tweet-midi/lib.js'
import { ANNIVERSARY_ART } from '../src/pages/tweet-midi/anniversaryArt.js'
import { PERFORMANCE_ART } from '../src/pages/tweet-midi/performanceArt.js'
import { INVESTMENT_ART } from '../src/pages/investment-calculator/emeraldArt.js'

import NON_BOND_LEVELS from '../src/data/non-bond-levels.json' with {type:'json'};
// A collector can validate this test before the production build regenerates its
// projections. Always build the shortcuts from the current observations first.
execFileSync(process.execPath, [fileURLToPath(new URL('./build-performance-links.mjs', import.meta.url))], { stdio: 'inherit' })
const { getPerformanceAssetId } = await import('../src/data/performance-links.js')
const LEVELS={...BASE_LEVELS,...NON_BOND_LEVELS};
const clock = new Date('2026-10-11T12:00:00Z')
assert.deepEqual(getManualDuelArt({isin:'FR0013412269'}, []), {theme:'chip',scene:'etf-night/chip.webp',kind:'illustration'}, 'A new qualified PANX history must not prevent monthly publication when its ETF sheet is absent')
assert.throws(()=>getManualDuelArt({isin:'UNKNOWN'}, []), /Illustration non vérifiée/, 'Unreviewed instruments keep the existing visual qualification guard')
const close = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} != ${b}`)
for (const id of ['etfImie','etfVwce','etfEqualWeight','etfMinVol','etfWqdv','etfTdiv','etfEpra','etfCmod','etfSemi','etfLock']) assert(ETF_MONTHLY_HISTORIES[id], `Initial exact share missing: ${id}`)
for (const [id, asset] of Object.entries(ETF_MONTHLY_HISTORIES)) {
  assert.equal(ASSETS[id], asset)
  assert(ASSET_ORDER.includes(id))
  assert.equal(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a => a.id === id), Boolean(asset.anniversaryPoints?.length && getValidYearsBackOptions(id,new Date()).length), id)
  assert(ANNIVERSARY_ART[id] && PERFORMANCE_ART[id] && INVESTMENT_ART[id])
  const routedId=getPerformanceAssetId(asset.isin)
  if(routedId){assert.equal(routedPerformanceAssets[routedId].isin,asset.isin);assert(routedPerformanceYears(routedId).length>0)}
  const priceInstrument = ['ETC','ETN','ETP'].includes(asset.instrumentType)
  assert.match(performanceBasis(id), priceInstrument ? new RegExp(`${asset.valuationBasis?'valeur liquidative':'cours'} de l’${asset.instrumentType}`) : /revenus réinvestis/)
  const start = asset.points[0].date
  for (const mode of ['lump', 'dca']) {
    const expected = (mode === 'lump' ? 100 / asset.points[0].price : asset.points.reduce((n, p) => n + 100 / p.price, 0)) * asset.points.at(-1).price
    const inputs = { assetId: id, amountRaw: '100', startYear: Number(start.slice(0, 4)), startMonth: Number(start.slice(5)), mode, overridePriceRaw: '' }
    const qualification=qualifyHistoryWindow(asset,start,asset.points.at(-1).date)
    if(!qualification.qualified){assert.throws(()=>derive(inputs),error=>error.message===qualification.reason);continue}
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
  if (years.length) {
  const expectedYears=[]
  for(let year=Number(start.slice(0,4))+1;`${year}-12`<=asset.points.at(-1).date;year++){
    if(qualifyHistoryWindow(asset,`${year-1}-12`,`${year}-12`).qualified)expectedYears.push(year)
  }
  assert.deepEqual(years,expectedYears)
  const rows = getAnnualReturns(id, years[0])
  assert(rows.every(r => r.startDate.endsWith('-12') && r.endDate.endsWith('-12')))
  const annual = buildPerformanceDepuisText({ format: FORMATS.PERFORMANCE_DEPUIS, mode: MODES.SIMPLE, assetId: id, year: years[0] })
  assert(annual.includes(asset.currency) && annual.includes(priceInstrument ? `${asset.valuationBasis?'valeur liquidative':'cours'} de l’${asset.instrumentType}` : 'revenus réinvestis'))
  } else {
    assert(asset.points[0].date > `${clock.getUTCFullYear()-2}-12` || !qualifyHistoryWindow(asset,asset.points[0].date,asset.points.at(-1).date).qualified, `${id}: unexpected missing completed annual history`);
  }
  if (!asset.anniversaryPoints?.length) {
    assert(!LEVELS[id], `${id}: anniversary collection must remain disabled`)
    continue
  }
  const options = getValidYearsBackOptions(id, clock)
  if (!options.length) assert(asset.anniversaryPoints[0].date > `${clock.getUTCFullYear()-1}-09`, `${id}: unexpected missing anniversary history`)
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
  assert.match(latest.method,asset.valuationBasis?/Valeur liquidative officielle/:/cours brut/)
  assert.equal(latest.valuationBasis,asset.anniversaryValuationBasis??asset.valuationBasis)
  assert.equal(resolveAnniversaryLevel(id, '', new Date(`${latest.asOf}T12:00:00Z`)).value, latest.value)
  const validYearsBack=getValidYearsBackOptions(id,new Date())
  if (!validYearsBack.length) continue
  const text = buildAnniversaireText({ format: FORMATS.ANNIVERSAIRE, mode: MODES.SIMPLE, assetId: id, yearsBack: validYearsBack[0] }, '100')
  assert(text.includes(asset.label))
  assert(!text.includes('[à saisir]'))
}
// Distributed income belongs to performance, never to the historical price story.
assert(ASSETS.etfWqdv.points.some((p, i) => Math.abs(p.price - ASSETS.etfWqdv.anniversaryPoints[i].price) > .01))
const comparative = buildAnniversaireComparatifText({ format: FORMATS.ANNIVERSAIRE, mode: MODES.COMPARATIF, assetIdA: 'etfImie', assetIdB: 'etfVwce', yearsBack: 1 }, '100', '200')
assert(comparative.includes(ASSETS.etfImie.label) && comparative.includes(ASSETS.etfVwce.label))
console.log(`${Object.keys(ETF_MONTHLY_HISTORIES).length} ETF/ETC: exact shares, lump/DCA, complete annual returns, raw anniversary prices, daily closes, comparisons and visual identities validated.`)

// New commodity labels must reach the actual copied presentation text.
const { buildText: presentationText } = await import('../src/pages/etf-sheets/lib.js');
const { ETFS: presentationCards } = await import('../src/data/etf-cards.js');
for (const card of presentationCards.filter(card => card.id.startsWith('etc-')))
  assert.doesNotMatch(presentationText(card), /undefined|NaN/, card.id);
