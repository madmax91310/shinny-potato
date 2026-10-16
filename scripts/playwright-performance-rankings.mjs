import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { ALL_CATEGORIES, CATEGORIES, RANKING_ASSETS } from '../src/pages/performance-rankings/data.js'
import { commonCoverage, monthIndex } from '../src/pages/performance-rankings/engine.js'
const port = 4372, base = process.env.TEST_BASE_URL || `http://127.0.0.1:${port}/shinny-potato`
const server = process.env.TEST_BASE_URL ? null : spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser, page
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 200)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(`${base}/classements-performances`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Qui a vraiment gagné ?', exact: true }).waitFor()
  assert.equal(await page.getByRole('group', { name: 'Catégorie', exact: true }).locator('[data-option]').count(), ALL_CATEGORIES.length)
  await page.getByRole('group', { name: 'Catégorie', exact: true }).locator('[data-option][data-value="factors"]').click()
  await page.getByRole('button', { name: 'Une année', exact: true }).click()
  await page.getByRole('group', { name: 'Année', exact: true }).locator('[data-option][data-value="2022"]').click()
  assert.match(await page.getByLabel('Texte à publier', { exact: true }).inputValue(), /en 2022/)
  await page.getByRole('tab', { name: 'Image', exact: true }).click()
  const img = page.locator('.publication-image-stage img')
  await img.waitFor({ state: 'visible' })
  assert((await img.getAttribute('src')).startsWith('data:image/png'))
  await page.getByRole('button', { name: 'Période libre', exact: true }).click()
  await page.getByLabel('Début, fin de mois', { exact: true }).fill('2020-12')
  await page.getByLabel('Fin, fin de mois', { exact: true }).fill('2025-12')
  await page.getByRole('tab', { name: 'Texte', exact: true }).click()
  assert.match(await page.getByLabel('Texte à publier', { exact: true }).inputValue(), /%\/an/)
  await page.getByText('Ajouter la régularité historique', { exact: true }).click()
  await page.getByLabel('Montrer la fréquence de première place').check()
  const factors = CATEGORIES.find(category => category.id === 'factors').ids.map(id => RANKING_ASSETS[id])
  const factorCoverage = commonCoverage(factors)
  const expectedWindows = monthIndex(factorCoverage.end) - monthIndex(factorCoverage.start) - 60 + 1
  assert(expectedWindows > 0)
  assert(!(await page.getByLabel('Texte à publier', { exact: true }).inputValue()).includes('périodes glissantes'))
  await page.getByLabel('Début, fin de mois', { exact: true }).fill('2014-12')
  await page.getByRole('alert').waitFor()
  assert(await page.getByRole('button', { name: 'Télécharger l’image', exact: true }).isDisabled())
  await page.getByLabel('Début, fin de mois', { exact: true }).fill('2020-12')
  await page.getByRole('tab', { name: 'Image', exact: true }).click()
  await img.waitFor({ state: 'visible' })
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger l’image', exact: true }).click()
  assert((await downloadEvent).suggestedFilename().endsWith('.png'))
  await mkdir('test-artifacts/performance-rankings', { recursive: true })
  await page.screenshot({ path: 'test-artifacts/performance-rankings/desktop.png', fullPage: true })
  // Capture the real PNG at three, five and six rows, not just the editor.
  const dimensions = {}
  await page.getByLabel('Montrer la fréquence de première place').uncheck()
  for (const [category, count] of [['europe', 3], ['themes', 5], ['europe-sectors', 6]]) {
    await page.getByRole('group', { name: 'Catégorie', exact: true }).locator(`[data-option][data-value="${category}"]`).click()
    await page.getByRole('button', { name: 'Année par année', exact: true }).click()
    await img.waitFor({ state: 'visible' })
    await page.waitForFunction(() => { const img = document.querySelector('.publication-image-stage img'); return img?.complete && img.naturalWidth > 0 })
    const png = await img.getAttribute('src')
    await writeFile(`test-artifacts/performance-rankings/export-${count}.png`, Buffer.from(png.split(',')[1], 'base64'))
    dimensions[count] = await img.evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight }))
  }
  assert(dimensions[3].height < dimensions[5].height)
  assert(dimensions[5].height < dimensions[6].height)
  await page.getByRole('group', { name: 'Catégorie', exact: true }).locator('[data-option][data-value="us-stocks"]').click()
  await page.getByRole('button', { name: 'Personnaliser les actifs', exact: true }).click()
  await page.getByRole('button', { name: 'Nouvelle sélection', exact: true }).click()
  const search = page.getByRole('searchbox', { name: 'Rechercher : Actif du classement', exact: true })
  await search.fill('Apple')
  await page.locator('.rk-manual [data-option][data-value="apple"]').click()
  await search.fill('Microsoft')
  await page.locator('.rk-manual [data-option][data-value="microsoft"]').click()
  assert.equal(await page.locator('.rk-selected>div').count(), 2)
  // Four new capabilities: long index history, annual calendars, ECB and portfolios.
  const category = value => page.getByRole('group', { name: 'Catégorie', exact: true }).locator(`[data-option][data-value="${value}"]`).click()
  await category('regions-indices')
  assert.match(await page.locator('.rk-coverage').innerText(), /2005-12/)
  await page.getByRole('group', { name: 'Devise du classement', exact: true }).locator('[data-option][data-value="EUR"]').click()
  assert.match(await page.locator('.rk-coverage').innerText(), /EUR/)
  await category('annual-pea')
  assert.match(await page.locator('.rk-coverage').innerText(), /NAV officiels/)
  await category('multi-asset')
  assert.equal(await page.getByRole('alert').count(), 0)
  await page.getByRole('button', { name: 'Portefeuilles', exact: true }).click()
  await page.getByLabel('Poids 1 du portefeuille 2', { exact: true }).fill('70')
  await page.getByRole('alert').waitFor()
  assert(await page.getByRole('button', { name: 'Télécharger l’image', exact: true }).isDisabled())
  await page.getByLabel('Poids 1 du portefeuille 2', { exact: true }).fill('80')
  await page.getByRole('group', { name: 'Rééquilibrage du portefeuille 2', exact: true }).locator('[data-option][data-value="monthly"]').click()
  assert.equal(await page.getByLabel('Poids 1 du portefeuille 2', { exact: true }).inputValue(), '80')
  assert.match(await page.getByLabel('Texte à publier', { exact: true }).inputValue(), /Parmi ces portefeuilles/)
  await page.getByRole('tab', { name: 'Image', exact: true }).click()
  await img.waitFor({ state: 'visible' })
  await page.screenshot({ path: 'test-artifacts/performance-rankings/portfolios.png', fullPage: true })
  await page.getByRole('button', { name: 'Actifs', exact: true }).click()
  assert.equal(await page.getByRole('alert').count(), 0)
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.getByRole('button', { name: 'Aperçu', exact: true }).click()
  await img.waitFor({ state: 'visible' })
  await page.screenshot({ path: 'test-artifacts/performance-rankings/mobile.png', fullPage: true })
  assert.deepEqual(errors, [])
  console.log('Rankings: categories, calendar/custom modes, annualization, regularity, invalid dates, exact manual selections, PNG download, desktop and mobile passed.')
} catch (error) {
  if (page) {
    await mkdir('test-artifacts/performance-rankings', { recursive: true })
    await page.screenshot({ path: 'test-artifacts/performance-rankings/failure.png' }).catch(() => {})
    await writeFile('test-artifacts/performance-rankings/failure.html', await page.content()).catch(() => {})
  }
  throw error
} finally { await browser?.close(); server?.kill() }
