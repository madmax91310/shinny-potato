import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { TOOLS } from '../src/tools.js'
import { spawn } from 'node:child_process'

const port = 4316
const base = `http://127.0.0.1:${port}/shinny-potato`
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  const deadline = Date.now() + 30000
  while (true) {
    try { if ((await fetch(`${base}/`)).ok) break } catch { /* Server starting. */ }
    if (Date.now() > deadline) throw new Error('Preview server did not start')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/tweets-factsheets`, { waitUntil: 'networkidle' })
  const preview = page.getByRole('button', { name: 'Aperçu', exact: true })
  await preview.click()
  const editor = page.locator('#factsheet-draft')
  const original = await editor.inputValue()
  await editor.fill('Mon brouillon de test')
  await page.getByRole('button', { name: /Copier le texte/ }).click()
  await page.locator('.publication-feedback').getByRole('status').filter({ hasText: 'Texte copié.' }).waitFor()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Mon brouillon de test')
  await page.getByRole('button', { name: 'Fermer la confirmation' }).click()
  assert.equal(await page.locator('.publication-feedback').isVisible(), false)
  await page.getByLabel('Plus d’actions').click()
  await page.getByRole('button', { name: /Rétablir le modèle/ }).click()
  assert.equal(await editor.inputValue(), original)
  assert.equal(await page.locator('.publication-feedback [role=status]').textContent(), 'Texte d’origine rétabli.')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger l’image', exact: true }).click()
  assert.match((await download).suggestedFilename(), /dans-les-coulisses\.png$/)
  assert.equal(await page.locator('.publication-feedback [role=status]').textContent(), 'Téléchargement lancé.')

  // Explicitly exercise API failure, fallback success, and total copy failure.
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error('blocked') }
    document.execCommand = () => true
  })
  await page.getByRole('button', { name: /Copier le texte|Copié/ }).click()
  assert.equal(await page.locator('.publication-feedback [role=status]').textContent(), 'Texte copié.')
  await page.evaluate(() => { document.execCommand = () => false })
  await page.getByRole('button', { name: /Copier le texte|Copié/ }).click()
  await page.locator('.publication-feedback [role=status]').filter({ hasText: 'Copie indisponible' }).waitFor()

  await page.goto(`${base}/comparatif-courtiers`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error('blocked') }
    document.execCommand = () => false
  })
  await page.getByRole('button', { name: 'Copier le tweet', exact: true }).click()
  await page.locator('.publication-feedback [role=status]').filter({ hasText: 'Copie indisponible' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Copier le tweet', exact: true }).count(), 1)

  let layouts = 0
  for (const tool of TOOLS) {
    await page.goto(`${base}${tool.to}`, { waitUntil: 'networkidle' })
    const actions = page.locator('.workspace-actions').first()
    if (!await actions.count() || !await actions.isVisible()) continue
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      // Chromium headless cannot open an Android keyboard: emulate its visual viewport.
      await page.evaluate(() => {
        Object.defineProperty(visualViewport, 'height', { configurable: true, value: 380 })
        Object.defineProperty(visualViewport, 'offsetTop', { configurable: true, value: 0 })
        visualViewport.dispatchEvent(new Event('resize'))
      })
      await page.waitForTimeout(50)
      const rect = await actions.boundingBox()
      assert(rect && rect.y >= 0 && rect.y + rect.height <= 381, `${tool.to} ${width}: toolbar outside visual viewport`)
      assert(rect.x >= 0 && rect.x + rect.width <= width + 1, `${tool.to} ${width}: toolbar too wide`)
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tool.to} ${width}: horizontal overflow`)
      const controls = actions.locator('button,a,summary').filter({ visible: true })
      for (const control of await controls.all()) {
        await control.evaluate(node => node.scrollIntoView({ block: 'nearest' }))
        const button = await control.boundingBox()
        assert(button && button.y >= rect.y - 1 && button.y + button.height <= rect.y + rect.height + 1, `${tool.to} ${width}: inaccessible action`)
      }
      layouts++
    }
    await page.evaluate(() => { delete visualViewport.height; delete visualViewport.offsetTop; visualViewport.dispatchEvent(new Event('resize')) })
    assert.equal(await page.locator('.workspace').evaluate(node => node.style.getPropertyValue('--keyboard-inset')), '0px')
  }
  // The action menu must also stay above the keyboard and remain scrollable.
  await page.goto(`${base}/tweets-factsheets`, { waitUntil: 'networkidle' })
  await page.evaluate(() => { Object.defineProperty(visualViewport, 'height', { configurable: true, value: 380 }); visualViewport.dispatchEvent(new Event('resize')) })
  await page.getByLabel('Plus d’actions').click()
  const menu = await page.locator('.workspace-action-popover').boundingBox()
  assert(menu && menu.y >= 0 && menu.y + menu.height <= 380)
  assert.deepEqual(errors, [])
  console.log(`Publication actions OK: copy, download, reset, copy fallback and failure; ${layouts} mobile layouts with simulated keyboard; menu and keyboard dismissal.`)
} finally {
  await browser?.close()
  server.kill()
}
