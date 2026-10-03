// Prove next month's gold refresh reaches consumers without another code change.
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = mkdtempSync(join(tmpdir(), 'gold-consumers-'))
try {
  cpSync(new URL('../src', import.meta.url), join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}')
  const path = join(dir, 'src/data/worldbank-gold-monthly.json')
  const gold = JSON.parse(readFileSync(path))
  const prior = gold.points.at(-1)[0]
  const [year, month] = prior.split('-').map(Number)
  const next = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7)
  const price = gold.points.at(-1)[1] * 1.01
  gold.points.push([next, price])
  writeFileSync(path, JSON.stringify(gold))
  const load = file => import(pathToFileURL(join(dir, 'src', file)))
  const { ASSETS, LATEST_YM } = await load('data/market-history.js')
  const { MARKET_HISTORY_REVIEW } = await load('data/market-history-review.js')
  const { derive, buildTweetText } = await load('pages/investment-calculator/lib.js')
  const { getAssetMaxDate } = await load('pages/tweet-midi/data/marketHistory.js')
  assert.equal(ASSETS.or.points.at(-1).date, next)
  assert.equal(LATEST_YM, next)
  assert.equal(MARKET_HISTORY_REVIEW['history:or'].periodEnd, next)
  assert.equal(getAssetMaxDate('or'), next)
  const state = { assetId: 'or', amountRaw: '1000', mode: 'dca', startYear: 2020, startMonth: 1, overridePriceRaw: '' }
  const result = derive(state)
  assert.equal(result.endYm, next)
  assert(Number.isFinite(result.result.finalValue))
  assert.equal(result.livretA, null)
  assert.equal(result.inflation, null)
  assert(buildTweetText(state, result).includes(gold.attribution))
  assert.equal(derive({ ...state, assetId: 'bitcoin' }).endYm, ASSETS.bitcoin.points.at(-1).date)
  // A more recent USD series must not extend custom EUR comparisons beyond INSEE.
  assert(derive({ ...state, assetId: 'custom', customStart: '100', customEnd: '110' }).endYm <= prior)
  console.log(`Gold: synthetic ${next} reaches registry, review, calculator and Tweet Midi; other asset dates preserved.`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
