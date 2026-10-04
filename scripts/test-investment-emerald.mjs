import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { ASSET_ORDER } from '../src/data/market-history.js'
import { INVESTMENT_ART } from '../src/pages/investment-calculator/emeraldArt.js'
assert.deepEqual(Object.keys(INVESTMENT_ART).sort(), [...ASSET_ORDER].sort())
for (const art of Object.values(INVESTMENT_ART)) for (const file of [art.background, art.mark, art.scene].filter(Boolean)) await readFile(`public/asset-art/${file}`)
assert.equal(INVESTMENT_ART.apple.background, 'emerald/apple.webp')
assert.equal(INVESTMENT_ART.microsoft.mark, 'microsoft.svg')
assert.equal(INVESTMENT_ART.tesla.mark, 'tesla.svg')
assert.equal(INVESTMENT_ART.asml.mark, 'asml.svg')
assert.equal(INVESTMENT_ART.or.scene, 'neon/gold.webp')
assert.equal(INVESTMENT_ART.silver.scene, 'neon/silver.webp')
assert.equal(INVESTMENT_ART.msciWorld.kind, 'illustration')
assert.equal(INVESTMENT_ART.berkshire.kind, 'illustration')
const port = 4327, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage(); await page.goto(base)
  // Missing assets must reject and allow a successful retry, rather than using another logo.
  await page.route('**/asset-art/microsoft.svg', route => route.abort())
  assert.equal(await page.evaluate(async () => {
    const { loadInvestmentArt } = await import('/shinny-potato/src/pages/investment-calculator/emeraldArt.js')
    try { await loadInvestmentArt('microsoft'); return false } catch { return true }
  }), true)
  await page.unroute('**/asset-art/microsoft.svg')
  const result = await page.evaluate(async () => {
    const { ASSETS, ASSET_ORDER } = await import('/shinny-potato/src/data/market-history.js')
    const { derive, fmtEUR, fmtPct, pct } = await import('/shinny-potato/src/pages/investment-calculator/lib.js')
    const { renderInvestmentImage, investmentChartKind, annualInvestmentCapital } = await import('/shinny-potato/src/pages/investment-calculator/imageExport.js')
    const original = CanvasRenderingContext2D.prototype.fillText
    let boxes = [], labels = [], current
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value), box = { text: value, l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, t: y - m.actualBoundingBoxAscent, b: y + m.actualBoundingBoxDescent }
      if (box.l < 0 || box.r > this.canvas.width || box.t < 0 || box.b > this.canvas.height) throw new Error(`Clipped ${current}: ${value}`)
      for (const prior of boxes) if (Math.min(box.r, prior.r) - Math.max(box.l, prior.l) > 1 && Math.min(box.b, prior.b) - Math.max(box.t, prior.t) > 1) throw new Error(`Overlap ${current}: ${prior.text} / ${value}`)
      boxes.push(box); labels.push(String(value)); return original.call(this, value, x, y, ...rest)
    }
    const samples = [], stateFor = (id, mode = 'lump') => {
      const date = ASSETS[id].points.find(p => p.date >= '2020-01')?.date || ASSETS[id].points[0].date
      return { assetId: id, mode, amountRaw: '1000', startYear: Number(date.slice(0, 4)), startMonth: Number(date.slice(5, 7)), overridePriceRaw: '' }
    }
    const check = async (name, state, keep = false) => {
      boxes = []; labels = []; current = name
      const d = derive(state), before = JSON.stringify(d), canvas = await renderInvestmentImage(state, d)
      const currency = d.isCustom ? 'EUR' : ASSETS[state.assetId].currency
      if (JSON.stringify(d) !== before) throw new Error('Changed calculation')
      if (!labels.includes(fmtEUR(d.result.finalValue, currency)) || !labels.includes(fmtPct(pct(d.result.finalValue, d.result.totalInvested)))) throw new Error('Wrong capital or return')
      if (!labels.includes(`En ${currency}`) && !labels.some(label => label.startsWith(`En ${currency} ·`))) throw new Error('Wrong currency')
      if (labels.filter(label => /[ée]pargnant.?libre/i.test(label)).length !== 1) throw new Error('Signature must appear once')
      if (d.effectiveMode === 'dca' && !labels.some(label => label.startsWith('TOTAL VERSÉ'))) throw new Error('Lost monthly contributions')
      if (keep) samples.push({ name, png: canvas.toDataURL(), labels })
      return d
    }
    try {
      for (const id of ASSET_ORDER) for (const mode of ['lump', 'dca']) await check(`${id}-${mode}`, stateFor(id, mode), mode === 'lump' && ['apple', 'microsoft', 'msciWorld', 'or', 'tesla', 'asml'].includes(id))
      const override = { ...stateFor('apple'), overridePriceRaw: '10' }
      await check('loss-manual-price', override, true)
      if (!labels.some(label => label.includes('Prix final saisi'))) throw new Error('Unlabelled manual price')
      await check('large-dca', { ...stateFor('bitcoin', 'dca'), amountRaw: '999999999999' })
      const last = ASSETS.apple.points.at(-1).date
      await check('single-month', { ...stateFor('apple'), startYear: Number(last.slice(0, 4)), startMonth: Number(last.slice(5, 7)) })
      await check('custom-two-points', { assetId: 'custom', mode: 'lump', amountRaw: '1000', startYear: 2020, startMonth: 1, customStart: '100', customEnd: '60', customLabel: 'Mon placement', overridePriceRaw: '' }, true)
      // Annual fixture uses actual December observations from the shared Apple history.
      const originalPoints = ASSETS.apple.points
      try {
        ASSETS.apple.points = originalPoints.filter(p => p.date >= '2019-12' && p.date <= '2025-12' && p.date.endsWith('-12'))
        const state = { ...stateFor('apple'), startYear: 2019, startMonth: 12 }, d = await check('annual-apple', state, true)
        if (investmentChartKind(state, d) !== 'annual') throw new Error('Annual observations drawn as monthly')
        const rows = annualInvestmentCapital(state, d)
        if (rows.length !== ASSETS.apple.points.length || rows.some(row => !ASSETS.apple.points.some(point => point.date === row.date))) throw new Error('Invented annual observation')
        if (rows.at(-1).value !== d.result.finalValue || !labels.includes('Capital en fin d’année')) throw new Error('Annual capital must match the final result')
      } finally { ASSETS.apple.points = originalPoints }
    } finally { CanvasRenderingContext2D.prototype.fillText = original }
    return samples
  })
  await mkdir('test-artifacts/investment-emerald', { recursive: true })
  for (const sample of result) {
    await writeFile(`test-artifacts/investment-emerald/${sample.name}.png`, Buffer.from(sample.png.split(',')[1], 'base64'))
    await writeFile(`test-artifacts/investment-emerald/${sample.name}.txt`, sample.labels.join('\n'))
  }
  console.log(`${ASSET_ORDER.length} actifs × versement unique/DCA : identités, devises, résultats, points annuels, prix saisi, pertes, grands montants et absence de chevauchement vérifiés.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
