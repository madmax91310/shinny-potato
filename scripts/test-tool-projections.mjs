import assert from 'node:assert/strict'
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
  const review = await server.ssrLoadModule('/src/data/review-catalog.js')
  assert.equal(JSON.stringify(review.REVIEW_CATALOG), JSON.stringify(projectReviewCatalog(DATA_CATALOG)))
  assert.equal(describeDataField({ label: 'PER', value: { value: 22.5, unit: 'fois' } }), '22,5 fois')
  assert.match(describeDataField({ label: 'Statistique de ménages', value: { value: 100, unit: 'EUR', referencePeriod: '2025', metricLabel: 'Médiane' } }), /100 € · 2025 · Médiane/)
  for (const id of Object.keys(original.ASSETS)) assert.equal(loaded.getAssetMinDate(id), original.getAssetMinDate(id))
  for (const route of ['tweet-midi', ...['dilemme','lexique','comparatif','anniversaire','performance','pouvoir'].map(n => `tweet-midi/formats/${n}`), 'investment-calculator', 'data-review', 'data-search']) {
    const { default: App } = await server.ssrLoadModule(`/src/pages/${route}/App.jsx`)
    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(App)))
    assert(html.length > 1000, `Empty ${route}`)
    if (route === 'tweet-midi') assert(html.includes('Il y a X ans'), 'Legacy mixed format controls missing')
  }
  console.log('Vite projections and all affected route components render with canonical histories.')
} finally { await server.close() }
