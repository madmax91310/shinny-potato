import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { choose } from './card-selection.mjs'

const base = process.env.INVESTOR_VISUAL_URL || 'http://127.0.0.1:4310/shinny-potato/'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  const draft = page.getByLabel('Tweet modifiable')
  const copy = page.getByRole('button', { name: /Copier le tweet|Copié/ })
  const refresh = page.getByRole('button', { name: 'Actualiser les données disponibles' })
  const edit = 'Mon brouillon vérifié pour le T3 2026.'
  const getTepper = '**/data/investors/tepper.json'
  const opening = () => page.getByRole('button', { name: 'Aperçu', exact: true }).click()
  await page.goto(base + 'portefeuilles-investisseurs')
  await opening()
  await page.getByText('Le texte développé dépasse cette limite.', { exact: false }).waitFor()
  const initial = await draft.inputValue()
  assert(initial.includes('Micron') && initial.length > 280)
  await page.getByText(/Voir la version courte/).click()
  await page.getByRole('button', { name: 'Copier la version courte' }).click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  assert(copied.includes('Micron') && copied !== initial && copied.length <= 280)
  assert.equal(await draft.inputValue(), initial)
  await page.getByLabel('Limite de caractères de ton compte X').fill('4000')
  await page.getByText('Le texte développé dépasse cette limite.', { exact: false }).waitFor({ state: 'hidden' })
  await draft.fill(edit)
  await page.getByLabel('Présentation de l’investisseur (modifiable)').fill('Ma présentation conservée.')
  await page.getByRole('button', { name: 'Réglages', exact: true }).click()
  await choose(page.getByLabel('Choisir un investisseur'), 'morfit')
  await opening()
  await page.getByText('Mason Morfit · ValueAct Holdings, L.P.', { exact: true }).waitFor()
  assert.notEqual(await draft.inputValue(), edit)
  await page.reload()
  await opening()
  await page.waitForFunction(text => document.querySelector('#ip-draft')?.value === text, edit)
  assert.equal(await page.getByLabel('Présentation de l’investisseur (modifiable)').inputValue(), 'Ma présentation conservée.')
  assert.equal(await copy.isEnabled(), true)

  const filing = await (await page.request.get(base + 'data/investors/tepper.json')).json()
  const snapshot = filing.data.snapshot
  snapshot.periodEnd = '2026-06-30'
  snapshot.filedAt = '2026-08-14'
  filing.data.identity.personPeriod = snapshot.periodEnd
  await page.route(getTepper, route => route.fulfill({ json: filing }))
  await refresh.click()
  await page.getByText('À réviser', { exact: true }).waitFor()
  assert.equal(await draft.inputValue(), edit)
  assert.equal(await copy.isDisabled(), true)
  await draft.fill('Mon texte révisé pour le T2 2026.')
  await page.getByRole('button', { name: 'Valider le texte pour ce relevé' }).click()
  assert.equal(await copy.isEnabled(), true)
  await refresh.click()
  await page.getByText('À réviser', { exact: true }).waitFor({ state: 'hidden' })
  assert.equal(await draft.inputValue(), 'Mon texte révisé pour le T2 2026.')
  await page.reload()
  await opening()
  await page.waitForFunction(() => document.querySelector('#ip-draft')?.value === 'Mon texte révisé pour le T2 2026.')
  await page.getByText(/Dernière tentative de collecte/).waitFor()
  assert.equal(await copy.isEnabled(), true)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  console.log('Édition 13F sur mobile : versions X distinctes, copie, profils, persistance et révision après changement de relevé.')
} finally {
  await browser.close()
}
