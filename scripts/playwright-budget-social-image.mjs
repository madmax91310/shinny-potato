import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { buildBudgetText } from '../src/pages/budget-profiles/lib.js'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { captureBudgetCanvas, verifyBudgetPng } from './budget-browser-image.mjs'
import { waitPreview } from './wait-preview.mjs'

const [shard, shards] = process.argv.slice(2).map(Number)
const part = Number.isInteger(shard) ? shard : 0
const count = Number.isInteger(shards) ? shards : 1
assert(part >= 0 && part < count)
const selected = process.env.BUDGET_PROFILES_ONLY?.split(',') || []
assert(selected.every(id => BUDGET_PROFILES.some(profile => profile.id === id)), 'Profil de recette inconnu')
const roster = BUDGET_PROFILES.filter((profile, index) => index % count === part && (!selected.length || selected.includes(profile.id)))
const port = String(4550 + part)
const base = process.env.BUDGET_PUBLIC_BASE || `http://127.0.0.1:${port}/shinny-potato`
const server = process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', port, '--strictPort'], { stdio: 'ignore' })
const output = process.env.BUDGET_ARTIFACTS || `test-artifacts/budget-single-image-${part}-of-${count}`
mkdirSync(output, { recursive: true })
let browser
try {
  if (server) await waitPreview(server, base)
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] })
  await page.addInitScript(captureBudgetCanvas)
  await page.goto(base + '/le-budget-de')
  const pick = page.getByRole('group', { name: 'Choisir un profil', exact: true })
  const layout = []
  for (const profile of roster) {
    await pick.locator(`[data-value="${profile.id}"]`).click()
    writeFileSync(`${output}/${profile.id}.png`, await verifyBudgetPng(page, profile))
    const drawn = await page.evaluate(() => window.budgetCanvasText)
    layout.push({ id: profile.id, truncated: drawn.filter(line => line.text.includes('…')),
      labels: drawn.filter(line => line.y >= 742 && line.y < 1155 && !/[€]|CHF/u.test(line.text)).map(line => line.text) })
    const draft = page.getByLabel('Texte prêt à publier')
    const expected = buildBudgetText(profile)
    await expect(draft).toHaveValue(expected)
    await page.getByRole('button', { name: 'Copier le texte', exact: true }).click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected, profile.id)
  }
  writeFileSync(`${output}/layout.json`, JSON.stringify(layout, null, 2) + '\n')
  console.log(`${roster.length} profils à 390 px, PNG téléchargés identiques aux aperçus, textes et montants contrôlés.`)
} finally {
  await browser?.close()
  server?.kill()
}
