import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { blankBudget, buildBudgetText, budgetPublicIncomeRows, budgetImageExpenses, euro, MAX_BUDGET_LINES } from '../src/pages/budget-profiles/lib.js'
import { WORKSPACE_KEY } from '../src/pages/budget-profiles/storage.js'

const base = process.env.BUDGET_PUBLIC_BASE ?? 'http://127.0.0.1:4485/shinny-potato'
const server = process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4485', '--strictPort'], { stdio: 'ignore' })
const output = process.env.BUDGET_ARTIFACTS || 'test-artifacts/budget-subscribers'
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const results = []
const normalize = value => value.replace(/\s+/g, ' ').trim()
const active = page => page.evaluate(key => { const w = JSON.parse(localStorage.getItem(key)); return w.drafts.find(d => d.profile.id === w.activeId) }, WORKSPACE_KEY)
const upload = (page, backup) => page.getByLabel('Restaurer une sauvegarde', { exact: true }).setInputFiles({ name: 'profils-abonnes.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
async function addRow(page, title, label, amount, category) {
  const group = page.getByRole('group', { name: title, exact: true })
  const index = await group.locator('.budget-row').count() + 1
  await group.getByRole('button', { name: 'Ajouter un poste', exact: true }).click()
  await page.getByLabel(`${title} · poste ${index}`, { exact: true }).fill(label)
  await page.getByLabel(`${title} · montant ${index}`, { exact: true }).fill(String(amount))
  if (category) await group.locator('select').nth(index - 1).selectOption(category)
}
async function capture(page, id) {
  const p = (await active(page)).profile
  const cents = key => p[key].reduce((sum, row) => sum + Math.round(row.amount * 100), 0)
  const balance = cents('income') - cents('expenses') - cents('savings')
  await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(p))
  const text = await page.getByLabel('Texte prêt à publier').inputValue()
  assert(text.includes(euro(Math.abs(balance) / 100, p.currency)))
  const img = page.getByRole('region', { name: 'Image du budget', exact: true }).locator('img')
  for (const mode of ['detailed', 'summary']) {
    await page.getByRole('group', { name: 'Version de l’image', exact: true }).locator(`[data-value="${mode}"]`).click()
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeEnabled()
    const encoded = await page.evaluate(async url => {
      const blob = await (await fetch(url)).blob()
      return new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result.split(',')[1]); r.readAsDataURL(blob) })
    }, await img.getAttribute('src'))
    const bytes = Buffer.from(encoded, 'base64')
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Télécharger le PNG', exact: true }).click()
    assert.deepEqual(readFileSync(await (await download).path()), bytes, 'Download equals selected preview')
    writeFileSync(`${output}/${id}-${mode}.png`, bytes)
    const drawn = await page.evaluate(() => window.subscriberCanvasText)
    assert.equal(drawn[0].text, 'LE BUDGET DE')
    for (const t of drawn) assert(t.left >= 30 && t.right <= 1170 && t.y >= 0 && t.y + t.size <= t.height && !t.text.includes('…'), JSON.stringify(t))
    for (let i = 0; i < drawn.length; i++) for (const b of drawn.slice(i + 1)) {
      const a = drawn[i]
      assert(!(Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.y + a.size, b.y + b.size) - Math.max(a.y, b.y) > 2), JSON.stringify([a, b]))
    }
    const rendered = normalize(drawn.map(t => t.text).join(' '))
    assert(rendered.includes(normalize(euro(Math.abs(balance) / 100, p.currency))))
    for (const row of [...budgetPublicIncomeRows(p), ...budgetImageExpenses(p, mode), ...p.savings]) {
      assert(rendered.replace(/\s/g, '').includes(row.label.replace(/\s/g, '')), `${id}: ${row.label}`)
      assert(rendered.includes(normalize(euro(row.amount, p.currency))))
    }
    assert.equal(budgetImageExpenses(p, mode).reduce((s, r) => s + Math.round(r.amount * 100), 0), cents('expenses'))
    if (balance < 0) assert(/MANQUE|DÉFICIT/.test(rendered))
    assert(!rendered.includes('Quelle priorité choisiriez-vous'), 'Questions stay out of images')
  }
  await page.getByRole('button', { name: 'Copier le texte', exact: true }).click()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), text)
  const close = page.getByRole('button', { name: 'Fermer la confirmation', exact: true }); if (await close.count()) await close.click()
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  results.push({ id, incomeCents: cents('income'), expensesCents: cents('expenses'), transfersCents: cents('savings'), balanceCents: balance, rows: p.income.length + p.expenses.length + p.savings.length, bothModesAndCopy: true })
}
async function context(width, workspace) {
  const c = await browser.newContext({ viewport: { width, height: 950 }, permissions: ['clipboard-read', 'clipboard-write'] })
  await c.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText; window.subscriberCanvasText = []
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...args) {
      if (text === 'LE BUDGET DE') window.subscriberCanvasText = []
      if (this.canvas.width === 1200) { const width = this.measureText(text).width, left = x - (this.textAlign === 'right' ? width : this.textAlign === 'center' ? width / 2 : 0); window.subscriberCanvasText.push({ text: String(text), left, right: left + width, y, size: parseFloat(this.font.match(/[\d.]+px/)?.[0]), height: this.canvas.height }) }
      return original.call(this, text, x, y, ...args)
    }
  })
  if (workspace) await c.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value) }, { key: WORKSPACE_KEY, value: typeof workspace === 'string' ? workspace : JSON.stringify(workspace) })
  return c
}
try {
  if (server) await waitPreview(server, base)
  for (const width of [1440, 390, 320]) {
    const c = await context(width), page = await c.newPage(), errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(base + '/le-budget-de')
    await page.getByText('Mes profils d’abonnés', { exact: true }).click()
    await expect(page.getByText('Aucun profil d’abonné enregistré pour le moment.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Nouveau profil d’abonné', exact: true }).click()
    const text = page.getByLabel('Texte prêt à publier'), questions = page.getByLabel('Questions pour les lecteurs', { exact: true })
    await expect(questions).toHaveValue(''); await expect(text).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeDisabled()
    await page.getByLabel('Prénom ou pseudonyme', { exact: true }).fill('Maëlys-Camille')
    await page.getByLabel('Revenus · poste 1', { exact: true }).fill('Salaire net')
    await page.getByLabel('Revenus · montant 1', { exact: true }).fill('2300')
    await addRow(page, 'Revenus', 'Allocations familiales', 200)
    await page.getByLabel('Dépenses · poste 1', { exact: true }).fill('Loyer et charges')
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('1000')
    await page.getByRole('group', { name: 'Dépenses', exact: true }).locator('select').first().selectOption('housing')
    await addRow(page, 'Dépenses', 'Alimentation et hygiène', 400.25, 'food')
    await addRow(page, 'Dépenses', 'Repas au travail', 100, 'food')
    await page.getByText('Épargne et projets', { exact: true }).click()
    await addRow(page, 'Épargne prévue', 'Livret de précaution', 200)
    const q = 'Quelle priorité choisiriez-vous pour ce foyer ?\nQuels achats préparez-vous chaque mois ?'
    await questions.fill(q)
    await expect.poll(async () => (await active(page)).profile.question).toBe(q)
    assert.equal((await active(page)).edited, false)
    const firstId = (await active(page)).profile.id
    assert(firstId.startsWith('participation-'))
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('1200')
    await expect(questions).toHaveValue(q)
    const prior = await text.inputValue()
    await addRow(page, 'Dépenses', 'Téléphone', 30, 'bills')
    await page.getByRole('button', { name: 'Retirer dépenses 4', exact: true }).click()
    await expect(text).toHaveValue(prior)
    await capture(page, `${width}-household`)
    await page.screenshot({ path: `${output}/${width}-composer.png`, fullPage: true })
    await expect(page.getByLabel('Profil publié', { exact: true })).not.toBeChecked()
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('')
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeDisabled()
    await expect(page.getByRole('region', { name: 'Image du budget', exact: true }).locator('img')).toHaveCount(0)
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('1200')
    await page.getByRole('button', { name: 'Nouveau profil d’abonné', exact: true }).click()
    await page.getByLabel('Prénom ou pseudonyme', { exact: true }).fill('Noé')
    await page.getByText('Présentation du profil', { exact: true }).click(); await page.getByLabel('Devise du budget', { exact: true }).selectOption('CHF')
    await page.getByLabel('Revenus · poste 1', { exact: true }).fill('Pension')
    await page.getByLabel('Revenus · montant 1', { exact: true }).fill('1800')
    await page.getByLabel('Dépenses · poste 1', { exact: true }).fill('Logement')
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('800')
    await expect(questions).toHaveValue('')
    assert(!(await text.inputValue()).includes('💬'))
    const secondId = (await active(page)).profile.id
    assert.notEqual(firstId, secondId)
    await questions.fill('Quels frais aviez-vous oubliés ?')
    await capture(page, `${width}-chf`)
    const picker = page.getByRole('group', { name: 'Choisir un profil d’abonné', exact: true })
    await expect(picker.locator('[data-option]')).toHaveCount(2)
    await picker.locator(`[data-value="${firstId}"]`).click(); await expect(questions).toHaveValue(q)
    await page.reload(); await expect(questions).toHaveValue(q); await expect(picker.locator('[data-option]')).toHaveCount(2)
    await page.getByRole('button', { name: 'Profils', exact: true }).click()
    await expect(page.getByRole('group', { name: 'Choisir un profil', exact: true }).locator('[data-option]')).toHaveCount(70)
    await picker.locator(`[data-value="${firstId}"]`).click(); await expect(questions).toHaveValue(q)
    await text.fill('Ma version personnelle à conserver.')
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('1210')
    await expect(text).toHaveValue('Ma version personnelle à conserver.')
    await expect(page.getByRole('alert').filter({ hasText: 'Les montants du budget ont changé' })).toBeVisible()
    await questions.fill('Quelle priorité choisiriez-vous maintenant ?')
    await page.getByRole('button', { name: 'Rétablir le texte', exact: true }).click()
    await expect.poll(() => text.inputValue()).toContain('Quelle priorité choisiriez-vous maintenant ?')
    await page.getByLabel('À publier prochainement', { exact: true }).check()
    await page.getByLabel('Profil publié', { exact: true }).click(); await page.getByLabel('Date de publication sur X', { exact: true }).fill('2026-11-01')
    await page.getByRole('button', { name: 'Confirmer la publication', exact: true }).click()
    await expect(page.getByLabel('La personne a validé les informations à publier.', { exact: true })).not.toBeChecked()
    await page.getByText('Brouillons et transfert entre appareils', { exact: true }).click()
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exporter les brouillons et statuts', exact: true }).click()
    const backup = JSON.parse(readFileSync(await (await download).path(), 'utf8'))
    assert.equal(backup.version, 4); assert.equal(backup.workspace.publicationDates[firstId], '2026-11-01')
    assert.equal(backup.workspace.drafts.filter(d => d.profile.kind === 'participant').length, 2)
    const incoming = structuredClone(backup), incomingDraft = incoming.workspace.drafts.find(d => d.profile.id === firstId)
    incomingDraft.profile.question = 'Question de mon autre appareil ?'
    const before = await page.evaluate(key => localStorage.getItem(key), WORKSPACE_KEY)
    await upload(page, incoming); await expect(page.getByRole('region', { name: 'Aperçu de l’import', exact: true })).toContainText('conflit')
    assert.equal(await page.evaluate(key => localStorage.getItem(key), WORKSPACE_KEY), before)
    await page.getByRole('button', { name: 'Appliquer cet import', exact: true }).click()
    await expect(questions).toHaveValue('Quelle priorité choisiriez-vous maintenant ?')
    await upload(page, incoming); await page.getByLabel('Gestion des conflits', { exact: true }).selectOption('use-imported')
    await page.getByRole('button', { name: 'Appliquer cet import', exact: true }).click(); await expect(questions).toHaveValue(incomingDraft.profile.question)
    await expect(page.getByText('Publié le 01/11/2026', { exact: true })).toBeVisible()
    await text.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${output}/${width}-editor.png` })
    assert.deepEqual(errors, []); await c.close()

    const long = { ...blankBudget(), id: 'participation-long-test', currency: 'CHF', name: 'Anaëlle-Charlotte et Jean-Baptiste de la longue famille Martin', question: 'Quelle priorité choisiriez-vous pour réduire les versements ?',
      ...Object.fromEntries(['income', 'expenses', 'savings'].map(key => [key, Array.from({ length: MAX_BUDGET_LINES }, (_, i) => ({ label: `${i + 1} ${key} ` + 'A'.repeat(70), amount: key === 'income' ? 100 : 80, category: 'other' }))])) }
    const record = { profile: long, text: buildBudgetText(long), edited: false }
    const lc = await context(width, { version: 4, drafts: [record], activeId: long.id, used: [], queued: [], published: [], publicationDates: {} })
    const lp = await lc.newPage(); await lp.goto(base + '/le-budget-de')
    for (const title of ['Revenus', 'Dépenses']) await expect(lp.getByRole('group', { name: title, exact: true }).getByRole('button', { name: 'Ajouter un poste', exact: true })).toBeDisabled()
    await lp.getByText('Épargne et projets', { exact: true }).click()
    await expect(lp.getByRole('group', { name: 'Épargne prévue', exact: true }).getByRole('button', { name: 'Ajouter un poste', exact: true })).toBeDisabled()
    await capture(lp, `${width}-long-deficit`); await lc.close()
  }
  const broken = await context(390, '{damaged-subscriber-storage'), page = await broken.newPage()
  await page.goto(base + '/le-budget-de'); await page.getByRole('button', { name: 'Créer un profil d’abonné', exact: true }).click()
  await page.getByLabel('Prénom ou pseudonyme', { exact: true }).fill('Profil en mémoire')
  assert.equal(await page.evaluate(key => localStorage.getItem(key), WORKSPACE_KEY), '{damaged-subscriber-storage')
  await expect(page.getByRole('status').filter({ hasText: 'Brouillon en mémoire' })).toBeVisible(); await broken.close()
  writeFileSync(`${output}/browser-results.json`, JSON.stringify(results, null, 2))
  console.log('Subscriber browser: creation, multiple saved profiles, manual questions, add/remove lines, EUR/CHF, 72 rows/deficits, both PNG modes, exact copy, custom preservation, dated statuses, backup conflicts and corrupt storage passed at 1440/390/320 px.')
} finally { await browser.close(); server?.kill() }
