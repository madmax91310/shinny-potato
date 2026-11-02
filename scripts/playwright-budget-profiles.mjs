import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetDisplayName, budgetImageExpenses, buildBudgetText, euro, sourceReply } from '../src/pages/budget-profiles/lib.js'
import { DRAFT_KEY, PUBLISHED_KEY, USAGE_KEY, WORKSPACE_KEY } from '../src/pages/budget-profiles/storage.js'

function captureCanvasText() {
      const original = CanvasRenderingContext2D.prototype.fillText
      window.budgetCanvasText = []
      CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...args) {
        if (['LE BUDGET DE', 'EXEMPLE DE BUDGET'].includes(String(text))) window.budgetCanvasText = []
        if (this.canvas.width === 1200) {
          const width = this.measureText(text).width
          const left = x - (this.textAlign === 'right' ? width : this.textAlign === 'center' ? width / 2 : 0)
          window.budgetCanvasText.push({ text, left, right: left + width, y, size: parseFloat(this.font.match(/[\d.]+px/)?.[0]), height: this.canvas.height })
        }
        return original.call(this, text, x, y, ...args)
      }
}

function assertNoCanvasTextOverlap(drawn, label) {
  for (let i = 0; i < drawn.length; i++) for (const b of drawn.slice(i + 1)) {
    const a = drawn[i]
    assert(!(Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.y + a.size, b.y + b.size) - Math.max(a.y, b.y) > 2), `${label}: overlapping text ${JSON.stringify([a, b])}`)
  }
}

