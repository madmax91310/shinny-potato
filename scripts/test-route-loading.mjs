import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { TOOLS } from '../src/tools.js'
import { initialFiles, homeFiles } from './audit-route-bundles.mjs'

const base = 'http://127.0.0.1:4312/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4312', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/`)).ok) break } catch { /* starting */ }
    assert(attempt < 100, 'Preview server unavailable')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const requested = new Set()
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname.endsWith('.js')) requested.add(url.pathname.replace('/shinny-potato/', ''))
  })
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  assert.deepEqual(requested, new Set([...initialFiles, ...homeFiles]), 'Home fetched unrelated deferred code')
  await page.getByRole('heading', { name: 'Mes outils' }).waitFor()

  // Hold a tool's JS to prove that Suspense leaves the shell visible and usable.
  let release
  let requestedTool
  const started = new Promise(resolve => { requestedTool = resolve })
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/assets/*.js', async route => { requestedTool(); await gate; await route.continue() })
  await page.locator('.workspace-tool-card[href$="/impact-frais"]').click()
  try {
    await started
    // A click must visibly acknowledge navigation even while the module waits.
    await page.getByRole('status').filter({ hasText: 'Chargement de l’outil' }).waitFor()
    assert(await page.getByRole('link', { name: '← Tous les outils', exact: true }).isVisible())
  } finally { release() }
  await page.getByText('Utiliser les frais d’un ETF', { exact: true }).waitFor()
  await page.unroute('**/assets/*.js')
  assert(requested.size > new Set([...initialFiles, ...homeFiles]).size, 'Navigation did not fetch deferred code')
  assert(![...requested].some(file => /etf-issuer|market-monthly|instrument-returns/.test(file)), 'Fee tool must not fetch issuer holdings or historical returns')
  await page.locator('.workspace-sidebar nav').getByRole('link', { name: 'Accueil', exact: true }).click()
  await page.getByRole('heading', { name: 'Mes outils' }).waitFor()
  await page.goBack()
  await page.getByText('Utiliser les frais d’un ETF', { exact: true }).waitFor()

  const slow = await browser.newPage()
  let releaseSlow
  const slowGate = new Promise(resolve => { releaseSlow = resolve })
  const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
  const feeChunk = manifest['src/pages/fee-impact/App.jsx'].file
  await slow.route(`**/${feeChunk}`, async route => { await slowGate; await route.continue() })
  await slow.goto(`${base}/impact-frais`, { waitUntil: 'domcontentloaded' })
  try {
    await slow.getByRole('status').filter({ hasText: 'Chargement de l’outil' }).waitFor()
    assert(await slow.locator('.workspace-sidebar nav').getByRole('link', { name: 'Accueil', exact: true }).isVisible())
  } finally { releaseSlow() }
  await slow.getByText('Utiliser les frais d’un ETF', { exact: true }).waitFor()
  await slow.close()

  // Rejected chunks and render exceptions must leave an actionable fallback.
  for (const failure of ['network', 'render']) {
    const broken = await browser.newPage()
    await broken.route(`**/${feeChunk}`, route => failure === 'network'
      ? route.abort('failed')
      : route.fulfill({contentType:'application/javascript', body:'export default function Broken(){throw new Error("render fixture")}'}))
    await broken.goto(`${base}/impact-frais`, {waitUntil:'networkidle'})
    await broken.getByRole('alert').filter({hasText:'L’outil n’a pas pu s’afficher'}).waitFor()
    assert(await broken.locator('.workspace-sidebar nav').getByRole('link',{name:'Accueil',exact:true}).isVisible())
    await broken.unroute(`**/${feeChunk}`)
    await broken.getByRole('button',{name:'Réessayer',exact:true}).click()
    await broken.getByText('Utiliser les frais d’un ETF',{exact:true}).waitFor()
    await broken.close()
  }

  // Cold lightweight formats must not fetch issuer holdings or monthly histories,
  // including the asynchronous renderer used by the preview.
  for (const path of ['/fiche-lexique', '/pouvoir-achat', '/bibliotheque-donnees']) {
    const isolated = await browser.newPage()
    isolated.on('pageerror', error => errors.push(error.message))
    const fetched = []
    isolated.on('request', request => fetched.push(request.url()))
    await isolated.goto(`${base}${path}`, { waitUntil: 'networkidle' })
    await isolated.locator('main h1').first().waitFor()
    assert(!fetched.some(url => url.endsWith(manifest['src/pages/Home.jsx'].file)), `${path} fetched home code`)
    assert(!fetched.some(url => /etf-issuer-part|history-assets-|automated-etf-monthly|non-bond-monthly/.test(url)), `${path} fetched unrelated financial payloads`)
    if (path === '/bibliotheque-donnees') {
      await isolated.getByRole('article', { name: 'Fiche de données' }).waitFor()
      assert.equal(fetched.filter(url => url.includes('/data/catalog/')).length, 1, 'Opening search should fetch exactly one full record')
    }
    await isolated.close()
  }
  // A failed record can be retried, and the previously loaded record cannot be
  // exported while a different selection is waiting for its own payload.
  const catalogue = await browser.newPage()
  catalogue.on('pageerror', error => errors.push(error.message))
  let rejectRecord = true
  await catalogue.route('**/data/catalog/*.json', route => rejectRecord ? route.fulfill({status:503,body:'unavailable'}) : route.continue())
  await catalogue.goto(`${base}/bibliotheque-donnees?q=FR001400U5Q4`, {waitUntil:'networkidle'})
  await catalogue.getByRole('button', {name:'Réessayer',exact:true}).waitFor()
  assert.equal(await catalogue.getByRole('button', {name:'Exporter la fiche JSON',exact:true}).count(),0)
  rejectRecord = false
  await catalogue.getByRole('button', {name:'Réessayer',exact:true}).click()
  await catalogue.getByRole('article', {name:'Fiche de données'}).filter({hasText:'FR001400U5Q4'}).waitFor()
  rejectRecord = true
  await catalogue.getByRole('searchbox', {name:'ISIN, ticker, nom ou identifiant',exact:true}).fill('history:soxx')
  await catalogue.getByRole('button', {name:'Réessayer',exact:true}).waitFor()
  assert.equal(await catalogue.getByRole('button', {name:'Exporter la fiche JSON',exact:true}).count(),0)
  rejectRecord = false
  await catalogue.getByRole('button', {name:'Réessayer',exact:true}).click()
  await catalogue.getByRole('article', {name:'Fiche de données'}).filter({hasText:'history:soxx'}).waitFor()
  await catalogue.close()

  // Emulate Pages' actual 404 instead of Vite preview's SPA fallback.
  const notFound = await readFile('dist/404.html', 'utf8')
  const direct = await browser.newPage()
  direct.on('pageerror', error => errors.push(error.message))
  await direct.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.isNavigationRequest() && url.origin === new URL(base).origin && url.pathname.startsWith('/shinny-potato/') && url.pathname !== '/shinny-potato/') {
      await route.fulfill({ status: 404, contentType: 'text/html', body: notFound })
    } else await route.continue()
  })
  for (const tool of TOOLS.filter(tool => tool.status === 'disponible')) {
    const target = `${base}${tool.to}?route_check=1#route-check`
    await direct.goto(target, { waitUntil: 'networkidle' })
    assert.equal(direct.url(), target, `Pages restoration lost URL for ${tool.to}`)
    await direct.locator('main h1').first().waitFor()
    assert.equal(await direct.getByRole('status').filter({ hasText: 'Chargement de l’outil' }).count(), 0)
    await direct.reload({ waitUntil: 'networkidle' })
    assert.equal(direct.url(), target)
    await direct.locator('main h1').first().waitFor()
  }
  assert.deepEqual(errors, [], 'Browser JavaScript errors')
  for (const width of [1280, 390]) {
    for (const tool of TOOLS.filter(tool => !tool.hidden && tool.status === 'disponible')) {
      const opening = await browser.newPage({ viewport: { width, height: 900 } })
      opening.on('pageerror', error => errors.push(`${tool.to}: ${error.message}`))
      await opening.goto(`${base}/`, { waitUntil: 'networkidle' })
      // Network idleness does not guarantee that React committed the lazy Home.
      await opening.getByRole('heading', { name: 'Mes outils', exact: true }).waitFor()
      const destination = await opening.locator('.workspace-tool-card').evaluateAll((cards, path) =>
        cards.find(card => new URL(card.href).pathname.endsWith(path))?.getAttribute('href'), tool.to)
      assert(destination, `Missing tool link: ${tool.to}`)
      await opening.locator(`.workspace-tool-card[href="${destination}"]`).first().click()
      await opening.locator('.workspace-home').waitFor({ state: 'detached' })
      // Focused modes retain a mounted page heading while hiding the redundant header.
      await opening.locator('main h1').first().waitFor({ state: 'attached' })
      await opening.waitForLoadState('networkidle')
      assert.equal(await opening.locator('.workspace-error').count(), 0, `${tool.to}: tool failed to open`)
      const generate = opening.getByRole('button', { name: /^(🔄 )?Générer$/ })
      if (await generate.count() === 1 && await generate.isVisible() && await generate.isEnabled()) await generate.click()
      assert.deepEqual(errors, [], `${tool.to}: browser errors`)
      console.log(`Opened ${tool.to} at ${width}px`)
      await opening.close()
    }
  }
  console.log('Route loading: cold home network, delayed navigation, shell, browser back, all Pages direct links and reloads with query/hash OK.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
