import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { ETFS } from '../src/data/etf-cards.js'
import { getPerformanceHref, getPerformanceAssetId } from '../src/data/performance-links.js'
import { FORMATS, MODES, getSecondaryOptionsForFormat, pickForSelection, buildTweetText, SUBJECT_ALEATOIRE } from '../src/pages/tweet-midi/lib.js'
import { choose } from './card-selection.mjs'
import { ASSETS } from '../src/data/market-history.js'

const base = 'http://localhost:4321/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4321'], { stdio: 'ignore' })
let browser
async function showPreview(page) {
  const button = page.locator('.workspace-view-switch').getByRole('button', { name: 'Aperçu', exact: true })
  if (await button.isVisible()) await button.click()
}
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    const scripts = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()) })
    await page.goto(`${base}/fiches-etf`, { waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('link', { name: 'Voir sa performance', exact: true }).count(), 0)
    assert(!scripts.some(url => url.includes('market-history-')), 'Presentations must not fetch monthly histories')
    for (const etf of ETFS.filter(etf => getPerformanceHref(etf.isin))) {
      await choose(page.locator('#es-etf-select'), etf.id)
      const link = page.getByRole('link', { name: 'Voir sa performance', exact: true })
      assert((await link.getAttribute('href')).endsWith(getPerformanceHref(etf.isin)))
      await link.click()
      const assetId = getPerformanceAssetId(etf.isin)
      await page.waitForFunction(id => document.querySelector('#subject-select')?.dataset.value === id, assetId)
      const years = getSecondaryOptionsForFormat(FORMATS.PERFORMANCE_DEPUIS, MODES.SIMPLE, assetId)
      const expectedPreviews = years.map(year => buildTweetText(pickForSelection({
        format: FORMATS.PERFORMANCE_DEPUIS, subjectId: assetId, secondaryId: year, history: [],
      }).item))
      assert(expectedPreviews.includes(await page.locator('pre').textContent()), 'Initial preview must use the selected share')
      await choose(page.locator('#secondary-select'), years[0])
      await page.getByRole('button', { name: '🔄 Générer', exact: true }).click()
      assert.equal(await page.locator('pre').textContent(), expectedPreviews[0])
      await page.goBack({ waitUntil: 'networkidle' })
    }
    // A second URL while the route stays mounted must select the new share.
    await page.goto(`${base}/performance-depuis?isin=LU0290358497`, { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      history.pushState({}, '', '?isin=IE00B66F4759')
      dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForFunction(() => document.querySelector('#subject-select')?.dataset.value === 'euroHighYieldBond')
    await page.goto(`${base}/performance-depuis?isin=unknown`, { waitUntil: 'networkidle' })
    assert.equal(await page.locator('#subject-select').getAttribute('data-value'), SUBJECT_ALEATOIRE)
    for (const assetId of ['bitcoin', 'apple', 'lvmh', 'euroHighYieldBond']) {
      await page.goto(`${base}/performance-depuis?asset=${assetId}`, { waitUntil: 'networkidle' })
      assert.equal(await page.locator('#subject-select').getAttribute('data-value'), assetId)
      await showPreview(page)
      scripts.length = 0
      await page.getByRole('link', { name: 'Simuler un investissement sur cet actif', exact: true }).click()
      assert(new URL(page.url()).searchParams.get('asset') === assetId)
      await page.getByRole('heading', { name: 'Et si tu avais investi ?', exact: true }).waitFor()
      await showPreview(page)
      await page.getByRole('heading', { name: ASSETS[assetId].label, exact: true }).waitFor()
      assert(await page.getByRole('button', { name: /Copier/ }).first().isEnabled(), 'Simulation must use a valid default date')
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow')
      await page.getByRole('link', { name: 'Voir les performances annuelles de cet actif', exact: true }).click()
      assert.equal(await page.locator('#subject-select').getAttribute('data-value'), assetId)
      await page.goBack({ waitUntil: 'networkidle' })
      await showPreview(page)
      await page.getByRole('heading', { name: ASSETS[assetId].label, exact: true }).waitFor()
    }
    await page.goto(`${base}/calculateur-investissement?asset=unknown`, { waitUntil: 'networkidle' })
    await showPreview(page)
    await page.getByRole('heading', { name: 'Bitcoin', exact: true }).waitFor()
    // Same mounted route, new identity: reset its form and result together.
    await page.evaluate(() => {
      history.pushState({}, '', '?asset=apple')
      dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForURL('**/calculateur-investissement?asset=apple')
    // Search changes remount the workspace, including its mobile view switch.
    await page.waitForFunction(() => document.querySelector('.workspace-tool-view')?.dataset.view === 'settings')
    await showPreview(page)
    await page.getByRole('heading', { name: 'Apple', exact: true }).waitFor()
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log('History shortcuts: mobile/desktop, 7 ETF shares, annual/simulation round trips, valid dates, back navigation, changed/unknown IDs and no overflow verified.')
} finally {
  await browser?.close()
  server.kill()
}
