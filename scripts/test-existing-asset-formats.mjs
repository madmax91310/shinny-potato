import assert from 'node:assert/strict'
import HISTORY from '../src/data/anniversary-index-history.json' with { type: 'json' }
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js'
import { computeAssetSeries } from '../src/pages/investment-calculator/lib.js'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, MARKET_ASSETS, getAnnualReturns } from '../src/pages/tweet-midi/data/marketHistory.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { buildTweetText } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { SHEETS } from '../src/data/index-factsheets.js'
import { getCurrentIndexFacts } from '../src/data/index-facts.js'
import { CATALOG, buildDuel } from '../src/pages/portfolio-duels/lib.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'

for (const [id, record] of Object.entries(HISTORY).filter(([id]) => id !== 'ftseAllWorld')) {
  assert(ASSET_ORDER.includes(id))
  assert(MARKET_ASSETS.some(asset => asset.id === id))
  assert.equal(ANNIVERSAIRE_ELIGIBLE_ASSETS.filter(asset => asset.id === id).length, 1)
  assert.deepEqual(ASSETS[id].points, record.points.map(([date, price]) => ({ date, price })))
  assert.equal(MARKET_HISTORY_REVIEW[`history:${id}`].method, record.method)
  const [start, end] = [record.points[0], record.points.at(-1)]
  const single = computeAssetSeries(ASSETS[id].points, start[0], end[0], 1000, 'lump')
  assert(Math.abs(single.finalValue - 1000 * end[1] / start[1]) < 1e-7)
  const dca = computeAssetSeries(ASSETS[id].points, start[0], end[0], 100, 'dca')
  const expected = record.points.reduce((sum, [, value]) => sum + 100 / value, 0) * end[1]
  assert(Math.abs(dca.finalValue - expected) < 1e-7)
  assert.equal(dca.totalInvested, record.points.length * 100)
  for (const row of getAnnualReturns(id, 2016)) {
    const values = new Map(record.points)
    assert(Math.abs(row.pct - (values.get(`${row.year}-12`) / values.get(`${row.year - 1}-12`) - 1) * 100) < 1e-9)
  }
}
assert(ASSET_ORDER.includes('ftseAllWorld'))
assert.equal(ASSETS.ftseAllWorld.points[0].date, '2024-10', 'No FTSE history before its first collected observation')
assert.equal(ASSETS.msciWorldQuality.indexCode, '702787', 'Keep Quality distinct from Sector Neutral Quality')
assert.equal(ASSETS.msciWorldValue.indexCode, '105868', 'Keep Value distinct from Enhanced Value')
for (const id of ['monetaire-obligations-courtes', 'world-meme-indice-pea', 'sp500-meme-indice-pea']) {
  const theme = DEFAULT_THEMES.find(item => item.id === id)
  assert(theme)
  const text = buildTweetText(theme)
  assert(!/\bundefined\b|\bNaN\b|non renseignés|à confirmer|non disponible/i.test(text))
  assert(theme.etfs.every(fund => text.includes(fund.isin)))
}
for (const id of ['msci-usa', 'msci-india']) {
  const sheet = SHEETS.find(item => item.id === id)
  assert.equal(sheet.indexFacts, getCurrentIndexFacts(id, '2026-09-30'))
  assert.equal(sheet.performance.kind, 'indice')
  assert.match(sheet.performance.detail, /dividendes.*réinvestis/)
}
for (const id of ['oblig_etat_eur_short', 'oblig_etat_eur', 'oblig_corp_ig', 'oblig_hy', 'oblig_inflation']) {
  assert.equal(CATALOG.find(item => item.id === id).basis, 'fund')
  assert.equal(CATALOG.find(item => item.id === id).currency, 'EUR')
}
for (const definition of DUELS.filter(item => ['oblig-0-1-ou-1-3','oblig-etat-ou-entreprises','oblig-ig-ou-high-yield','oblig-etat-ou-inflation'].includes(item.id))) {
  const duel = buildDuel(definition)
  assert.equal(duel.a.assets[0].id, duel.b.assets[0].id)
  assert.equal(duel.a.assets[0].pct, 70)
  assert.equal(duel.b.assets[0].pct, 70)
  assert.deepEqual(duel.years, [2020, 2021, 2022, 2023, 2024, 2025])
}
console.log('Eight exact monthly histories, DCA, annual closes, index variants, three comparisons, two index sheets and four bond duels verified.')
