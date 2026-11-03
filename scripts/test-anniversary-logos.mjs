import {mockRadarChrome,isRadarChromeRequest} from './lib/browser-radar-chrome.mjs'
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium, devices } from 'playwright'
import { expect } from 'playwright/test'
import { choose } from './card-selection.mjs'
import { execFileSync } from 'node:child_process'
execFileSync(process.execPath, ['scripts/sync-anniversary-logo-registry.mjs', '--check'], { stdio: 'inherit' })

// Run against the built Pages bundle, including its repository path prefix.
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4331/shinny-potato/'
const server = process.env.TEST_BASE_URL ? null : spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4331'], { stdio: 'ignore' })
const out = 'test-artifacts/anniversary-logos'
await mkdir(out, { recursive: true })
let browser
const results = [], failures = []
try {
  await expect.poll(async () => { try { return (await fetch(base)).status } catch { return 0 } }, { timeout: 30000 }).toBe(200)
  // Keep text rasterisation stable across hundreds of canvas readbacks.
  browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--disable-accelerated-2d-canvas'], executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
  async function context(options = {}) {
    const ctx = await browser.newContext({ acceptDownloads: true, ...options })
    await ctx.addInitScript(() => {
      window.logoDraws = []; window.exportLabels = []; window.exportTextFrames = []
      const textFrames = new WeakMap()
      const draw = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function(img, ...args) {
        if (img instanceof HTMLImageElement && /official-logos\/|asset-art\/asml.svg/.test(img.src)) {
          window.logoDraws.push({ src: img.src, natural: [img.naturalWidth, img.naturalHeight], args, alpha: this.globalAlpha, filter: this.filter, composite: this.globalCompositeOperation })
        }
        return draw.call(this, img, ...args)
      }
      const fill = CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText = function(value, ...args) {
        window.exportLabels.push(String(value))
        if (this.canvas.width === 1600 && this.canvas.height === 2000) {
          if (!textFrames.has(this.canvas)) { const frame = []; textFrames.set(this.canvas, frame); window.exportTextFrames.push(frame) }
          textFrames.get(this.canvas).push({ value: String(value), args, font: this.font, align: this.textAlign, baseline: this.textBaseline, spacing: this.letterSpacing })
        }
        return fill.call(this, value, ...args)
      }
    })
    return ctx
  }
  async function showImage(page) {
    await expect(page.locator('.workspace-tool-view')).toBeVisible({ timeout: 30000 })
    const preview = page.getByRole('button', { name: 'Aperçu', exact: true })
    if (await preview.isVisible()) await preview.click()
    await page.getByRole('tab', { name: 'Image', exact: true }).click()
  }
  async function ready(page) {
    const img = page.locator('.publication-image-stage img')
    await expect(img).toBeVisible({ timeout: 30000 })
    await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true)
    return img
  }
  async function pixels(page, source) {
    return page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode()
      const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0)
      const hash = await crypto.subtle.digest('SHA-256', ctx.getImageData(0, 0, canvas.width, canvas.height).data)
      const logo = await crypto.subtle.digest('SHA-256', ctx.getImageData(0, 150, canvas.width, 860).data)
      const hex = bytes => [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('')
      return { width: canvas.width, height: canvas.height, hash: hex(hash), logoHash: hex(logo) }
    }, source)
  }
  async function download(page, name, button = 'Télécharger l’image PNG') {
    const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: button, exact: true }).click()]); assert.equal(await file.failure(), null)
    const path = `${out}/${name}.png`; await file.saveAs(path)
    return pixels(page, `data:image/png;base64,${(await readFile(path)).toString('base64')}`)
  }
  async function compareExport(page, actual, expected, expectedText, id, label) {
    assert.equal(actual.width, expected.width); assert.equal(actual.height, expected.height)
    // Browser text antialiasing can vary between canvases. Check exact source
    // text/layout commands, and exact pixels throughout the logo's full area.
    assert.deepEqual(await page.evaluate(() => window.exportTextFrames.at(-1)), expectedText, `${label}: text or layout changed`)
    if (id !== 'broadcom') assert.equal(actual.logoHash, expected.logoHash, `${label}: logo pixels changed`)
  }
  const sources = JSON.parse(await readFile('public/asset-art/official-logos/sources.json', 'utf8'))
  const preflightContext = await browser.newContext(), preflightPage = await preflightContext.newPage()
  await preflightPage.goto(base)
  const preflight = await preflightPage.evaluate(async ({ base, sources }) => Promise.all(Object.entries(sources).map(async ([id, source]) => {
    try {
      const img = new Image(); img.src = `${base}asset-art/${source.file}`; await img.decode()
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 200
      canvas.getContext('2d').drawImage(img, 0, 0, 320, 200)
      if (!canvas.toDataURL('image/png').startsWith('data:image/png;')) throw new Error('PNG encoding failed')
      return { id, width: img.naturalWidth, height: img.naturalHeight, originClean: true }
    } catch (error) { throw new Error(`${id}: hosted logo cannot be exported: ${error.message}`) }
  })), { base, sources })
  await preflightContext.close()
  console.log(`${preflight.length} hosted logo files decode and export from the production Pages base path.`)
  const allCases = [...Object.keys(sources), 'broadcom']
  const cases = process.env.LOGO_TEST_ASSETS ? allCases.filter(id => process.env.LOGO_TEST_ASSETS.split(',').includes(id)) : allCases
  const deviceChecks = await Promise.allSettled([['desktop', { viewport: { width: 1440, height: 1000 } }], ['mobile', devices['iPhone 13']]].map(async ([device, options]) => {
    async function trackedPage() {
      const ctx = await context(options), page = await ctx.newPage()
      page.on('pageerror', error => failures.push(error.message))
      await mockRadarChrome(page)
      page.on('request', request => {if(isRadarChromeRequest(request))return;assert.ok(request.url().startsWith(base) || /^(data:|blob:)/.test(request.url()), `External or incorrectly based URL: ${request.url()}`)})
      return { ctx, page }
    }
    for (const [caseIndex, id] of cases.entries()) {
      // Bound decoded PNG/document memory across the growing catalogue.
      const { ctx, page } = await trackedPage()
      await page.goto(`${base}il-y-a-x-ans?asset=${id}`)
      await showImage(page)
      const img = await ready(page), src = await img.getAttribute('src'), expected = await pixels(page, src)
      await writeFile(`${out}/${device}-${id}-rendered.png`, Buffer.from(src.split(',')[1], 'base64'))
      assert.equal(expected.width, 1600); assert.equal(expected.height, 2000)
      await page.locator('.studio-preview').screenshot({ path: `${out}/${device}-${id}-preview-ui.png` })
      const expectedText = await page.evaluate(() => window.exportTextFrames.at(-1))
      const exported = await download(page, `${device}-${id}`)
      await compareExport(page, exported, expected, expectedText, id, `${device}/${id} PNG`)
      const previewExport = await download(page, `${device}-${id}-preview`, 'Télécharger cet aperçu')
      await compareExport(page, previewExport, expected, expectedText, id, `${device}/${id} preview PNG`)
      const draws = await page.evaluate(() => window.logoDraws)
      if (id === 'broadcom') {
        assert.equal(draws.length, 0)
        assert.ok((await page.evaluate(() => window.exportLabels)).filter(v => v === 'BROADCOM').length >= 2, 'Clean fallback missing')
      } else if (id === 'bitcoin' || id === 'microsoft') {
        assert.equal(draws.length, 0, `${id}: approved sculptural hero must not be overlaid twice`)
      } else {
        assert.ok(draws.length > 0, `${id}: logo never drawn`)
        for (const d of draws) {
          assert.equal(d.args.length, 4, 'Logo must not use source cropping')
          const [x, y, w, h] = d.args
          assert.ok(Math.abs(w / h - d.natural[0] / d.natural[1]) < 0.001, `${id}: stretched logo`)
          assert.ok(x >= 199.99 && x + w <= 1400.01 && y >= 294.99 && y + h <= 915.01, `${id}: insufficient margins`)
          assert.ok(Math.abs(x + w / 2 - 800) < 0.01 && Math.abs(y + h / 2 - 605) < 0.01, `${id}: logo off centre`)
          assert.equal(d.alpha, 1); assert.equal(d.filter, 'none'); assert.equal(d.composite, 'source-over')
        }
      }
      assert.equal(await page.locator('img').evaluateAll(images => images.filter(i => !i.complete || !i.naturalWidth).length), 0, 'Broken image')
      results.push({ device, id, ...expected, downloadedHash: exported.hash, downloadedPreviewHash: previewExport.hash, textAndLayoutIdentical: true, logoPixelsIdentical: id !== 'broadcom' ? true : undefined })
      await ctx.close()
      if ((caseIndex + 1) % 24 === 0 || caseIndex === cases.length - 1) console.log(`${device}: ${caseIndex + 1}/${cases.length} previews and PNGs checked.`)
    }
    // Change the asset through the actual picker on both screen sizes.
    const { ctx, page } = await trackedPage()
    await page.goto(`${base}il-y-a-x-ans?asset=nvidia`); await showImage(page); const previous = await (await ready(page)).getAttribute('src')
    await choose(page.locator('#subject-select'), 'microsoft')
    await page.getByRole('button', { name: /Générer$/, exact: false }).click()
    await showImage(page); await ready(page)
    await expect.poll(() => page.locator('.publication-image-stage img').getAttribute('src')).not.toBe(previous)
    assert.equal(await page.locator('.publication-image-stage img').evaluate(img => img.naturalWidth), 1600)
    await ctx.close()
  }))
  for (const check of deviceChecks) if (check.status === 'rejected') throw check.reason
  // Hold a logo response: neither the preview nor a requested download may finish early.
  const ctx = await context(), page = await ctx.newPage()
  let release, requested
  const gate = new Promise(resolve => { release = resolve }), seen = new Promise(resolve => { requested = resolve })
  await page.route('**/asset-art/official-logos/nvidia.svg', async route => { requested(); await gate; await route.continue() })
  await page.goto(`${base}il-y-a-x-ans?asset=nvidia`); await showImage(page); await seen
  await expect(page.locator('.publication-image-stage img')).toHaveCount(0)
  let completed = false; page.on('download', () => { completed = true })
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger l’image PNG', exact: true }).click()
  await expect(page.getByText('Préparation du visuel…', { exact: true })).toBeVisible()
  assert.equal(completed, false, 'PNG completed before the logo loaded')
  release(); const file = await pending; await file.saveAs(`${out}/delayed-nvidia.png`); await ready(page)
  assert.ok((await page.evaluate(() => window.logoDraws)).some(d => d.src.endsWith('nvidia.svg')))
  await ctx.close()
  // An older render must not replace the newly selected asset after a slow load.
  const raceContext = await context(), race = await raceContext.newPage()
  let releaseOld, oldRequested
  const oldGate = new Promise(resolve => { releaseOld = resolve }), oldSeen = new Promise(resolve => { oldRequested = resolve })
  await race.route('**/asset-art/official-logos/nvidia.svg', async route => { oldRequested(); await oldGate; await route.continue() })
  await race.goto(`${base}il-y-a-x-ans?asset=nvidia`); await showImage(race); await oldSeen
  await choose(race.locator('#subject-select'), 'microsoft')
  await race.getByRole('button', { name: /Générer$/ }).click(); await ready(race)
  const newAsset = await race.locator('.publication-image-stage img').getAttribute('src')
  releaseOld()
  await expect.poll(() => race.evaluate(() => window.logoDraws.some(d => d.src.endsWith('nvidia.svg')))).toBe(true)
  await race.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  assert.equal(await race.locator('.publication-image-stage img').getAttribute('src'), newAsset, 'A stale logo render replaced the selected asset')
  await raceContext.close()
  // HTTP failure and corrupt SVG both produce a usable text fallback, then recover.
  for (const corrupt of [false, true]) {
    const ctx = await context(), page = await ctx.newPage()
    await page.route('**/asset-art/official-logos/apple.svg', route => corrupt ? route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg broken' }) : route.abort())
    await page.goto(`${base}il-y-a-x-ans?asset=apple`); await showImage(page); await ready(page)
    assert.equal((await page.evaluate(() => window.logoDraws)).length, 0)
    assert.equal((await page.evaluate(() => window.exportLabels)).filter(v => v === 'APPLE').length, 2)
    await page.locator('.studio-preview').screenshot({ path: `${out}/missing-apple-${corrupt}-ui.png` })
    const fallback = await pixels(page, await page.locator('.publication-image-stage img').getAttribute('src'))
    const fallbackText = await page.evaluate(() => window.exportTextFrames.at(-1))
    await compareExport(page, await download(page, `missing-apple-${corrupt}`), fallback, fallbackText, 'broadcom', 'Missing logo text fallback')
    await page.unroute('**/asset-art/official-logos/apple.svg')
    await download(page, `recovered-apple-${corrupt}`)
    assert.ok((await page.evaluate(() => window.logoDraws)).some(d => d.src.endsWith('apple.svg')), 'Failed logo was cached forever')
    await ctx.close()
  }
  assert.deepEqual(failures, [])
  await writeFile(`${out}/results.json`, JSON.stringify({ base, preflight, results, checks: ['both PNG download buttons match exact logo pixels and text/layout commands; full hashes retained as diagnostics', 'desktop and mobile picker changes; stale render ignored', 'delayed logo blocks PNG completion', 'missing and corrupt logos fall back and recover', 'contain, centring, margins, unchanged alpha/colour', 'all requests under GitHub Pages base path'], failures }, null, 2) + '\n')
  console.log(`${results.length} built-Pages previews; ${results.length * 2} real PNG downloads match preview logo pixels and text/layout; picker changes, delayed load, missing/corrupt logo and retry passed.`)
} finally { await browser?.close(); server?.kill('SIGTERM') }
