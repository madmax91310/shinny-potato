import { choose } from './card-selection.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { buildReview, reviewCalendar } from '../src/pages/data-review/lib.js'
const report = buildReview()
const calculatorCount = report.schedule.filter(item => item.tools.includes('Calculateur')).length
const investorCount = report.schedule.filter(item => item.tools.includes('Présentation investisseur')).length
const reserveCount = report.items.filter(item => item.category === 'reserve').length
assert(calculatorCount > 0 && investorCount > 0 && reserveCount > 0)
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4311'], { stdio: 'ignore' })
let browser
try {
  const base = 'http://127.0.0.1:4311/shinny-potato'
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/`)).ok) break } catch { /* démarrage */ }
    if (attempt > 100) throw new Error('Serveur de test indisponible')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})
  const page = await browser.newPage()
  // Alerts remain visible independently of calendar filters.
  await page.route('**/automation-status/automation-status.json', route => route.fulfill({json: {schemaVersion: 1, workflows: {economic: {name: 'Données économiques', status: 'failure', completedAt: '2026-10-07T10:00:00Z', runUrl: 'https://github.com/madmax91310/shinny-potato/actions/runs/1'}}}}))
  await page.goto(`${base}/donnees-a-revoir?view=calendar&tool=Calculateur`, { waitUntil: 'networkidle' })
  assert.equal(await page.getByRole('region', { name: 'Échecs des mises à jour automatiques', exact: true }).locator('.dr-item').count(), 1)
  assert.equal(await page.locator('.data-review > .dr-list > .dr-item').count(), calculatorCount)
  assert.equal(await page.getByText('Prochaine vérification', { exact: true }).count(), calculatorCount)
  assert.equal(await page.getByText('Date de la donnée', { exact: true }).count(), calculatorCount)
  assert.equal(await page.getByText('Dernier contrôle réussi de la source', { exact: true }).count(), calculatorCount)
  assert.equal(await page.getByText('Dernière modification de la donnée', { exact: true }).count(), calculatorCount)

  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.getByLabel('Outil', { exact: true }).getAttribute('data-value'), 'Calculateur')
  assert.equal(await page.locator('.data-review > .dr-list > .dr-item').count(), calculatorCount)
  await choose(page.getByLabel('Outil', { exact: true }), 'Présentation investisseur')
  await page.waitForFunction(count => document.querySelectorAll('.data-review > .dr-list > .dr-item').length === count, investorCount)
  assert.equal(await page.getByRole('link', { name: 'Ouvrir le portefeuille investisseur' }).count(), investorCount)
  await choose(page.getByLabel('Outil', { exact: true }), '')
  await page.waitForFunction(() => new URLSearchParams(location.search).get('tool') === '' && document.querySelectorAll('.data-review > .dr-list > .dr-item').length > document.querySelectorAll('.data-review > .dr-list > .dr-item .dr-current').length)
  await page.locator('.dr-cadence').filter({ hasText: /^Mensuel/ }).click()
  const monthlyCount = reviewCalendar(report).filter(item => item.cadence === 'monthly').length
  await page.waitForFunction(count => document.querySelectorAll('.data-review > .dr-list > .dr-item').length === count, monthlyCount)
  assert.equal(await page.getByLabel('Temporalité', { exact: true }).getAttribute('data-value'), 'monthly')
  assert((await page.locator('.dr-cadence').filter({ hasText: /^Mensuel/ }).innerText()).includes('Prochaine échéance'))
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.locator('.data-review > .dr-list > .dr-item').count(), monthlyCount)
  assert.equal(await page.getByLabel('Temporalité', { exact: true }).getAttribute('data-value'), 'monthly')
  await page.locator('.dr-cadence').filter({ hasText: /^Trimestriel/ }).click()
  const quarterlyCount = reviewCalendar(report).filter(item => item.cadence === 'quarterly').length
  await page.waitForFunction(count => document.querySelectorAll('.data-review > .dr-list > .dr-item').length === count, quarterlyCount)
  assert.equal(await page.getByRole('link', { name: 'Ouvrir le portefeuille investisseur' }).count(), investorCount)
  await choose(page.getByLabel('Temporalité', { exact: true }), 'event')
  await page.waitForFunction(() => document.querySelectorAll('.data-review > .dr-list > .dr-item').length === 3)
  assert.equal(await page.getByText('Fin de l’offre', { exact: true }).count(), 3)
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await choose(page.getByLabel('Afficher', { exact: true }), 'reserve')
  await page.waitForFunction(count => document.querySelectorAll('.data-review > .dr-list > .dr-item').length === count, reserveCount)
  assert.equal(await page.getByLabel('Temporalité', { exact: true }).getAttribute('data-value'), '')
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  console.log('Calendrier : dates, filtre outil, rechargement, réserves, rappels par temporalité, filtres persistants et mobile validés.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
