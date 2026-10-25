import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { waitPreview } from './wait-preview.mjs'
import { STORAGE_KEY } from '../src/pages/hey-grok/lib.js'

const output = 'test-artifacts/hey-grok'
mkdirSync(output, { recursive: true })
const base = process.env.HEY_GROK_PUBLIC_BASE ?? 'http://127.0.0.1:4399/shinny-potato'
const server = process.env.HEY_GROK_PUBLIC_BASE ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4399', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  if (server) await waitPreview(server, base)
  browser = await chromium.launch({ headless: true })
  const errors = [], writes = [], results = []
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method() + ' ' + request.url()) })
    await page.goto(base + '/', { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: /Hey @Grok/ }).first().click()
    await page.getByRole('heading', { name: 'Hey @Grok', exact: true }).waitFor()
    const editor = page.getByRole('textbox', { name: 'Texte du tweet', exact: true })
    await editor.waitFor()
    const list = page.getByRole('list', { name: 'Questions disponibles' })
    const category = page.getByLabel('Catégorie', { exact: true })
    const search = page.getByRole('searchbox', { name: 'Rechercher' })
    const random = page.getByRole('button', { name: 'Question au hasard', exact: true })
    const copy = page.getByRole('button', { name: 'Copier le tweet', exact: true })
    assert.equal(await list.getByRole('button').count(), 160)
    await page.getByLabel('Tout public', { exact: true }).check()
    assert.equal(await list.getByRole('button').count(), 140)
    await category.selectOption('bourse')
    assert.equal(await list.count(), 0)
    assert(await random.isDisabled())
    await category.selectOption('budget')
    assert.equal(await list.getByRole('button').count(), 20)
    await search.fill('cafe')
    assert.equal(await list.getByRole('button').count(), 1)
    await list.getByRole('button').click()
    const original = await editor.inputValue()
    await page.getByRole('button', { name: 'Ajouter aux favoris', exact: true }).click()
    await copy.click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), original)
    assert(await page.getByRole('button', { name: 'Marquer « Utilisé »', exact: true }).isVisible())
    await page.getByLabel('Favoris', { exact: true }).check()
    await page.getByLabel('Non utilisés', { exact: true }).check()
    assert.equal(await list.getByRole('button').count(), 1)
    await page.getByRole('button', { name: 'Marquer « Utilisé »', exact: true }).click()
    assert.equal(await list.count(), 0)
    await page.getByRole('button', { name: 'Annuler « Utilisé »', exact: true }).click()
    assert.equal(await list.getByRole('button').count(), 1)
    const boundary = 'Hey @grok, ' + 'a'.repeat(269)
    await editor.fill(boundary)
    assert.equal(await page.locator('#hg-counter').innerText(), '280 / 280')
    assert(await copy.isEnabled()); await copy.click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), boundary)
    await editor.fill(boundary + '😀')
    assert.match(await page.locator('#hg-counter').innerText(), /282 \/ 280.*Dépassement de 2/)
    assert(await copy.isDisabled())
    assert.equal(await editor.inputValue(), boundary + '😀')
    await editor.fill('Hey @grok, 👨‍👩‍👧‍👦')
    assert.equal(await page.locator('#hg-counter').innerText(), '13 / 280')
    await editor.fill('Hey @grok, https://example.com/this-is-a-long-url')
    assert.equal(await page.locator('#hg-counter').innerText(), '34 / 280')
    await editor.fill('Mauvaise mention'); assert(await copy.isDisabled())
    const draft = 'Hey @grok, quelle dépense défendrais-tu ?'
    await editor.fill(draft)
    await page.getByRole('button', { name: 'Marquer « Utilisé »', exact: true }).click()
    await page.reload({ waitUntil: 'networkidle' })
    await search.fill('cafe')
    await list.getByRole('button').click()
    assert.equal(await editor.inputValue(), draft)
    assert(await page.getByRole('button', { name: 'Retirer des favoris', exact: true }).isVisible())
    assert(await page.getByRole('button', { name: 'Annuler « Utilisé »', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Annuler « Utilisé »', exact: true }).click()
    await search.fill('')
    await category.selectOption('technologie')
    const drawn = new Set()
    for (let i = 0; i < 20; i++) {
      await random.click()
      const text = await editor.inputValue()
      assert(!drawn.has(text)); drawn.add(text)
    }
    assert(await random.isDisabled())
    await page.getByText('Sélection épuisée : toutes ces questions ont été vues.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Recommencer cette sélection', exact: true }).click()
    assert(await random.isEnabled()); await random.click()
    // Manual selection and changing filters preserve each question's edited draft.
    await category.selectOption('budget'); await search.fill('cafe')
    await list.getByRole('button').click(); assert.equal(await editor.inputValue(), draft)
    await search.fill('inexistantxyz'); assert.equal(await list.count(), 0); assert(await random.isDisabled())
    await search.fill(''); await category.selectOption('')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true })
    results.push({ width, navigation: true, filters: true, noRepeatDraws: drawn.size, exhaustion: true, xWeighting: true, overflowBlocksCopy: true, clipboardExact: true, copyDoesNotMarkUsed: true, undoUsed: true, persistedDraftFavoriteUsed: true, horizontalOverflow: false })
    await context.close()
  }
  // Corrupt records and denied storage: no silent reset, still usable.
  for (const mode of ['corrupt', 'denied', 'quota', 'clipboard']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 } })
    await context.addInitScript(({ mode, key }) => {
      if (mode === 'corrupt') localStorage.setItem(key, 'unreadable')
      if (mode === 'denied') Object.defineProperty(window, 'localStorage', { get() { throw Error('denied') } })
      if (mode === 'quota') Storage.prototype.setItem = () => { throw Error('quota') }
      if (mode === 'clipboard') {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(Error('denied')) } })
        document.execCommand = () => false
      }
    }, { mode, key: STORAGE_KEY })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/hey-grok', { waitUntil: 'networkidle' })
    await page.getByRole('textbox', { name: 'Texte du tweet', exact: true }).fill('Hey @grok, que choisirais-tu ?')
    if (mode === 'clipboard') {
      await page.getByRole('button', { name: 'Copier le tweet', exact: true }).click()
      await page.getByText('Copie impossible. Sélectionne le texte pour le copier manuellement.', { exact: true }).waitFor()
    } else {
      assert.match(await page.getByRole('alert').innerText(), /locales|local/)
      if (mode === 'corrupt') assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY), 'unreadable')
    }
    await context.close()
  }
  assert.deepEqual(errors, []); assert.deepEqual(writes, [])
  writeFileSync(output + '/results.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), results, corruptStoragePreserved: true, deniedStorage: true, quotaFailure: true, clipboardFailure: true, errors, writes }, null, 2) + '\n')
  console.log('Hey @Grok: real Chromium desktop/mobile, filters, 20 unique draws, exhaustion/reset, X limits, exact copy, persistence and failure paths passed.')
} finally { await browser?.close(); server?.kill() }
