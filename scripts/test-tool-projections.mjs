import assert from 'node:assert/strict'
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import * as original from '../src/data/market-history.js'
// Exercise Vite's bundled config, virtual modules and actual route components.
// Direct imports alone cannot catch renamed closure references in a projection.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const loaded = await server.ssrLoadModule('/src/data/market-history.js')
  assert.equal(JSON.stringify(loaded.ASSETS), JSON.stringify(original.ASSETS))
  for (const id of Object.keys(original.ASSETS)) assert.equal(loaded.getAssetMinDate(id), original.getAssetMinDate(id))
  for (const route of ['tweet-midi', ...['dilemme','lexique','comparatif','anniversaire','performance','pouvoir'].map(n => `tweet-midi/formats/${n}`), 'investment-calculator', 'data-review', 'data-search']) {
    const { default: App } = await server.ssrLoadModule(`/src/pages/${route}/App.jsx`)
    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(App)))
    assert(html.length > 1000, `Empty ${route}`)
    if (route === 'tweet-midi') assert(html.includes('Il y a X ans'), 'Legacy mixed format controls missing')
  }
  console.log('Vite projections and all affected route components render with canonical histories.')
} finally { await server.close() }
