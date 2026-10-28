import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { MODEL_FAMILIES } from '../src/pages/portfolio-generator/modelPortfolios.js'
const base = 'http://127.0.0.1:4364/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4364'], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 200)) }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] })
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } }), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/generateur-portefeuilles`, { waitUntil: 'networkidle' })
    const settings = page.locator('.workspace-view-switch').getByRole('button', { name: 'Réglages', exact: true })
    if (await settings.isVisible()) await settings.click()
    await page.getByRole('button', { name: '📚 Portefeuilles modèles', exact: true }).click()
    const images = new Set()
    await mkdir('test-artifacts/model-portfolios', { recursive: true })
    for (const family of MODEL_FAMILIES) {
      await page.getByLabel('Choisir un portefeuille modèle', { exact: true }).selectOption(family.id)
      for (const preset of family.presets) {
        if (family.presets.length > 1) await page.getByLabel('Choisir une variante', { exact: true }).selectOption(preset.id)
        const count = preset.assets.length
        assert.equal(await page.locator('.pg-model-roles li').count(), count)
        assert.equal(await page.locator('.pg-alloc-list > li').count(), count)
        const explanation = page.getByRole('region', { name: 'Comprendre ce portefeuille', exact: true })
        assert.ok(await explanation.isVisible())
        assert.ok((await explanation.textContent()).includes(family.explanation))
        assert.ok((await explanation.textContent()).includes(family.adaptation))
        if (family.reference) {
          for (const value of [family.origin, family.rebalancing, family.limits, family.comparison]) assert.ok((await explanation.textContent()).includes(value))
          assert.deepEqual(await explanation.locator('a').evaluateAll(links => links.map(a => a.href)), family.sources.map(s => s.url))
          for (const row of preset.assets) assert.ok((await page.locator('.pg-model-roles').textContent()).includes(row.pct.toLocaleString('fr-FR')))
        }
        assert.ok((await page.locator('.pg-tweet-body').textContent()).includes(preset.thesis))
        const href = await page.locator('.pg-image-download').getAttribute('href')
        assert.ok(href.startsWith('data:image/png;base64,'))
        images.add(href)
        assert.ok((await page.locator('.pg-riskgauge-detail').textContent()).includes('Allocation fixe.'))
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false)
        if (family.reference) {
          const previewButton = page.getByRole('button', { name: 'Aperçu', exact: true })
          if (await previewButton.isVisible()) await previewButton.click()
          await page.getByRole('tab', { name: 'Image', exact: true }).click()
          const preview = page.locator('.pg-main img').first()
          await preview.evaluate(img => img.decode())
          assert.equal(await preview.getAttribute('src'), href, 'Preview belongs to the current model')
          const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.pg-image-download').click()])
          const path = `test-artifacts/model-portfolios/${family.id}-${width}-export.png`
          await download.saveAs(path)
          assert.deepEqual(await readFile(path), Buffer.from(href.split(',')[1], 'base64'), 'Downloaded bytes match preview')
          assert.equal(download.suggestedFilename(), 'repartition-portefeuille.png')
          await page.screenshot({ path: `test-artifacts/model-portfolios/${family.id}-${width}-preview.png`, fullPage: true })
          if (await settings.isVisible()) await settings.click()
        }
      }
      await page.screenshot({ path: `test-artifacts/model-portfolios/${family.id}-${width}.png`, fullPage: true })
    }
    assert.equal(images.size, 10)
    await page.getByLabel('Choisir un portefeuille modèle', { exact: true }).selectOption('all-weather')
    await page.getByLabel('Choisir une variante', { exact: true }).selectOption('shorter')
    await page.getByRole('button', { name: 'Modifier cette allocation', exact: true }).click()
    const gold = page.getByRole('spinbutton', { name: 'Pourcentage pour Invesco Physical Gold ETC', exact: true })
    assert.equal(await gold.inputValue(), '7.5')
    assert.equal(await gold.getAttribute('step'), '0.1')
    // Changing weight must recompute the manual portfolio without the preset label.
    await gold.fill('8')
    await page.getByRole('spinbutton', { name: 'Pourcentage pour Invesco Bloomberg Commodity UCITS ETF', exact: true }).fill('7')
    await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click()
    assert.equal(await page.locator('.pg-recipe-label').count(), 0)
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log('Modèles : 10 allocations et images distinctes, explications, édition décimale et affichage mobile/bureau OK.')
} finally { await browser?.close(); server.kill() }
