import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, buildBudgetText, euro } from '../src/pages/budget-profiles/lib.js'
import { DRAFT_KEY, USAGE_KEY } from '../src/pages/budget-profiles/storage.js'

const base = process.env.BUDGET_PUBLIC_BASE ?? 'http://127.0.0.1:4403/shinny-potato'
const server = process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4403', '--strictPort'], { stdio: 'ignore' })
const output = 'test-artifacts/budget-profiles'; mkdirSync(output, { recursive: true })
let browser
try {
  if (server) await waitPreview(server, base)
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const errors = [], results = []
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, permissions: ['clipboard-read', 'clipboard-write'], reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(base + '/'); await expect(page.getByRole('link', { name: 'Le budget de… Publication ponctuelle', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Le budget de… Publication ponctuelle', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Le budget de…', exact: true, level: 1 })).toBeVisible()
    const picker = page.getByRole('group', { name: 'Choisir un profil budget' })
    for (const profile of BUDGET_PROFILES) {
      await picker.locator(`[data-value="${profile.id}"]`).click()
      const image = page.getByRole('region', { name: 'Image du budget' }).locator('img')
      await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(profile))
      await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeEnabled()
      await expect(image).toHaveAttribute('alt', new RegExp(profile.name))
      const blobUrl = await image.getAttribute('src')
      const previewBytes = await page.evaluate(async url => [...new Uint8Array(await (await fetch(url)).arrayBuffer())], blobUrl)
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Télécharger le PNG', exact: true }).click()
      const download = await downloadPromise
      assert.deepEqual(readFileSync(await download.path()), Buffer.from(previewBytes), 'The downloaded PNG must equal the visible preview byte for byte')
      assert((await image.evaluate(img => img.naturalWidth)) === 1200)
      await page.getByRole('button', { name: 'Copier le texte', exact: true }).click()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), buildBudgetText(profile))
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no horizontal overflow`)
      const a = analyzeBudget(profile)
      await expect(page.locator('.budget-totals')).toContainText(euro(a.available))
      await page.screenshot({ path: `${output}/${width}-${profile.id}.png`, fullPage: true })
      results.push({ width, profile: profile.id, income: a.income, expenses: a.expenses, available: a.available, balance: a.balance, pngBytes: previewBytes.length })
    }
    await page.getByRole('button', { name: 'Marquer utilisé', exact: true }).click()
    await page.getByLabel('Masquer les profils déjà utilisés').check()
    await expect(picker.locator(`[data-value="${BUDGET_PROFILES.at(-1).id}"]`)).toHaveCount(0)
    await page.getByLabel('Rechercher un profil').fill('aucun-resultat-xyz')
    await expect(page.getByText('Aucun profil ne correspond. Le budget ouvert reste affiché.')).toBeVisible()
    await page.getByLabel('Rechercher un profil').fill('')
    await page.getByLabel('Masquer les profils déjà utilisés').uncheck()
    await page.getByLabel('Texte prêt à publier').fill('Mon brouillon personnel')
    await page.reload(); await expect(page.getByLabel('Texte prêt à publier')).toHaveValue('Mon brouillon personnel')
    await page.getByRole('button', { name: 'Adapter ce budget', exact: true }).click()
    await expect(page.getByText('Participation à faire valider avant publication.')).toBeVisible()
    await expect(page.getByText('Source et vérification du profil', { exact: true })).toHaveCount(0)
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('')
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeDisabled()
    await expect(page.getByRole('region', { name: 'Image du budget' }).locator('img')).toHaveCount(0)
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('100')
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeEnabled()
    await context.close()
  }
  // Corrupt records must survive loading and attempted writes.
  const context = await browser.newContext()
  await context.addInitScript(({ draft, usage }) => { localStorage.setItem(draft, '{broken'); localStorage.setItem(usage, '{broken') }, { draft: DRAFT_KEY, usage: USAGE_KEY })
  const page = await context.newPage(); await page.goto(base + '/le-budget-de')
  await expect(page.getByRole('alert')).toContainText('conservé sans modification')
  assert.equal(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY), '{broken')
  await context.close()
  assert.deepEqual(errors, [])
  writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2))
  console.log(`Budget browser: ${results.length} profile/viewport exports, clipboard, discovery, filters, drafts, invalidation and corrupt storage passed.`)
} finally { await browser?.close(); server?.kill() }
