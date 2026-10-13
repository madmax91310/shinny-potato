import assert from 'node:assert/strict'
import { choose } from './card-selection.mjs'
import { ASSETS } from '../src/data/market-history.js'
import { compareCrisis, lossMonths, buildCrisisTweet } from '../src/pages/investment-calculator/crisis.js'
import { fmtEUR } from '../src/pages/investment-calculator/lib.js'

assert.deepEqual(lossMonths({ series: [100, 90, 80, 100, 99, 110], invested: [100, 100, 100, 100, 100, 100] }), { total: 3, longest: 2, stillUnderwater: false })
assert.equal(lossMonths({ series: [100, 80, 70], invested: [100, 100, 100] }).stillUnderwater, true)
assert.equal(lossMonths({ series: [100, 200, 250], invested: [100, 200, 300] }).total, 1)
const input = { assetId: 'bitcoin', crisisId: 'covid', amount: 1000, mode: 'lump' }
const comparison = compareCrisis(input)
assert.equal(comparison.available, true, comparison.message)
for (const entry of comparison.entries) {
  assert.equal(entry.result.totalInvested, 1000)
  assert.equal(entry.result.months.at(-1), comparison.endYm)
  const start = ASSETS.bitcoin.points.find(p => p.date === entry.startYm).price
  const end = ASSETS.bitcoin.points.find(p => p.date === comparison.endYm).price
  assert.ok(Math.abs(entry.result.finalValue - 1000 * end / start) < 1e-7)
  assert.ok(buildCrisisTweet(comparison).includes(fmtEUR(entry.result.finalValue, comparison.asset.currency)))
}
const dca = compareCrisis({ ...input, mode: 'dca', amount: 100 })
assert.equal(dca.available, true)
assert.ok(dca.entries[0].result.totalInvested > dca.entries[2].result.totalInvested)
for (const entry of dca.entries) assert.equal(entry.result.totalInvested, entry.result.months.length * 100)
assert.ok(buildCrisisTweet(dca).includes('sommes totales versées différentes'))
assert.ok(buildCrisisTweet(comparison).includes('pas les sommets ou creux exacts'))
assert.equal(compareCrisis({ ...input, crisisId: 'dotcom' }).available, false)
assert.equal(compareCrisis({ ...input, assetId: 'custom' }).available, false)
assert.equal(compareCrisis({ ...input, amount: 0 }).available, false)
assert.equal(compareCrisis({ ...input, amount: Infinity }).available, false)
// A missing observation must block the comparison rather than interpolate losses.
const points = ASSETS.bitcoin.points
try {
  ASSETS.bitcoin.points = points.filter(p => p.date !== '2020-02')
  const missing = compareCrisis(input)
  assert.equal(missing.available, false)
  assert.match(missing.message, /clôtures mensuelles manquent/)
  assert.equal(buildCrisisTweet(missing), '')
} finally { ASSETS.bitcoin.points = points }
console.log('Crisis comparison: real monthly prices, equal end date, budgets, losses, coverage and publication OK.')

if (process.argv.includes('--browser')) {
  const { chromium } = await import('playwright')
  const { spawn } = await import('node:child_process')
  const { mkdir } = await import('node:fs/promises')
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4321'], { detached: true, stdio: 'ignore' })
  let browser
  try {
    const base = 'http://127.0.0.1:4321/shinny-potato'
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`${base}/`, { signal: AbortSignal.timeout(1000) })).ok) break } catch {}
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : {})
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/calculateur-investissement`, { waitUntil: 'networkidle' })
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedCrisis = text } } }))
    await page.getByRole('button', { name: 'Mauvais moment', exact: true }).click()
    await page.locator('.ic-crisis-entry').first().waitFor()
    assert.equal(await page.locator('.ic-crisis-entry').count(), 3)
    await page.getByRole('button', { name: /Copier le texte du post/ }).click()
    assert.equal(await page.evaluate(() => window.copiedCrisis), buildCrisisTweet(comparison))
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Télécharger une image', exact: true }).click()
    const download = await downloadPromise
    assert.equal(download.suggestedFilename(), 'investissement-bitcoin-covid-lump.png')
    await mkdir('test-artifacts/investment-crisis', { recursive: true })
    await download.saveAs('test-artifacts/investment-crisis/covid.png')
    await page.getByRole('button', { name: 'Mensuel (DCA)', exact: true }).click()
    await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click()
    assert.ok((await page.evaluate(() => window.copiedCrisis)).includes('sommes totales versées différentes'))
    await choose(page.getByRole('group', { name: 'Choisir un actif', exact: true }), 'etfLifeStrategy60')
    await page.getByText('L’historique de cet actif ne couvre pas les trois dates de cette crise.', { exact: false }).waitFor()
    assert.equal(await page.locator('.ic-crisis-entry').count(), 0)
    await choose(page.getByRole('group', { name: 'Choisir un actif', exact: true }), 'bitcoin')
    await page.getByRole('button', { name: 'Versement unique', exact: true }).click()
    await page.getByRole('tab', { name: 'Image', exact: true }).click()
    await page.locator('.publication-image-stage img').waitFor()
    await page.screenshot({ path: 'test-artifacts/investment-crisis/desktop.png', fullPage: true })
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 })
      await page.getByRole('button', { name: 'Aperçu', exact: true }).click()
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`)
    }
    await page.screenshot({ path: 'test-artifacts/investment-crisis/mobile.png', fullPage: true })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('button', { name: 'Date libre', exact: true }).click()
    await page.getByRole('tab', { name: 'Texte', exact: true }).click()
    assert.equal(await page.locator('.ic-hero-number').count(), 1)
    assert.deepEqual(errors, [])
    console.log('Crisis UI: scenarios, clipboard, image download, missing history, mobile and standard mode OK.')
  } finally {
    await browser?.close()
    try { process.kill(-server.pid, 'SIGTERM') } catch {}
  }
}
