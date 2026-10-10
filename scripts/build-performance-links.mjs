import { writeFile } from 'node:fs/promises'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { getAnnualReturnStartYears } from '../src/pages/tweet-midi/data/marketHistory.js'

// Only exact ETF share classes with usable annual histories. This small index
// keeps the presentation route from importing monthly prices or the tweet engine.
const links = {}
for (const id of ASSET_ORDER) {
  const asset = ASSETS[id]
  if (!asset.isin || !getAnnualReturnStartYears(id).length) continue
  if (links[asset.isin]) throw new Error(`Ambiguous performance history: ${asset.isin}`)
  links[asset.isin] = id
}
await writeFile(new URL('../src/data/performance-links.json', import.meta.url), `${JSON.stringify(links, null, 2)}\n`)
console.log(`Performance shortcuts: ${Object.keys(links).length} exact share classes.`)
