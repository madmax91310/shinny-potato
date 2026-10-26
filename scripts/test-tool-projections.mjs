import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as annualOriginal from '../src/pages/tweet-midi/data/marketHistory.js'
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import * as bankOriginal from '../src/pages/tweet-bank/data.js'
import * as original from '../src/data/market-history.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { projectReviewCatalog } from '../src/data/review-projection.js'
import { describeDataField } from '../src/pages/data-search/lib.js'
// Exercise Vite's bundled config, virtual modules and actual route components.
// Direct imports alone cannot catch renamed closure references in a projection.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const bank = await server.ssrLoadModule('/src/pages/tweet-bank/data.js')
  for (const [key, value] of Object.entries(bankOriginal)) {
    if (typeof value !== 'function') assert.equal(JSON.stringify(bank[key]), JSON.stringify(value), `Tweet bank ${key} changed`)
  }
  for (const tweet of bankOriginal.TWEETS) assert.equal(JSON.stringify(bank.getTweet(tweet.id)), JSON.stringify(tweet))
  const loaded = await server.ssrLoadModule('/src/data/market-history.js')
  assert.equal(JSON.stringify(loaded.ASSETS), JSON.stringify(original.ASSETS))
  assert.deepEqual(JSON.parse(JSON.stringify(loaded.derivedAnnualInflation())), original.derivedAnnualInflation(), 'The full history projection retains the same default')
  const calculator=await server.ssrLoadModule('/src/data/calculator-history.js')
  assert.deepEqual(JSON.parse(JSON.stringify(calculator.derivedAnnualInflation())), original.derivedAnnualInflation(), 'Projected defaults must retain their dependencies')
  assert.deepEqual(Object.keys(calculator).sort(), [...Object.keys(original).filter(key=>key!=='BASELINE_ASSETS'), 'ensureCalculatorAsset'].sort(), 'Every projected export needs an explicit binding')
  const annual=await server.ssrLoadModule('/src/pages/tweet-midi/data/performanceHistory.js')
  const records=new Map(Object.values(original.ASSETS).map(asset=>{const body=JSON.stringify(asset);return [createHash('sha256').update(body).digest('hex').slice(0,20),asset]}))
  const previousFetch=globalThis.fetch
  let requests=0
  globalThis.fetch=async url=>{requests++;const hash=String(url).match(/\/data\/history\/([a-f0-9]+)\.json$/)?.[1];assert(records.has(hash),`Unknown selected history URL: ${url}`);return{ok:true,json:async()=>JSON.parse(JSON.stringify(records.get(hash)))}}
  try {
    for(const [id,asset] of Object.entries(original.ASSETS)){
      assert.equal(calculator.ASSETS[id].historyPending,true)
      assert.deepEqual(JSON.parse(JSON.stringify(calculator.ASSETS[id].points)),[asset.points[0],asset.points.at(-1)])
      assert.equal(calculator.getAssetMinDate(id),original.getAssetMinDate(id))
      assert.equal(annual.ASSETS[id].points,undefined)
      for(const year of annualOriginal.getAnnualReturnStartYears(id)) assert.deepEqual(JSON.parse(JSON.stringify(annual.getAnnualReturns(id,year))),annualOriginal.getAnnualReturns(id,year))
      await calculator.ensureCalculatorAsset(id)
      assert.deepEqual(JSON.parse(JSON.stringify(calculator.ASSETS[id])),JSON.parse(JSON.stringify(asset)))
    }
    assert.equal(requests,Object.keys(original.ASSETS).length)
    await calculator.ensureCalculatorAsset('apple')
    assert.equal(requests,Object.keys(original.ASSETS).length,'Loaded history must stay cached')
  } finally {globalThis.fetch=previousFetch}
  const review = await server.ssrLoadModule('/src/data/review-catalog.js')
  assert.equal(JSON.stringify(review.REVIEW_CATALOG), JSON.stringify(projectReviewCatalog(DATA_CATALOG)))
  assert.equal(describeDataField({ label: 'PER', value: { value: 22.5, unit: 'fois' } }), '22,5 fois')
  assert.match(describeDataField({ label: 'Statistique de ménages', value: { value: 100, unit: 'EUR', referencePeriod: '2025', metricLabel: 'Médiane' } }), /100 € · 2025 · Médiane/)
  for (const id of Object.keys(original.ASSETS)) assert.equal(loaded.getAssetMinDate(id), original.getAssetMinDate(id))
  const {default:mixed} = await server.ssrLoadModule('/src/pages/tweet-midi/lib.js')
  const {default:comparison} = await server.ssrLoadModule('/src/pages/tweet-midi/engines/comparatif.js')
  for(const item of comparison.ALL_ITEMS) {
    assert.deepEqual(mixed.getPerformanceCurrencies(item),comparison.getPerformanceCurrencies(item),'Mixed-format currency selection must use the ETF comparator')
    for(const currency of comparison.getPerformanceCurrencies(item))
      assert.equal(mixed.buildTweetText({...item,currency}),comparison.buildTweetText({...item,currency}))
  }
  for (const route of ['tweet-midi', ...['dilemme','lexique','comparatif','anniversaire','performance','pouvoir'].map(n => `tweet-midi/formats/${n}`), 'investment-calculator', 'data-review', 'data-search']) {
    const { default: App } = await server.ssrLoadModule(`/src/pages/${route}/App.jsx`)
    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(App)))
    if(route==='investment-calculator'){assert.match(html,/role="status"/);assert.match(html,/Chargement de l’historique/)}
    else assert(html.length > 1000, `Empty ${route}`)
    if (route === 'tweet-midi') assert(html.includes('Il y a X ans'), 'Legacy mixed format controls missing')
  }
  console.log('Vite projections: every selected history and annual window match canonical data; cache, loading state and affected routes verified.')
} finally { await server.close() }
