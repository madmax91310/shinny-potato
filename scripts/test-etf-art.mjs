import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { ETFS } from '../src/data/etf-cards.js'
import { ETF_ART } from '../src/pages/etf-sheets/visualIdentity.js'

assert.deepEqual(Object.keys(ETF_ART).sort(), ETFS.map(e => e.id).sort(), 'All fiches must have an explicit visual identity')
for (const art of Object.values(ETF_ART)) for (const file of [art.scene, art.mark].filter(Boolean)) await readFile(`public/asset-art/${file}`)
for (const [id, theme] of Object.entries({ sp500: 'america', 'msci-world': 'world', eurostoxx50: 'europe', 'topix-pea-hedged': 'asia', or: 'gold', 'support-argent': 'silver', bitcoin: 'bitcoin', 'support-ethereum': 'ethereum', semiconducteurs: 'chip', cybersecurite: 'security' })) assert.equal(ETF_ART[id].theme, theme, `Wrong exposure illustration: ${id}`)
assert.equal(ETF_ART.bitcoin.mark, 'bitcoin.svg')
assert.equal(ETF_ART['support-ethereum'].mark, 'ethereum.svg')
for (const art of Object.values(ETF_ART)) {
  if (art.kind === 'illustration') assert.equal(art.scene, `etf-night/${art.theme}.webp`)
  else assert.equal(art.kind, 'asset-symbol')
}
const port = 4315, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage()
  const requests = []; page.on('request', r => requests.push(r.url()))
  await page.goto(base)
  await mkdir('test-artifacts/etf-titanium', { recursive: true })
  const samples = new Set()
  for (const etf of ETFS) {
    const keep = etf.id === 'sp500' || !samples.has(ETF_ART[etf.id].theme); samples.add(ETF_ART[etf.id].theme)
    const result = await page.evaluate(async ({ id, keep }) => {
      const { ETFS } = await import('/shinny-potato/src/data/etf-cards.js')
      const { renderETFImage } = await import('/shinny-potato/src/pages/etf-sheets/canvasImage.js')
      const { getAnnualPerformance, performanceEntries } = await import('/shinny-potato/src/pages/etf-sheets/annualPerformance.js')
      const etf = ETFS.find(e => e.id === id)
      const labels = [], bounds = [], performanceText = [], identifiers = []
      const original = CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
        const m = this.measureText(value)
        const box = { text: String(value), l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, t: y - m.actualBoundingBoxAscent, b: y + m.actualBoundingBoxDescent }
        if (box.l < 0 || box.r > this.canvas.width || box.t < 0 || box.b > this.canvas.height) throw new Error(`Clipped ${id}: ${value}`)
        for (const p of bounds) if (Math.min(box.r, p.r) - Math.max(box.l, p.l) > 1 && Math.min(box.b, p.b) - Math.max(box.t, p.t) > 1) throw new Error(`Overlap ${id}: ${p.text} / ${value}`)
        bounds.push(box); labels.push(String(value));
        if (String(value) === `ISIN ${etf.isin}` || value === etf.listing?.ticker) identifiers.push({ text: String(value), x, y });
        if (y >= 1600 && y < 1895) performanceText.push({ text: String(value), font: this.font, color: this.fillStyle })
        return original.call(this, value, x, y, ...rest)
      }
      try {
        const canvas = await renderETFImage(etf)
        const annual = getAnnualPerformance(etf)
        if (annual) {
          performanceEntries(annual).forEach(({ value, label }) => {
            const expected = `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
            const number = performanceText.find(item => item.text === expected)
            if (!performanceText.some(item => item.text === label) || !number || Number(number.font.match(/(\d+)px/)?.[1]) < 58) throw new Error(`Unreadable annual cell ${id}: ${expected}`)
            if (number.color !== (value > 0 ? '#9bebb4' : value < 0 ? '#ff998b' : '#fff4da')) throw new Error(`Wrong annual sign color ${id}`)
          })
        }
        if (identifiers.length !== (etf.listing ? 2 : 1) || identifiers.some(item => item.y > 850) || (etf.listing && identifiers[1].x <= identifiers[0].x)) throw new Error(`Misplaced identity ${id}`)
        if (canvas.width !== 1600 || canvas.height !== 2000) throw new Error('Incorrect X aspect ratio')
        const text = labels.join(' '), normalize = s => s.replace(/\s+/g, ' ').trim()
        for (const value of [etf.name, etf.isin, etf.ter, etf.positions, etf.distribution, etf.listing?.ticker].filter(Boolean)) if (!normalize(text).includes(normalize(value))) throw new Error(`Lost fact ${id}: ${value}`)
        const aumLabel = labels.indexOf('Encours')
        const displayedAum = labels.slice(aumLabel + 1, labels.findIndex((s, i) => i > aumLabel && s.startsWith('Performances annuelles')) === -1 ? undefined : labels.findIndex((s, i) => i > aumLabel && s.startsWith('Performances annuelles')))
        const amount = String(etf.aum).replace(/^(?:Part|Fonds)\s*:\s*/i, '').replace(/\s+(?:au\s+\d{2}\/\d{2}\/\d{4}|\(relevé le [^)]+\))\s*$/i, '').trim()
        if (aumLabel < 0 || !normalize(displayedAum.join(' ')).includes(normalize(amount))) throw new Error(`Missing AUM amount ${id}: ${amount}`)
        if (displayedAum.some(s => /^(?:Part|Fonds)\s*:|\d{2}\/\d{2}\/\d{4}|relevé le/i.test(s))) throw new Error(`AUM metadata returned ${id}`)
        if (labels.filter(s => s === 'ÉPARGNANT LIBRE').length !== 1 || !text.includes('Pas un conseil en investissement')) throw new Error('Signature/disclaimer missing')
        if (labels.filter(s => s === etf.ter).length !== 1 || /Nouveau|PRÉSENTATION/.test(text)) throw new Error('Clutter returned')
        if (labels.some(s => /\bPEA\b/.test(s)) !== (etf.pea === true || /\bPEA\b/.test(etf.name))) throw new Error(`Unverified PEA ${id}`)
        return { labels, png: keep ? canvas.toDataURL() : null }
      } finally { CanvasRenderingContext2D.prototype.fillText = original }
    }, { id: etf.id, keep })
    await writeFile(`test-artifacts/etf-titanium/${etf.id}.txt`, result.labels.join('\n'))
    if (result.png) await writeFile(`test-artifacts/etf-titanium/${etf.id}.png`, Buffer.from(result.png.split(',')[1], 'base64'))
  }
  assert.ok(requests.every(url => url.startsWith(`http://127.0.0.1:${port}`)), 'Exports must use local resources')
  // Retry after a failed local asset fetch, then exercise the actual download controls.
  const retry = await browser.newPage(); await retry.goto(base)
  await retry.route('**/asset-art/etf-night/america.webp', route => route.abort())
  await retry.locator('a[href$="/fiches-etf"]:visible').first().click()
  await retry.getByRole('button', { name: 'Télécharger l’image', exact: true }).click()
  await retry.getByRole('alert').waitFor()
  await retry.unroute('**/asset-art/etf-night/america.webp')
  const download = retry.waitForEvent('download')
  await retry.getByRole('button', { name: 'Télécharger l’image', exact: true }).click()
  const file = await download
  assert.equal(file.suggestedFilename(), 'sp500-fiche-etf.png')
  await retry.getByRole('tab', { name: 'Image', exact: true }).click()
  await retry.getByRole('tabpanel').locator('img').waitFor()
  assert.equal(await retry.getByRole('tabpanel').locator('img').evaluate(img => img.naturalWidth), 1600)
  console.log(`${ETFS.length} titanium ETF exports: identities, complete facts, no overlaps, X dimensions, local assets and download/retry verified.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
