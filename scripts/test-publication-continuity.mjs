import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { choose } from './card-selection.mjs'
const base = 'http://localhost:4347/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4347'], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const [route, selector] of [['fiches-etf', '#es-etf-select'], ['tweets-factsheets', '#factsheet-subject'], ['duels-portefeuilles', '#pd-select'], ['comparatif-etf', '#subject-select']]) {
    await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' })
    const picker = page.locator(selector)
    const second = await picker.locator('[data-option]').nth(1).getAttribute('data-value')
    await choose(picker, second)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await picker.getAttribute('data-value'), second, `${route}: selection restored`)
  }
  await page.goto(`${base}/calculateur-investissement`, { waitUntil: 'networkidle' })
  await page.locator('.ic-amount-wrap input').fill('4321')
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.locator('.ic-amount-wrap input').inputValue(), '4321')
  await page.goto(`${base}/calculateur-investissement?asset=apple`, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.ic-amount-wrap input').inputValue(), '1000', 'explicit link starts a fresh simulation')
  await page.goto(`${base}/fiches-etf`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '☆ Ajouter aux favoris', exact: true }).click()
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.getByRole('button', { name: '★ Retirer des favoris', exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal(await page.getByRole('group', { name: /^Favoris :/ }).getByRole('button').count(), 1)
  await page.getByRole('tab', { name: 'Image', exact: true }).click()
  const image = page.locator('.publication-image-stage img')
  await image.waitFor()
  const before = await image.getAttribute('src')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Télécharger cet aperçu', exact: true }).click()])
  assert.equal(download.suggestedFilename(), 'publication.png')
  assert.equal(await download.failure(), null)
  const digest = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(digest(await readFile(await download.path())), digest(Buffer.from(before.split(',')[1], 'base64')), 'download contains the exact displayed PNG, including Blob downloads')
  await page.getByRole('button', { name: 'Agrandir l’image', exact: true }).click()
  await page.keyboard.press('Escape')
  await choose(page.locator('#es-etf-select'), { index: 2 })
  await page.waitForFunction(old => document.querySelector('.publication-image-stage img')?.src && document.querySelector('.publication-image-stage img').src !== old, before)
  await page.setViewportSize({ width: 390, height: 900 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no mobile overflow')
  await page.evaluate(() => localStorage.setItem('epargnant-publication:v1:etf-sheet', JSON.stringify('removed-id')))
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.locator('#es-etf-select').getAttribute('data-value'), 'sp500', 'invalid saved selection falls back')
  assert.deepEqual(errors, [])
  console.log('Publication continuity: selections, favorites, matching download, fresh preview, mobile and stale storage passed')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
