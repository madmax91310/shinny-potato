import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { ASSET_ORDER } from '../src/data/market-history.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { PERFORMANCE_ART } from '../src/pages/tweet-midi/performanceArt.js'
import { performanceLayout } from '../src/pages/tweet-midi/performanceImage.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
assert.deepEqual(Object.keys(PERFORMANCE_ART).sort(), [...ASSET_ORDER].sort())
for (let count = 1; count <= 40; count++) {
  const layout = performanceLayout(count)
  assert.ok(layout.rows * layout.columns >= count)
  assert.ok(layout.gridTop + (layout.rows - 1) * layout.rowStep + layout.cellHeight < layout.height)
}
for (const art of Object.values(PERFORMANCE_ART)) await readFile(`public/asset-art/${art.mark || art.scene}`)
assert.equal(getComparisonPerformance('FR001400U5Q4'), null, 'No complete calendar year for this share class')
const ubsPerformance = getComparisonPerformance('IE00BD4TXV59')
assert.equal(ubsPerformance.referenceIsin, 'IE00BD4TXV59', 'Never substitute another share class')
assert.equal(ubsPerformance.currency, 'USD')
assert.match(ubsPerformance.source, /swissfunddata\.ch\/sfdpub\/docs\/fsm-8522_03_03-/)
assert.deepEqual(Object.fromEntries(Object.entries(ubsPerformance.calendarReturns).filter(([year]) => Number(year) >= 2022 && Number(year) <= 2025)), {2022:-18.26,2023:23.79,2024:18.86,2025:21.31})
assert.equal(getComparisonPerformance('IE00BTJRMP35').label, 'ETF')
assert.equal(getComparisonPerformance('IE00BTJRMP35').referenceIsin, 'IE00BTJRMP35')
assert.equal(getComparisonPerformance('IE00BK5BQT80').currency, 'USD')
assert.equal(getComparisonPerformance('IE0007Y8Y157'), null, 'No invented full calendar year for a new fund')
const port = 4321, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
  browser = await chromium.launch({ headless: true, args:['--disable-gpu','--disable-software-rasterizer','--disable-dev-shm-usage','--js-flags=--expose-gc'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage(); await page.goto(base)
  const result = await page.evaluate(async () => {
    const { DEFAULT_THEMES } = await import('/shinny-potato/src/data/etf-themes.js')
    const { getInstrumentPeaStatus } = await import('/shinny-potato/src/data/instruments.js')
    const { ASSET_ORDER } = await import('/shinny-potato/src/data/market-history.js')
    const { getAnnualReturnStartYears, getAnnualReturns } = await import('/shinny-potato/src/pages/tweet-midi/data/marketHistory.js')
    const { getComparisonComposition, compositionEvidenceLabel } = await import('/shinny-potato/src/pages/etf-tweets/lib/comparisonComposition.js')
    const { renderComparatifEtfImage, getComparisonPaperCards } = await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
    const { renderPerformanceImage, cumulativePerformance } = await import('/shinny-potato/src/pages/tweet-midi/performanceImage.js')
    const original = CanvasRenderingContext2D.prototype.fillText
    let boxes = [], labels = [], current
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value), box = { text: value, l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, t: y - m.actualBoundingBoxAscent, b: y + m.actualBoundingBoxDescent }
      const transform = this.getTransform(); box.t += transform.f; box.b += transform.f
      if (box.l < 0 || box.r > this.canvas.width || box.t < 0 || box.b > this.canvas.height) throw new Error(`Clipped ${current}: ${value}`)
      for (const prior of boxes) if (Math.min(box.r, prior.r) - Math.max(box.l, prior.l) > 1 && Math.min(box.b, prior.b) - Math.max(box.t, prior.t) > 1) throw new Error(`Overlap ${current}: ${prior.text} / ${value}`)
      boxes.push(box); labels.push(String(value)); return original.call(this, value, x, y, ...rest)
    }
    const samples = []
    const check = async (name, render, keep) => {
      boxes = []; labels = []; current = name
      const canvas = await render()
      if (name.startsWith('performance-') && canvas.width !== 1600) throw new Error('Performance width changed')
      if (labels.filter(label => /[ée]pargnant.?libre/i.test(label)).length !== 1) throw new Error('Missing signature')
      if (keep) samples.push({ name, png: canvas.toDataURL(), labels })
      // Release backing pixels between hundreds of exports in constrained Chromium.
      canvas.width = 1; canvas.height = 1
      window.gc?.()
      return labels
    }
    try {
      for (const theme of DEFAULT_THEMES) {
        const words = await check(`compare-${theme.id}`, () => renderComparatifEtfImage(theme), ['ia-robotique', 'sante', 'ressources-naturelles', 'materials-classic-advanced', 'industrie-infrastructures', 'sp500-equal-weight', 'monde', 'usa', 'etc-metaux', 'semiconducteurs-tech', 'quantique', 'emergents-pea', 'world-pea', 'monetaire-obligations-courtes', 'world-meme-indice-pea', 'sp500-meme-indice-pea'].includes(theme.id))
        const all=words.join(' ').replace(/\s+/g,'')
        const cards=getComparisonPaperCards(theme)
        for (const [i,fund] of theme.etfs.entries()) {
          if (!all.includes(cards[i].name.replace(/\s+/g,'')) || !words.includes(`${fund.frais.replace(/\s*%$/, '')} %`)) throw new Error('Lost fund fact')
          const status=getInstrumentPeaStatus(fund.isin)
          if(cards[i].badge!==(status===null?null:status?'PEA':'CTO'))throw new Error('Incorrect qualified PEA badge')
          if(cards[i].badge&&!words.includes(cards[i].badge))throw new Error('Missing envelope')
        }
        for (const fund of theme.etfs) {
          const composition = getComparisonComposition(fund.isin, 'countries')
          if (composition.classification && !all.includes(compositionEvidenceLabel(composition).replace(/\s+/g,''))) throw new Error(`Missing dated DWS classification: ${fund.isin}`)
        }
        if(words.some(word=>/Historique annuel non disponible|PERFORMANCES ANNUELLES/.test(word)))throw new Error('Unapproved history panel')
      }
      for (const id of ASSET_ORDER) {
        const years = getAnnualReturnStartYears(id), year = years[0]
        if (!years.length) {
          if (getAnnualReturns(id, 2000).length) throw new Error(`Annual window unexpectedly absent: ${id}`)
          let refused = false
          try { await renderPerformanceImage({ mode: 'simple', assetId: id, year: 2000 }) }
          catch (error) { if (!error.message.includes('Actif ou performances annuelles absents')) throw error; refused = true }
          if (!refused) throw new Error(`Incomplete annual history rendered: ${id}`)
          continue
        }
        const words = await check(`performance-${id}`, () => renderPerformanceImage({ mode: 'simple', assetId: id, year }), ['msciWorld', 'or', 'apple', 'bitcoin', 'silver', 'msciEurope', 'msciIndia', 'msciWorldQuality', 'msciWorldValue', 'russell2000'].includes(id))
        const rows = getAnnualReturns(id, year)
        if (words.some(word => /PERFORMANCE DEPUIS|PERFORMANCE CUMULÉE|clôtures annuelles|SANS CONVERSION/.test(word))) throw new Error('Generic series heading returned')
        if (!words.includes(`Cumul sur ${rows.length} an${rows.length > 1 ? 's' : ''}`)) throw new Error('Missing period summary')
        if (words.some(word => /sources?\s*:|MSCI ·|BCE|Yahoo|Les performances passées/i.test(word))) throw new Error('Source/footer returned on performance image')
        const { performanceBasis } = await import('/shinny-potato/src/pages/tweet-midi/data/marketHistory.js')
        const currency = (await import('/shinny-potato/src/pages/tweet-midi/lib.js')).getMarketAsset(id).currency
        if (!words.join(' ').includes(performanceBasis(id).replace(`${currency} · `, '').replace(` · ${currency}`, ''))) throw new Error('Missing return convention')
        if (!words.includes(`${rows[0].year} — ${rows.at(-1).year} · EN ${(await import('/shinny-potato/src/pages/tweet-midi/lib.js')).getMarketAsset(id).currency}`)) throw new Error('Missing dates or currency')
        const { formatPerformancePct } = await import('/shinny-potato/src/pages/tweet-midi/performanceFormat.js')
        for (const row of rows) {
          const annual = formatPerformancePct(row.pct)
          if (!words.includes(annual) || !words.includes(String(row.year))) throw new Error('Missing annual bar label')
        }
        const total = cumulativePerformance(rows)
        const percent = formatPerformancePct(total)
        if (!words.includes(percent)) throw new Error('Changed performance calculation')
      }
      const { getPerformanceEntries } = await import('/shinny-potato/src/pages/tweet-midi/engines/performance.js')
      const { performanceBasis } = await import('/shinny-potato/src/pages/tweet-midi/data/performanceHistory.js')
      const { performanceDisplayBasis } = await import('/shinny-potato/src/pages/tweet-midi/performanceCurrency.js')
      const { formatPerformancePct } = await import('/shinny-potato/src/pages/tweet-midi/performanceFormat.js')
      const worldYears = getAnnualReturnStartYears('msciWorld')
      const sampleYear = worldYears[Math.max(0,worldYears.length - 10)]
      const longId = ASSET_ORDER.find(id => getAnnualReturnStartYears(id).length > 10)
      const commonYear = (a,b) => getAnnualReturnStartYears(a).find(year => getAnnualReturnStartYears(b).includes(year))
      for (const item of [
        ...[1,2,5,6,10].filter(count => count <= worldYears.length).map(count => ({mode:'simple',assetId:'msciWorld',year:worldYears.at(-count)})),
        ...(longId ? [{mode:'simple',assetId:longId,year:getAnnualReturnStartYears(longId)[0]}] : []),
        ...['EUR','USD'].map(currency => ({mode:'simple',assetId:'msciWorld',year:sampleYear,currency})),
        {mode:'simple',assetId:'sp500',year:getAnnualReturnStartYears('sp500')[0],currency:'EUR'},
        {mode:'comparatif',assetIdA:'msciWorld',assetIdB:'or',year:commonYear('msciWorld','or')},
        {mode:'comparatif',assetIdA:'msciWorld',assetIdB:'stoxx600',year:commonYear('msciWorld','stoxx600'),currency:'USD'},
        {mode:'comparatif',assetIdA:'msciAcwi',assetIdB:'msciWorld',year:commonYear('msciAcwi','msciWorld'),currency:'EUR'},
      ]) {
        const entries = getPerformanceEntries(item)
        const name = `performance-cobalt-${item.assetId || item.assetIdA}-${item.year}-${item.currency || 'native'}-${item.mode}`
        const before = JSON.stringify(item)
        const words = await check(name, () => renderPerformanceImage(item), true)
        if (before !== JSON.stringify(item)) throw new Error('Selection mutated by renderer')
        for (const {asset,returns} of entries) {
          if (!words.includes(`${returns[0].year} — ${returns.at(-1).year} · EN ${asset.currency}`)) throw new Error('Wrong displayed currency/period')
          if (!words.includes(formatPerformancePct(cumulativePerformance(returns)))) throw new Error('Wrong converted total')
          for (const row of returns) if (!words.includes(String(row.year)) || !words.includes(formatPerformancePct(row.pct))) throw new Error('Wrong annual value')
          const basis = performanceDisplayBasis(asset,performanceBasis(asset.id)).split(' · ').filter(part=>![asset.currency,asset.sourceCurrency].includes(part)).join(' · ')
          if (!words.join(' ').includes(basis)) throw new Error('Lost official/converted return convention')
        }
        // Long share identities remain exact, with wrapping rather than ellipsis.
        for (const {asset} of entries) if (!words.join(' ').includes((asset.label || asset.tweetPhrase).replace(/^Indice\s+/i,''))) throw new Error('Asset name truncated')
        if (item.assetId === 'msciWorld' && entries[0].returns.length === 10 && !item.currency) {
          const canvas = await renderPerformanceImage(item)
          if (canvas.height !== 1600) throw new Error('Ten-year single export must be square')
        }
      }
    } finally { CanvasRenderingContext2D.prototype.fillText = original }
    return samples
  })
  await mkdir('test-artifacts/stylized-formats', { recursive: true })
  for (const sample of result) {
    await writeFile(`test-artifacts/stylized-formats/${sample.name}.png`, Buffer.from(sample.png.split(',')[1], 'base64'))
    await writeFile(`test-artifacts/stylized-formats/${sample.name}.txt`, sample.labels.join('\n'))
  }
  console.log(`${DEFAULT_THEMES.length} comparatifs et ${ASSET_ORDER.length} actifs : visuels explicites, chiffres inchangés, devises, références, signature, aucun chevauchement.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
