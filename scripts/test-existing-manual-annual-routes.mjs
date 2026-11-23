import assert from 'node:assert/strict'
import {ASSETS} from '../src/data/portfolio-assets.js'
import {CATALOG, euroReturn} from '../src/data/duel-assets.js'
import {QUALIFIED_FUND_CALENDARS} from '../src/data/qualified-annual-calendars.js'
import {qualifyPreferredManualNav, isQualifiedAnnualPortfolioFund} from '../src/data/annual-portfolio-funds.js'
import {assetReturn, computeYearlyPerf} from '../src/pages/portfolio-generator/performance.js'
import {convertCalendarReturn} from '../src/data/calendar-fx.js'
import {latestCommonYears} from '../src/data/annual-window.js'
import {PROFILES} from '../src/pages/portfolio-generator/theses.js'
const previous = {'IE00BMC38736': [2022,2023,2024,2025], 'LU1875395870': [2021,2022,2023,2024,2025], 'FR0011550185': [2023,2024,2025], 'IE00BYPC1H27': [2021,2022,2023,2024,2025], 'IE00BK5BCH80': [2021,2022,2023]}
let restored = 0
for (const [isin, oldYears] of Object.entries(previous)) {
  const id = 'manual-' + isin, source = QUALIFIED_FUND_CALENDARS[isin]
  assert(source && qualifyPreferredManualNav(source), isin)
  const assets = ASSETS.filter(a => a.isin === isin), duels = CATALOG.filter(a => a.isin === isin)
  assert.equal(assets.length,1); assert.equal(duels.length,1)
  const asset=assets[0], duel=duels[0]
  for (const a of [asset,duel]) { assert.equal(a.id,id); assert(isQualifiedAnnualPortfolioFund(a)); assert.equal(a.manualOnly,true) }
  assert.equal(duel.role,'complement')
  assert(!JSON.stringify(PROFILES).includes(id), 'No new Auto recipe allocation')
  const years = latestCommonYears([source.years], {minimum:3})
  assert(oldYears.every(y => years.includes(y)), 'Existing manual periods remain available')
  restored += years.filter(y => !oldYears.includes(y)).length
  assert.deepEqual(Object.keys(computeYearlyPerf([{...asset,pct:100}])).map(Number),years)
  for (const year of years) {
    const expected=convertCalendarReturn(source.years[year],year,source.currency,'EUR')
    assert.equal(assetReturn(asset,year),expected); assert.equal(euroReturn(duel,year),expected)
  }
  for (const method of ['calendar-year proxy total return, net of fund fees','calendar-year NAV total return, gross of fund fees']) assert.equal(qualifyPreferredManualNav({...source,method}),null)
}
const ese = QUALIFIED_FUND_CALENDARS.FR0011550185
const legacy = qualifyPreferredManualNav({...ese, sourceUrls:['https://dokumenty.analizy.pl/pobierz/etf/E_SBNPEF002_C_EUR/KA/2026-09-30'], documentEvidence:undefined})
assert.equal(legacy.id,'manual-FR0011550185')
const official = {...ese, asOf:'2026-10-30', checkedAt:'2026-11-23',
  sourceUrls:['https://docfinder.bnpparibas-am.com/api/files/11111111-2222-3333-4444-555555555555/512'],
  documentEvidence:{catalogueUrl:legacy.bnpCatalogueUrl, sha256:'a'.repeat(64), referenceDate:'2026-10-30', publicationDate:'2026-11-07'}}
const review = new Date('2026-11-24T00:00:00Z')
assert.equal(qualifyPreferredManualNav(official,review).id,legacy.id)
for(const evidence of [undefined, {...official.documentEvidence,sha256:''},
  {...official.documentEvidence,catalogueUrl:legacy.bnpCatalogueUrl.replace('FR0011550185','FR0011550193')},
  {...official.documentEvidence,publicationDate:'2026-11-24'},
  {...official.documentEvidence,publicationDate:'2026-10-29'},
])assert.equal(qualifyPreferredManualNav({...official,documentEvidence:evidence},review),null)
assert.equal(qualifyPreferredManualNav({...official,sourceUrls:[official.sourceUrls[0]+'?id=changed']},review),null)
assert.equal(restored,8, 'Eight additional existing-part/year windows in each of the two tools')
console.log('Five existing shares: eight annual windows restored in manual portfolios and Duels, no new instruments/Auto roles; exact source, currency and convention retained')
