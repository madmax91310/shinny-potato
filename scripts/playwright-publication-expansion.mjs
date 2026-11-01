import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { INVESTOR_MODELS } from '../src/data/investor-models.js'
import { modelPortfolio } from '../src/pages/investor-portfolio/models.js'
import { buildTweet, percentage } from '../src/pages/investor-portfolio/data.js'
import { PUBLICATION_SELECTIONS } from '../src/data/publication-selections.js'
import { getPreferredInstrumentListing } from '../src/data/instrument-listings.js'
import { choose } from './card-selection.mjs'

const port = 4397, base = `http://127.0.0.1:${port}/shinny-potato/`, dir = 'test-artifacts/publication-expansion'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
async function part(page, name) {
  const button = page.locator('.workspace-view-switch').getByRole('button', { name, exact: true })
  if (await button.isVisible()) await button.click()
}
async function tab(page, name) {
  const button = page.getByRole('tab', { name, exact: true })
  if (await button.isVisible()) await button.click()
}
async function downloaded(page, button, filename, preview) {
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
  await download.saveAs(`${dir}/${filename}.png`)
  const bytes = await readFile(`${dir}/${filename}.png`)
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG')
  assert(bytes.readUInt32BE(16) >= 1000 && bytes.readUInt32BE(20) >= 700)
  assert.deepEqual(bytes, Buffer.from(preview.split(',')[1], 'base64'), `${filename}: download matches preview byte for byte`)
}
async function noOverflow(page, context) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), context)
}
try {
  await mkdir(dir, { recursive: true })
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 100)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox'] })
  const errors = [], report = []
  for (const width of [1440, 390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      window.__modelPaints = []
      const original = CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText = function (value, x, y, ...rest) {
        if (this.canvas.width === 1600 && this.canvas.height >= 1100) {
          const m = this.measureText(value)
          const box = { value, left: x - m.actualBoundingBoxLeft, right: x + m.actualBoundingBoxRight, top: y - m.actualBoundingBoxAscent, bottom: y + m.actualBoundingBoxDescent, font: this.font }
          if (box.left < 0 || box.right > this.canvas.width || box.top < 0 || box.bottom > this.canvas.height) throw new Error('Clipped canvas text: ' + value)
          window.__modelPaints.push(box)
        }
        return original.call(this, value, x, y, ...rest)
      }
    })
    await page.goto(base + 'portefeuilles-investisseurs', { waitUntil: 'networkidle' })
    for (const model of INVESTOR_MODELS) {
      await part(page, 'Réglages')
      const picker = page.locator('#ip-investor')
      await picker.getByRole('searchbox').fill(model.name)
      await choose(picker, model.id)
      await page.waitForFunction(id => document.querySelector('#ip-draft')?.value.includes(id), model.hook)
      await part(page, 'Aperçu'); await tab(page, 'Texte')
      const expected = buildTweet(modelPortfolio(model.id))
      assert.equal(await page.locator('#ip-draft').inputValue(), expected)
      assert.equal(await page.locator('.ip-row').count(), model.rows.length)
      for (const row of modelPortfolio(model.id).holdings) assert((await page.locator('.ip-preview').innerText()).includes(percentage(row.weight)))
      await page.getByRole('button', { name: '📋 Copier le tweet', exact: true }).click()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected)
      await page.evaluate(() => { window.__modelPaints = [] })
      await tab(page, 'Image')
      const image = page.locator('.publication-image-stage img').first()
      await image.waitFor(); await image.evaluate(img => img.decode())
      const png = await image.getAttribute('src')
      const paints = await page.evaluate(() => window.__modelPaints)
      assert(paints.some(row => row.value === 'Cibles théoriques · aucune détention personnelle'))
      for (const row of paints) for (const other of paints) {
        if (row === other) continue
        const overlap = Math.min(row.right, other.right) - Math.max(row.left, other.left) > 1 && Math.min(row.bottom, other.bottom) - Math.max(row.top, other.top) > 1
        assert(!overlap, `${model.id}: ${row.value} overlaps ${other.value}`)
      }
      assert(!paints.some(row => /Positions au|hors options|Autres positions/.test(row.value)))
      await noOverflow(page, model.id + ' image ' + width)
      if (model.rows.length === 12 || model.rows.length === 2 || model.id === 'marc-faber-meb') await page.screenshot({ path: `${dir}/${model.id}-${width}-page.png`, fullPage: true })
      await tab(page, 'Texte')
      await downloaded(page, page.getByRole('button', { name: '⬇️ Télécharger le PNG', exact: true }), `${model.id}-${width}`, png)
      await noOverflow(page, model.id + ' text ' + width)
      report.push({ width, kind: 'model', id: model.id, rows: model.rows.length, exportMatchesPreview: true })
    }
    for (const selection of PUBLICATION_SELECTIONS) {
      await page.goto(base + 'comparatif-etf', { waitUntil: 'networkidle' }); await part(page, 'Réglages')
      const picker = page.locator('#subject-select')
      for (const isin of selection.funds) {
        await picker.getByRole('searchbox').fill(isin)
        assert.equal(await picker.locator(`[data-option][data-value="${selection.id}"]`).count(), 1, 'ISIN search ' + isin)
      }
      const ticker = getPreferredInstrumentListing(selection.funds[0])?.ticker
      if (ticker) {
        await picker.getByRole('searchbox').fill(ticker)
        assert.equal(await picker.locator(`[data-option][data-value="${selection.id}"]`).count(), 1, 'Ticker search ' + ticker)
      }
      await picker.getByRole('searchbox').fill(selection.nom)
      await choose(picker, selection.id)
      await page.getByRole('button', { name: '🔄 Générer', exact: true }).click()
      await part(page, 'Aperçu'); await tab(page, 'Texte')
      await page.waitForFunction(note => document.querySelector('pre')?.textContent.includes(note), selection.cloture)
      const tweet = await page.locator('pre').innerText()
      for (const isin of selection.funds) assert(tweet.includes(isin))
      assert(!/NaN|undefined|non renseign/.test(tweet))
      if (selection.id === 'allworld-imi-perimeter') assert(!tweet.includes('📈 Performances annuelles'), 'No calendar before share inception')
      if (selection.id === 'silver-metal-miners') assert(tweet.includes('produits (ETF et ETC)'))
      await page.getByRole('button', { name: 'Copier le texte', exact: true }).click()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), tweet)
      await tab(page, 'Image')
      const img = page.locator('.publication-image-stage img').first(); await img.waitFor(); await img.evaluate(image => image.decode())
      const png = await img.getAttribute('src')
      await noOverflow(page, selection.id + ' comparison ' + width)
      if (selection.funds.length === 3 || selection.id === 'silver-metal-miners') await page.screenshot({ path: `${dir}/${selection.id}-${width}-page.png`, fullPage: true })
      await tab(page, 'Texte')
      await downloaded(page, page.getByRole('button', { name: 'Télécharger l’image PNG', exact: true }), `${selection.id}-comparison-${width}`, png)
      await page.goto(base + 'fiches-pratiques?fiche=' + selection.id, { waitUntil: 'networkidle' }); await part(page, 'Réglages')
      const practicalPicker = page.getByRole('group', { name: 'Choisir une fiche', exact: true })
      await practicalPicker.getByRole('searchbox').fill(selection.funds[0])
      assert.equal(await practicalPicker.locator(`[data-option][data-value="${selection.id}"]`).count(), 1)
      await choose(practicalPicker, selection.id)
      await part(page, 'Aperçu'); await tab(page, 'Texte')
      assert((await page.locator('#practical-tweet').inputValue()).includes(selection.cloture))
      await tab(page, 'Image')
      const practicalPng = await page.locator('canvas.practical-image').evaluate(canvas => canvas.toDataURL('image/png'))
      await downloaded(page, page.getByRole('button', { name: 'Télécharger l’image PNG', exact: true }), `${selection.id}-practical-${width}`, practicalPng)
      await noOverflow(page, selection.id + ' practical ' + width)
      report.push({ width, kind: 'selection', id: selection.id, exportsMatchPreview: true })
    }
    await page.goto(base + 'bibliotheque-donnees?type=portfolio&q=7Twelve', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Exporter la fiche JSON', exact: true }).waitFor()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter la fiche JSON', exact: true }).click()])
    await download.saveAs(`${dir}/7twelve-${width}.json`)
    const record = JSON.parse(await readFile(`${dir}/7twelve-${width}.json`, 'utf8'))
    assert.deepEqual(record.fields[0].value, INVESTOR_MODELS.find(model => model.id === 'israelsen-7twelve'))
    assert.equal(record.fields[0].metadata.asOf, null)
    await noOverflow(page, 'Library ' + width)
    await context.close()
  }
  assert.deepEqual(errors, [])
  await writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2))
  console.log('Chromium 1440/390/360 px: 8 models, 23 assets / 11 comparisons + practical sheets; 90 PNG downloads inspected and identical to previews, source JSON, searches, text/copy, absent calendars and layouts verified.')
} finally { await browser?.close(); server.kill('SIGTERM') }
