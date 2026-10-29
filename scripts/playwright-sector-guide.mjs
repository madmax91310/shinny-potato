import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { contentValidity } from '../src/pages/tweet-bank/validity.js'

const id = 'guide:sectoriels-thematiques-pea'
const guide = TWEETS.find(item => item.id === id)
assert.equal(TWEETS.filter(item => item.id === id).length, 1)
assert.equal(new Set(TWEETS.map(item => item.id)).size, TWEETS.length)
const isins = guide.text.match(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/g)
assert.equal(isins.length, 13)
assert.equal(new Set(isins).size, 13)
assert.deepEqual(guide.productChecks.map(item => item.isin), isins)
for (const proof of guide.productChecks) {
  assert(proof.peaEligible && proof.fundAumEur > 100_000_000)
  assert(guide.sources.some(source => source.url === proof.sourceUrl))
  const segment = guide.text.split(proof.isin)[1].split('🆔')[0]
  assert(segment.includes(proof.terPct.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' %'))
}
assert.equal(contentValidity(guide, undefined, '2026-10-24').ready, true)
assert.equal(contentValidity(guide, undefined, '2026-12-01').ready, false)
assert(!/encours|millions|100 M/.test(guide.text))

const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4441/shinny-potato'
const out = process.env.TEST_OUTPUT_DIR ?? 'test-artifacts/sector-guide'
const server = process.env.TEST_BASE_URL ? null : spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4441'], { stdio: 'ignore' })
let browser
try {
  await fs.mkdir(out, { recursive: true })
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/banque-tweets', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Guide', exact: true }).click()
    await page.locator('.tb-search').fill('sectoriels et thématiques')
    assert.equal(await page.locator('.tb-tweet').count(), 1)
    const card = page.locator(`[data-tweet-id="${id}"]`)
    const textarea = card.getByRole('textbox', { name: 'Texte de la publication', exact: true })
    assert.equal(await textarea.inputValue(), guide.text)
    assert(await textarea.evaluate(el => el.clientHeight >= el.scrollHeight - 2))
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await card.locator('summary', { hasText: 'Sources de ce texte' }).click()
    assert.equal(await card.locator('.tb-sources a').count(), guide.sources.length)
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__guideCopied = text } } }))
    await card.getByRole('button', { name: '📋 Copier', exact: true }).click()
    assert.equal(await page.evaluate(() => window.__guideCopied), guide.text)
    await card.getByRole('button', { name: "Marquer publié aujourd'hui", exact: true }).click()
    assert.equal(await card.locator('.tb-pub-badge.cooldown').count(), 1)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await card.locator('.tb-pub-badge.cooldown').count(), 1)
    await card.getByRole('button', { name: 'Effacer la date', exact: true }).click()
    await textarea.fill(guide.text + '\nBrouillon de recette.')
    assert(await card.getByRole('button', { name: '📋 Copier', exact: true }).isDisabled())
    await page.reload({ waitUntil: 'networkidle' })
    assert((await textarea.inputValue()).endsWith('Brouillon de recette.'))
    await card.getByRole('button', { name: 'Revenir au texte archivé' }).click()
    assert.equal(await textarea.inputValue(), guide.text)
    await card.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${out}/guide-${width}.png` })
    assert.deepEqual(errors, [])
    await context.close()
  }
  console.log('13 verified references; desktop/mobile: category, search, complete text, sources, copy, publication history, persistent draft and reset OK.')
} finally {
  await browser?.close()
  server?.kill()
}
