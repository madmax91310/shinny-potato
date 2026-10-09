import assert from 'node:assert/strict'
import { ASSETS, getAsset } from '../src/data/portfolio-assets.js'
import { ITEM_BY_ID, euroReturn } from '../src/data/duel-assets.js'
import annualFx from '../src/data/annual-fx.json' with { type: 'json' }
import { assetReturn, returnCurrency, computeYearlyPerf, annualizedReturn, performanceNotes } from '../src/pages/portfolio-generator/performance.js'
import { buildManualPortfolio, renderTweetText, RISK_BOUNDS } from '../src/pages/portfolio-generator/engine.js'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { contentValidity, renderBankCopy, reviewPolicy } from '../src/pages/tweet-bank/validity.js'
import { countAvailable } from '../src/pages/tweet-bank/lib.js'

for (const asset of ASSETS) assert.ok(['EUR', 'USD'].includes(returnCurrency(asset)), `Undocumented historical currency: ${asset.id}`)
for (const [id, item] of ITEM_BY_ID) {
  const asset = getAsset(id)
  if (!asset) continue
  for (let year = 2020; year <= 2025; year++) {
    const expected = euroReturn(item, year)
    if (Number.isFinite(expected)) assert.ok(Math.abs(assetReturn(asset, year) - expected) < 1e-10, `Generator/duel currency parity: ${id}/${year}`)
  }
}
const usd = { returnCurrency: 'USD', calendarReturns: { 2020: 10 }, pct: 50 }
const eur = { returnCurrency: 'EUR', calendarReturns: { 2020: 10 }, pct: 50 }
const expected = ((1.1 * annualFx.years[2019].value / annualFx.years[2020].value - 1) * 100 + 10) / 2
assert.equal(computeYearlyPerf([usd, eur])[2020], expected)
assert.notEqual(expected, 10, 'A USD/EUR mixture must never use the raw weighted average')
assert.equal(assetReturn({ returnCurrency: 'USD', calendarReturns: { 2099: 10 } }, 2099), null, 'Missing FX cannot silently assume 1:1')
assert.equal(assetReturn({ calendarReturns: { 2020: 10 } }, 2020), null, 'Unknown currency cannot silently assume EUR')
const partial = computeYearlyPerf([{ calendarReturns: { 2020: 10 }, pct: 100 }])
assert.equal(annualizedReturn(partial), null)
const portfolio = buildManualPortfolio([{ id: 'msci_world_amundi_pea', pct: 50 }, { id: 'bitcoin', pct: 50 }], 'generaliste', [])
const post = renderTweetText({ ...portfolio, perf: { 2020: 999 } })
assert.match(post, /simulées \(EUR\)/)
assert.match(post, /taux BCE/)
assert.match(post, /Simulation sur l'indice/)
assert.match(post, /n’est pas une perte maximale/)
assert.doesNotMatch(post, /999/)
assert.match(performanceNotes(portfolio.selection), /2020/)
for (const bound of Object.values(RISK_BOUNDS)) assert.doesNotMatch(bound.text, /perte max acceptable/)

const today = '2026-10-09'
for (const id of [32, 37, 33, 43, 47]) {
  const tweet = TWEETS.find(t => t.id === id)
  assert.equal(contentValidity(tweet, undefined, today).ready, false)
  assert.throws(() => renderBankCopy(tweet, undefined, today))
  const draft = { text: 'Bilan historique actualisé : 100 €.', asOf: '2026-10-08', checkedAt: today, verifiedText: 'Bilan historique actualisé : 100 €.', verifiedAsOf: '2026-10-08' }
  assert.equal(contentValidity(tweet, draft, today).ready, true)
  assert.match(renderBankCopy(tweet, draft, today), /2026-10-08/)
  assert.equal(contentValidity(tweet, draft, '2026-10-10').ready, false, 'Market and personal reviews expire the next day')
  assert.equal(contentValidity(tweet, { ...draft, text: 'Changed after review' }, today).ready, false)
  assert.equal(contentValidity(tweet, { ...draft, asOf: '2026-10-07' }, today).ready, false)
  assert.equal(contentValidity(tweet, { ...draft, checkedAt: '2026-10-10' }, today).ready, false)
  assert.equal(contentValidity(tweet, { ...draft, asOf: '2026-02-30', verifiedAsOf: '2026-02-30' }, today).ready, false)
}
const personal = TWEETS.find(t => t.id === 43)
assert.equal(contentValidity(personal, { text: personal.text, asOf: today, checkedAt: today, verifiedText: personal.text, verifiedAsOf: today }, today).ready, false, 'Checking an unchanged personal archive cannot make it current')
const general = TWEETS.find(t => t.id === 2)
assert.equal(renderBankCopy(general, undefined, today), general.text)
for (const tweet of TWEETS.filter(t => String(t.id).startsWith('pedagogy:'))) {
  assert.equal(renderBankCopy(tweet, undefined, today), tweet.text)
  assert.equal(contentValidity(tweet, undefined, '2027-10-09').ready, false)
}
assert.equal(reviewPolicy({ id: 'pedagogy:new-unreviewed' }).kind, 'verification', 'New entries default to unverified')
assert.equal(countAvailable([personal], {}), 0, 'Completed cooldown does not validate content')
assert.equal(countAvailable([general], {}), 1)
console.log('OK: verified currency coverage, generator/duel EUR parity, missing FX, proxy disclosure, stale saved results, independent content freshness, date validation and edited-review invalidation.')
