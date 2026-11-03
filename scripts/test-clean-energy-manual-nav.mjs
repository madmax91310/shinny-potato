import assert from 'node:assert/strict'
import {ASSETS} from '../src/data/portfolio-assets.js'
import {CATALOG, euroReturn} from '../src/data/duel-assets.js'
import {QUALIFIED_FUND_CALENDARS} from '../src/data/qualified-annual-calendars.js'
import {qualifyPreferredManualNav, isQualifiedAnnualPortfolioFund} from '../src/data/annual-portfolio-funds.js'
import {assetReturn, hasCompleteAutomaticWindow, computeYearlyPerf} from '../src/pages/portfolio-generator/performance.js'
import {convertCalendarReturn} from '../src/data/calendar-fx.js'
import {portfolioHistoryContract} from './lib/portfolio-history-contract.mjs'
import {buildCustomDuel} from '../src/pages/portfolio-duels/lib.js'
import {automationPaths, classify} from './classify-deploy-scope.mjs'
const isin = 'IE00BK5BCH80', id = 'manual-' + isin, source = QUALIFIED_FUND_CALENDARS[isin]
assert(source && qualifyPreferredManualNav(source))
const matches = ASSETS.filter(a => a.isin === isin), duels = CATALOG.filter(a => a.isin === isin)
assert.equal(matches.length, 1); assert.equal(duels.length, 1)
const asset = matches[0], duel = duels[0]
assert.equal(asset.id, id); assert.equal(duel.id, id, 'Saved selection identity stays stable')
assert(isQualifiedAnnualPortfolioFund(asset)); assert(isQualifiedAnnualPortfolioFund(duel))
assert.equal(asset.returnCurrency, 'USD'); assert.equal(duel.role, 'complement')
assert.equal(asset.manualOnly, true); assert.equal(hasCompleteAutomaticWindow(asset), false)
assert.equal(portfolioHistoryContract(asset), 'partial-manual')
assert.match(asset.confidenceNote, /valeur liquidative.*dollars.*réinvestis/)
assert.equal(buildCustomDuel({left: [{id, pct: 100}], right: [{id: 'msci_world_ishares', pct: 100}]}).sources.find(s => s.isin === isin).note, asset.confidenceNote)
assert.equal(classify(['src/data/manual-source-routes.json'], automationPaths()).dataOnly, false, 'Changing an admission policy still requires the full code gate')
assert.deepEqual(Object.keys(asset.calendarReturns), ['2021', '2022', '2023', '2024', '2025'])
for (const [year, native] of Object.entries(source.years)) {
  const expected = convertCalendarReturn(native, Number(year), 'USD', 'EUR')
  assert.equal(assetReturn(asset, Number(year)), expected)
  assert.equal(euroReturn(duel, Number(year)), expected, 'Same qualified return and single FX conversion in both tools')
}
assert.deepEqual(computeYearlyPerf([{...asset, pct: 100}]), Object.fromEntries(Object.entries(source.years).map(([y, v]) => [y, convertCalendarReturn(v, Number(y), 'USD', 'EUR')])))
for (const patch of [{currency: 'EUR'}, {basis: 'market-price'}, {sourceUrls: ['https://example.invalid']}, {years: {2024: 1, 2025: 2}}, {checkedAt: '2000-01-01'}]) {
  assert.equal(qualifyPreferredManualNav({...source, ...patch}), null)
}
console.log('L&G Clean Energy: existing manual/Duel IDs, exact annual NAV, five full years, single EUR conversion, no automatic admission')
