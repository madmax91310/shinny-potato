import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { ASSET_ORDER } from '../src/data/market-history.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { NEON_ASSET_ART, getPaperArt } from '../src/pages/tweet-midi/stylizedArt.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
assert.deepEqual(Object.keys(NEON_ASSET_ART).sort(), [...ASSET_ORDER].sort())
for (const theme of DEFAULT_THEMES) for (const fund of theme.etfs) await readFile(`public/asset-art/paper/${getPaperArt(theme.id, fund.isin)}.webp`)
for (const art of Object.values(NEON_ASSET_ART)) for (const file of [art.scene && `neon/${art.scene}.webp`, art.mark].filter(Boolean)) await readFile(`public/asset-art/${file}`)
assert.equal(getComparisonPerformance('FR001400U5Q4').label, 'Indice MSCI World net')
assert.equal(getComparisonPerformance('FR001400U5Q4').currency, 'EUR')
assert.equal(getComparisonPerformance('IE00BD4TXV59').referenceIsin, 'IE00B4L5Y983')
assert.equal(getComparisonPerformance('IE00BK5BQT80').currency, 'USD')
assert.equal(getComparisonPerformance('IE0007Y8Y157'), null, 'No invented full calendar year for a new fund')
const port = 4321, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage(); await page.goto(base)
  const result = await page.evaluate(async () => {
    const { DEFAULT_THEMES } = await import('/shinny-potato/src/data/etf-themes.js')
    const { ASSET_ORDER } = await import('/shinny-potato/src/data/market-history.js')
    const { getAnnualReturnStartYears, getAnnualReturns } = await import('/shinny-potato/src/pages/tweet-midi/data/marketHistory.js')
    const { renderComparatifEtfImage } = await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
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
      if (labels.filter(label => /[ée]pargnant.?libre/i.test(label)).length !== 1) throw new Error('Missing signature')
      if (keep) samples.push({ name, png: canvas.toDataURL(), labels })
      return labels
    }
    try {
      for (const theme of DEFAULT_THEMES) {
        const words = await check(`compare-${theme.id}`, () => renderComparatifEtfImage(theme), ['monde', 'usa', 'etc-metaux', 'semiconducteurs-tech', 'quantique'].includes(theme.id))
        for (const fund of theme.etfs) if (!words.includes(fund.isin) || !words.includes(`${fund.frais.replace(/\s*%$/, '')} %`)) throw new Error('Lost fund fact')
        const peaInNames = theme.etfs.reduce((count, fund) => count + (fund.nom.match(/\bPEA\b/g)?.length ?? 0), 0)
        const peaOnImage = words.join(' ').match(/\bPEA\b/g)?.length ?? 0
        if (peaOnImage !== peaInNames || words.includes('CTO')) throw new Error('Envelope badge returned outside the official product names')
      }
      for (const id of ASSET_ORDER) {
        const years = getAnnualReturnStartYears(id), year = years.includes(2020) ? 2020 : years[0]
        const words = await check(`performance-${id}`, () => renderPerformanceImage({ mode: 'simple', assetId: id, year }), ['msciWorld', 'or', 'apple', 'bitcoin', 'silver'].includes(id))
        const rows = getAnnualReturns(id, year)
        if (words.some(word => /PERFORMANCE DEPUIS|PERFORMANCE CUMULÉE|clôtures annuelles|SANS CONVERSION/.test(word))) throw new Error('Generic series heading returned')
        if (!words.some(word => word.endsWith(`de ${rows[0].year - 1} à ${rows.at(-1).year}`))) throw new Error('Title must match the actual period')
        if (!words.includes(`Fin ${rows[0].year - 1} → Fin ${rows.at(-1).year}`) || !words.includes(`EN ${(await import('/shinny-potato/src/pages/tweet-midi/lib.js')).getMarketAsset(id).currency}`)) throw new Error('Missing dates or currency')
        const total = cumulativePerformance(rows)
        const percent = `${total >= 0 ? '+' : '−'}${Math.abs(total).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
        if (!words.includes(percent)) throw new Error('Changed performance calculation')
      }
      await check('performance-duel', () => renderPerformanceImage({ mode: 'comparatif', assetIdA: 'msciWorld', assetIdB: 'or', year: 2020 }), true)
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
