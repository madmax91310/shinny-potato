import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { TOOLS } from '../src/tools.js'
import { initialFiles } from './audit-route-bundles.mjs'

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
  assert.deepEqual(requested, initialFiles, 'Home fetched deferred code')
  await page.getByRole('heading', { name: 'Boîte à outils' }).waitFor()

  // Hold a tool's JS to prove that Suspense leaves the shell visible and usable.
  let release
  let requestedTool
  const started = new Promise(resolve => { requestedTool = resolve })
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/assets/*.js', async route => { requestedTool(); await gate; await route.continue() })
  await page.locator('.workspace-tool-card[href$="/impact-frais"]').click()
  try {
    await started
    // Router transitions keep the previous content while a lazy route loads.
    assert(await page.getByRole('heading', { name: 'Boîte à outils' }).isVisible())
    assert.equal(await page.locator('.workspace-tool-card').count(), TOOLS.length, 'Previous home stays usable during loading')
  } finally { release() }
  await page.getByLabel('ETF du scénario 1', { exact: true }).waitFor()
  await page.unroute('**/assets/*.js')
  assert(requested.size > initialFiles.size, 'Navigation did not fetch deferred code')
  await page.locator('.workspace-sidebar nav').getByRole('link', { name: 'Accueil', exact: true }).click()
  await page.getByRole('heading', { name: 'Boîte à outils' }).waitFor()
  await page.goBack()
  await page.getByLabel('ETF du scénario 1', { exact: true }).waitFor()

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
  await slow.getByLabel('ETF du scénario 1', { exact: true }).waitFor()
  await slow.close()

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
  console.log('Route loading: cold home network, delayed navigation, shell, browser back, all Pages direct links and reloads with query/hash OK.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
