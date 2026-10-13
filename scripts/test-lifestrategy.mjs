import assert from 'node:assert/strict'
import { LIFESTRATEGY_RECORDS, LIFESTRATEGY_SHEETS } from '../src/data/lifestrategy.js'
import { ETFS } from '../src/data/etf-cards.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { buildText } from '../src/pages/etf-sheets/lib.js'
import { getETFArt } from '../src/pages/etf-sheets/visualIdentity.js'
import { ASSETS } from '../src/data/market-history.js'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, MARKET_ASSETS } from '../src/pages/tweet-midi/data/marketHistory.js'
import { buildCustomDuel } from '../src/pages/portfolio-duels/lib.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { ASSETS as PORTFOLIO_ASSETS } from '../src/data/portfolio-assets.js'
import { PROFILES } from '../src/pages/dca-profiles/data.js'
import { buildComparisonEtfDetails } from '../src/pages/etf-tweets/lib/comparisonDetails.js'
assert.equal(LIFESTRATEGY_SHEETS.length, 4)
for (const sheet of LIFESTRATEGY_SHEETS) {
  const r = LIFESTRATEGY_RECORDS[sheet.isin], n = Number(sheet.id.replace('lifestrategy',''))
  const card = ETFS.find(x=>x.id===sheet.id)
  assert(card && card.listing.currency==='EUR' && card.listing.ticker===`V${n}A`)
  assert.equal(r.aum.scope,'share-class'); assert(r.aum.precisionNote)
  assert(!r.performance.years[2020]); assert.equal(Object.keys(r.performance.years)[0],'2021')
  assert(r.assetAllocation.rows.some(x=>x.name==='Actions'))
  assert(r.holdings.rows.every(x=>x.name.startsWith('Vanguard ')))
  assert(!r.countries && !r.sectors)
  const text = buildText(card)
  assert(text.includes('Allocation publiée au')); assert(!/undefined|NaN/.test(text)); getETFArt(sheet.id)
  const history = ASSETS[`etfLifeStrategy${n}`]
  assert(history && history.points[0].date==='2021-01' && history.currency==='EUR')
  assert(!history.anniversaryPoints)
  assert(MARKET_ASSETS.some(x=>x.id===history.id))
  assert(!ANNIVERSAIRE_ELIGIBLE_ASSETS.some(x=>x.id===history.id))
  assert(PORTFOLIO_ASSETS.some(x=>x.id===sheet.id))
  assert(PROFILES.some(p=>p.lines.some(l=>l.asset===sheet.id)))
}
for(const theme of DEFAULT_THEMES.filter(t=>t.id.startsWith('lifestrategy-'))) {
  assert(theme.etfs.length>=2)
  for(const fund of theme.etfs) {
    const text=buildComparisonEtfDetails(fund,[2021,2022,2023,2024,2025]).join('\n')
    assert(text.includes('Allocation du fonds au')); assert(!text.includes('Répartition sectorielle'))
  }
}
for(const definition of DUELS.filter(x=>x.id.startsWith('lifestrategy'))) {
  const duel=buildCustomDuel(definition)
  assert(duel.years.every(y=>y>=2021)); assert(Number.isFinite(duel.a.final)&&Number.isFinite(duel.b.final))
}
console.log('LifeStrategy: 4 shares, cross-tool histories, compositions, duels, DCA and anniversary exclusion verified.')
