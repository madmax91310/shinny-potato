import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { MARKET_STORIES } from '../src/pages/tweet-bank/market-stories.js'
const base = 'http://localhost:4321/shinny-potato'
const output = 'reports/market-stories-2026-10-23'
await mkdir(output, { recursive: true })
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4321'], { stdio: 'ignore' })
let browser
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await fetch(base).then(r => r.ok).catch(() => false)) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch()
  for (const width of [1440, 390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/banque-tweets`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Histoires de marché', exact: true }).click()
    assert.equal(await page.locator('.tb-tweet').count(), 3)
    for (const story of MARKET_STORIES) {
      const card = page.locator(`[data-tweet-id="${story.id}"]`)
      const text = card.getByRole('textbox', { name: 'Texte de la publication', exact: true })
      assert.equal(await text.inputValue(), story.text)
      assert.ok(await text.evaluate(el => el.clientHeight >= el.scrollHeight - 2), 'texte intégral visible')
      await card.getByRole('button', { name: '📋 Copier', exact: true }).click()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), story.text, 'presse-papiers réel, sans sources ni métadonnées')
      await card.getByText('Accroche alternative', { exact: true }).click()
      await card.getByRole('button', { name: 'Copier l’accroche alternative' }).click()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), story.alternativeHook)
      await card.getByText('Dossier de preuves et limites', { exact: true }).click()
      assert.ok(await card.getByText(story.uncertainties[0], { exact: true }).isVisible())
      await card.getByText('Sources de ce texte', { exact: true }).click()
      const links = await card.locator('.tb-sources a').evaluateAll(links => links.map(link => link.href))
      assert.deepEqual(links, story.sources.map(source => source.url))
      await card.getByText('Accroche alternative', { exact: true }).click()
      await card.getByText('Dossier de preuves et limites', { exact: true }).click()
      await card.getByText('Sources de ce texte', { exact: true }).click()
    }
    const first = page.locator(`[data-tweet-id="${MARKET_STORIES[0].id}"]`)
    await page.locator('.tb-search').fill('Oklahoma')
    assert.equal(await page.locator('.tb-tweet').count(), 1)
    await page.locator('.tb-search').fill('')
    await first.getByRole('button', { name: "Marquer publié aujourd'hui" }).click()
    assert.equal(await first.locator('.tb-pub-badge.cooldown').count(), 1)
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Histoires de marché', exact: true }).click()
    assert.equal(await first.locator('.tb-pub-badge.cooldown').count(), 1)
    await page.getByLabel('Masquer les tweets encore en repos', { exact: false }).check()
    assert.equal(await page.locator('.tb-tweet').count(), 2)
    await page.getByLabel('Masquer les tweets encore en repos', { exact: false }).uncheck()
    await first.getByLabel('Date de dernière publication', { exact: true }).fill('2026-01-01')
    assert.equal(await first.locator('.tb-pub-badge.available').count(), 1)
    await first.getByRole('button', { name: 'Effacer la date' }).click()
    const text = first.getByLabel('Texte de la publication', { exact: true })
    await text.fill(MARKET_STORIES[0].text + '\nModification à relire.')
    assert.ok(await first.getByRole('button', { name: '📋 Copier', exact: true }).isDisabled())
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Histoires de marché', exact: true }).click()
    assert.ok((await text.inputValue()).endsWith('Modification à relire.'))
    await first.getByRole('button', { name: 'Revenir au texte archivé' }).click()
    assert.equal(await text.inputValue(), MARKET_STORIES[0].text)
    // Repli execCommand, puis sélection manuelle si aucune API ne fonctionne.
    await page.evaluate(() => { const readText = navigator.clipboard.readText.bind(navigator.clipboard); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText, writeText: async () => { throw new Error('test refus') } } }) })
    await first.locator('.tb-tweet-actions button').first().click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), MARKET_STORIES[0].text, 'repli execCommand fidèle')
    await page.evaluate(() => { document.execCommand = () => false })
    await first.locator('.tb-tweet-actions button').first().click()
    assert.equal(await first.getByLabel('Copie manuelle avec date de référence').inputValue(), MARKET_STORIES[0].text)
    await first.getByLabel('Texte de la publication', { exact: true }).focus()
    await page.setViewportSize({ width: width === 1440 ? 390 : 1440, height: 900 })
    await page.waitForTimeout(100)
    for (const el of await page.locator('.tb-tweet-text').all()) assert.ok(await el.evaluate(el => el.clientHeight >= el.scrollHeight - 2), 'réajustement après changement de largeur')
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(100)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'aucun débordement horizontal')
    // Recharger pour capturer la lecture normale après les refus de copie simulés.
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Histoires de marché', exact: true }).click()
    await page.screenshot({ path: `${output}/banque-${width}.png` })
    for (const story of MARKET_STORIES) {
      const card = page.locator(`[data-tweet-id="${story.id}"]`)
      await card.getByText('Dossier de preuves et limites', { exact: true }).click()
      await card.getByText('Sources de ce texte', { exact: true }).click()
      await card.screenshot({ path: `${output}/${story.id.split(':')[1]}-${width}.png` })
    }
    assert.deepEqual(errors, [])
    await context.close()
    console.log(`${width}px : 3 récits complets, copie réelle et alternative, recherche, sources, publication, repos, brouillon, replis et redimensionnement OK`)
  }
} finally {
  await browser?.close()
  server.kill()
}
