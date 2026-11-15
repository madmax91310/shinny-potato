import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
import { DRAFT_KEY, WORKSPACE_KEY } from '../src/pages/budget-profiles/storage.js'
import { budgetBeforeChantier4 } from './budget-audit-history.mjs'

// Also runs against the deployed build: no source imports inside the browser.
const base = process.env.BUDGET_PUBLIC_BASE || 'http://127.0.0.1:4487/shinny-potato'
const output = process.env.BUDGET_ARTIFACTS || 'test-artifacts/budget-chantier4'
mkdirSync(output, { recursive: true })
const server = process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4487', '--strictPort'], { stdio: 'ignore' })
const receipts = [], errors = []
let browser
async function copy(page, expected) {
  await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(expected)
  await page.getByRole('button', { name: 'Copier le texte', exact: true }).click()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected)
}
try {
  if (server) await waitPreview(server, base)
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, permissions: ['clipboard-read', 'clipboard-write'] })
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(base + '/le-budget-de')
    for (const profile of BUDGET_PROFILES) {
      await page.getByRole('group', { name: 'Choisir un profil', exact: true }).locator(`[data-value="${profile.id}"]`).click()
      const text = buildBudgetText(profile)
      await copy(page, text)
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), profile.id)
      receipts.push({ width, id: profile.id, displayedAndCopied: text })
      if (['Marc', 'Guillaume', 'Hadrien'].includes(profile.name)) {
        await expect(page.getByRole('region', { name: 'Image du budget' })).toHaveAttribute('aria-busy', 'false', { timeout: 30000 })
        await page.screenshot({ path: `${output}/${profile.name}-${width}.png`, fullPage: true })
      }
    }
    await context.close()
    console.log(`${width}px: ${BUDGET_PROFILES.length} displayed texts = actual clipboard, including line breaks and questions.`)
  }
  const marc = BUDGET_PROFILES.find(p => p.name === 'Marc'), old = budgetBeforeChantier4(marc)
  const custom = 'Mon texte sauvegardé pour Marc.\n\n💰 16 167 CHF — ma formulation.\nEt vous ?'
  for (const version of ['legacy', 2, 4]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 950 }, permissions: ['clipboard-read', 'clipboard-write'] })
    const draft = { profile: old, text: custom, edited: true, textFinance: budgetFinancialReference(old) }
    const value = version === 'legacy' ? draft : { version, drafts: [draft], activeId: old.id, used: [], published: [], queued: [], ...(version === 4 && { publicationDates: {} }) }
    await context.addInitScript(({ key, value }) => {
      if (!sessionStorage.getItem('chantier4-seeded')) {
        localStorage.setItem(key, JSON.stringify(value))
        sessionStorage.setItem('chantier4-seeded', 'true')
      }
    }, { key: version === 'legacy' ? DRAFT_KEY : WORKSPACE_KEY, value })
    const page = await context.newPage()
    await page.goto(base + '/le-budget-de')
    await copy(page, custom)
    await expect(page.getByRole('alert').filter({ hasText: 'Les montants du budget ont changé' })).toBeVisible()
    await page.reload()
    await copy(page, custom)
    await page.getByRole('button', { name: 'Rétablir le texte', exact: true }).click()
    await copy(page, buildBudgetText(marc))
    await expect(page.getByRole('alert').filter({ hasText: 'Les montants du budget ont changé' })).toHaveCount(0)
    await context.close()
    console.log(`${version}: custom Marc draft preserved through migration/reload/copy; explicit reset adopts corrected finances.`)
  }
  assert.deepEqual(errors, [])
  writeFileSync(`${output}/copied-texts.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), receipts, migrations: ['legacy', 2, 4], errors }, null, 2))
} finally { await browser?.close(); server?.kill() }
