// Data smoke test: opens every routed tool on the built site and fails if refreshed
// data makes a page crash or display unusable values. It deliberately asserts no
// figures, so a legitimate data refresh can never break it; editorial and visual
// regressions belong to the other browser checks.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { TOOLS } from '../src/tools.js'

const port = 4371
const base = process.env.TEST_BASE_URL || `http://127.0.0.1:${port}/shinny-potato`
const server = process.env.TEST_BASE_URL ? null : spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
// Deep links into the performance tools exercise the series refreshed most often.
const EXTRA_ROUTES = [
  '/performance-depuis?asset=msciWorld',
  '/performance-depuis?asset=nasdaq100',
  '/il-y-a-x-ans?asset=sp500',
  '/calculateur-investissement?asset=msciWorld',
]
const BAD_VALUE = /(?<![\p{L}\d_])(NaN|undefined|Infinity|null %|\[object Object\])(?![\p{L}\d_])/u

let browser
const failures = []
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/`)).ok) break } catch { /* starting */ }
    assert(attempt < 150, 'Preview server unavailable')
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})
  const routes = [...TOOLS.map(tool => tool.to), ...EXTRA_ROUTES]
  for (const route of routes) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
      await page.locator('.workspace-loading').waitFor({ state: 'detached', timeout: 60000 })
      const main = page.locator('#workspace-main')
      const crashed = await page.getByRole('heading', { name: 'L’outil n’a pas pu s’afficher' }).count()
      const text = await main.innerText()
      const bad = text.match(BAD_VALUE)
      if (errors.length) failures.push(`${route}: page error ${errors[0]}`)
      if (crashed) failures.push(`${route}: error boundary displayed`)
      if (text.trim().length < 40) failures.push(`${route}: empty tool`)
      if (bad) failures.push(`${route}: invalid value "${bad[0]}" near "${text.slice(Math.max(0, bad.index - 60), bad.index + 20).replace(/\s+/g, ' ')}"`)
      if (!errors.length && !crashed && !bad && text.trim().length >= 40) console.log(`ok ${route}`)
    } catch (error) {
      failures.push(`${route}: ${error.message.split('\n')[0]}`)
    } finally {
      await page.close()
    }
  }
} finally {
  await browser?.close()
  server?.kill()
}
if (failures.length) {
  console.error(`\n${failures.length} tool(s) unusable with the current data:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('\nEvery tool renders with the current data.')
