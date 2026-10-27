import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { CATEGORIES } from '../src/pages/ranking-ideas/data.js'
import PUBLIC_CATEGORIES from '../src/pages/ranking-ideas/public-ideas.json' with { type: 'json' }
import { ideaText } from '../src/pages/ranking-ideas/lib.js'

const base = 'http://127.0.0.1:4407/shinny-potato'
const output = 'test-artifacts/ranking-ideas'
mkdirSync(output, { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4407', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  await waitPreview(server, base)
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const ideas = CATEGORIES.flatMap(group => group.ideas)
  assert.equal(ideas.length, 51)
  const publicIdeas = PUBLIC_CATEGORIES.flatMap(group => group.ideas)
  assert(publicIdeas.length > 0)
  assert.equal(new Set(publicIdeas.map(idea => idea.id)).size, publicIdeas.length)
  assert(publicIdeas.every(idea => idea.title && idea.angle))
  const errors = []
  for (const width of [1280, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/idees-classements`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Idées de publications')
    const rows = page.locator('.ri-category li')
    const kind = page.getByRole('group', { name: 'Type de sujets', exact: true })
    await expect(rows).toHaveCount(ideas.length + publicIdeas.length)
    assert.deepEqual(await rows.locator('.ri-idea strong').allTextContents(), publicIdeas.map(idea => idea.title))
    await kind.getByRole('button', { name: 'Classements', exact: true }).click()
    assert.deepEqual(await rows.locator(':scope > span').allTextContents(), ideas)
    await expect(page.locator('.ri-category')).toHaveCount(CATEGORIES.length)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true })
    await rows.first().getByRole('button').click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), ideas[0])
    await expect(page.locator('.ri-status [role=status]')).toContainText('Titre copié.')
    const search = page.getByRole('searchbox', { name: 'Rechercher une idée' })
    await search.fill('metaux precieux')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText('Les métaux précieux les plus performants.')
    await search.fill('etf pea')
    await expect(rows).toHaveCount(3)
    await search.fill('fonds euros 2025')
    await expect(rows).toHaveCount(1)
    await search.fill('aucun-sujet-xyz')
    await expect(rows).toHaveCount(0)
    await expect(page.getByText('Aucune idée ne correspond à cette recherche.')).toBeVisible()
    await page.getByRole('button', { name: 'Tout afficher', exact: true }).click()
    await page.locator('.ri-category-picker summary').click()
    await page.getByRole('group', { name: 'Catégorie', exact: true }).getByRole('button', { name: 'Immobilier et SCPI', exact: true }).click()
    assert.equal(await page.locator('select').count(), 0)
    await expect(rows).toHaveCount(6)
    await rows.last().getByRole('button').click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), CATEGORIES[4].ideas.at(-1))
    // Switching collections resets an incompatible category and keeps all new angles usable.
    await kind.getByRole('button', { name: 'Argent au quotidien', exact: true }).click()
    await expect(rows).toHaveCount(publicIdeas.length)
    await expect(page.locator('.ri-category-picker summary')).toHaveText('Toutes les catégories')
    await rows.first().getByRole('button').click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), ideaText(publicIdeas[0]))
    await expect(page.locator('.ri-status [role=status]')).toContainText('Sujet et angle copiés.')
    // Search includes text found only in an angle, with accents ignored.
    await search.fill('chasse-au-sujet-inexistant')
    await expect(rows).toHaveCount(0)
    await search.fill('chaudiere')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText('Avoir les clés de sa maison')
    await search.fill('')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: `${output}/${width}-everyday.png`, fullPage: true })
    // A denied clipboard and failed legacy fallback leave a selectable exact title.
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(Error('denied')) } }); document.execCommand = () => false })
    await rows.first().getByRole('button').click()
    const manual = page.getByRole('textbox', { name: 'Texte à copier' })
    await expect(manual).toHaveValue(ideaText(publicIdeas[0]))
    await manual.focus()
    assert.equal(await manual.evaluate(node => node.selectionEnd - node.selectionStart), ideaText(publicIdeas[0]).length)
    await kind.getByRole('button', { name: 'Classements', exact: true }).click()
    await rows.first().getByRole('button').click()
    await expect(manual).toHaveValue(ideas[0])
    await page.getByRole('button', { name: 'Tout afficher', exact: true }).click()
    await expect(rows).toHaveCount(ideas.length + publicIdeas.length)
    await expect(manual).toHaveCount(0)
    await page.screenshot({ path: `${output}/${width}-manual.png`, fullPage: true })
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    await page.getByRole('searchbox', { name: 'Rechercher un outil' }).fill('Idées de publications')
    await page.locator('.workspace-tool-card').filter({ hasText: 'Idées de publications' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Idées de publications')
    await context.close()
    console.log(`Ranking ideas: search, category, long names, exact copy, manual fallback and home link OK at ${width}px`)
  }
  assert.deepEqual(errors, [])
} finally { await browser?.close(); server.kill() }
