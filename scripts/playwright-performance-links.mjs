import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { ETFS } from '../src/data/etf-cards.js'
import { getPerformanceHref, getPerformanceAssetId } from '../src/data/performance-links.js'
import { FORMATS, MODES, getSecondaryOptionsForFormat, pickForSelection, buildTweetText } from '../src/pages/tweet-midi/lib.js'
import { choose } from './card-selection.mjs'
import {qualifiedMonthlyWindows} from '../src/pages/performance-rankings/selection-windows.js'
import {getSimulationAssetId} from '../src/data/simulation-links.js'
import { ASSETS,ASSET_ORDER,SPARSE_MONTHLY_DATA_IDS,INCONSISTENT_MONTHLY_DATA_IDS } from '../src/data/market-history.js'

const base = 'http://localhost:4321/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4321'], { stdio: 'ignore' })
let browser
async function showPreview(page) {
  await page.locator('.workspace-tool-view').waitFor({state:'attached'})
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
    // Coverage grows automatically: validate the selected exact share instead of
    // assuming the default ETF can never acquire a performance shortcut.
    const initialId = await page.locator('#es-etf-select').getAttribute('data-value')
    const initialETF = ETFS.find(etf => etf.id === initialId)
    assert(initialETF, 'Initial selection must be a known ETF')
    const initialHref = getPerformanceHref(initialETF.isin)
    const initialLink = page.getByRole('link', { name: 'Voir sa performance', exact: true })
    assert.equal(await initialLink.count(), initialHref ? 1 : 0)
    if (initialHref) assert((await initialLink.getAttribute('href')).endsWith(initialHref))
    const unlinkedETF = ETFS.find(etf => !getPerformanceHref(etf.isin))
    assert(unlinkedETF, 'Keep a real share without a performance history in this check')
    await choose(page.locator('#es-etf-select'), unlinkedETF.id)
    assert.equal(await initialLink.count(), 0, 'An unlinked share must not open another share or index')
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
    await page.getByRole('alert').filter({hasText:'Aucun autre actif n’a été substitué'}).waitFor()
    assert.equal(await page.locator('#subject-select').count(),0)
    assert.equal(await page.getByRole('button',{name:/Télécharger/}).count(),0)
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
    const recentId=ASSET_ORDER.find(id=>!getSimulationAssetId(id)&&!SPARSE_MONTHLY_DATA_IDS.has(id)&&!INCONSISTENT_MONTHLY_DATA_IDS.has(id)&&qualifiedMonthlyWindows([ASSETS[id]]).length)
    if(recentId){
      const window=qualifiedMonthlyWindows([ASSETS[recentId]]).at(-1)
      await page.goto(`${base}/calculateur-investissement?asset=${recentId}`,{waitUntil:'networkidle'})
      assert.equal(await page.getByRole('group',{name:'Choisir un actif',exact:true}).getAttribute('data-value'),recentId)
      await choose(page.getByRole('group',{name:'Année de départ',exact:true}),window.start.slice(0,4))
      await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),String(Number(window.start.slice(5))))
      await showPreview(page)
      await page.getByRole('heading',{name:ASSETS[recentId].label,exact:true}).waitFor()
      assert.equal(await page.getByRole('alert').count(),0,'Compatible recent months remain usable without an annual calendar')
    }
    const savedSettings=await page.evaluate(()=>localStorage.getItem('epargnant-publication:v1:investment-settings'))
    await page.goto(`${base}/calculateur-investissement?asset=unknown`, { waitUntil: 'networkidle' })
    await page.getByRole('alert').filter({hasText:'Aucun autre actif n’a été substitué'}).waitFor()
    assert.equal(await page.getByRole('img',{name:'Graphique du placement',exact:true}).count(),0)
    assert.equal(await page.evaluate(()=>localStorage.getItem('epargnant-publication:v1:investment-settings')),savedSettings)
    await page.goto(`${base}/calculateur-investissement?asset=bitcoin`,{waitUntil:'networkidle'})
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
  console.log(`History shortcuts: mobile/desktop, ${ETFS.filter(etf=>getPerformanceHref(etf.isin)).length} exact ETF shares, annual/simulation round trips, valid dates, back navigation, unavailable IDs without substitution, preserved settings and no overflow verified.`)
} finally {
  await browser?.close()
  server.kill()
}