// CI partitions by viewport and disjoint profile subsets; direct runs retain the full roster.
const widths = process.argv[2] === undefined ? [1440, 390, 320] : [Number(process.argv[2])]
assert(widths.every(width => [1440, 390, 320].includes(width)), 'Expected viewport 1440, 390 or 320')
const partition = Number(process.argv[3] ?? 0), partitions = Number(process.argv[4] ?? 1)
assert(Number.isInteger(partition) && Number.isInteger(partitions) && partitions > 0 && partition >= 0 && partition < partitions, 'Invalid profile partition')
const roster = BUDGET_PROFILES.filter((_, index) => index % partitions === partition)
const port = partition * 10 + (widths.length === 1 ? ({ 1440: 4470, 390: 4471, 320: 4472 })[widths[0]] : 4470)
const base = process.env.BUDGET_PUBLIC_BASE ?? `http://127.0.0.1:${port}/shinny-potato`
const server = process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
const output = 'test-artifacts/budget-profiles'; mkdirSync(output, { recursive: true })
let browser
try {
  if (server) await waitPreview(server, base)
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const errors = [], results = []
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, permissions: ['clipboard-read', 'clipboard-write'], reducedMotion: 'reduce' })
    await context.addInitScript(captureCanvasText)
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(base + '/'); await expect(page.locator('.workspace-tool-card[href$="/le-budget-de"]')).toBeVisible()
    await page.locator('.workspace-tool-card[href$="/le-budget-de"]').click()
    await expect(page.getByRole('heading', { name: 'Le budget de…', exact: true, level: 1 })).toBeVisible()
    assert.equal(await page.locator('select').count(), 0, 'Default budget uses the shared button selectors')
    const picker = page.getByRole('group', { name: 'Choisir un profil budget' })
    for (const profile of roster) {
      await page.getByRole('group', { name: 'Version de l’image', exact: true }).locator('[data-value="detailed"]').click()
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
      const drawn = await page.evaluate(() => window.budgetCanvasText)
      assert(drawn.length > 0, 'Inspect the real canvas text, not only its PNG dimensions')
      assertNoCanvasTextOverlap(drawn, profile.id)
      if (profile.approximate) assert(drawn.some(t => t.text.startsWith('≈ ')), 'Approximate amounts stay qualified in the main figure, without a disclaimer line')
      for (const t of drawn) {
        assert(t.left >= 30 && t.right <= 1170 && t.y >= 0 && t.y + t.size <= t.height, `${profile.id}: text exceeds the image: ${JSON.stringify(t)}`)
        assert(!t.text.includes('…'), `${profile.id}: no truncated content`)
        assert(!/prénoms? fictifs?|scénario mensuel préparé|l’auteur|sa femme|placeholder|\.json|PR #/i.test(t.text), `${profile.id}: internal mention on image`)
      }
      const normalize = text => text.replace(/\s+/g, ' ').trim()
      const imageText = normalize(drawn.map(t => t.text).join(' '))
      assert(imageText.includes(budgetDisplayName(profile)))
      for (const row of [...profile.income, ...profile.expenses, ...profile.savings]) {
        assert(imageText.includes(normalize(row.label)), `${profile.id}: missing complete label ${row.label}`)
        assert(imageText.includes(normalize(euro(row.amount, profile.currency))), `${profile.id}: missing amount ${row.amount}`)
      }
      assert(imageText.includes(normalize(euro(Math.abs(analyzeBudget(profile).balance), profile.currency))))
      writeFileSync(`${output}/${width}-${profile.id}-export.png`, Buffer.from(previewBytes))
      await page.getByRole('button', { name: 'Copier le texte', exact: true }).click()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), buildBudgetText(profile))
      const sourceDetails = page.getByText('Source et vérification du profil', { exact: true }).locator('..')
      if (!(await sourceDetails.evaluate(node => node.open))) await sourceDetails.locator('summary').first().click()
      await page.getByRole('button', { name: 'Copier la source pour une réponse', exact: true }).click()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), sourceReply(profile))
      assert(!/prépar|compléments|arrondis|prénoms? fictifs?|l’auteur|sa femme|vérification|\.json|PR\s*#/i.test(sourceReply(profile)), 'The optional copied source also excludes production notes')
      await expect(page.getByRole('checkbox', { name: 'Profil publié', exact: true })).not.toBeChecked()
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).published, WORKSPACE_KEY), [], 'Copying and exporting never declare publication')
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no horizontal overflow`)
      // Verify the optional summary from the actual render, then its selected download.
      await page.getByRole('group', { name: 'Version de l’image', exact: true }).locator('[data-value="summary"]').click()
      await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeEnabled()
      const summaryDrawn = await page.evaluate(() => window.budgetCanvasText)
      assertNoCanvasTextOverlap(summaryDrawn, `${profile.id} summary`)
      const summaryText = normalize(summaryDrawn.map(t => t.text).join(' '))
      for (const row of [...profile.income, ...budgetImageExpenses(profile, 'summary'), ...profile.savings]) {
        assert(summaryText.includes(normalize(row.label)), `${profile.id}: missing summary label ${row.label}`)
        assert(summaryText.includes(normalize(euro(row.amount, profile.currency))))
      }
      for (const t of summaryDrawn) assert(t.left >= 30 && t.right <= 1170 && t.y >= 0 && t.y + t.size <= t.height, `Summary bounds: ${JSON.stringify(t)}`)
      const summaryBytes = await page.evaluate(async url => [...new Uint8Array(await (await fetch(url)).arrayBuffer())], await image.getAttribute('src'))
      const summaryDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Télécharger le PNG', exact: true }).click()
      assert.deepEqual(readFileSync(await (await summaryDownload).path()), Buffer.from(summaryBytes))
      writeFileSync(`${output}/${width}-${profile.id}-summary.png`, Buffer.from(summaryBytes))
      await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(profile))
      const a = analyzeBudget(profile)
      await expect(page.locator('.budget-totals')).toContainText(euro(a.available, profile.currency))
      await page.screenshot({ path: `${output}/${width}-${profile.id}.png`, fullPage: true })
      results.push({ width, profile: profile.id, income: a.income, expenses: a.expenses, available: a.available, balance: a.balance, pngBytes: previewBytes.length })
    }
    // Publication is a deliberate per-profile declaration, independent of usage.
    const publication = page.getByRole('checkbox', { name: 'Profil publié', exact: true })
    const lastId = BUDGET_PROFILES.at(-1).id
    await picker.locator(`[data-value="${lastId}"]`).click()
    await publication.click()
    await page.getByRole('button', { name: 'Confirmer la publication', exact: true }).click()
    await expect(page.getByText('Publication déclarée enregistrée.', { exact: true })).toBeVisible()
    await expect(picker.locator(`[data-value="${lastId}"]`)).toContainText('publié')
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).used, WORKSPACE_KEY), [])
    await page.reload(); await expect(publication).toBeChecked()
    await picker.locator(`[data-value="${BUDGET_PROFILES[0].id}"]`).click()
    await expect(publication).not.toBeChecked()
    await picker.locator(`[data-value="${lastId}"]`).click()
    await expect(publication).toBeChecked()
    await page.getByLabel('Masquer les profils publiés', { exact: true }).check()
    await expect(picker.locator(`[data-value="${lastId}"]`)).toHaveCount(0)
    await expect(publication).toBeChecked() // The opened profile stays available to unmark.
    await publication.uncheck()
    await expect(picker.locator(`[data-value="${lastId}"]`)).toHaveCount(1)
    await page.reload(); await expect(publication).not.toBeChecked()
    await page.getByRole('button', { name: 'Marquer utilisé', exact: true }).click()
    await expect(publication).not.toBeChecked()
    await page.getByLabel('Masquer les profils déjà utilisés').check()
    await expect(picker.locator(`[data-value="${BUDGET_PROFILES.at(-1).id}"]`)).toHaveCount(0)
    await page.getByLabel('Rechercher un profil').fill('aucun-resultat-xyz')
    await expect(page.getByText('Aucun profil ne correspond. Le budget ouvert reste affiché.')).toBeVisible()
    await page.getByLabel('Rechercher un profil').fill('')
    await page.getByLabel('Masquer les profils déjà utilisés').uncheck()
    await page.getByLabel('Texte prêt à publier').fill('Mon brouillon personnel')
    await page.reload(); await expect(page.getByLabel('Texte prêt à publier')).toHaveValue('Mon brouillon personnel')
    await page.getByRole('button', { name: 'Adapter ce budget', exact: true }).click()
    await expect(publication).not.toBeChecked()
    await publication.click()
    await page.getByRole('button', { name: 'Confirmer la publication', exact: true }).click()
    await expect(publication).toBeChecked()
    const participationId = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).activeId, WORKSPACE_KEY)
    await page.getByRole('button', { name: 'Créer une participation', exact: true }).click()
    await expect(publication).not.toBeChecked()
    await page.getByRole('button', { name: 'Profils sourcés', exact: true }).click()
    await picker.locator(`[data-value="${lastId}"]`).click()
    await page.getByRole('button', { name: 'Adapter ce budget', exact: true }).click()
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).activeId, WORKSPACE_KEY)).not.toBe(participationId)
    await expect(page.getByText('Participation à faire valider avant publication.')).toBeVisible()
    if (BUDGET_PROFILES.at(-1).currency === 'CHF') {
      await page.getByText('Présentation du profil', { exact: true }).click()
      await expect(page.getByLabel('Devise du budget')).toHaveValue('CHF')
      await page.getByLabel('Devise du budget').selectOption('EUR')
      await expect.poll(() => page.getByLabel('Texte prêt à publier').inputValue()).toContain('€')
      await page.getByLabel('Devise du budget').selectOption('CHF')
      await expect.poll(() => page.getByLabel('Texte prêt à publier').inputValue()).toContain('CHF')
    }
    await expect(page.getByText('Source et vérification du profil', { exact: true })).toHaveCount(0)
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('')
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeDisabled()
    await expect(page.getByRole('region', { name: 'Image du budget' }).locator('img')).toHaveCount(0)
    await page.getByLabel('Dépenses · montant 1', { exact: true }).fill('100')
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeEnabled()
    await context.close()
  }
  // Exercise the full editor contract independently of the source roster.
  const extreme = {
    ...structuredClone(BUDGET_PROFILES[0]), id: 'participation-image-limit', kind: 'participant', source: null,
    name: 'Un prénom volontairement long pour vérifier la présentation complète',
    job: 'Activité professionnelle très détaillée '.repeat(6).slice(0, 250),
    household: 'Situation familiale et logement '.repeat(8).slice(0, 250),
    incomeBasis: 'Base des revenus détaillée '.repeat(9).slice(0, 250),
    capacity: 10000000,
    ...Object.fromEntries(['income', 'expenses', 'savings'].map((key, index) => [key,
      Array.from({ length: 24 }, (_, i) => ({ label: `${key} ${i + 1} ` + (i % 2 ? 'Libellé très long avec plusieurs mots '.repeat(3) : 'X'.repeat(90)).slice(0, 78), amount: index === 0 ? 10000000 : index === 1 ? 9000000 : 1000000, category: 'other' }))
    ])),
  }
  for (const deficit of [false, true]) {
    const fixture = structuredClone(extreme)
    fixture.currency = deficit ? 'CHF' : 'EUR'
    if (deficit) fixture.income.forEach(row => { row.amount = 1 })
    const context = await browser.newContext({ viewport: { width: 390, height: 950 } })
    await context.addInitScript(captureCanvasText)
    await context.addInitScript(({ key, fixture }) => localStorage.setItem(key, JSON.stringify({ profile: fixture, text: '', edited: false })), { key: DRAFT_KEY, fixture })
    const page = await context.newPage(); await page.goto(base + '/le-budget-de')
    const image = page.getByRole('region', { name: 'Image du budget' }).locator('img')
    await expect(page.getByRole('button', { name: 'Télécharger le PNG', exact: true })).toBeEnabled()
    const dimensions = await image.evaluate(img => [img.naturalWidth, img.naturalHeight])
    assert(dimensions[1] < 16384, 'The maximum valid editor budget fits a supported canvas')
    const drawn = await page.evaluate(() => window.budgetCanvasText)
    assertNoCanvasTextOverlap(drawn, 'Editor limit')
    for (const t of drawn) assert(t.left >= 30 && t.right <= 1170 && t.y >= 0 && t.y + t.size <= t.height, `Editor limit: ${JSON.stringify(t)}`)
    const compact = text => text.replace(/\s/g, '')
    const imageText = compact(drawn.map(t => t.text).join(''))
    for (const row of [...fixture.income, ...fixture.expenses, ...fixture.savings]) {
      assert(imageText.includes(compact(row.label)), `Editor limit: complete long label ${row.label}`)
      assert(imageText.includes(compact(euro(row.amount, fixture.currency))))
    }
    assert(imageText.includes(compact(euro(Math.abs(analyzeBudget(fixture).balance), fixture.currency))))
    if (deficit) assert(imageText.includes(compact('MANQUE APRÈS VERSEMENTS')))
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Télécharger le PNG', exact: true }).click()
    const download = await downloadPromise
    const bytes = await page.evaluate(async url => [...new Uint8Array(await (await fetch(url)).arrayBuffer())], await image.getAttribute('src'))
    assert.deepEqual(readFileSync(await download.path()), Buffer.from(bytes))
    writeFileSync(`${output}/editor-limit-${deficit ? 'deficit' : 'balanced'}.png`, Buffer.from(bytes))
    await context.close()
  }
  // Corrupt records must survive loading and attempted writes.
  const context = await browser.newContext()
  await context.addInitScript(({ draft, usage, published }) => { localStorage.setItem(draft, '{broken'); localStorage.setItem(usage, '{broken'); localStorage.setItem(published, '{broken') }, { draft: DRAFT_KEY, usage: USAGE_KEY, published: PUBLISHED_KEY })
  const page = await context.newPage(); await page.goto(base + '/le-budget-de')
  await expect(page.getByRole('alert')).toContainText('conservé sans modification')
  assert.equal(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY), '{broken')
  await page.getByRole('checkbox', { name: 'Profil publié', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmer la publication', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Profil publié', exact: true })).not.toBeChecked()
  await expect(page.getByText('Le statut publié n’a pas pu être enregistré. Le suivi précédent est conservé.', { exact: true })).toBeVisible()
  assert.equal(await page.evaluate(key => localStorage.getItem(key), PUBLISHED_KEY), '{broken')
  await context.close()
  const legacy = await browser.newContext()
  await legacy.addInitScript(({ draft, usage, profile }) => {
    localStorage.setItem(draft, JSON.stringify({ profile, text: 'Ancien texte généré', edited: false }))
    localStorage.setItem(usage, JSON.stringify([profile.id]))
  }, { draft: DRAFT_KEY, usage: USAGE_KEY, profile: BUDGET_PROFILES[0] })
  const legacyPage = await legacy.newPage(); await legacyPage.goto(base + '/le-budget-de')
  await expect(legacyPage.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(BUDGET_PROFILES[0]))
  await expect(legacyPage.getByRole('checkbox', { name: 'Profil publié', exact: true })).not.toBeChecked()
  await legacy.close()
  const blocked = await browser.newContext()
  await blocked.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked') } })
  const blockedPage = await blocked.newPage(); await blockedPage.goto(base + '/le-budget-de')
  await blockedPage.getByRole('checkbox', { name: 'Profil publié', exact: true }).click()
  await blockedPage.getByRole('button', { name: 'Confirmer la publication', exact: true }).click()
  await expect(blockedPage.getByRole('checkbox', { name: 'Profil publié', exact: true })).not.toBeChecked()
  await expect(blockedPage.getByText('Le statut publié n’a pas pu être enregistré. Le suivi précédent est conservé.', { exact: true })).toBeVisible()
  await blocked.close()
  assert.deepEqual(errors, [])
  writeFileSync(`${output}/results-${widths.join('-')}.json`, JSON.stringify(results, null, 2))
  console.log(`Budget browser: ${results.length} profile/viewport exports, clipboard, discovery, filters, drafts, invalidation and corrupt storage passed.`)
} finally { await browser?.close(); server?.kill() }
