// Reproducible contact sheets use the exact support shared by both real exports.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const root = process.env.INDEX_LOGO_REVIEW_OUTPUT ?? 'reports/index-logo-completion', port = 4340
const candidates = process.env.INDEX_LOGO_CANDIDATES ? JSON.parse(await readFile(process.env.INDEX_LOGO_CANDIDATES, 'utf8')) : null
const base = `http://127.0.0.1:${port}/shinny-potato/`
const added = candidates ? Object.keys(candidates).sort() : JSON.parse(await readFile(`${root}/added.json`, 'utf8')).sort()
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
  browser = await chromium.launch({headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})})
  const page = await browser.newPage()
  await page.goto(base, {waitUntil: 'domcontentloaded'})
  await mkdir(`${root}/previews`, {recursive: true})
  const checks = []
  for (let offset = 0; offset < added.length; offset += 20) {
    const result = await page.evaluate(async ({ids, candidates}) => {
      const {logoSupport} = await import('/shinny-potato/src/pages/factsheet-tweets/canvasImage.js')
      const {default: registry} = await import('/shinny-potato/src/pages/factsheet-tweets/companyLogoRegistry.json')
      const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = Math.ceil(ids.length / 4) * 200
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#94dad3'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      const checks = []
      for (const [i, id] of ids.entries()) {
        const entry = candidates?.[id] ?? registry.companies[id], image = new Image()
        image.dataset.support = entry.support; image.src = '/shinny-potato/asset-art/' + entry.file; await image.decode()
        const probe = document.createElement('canvas'); probe.width = 400; probe.height = 200
        const pctx = probe.getContext('2d'), scale = Math.min(400 / image.width, 200 / image.height)
        pctx.drawImage(image, 0, 0, image.width * scale, image.height * scale)
        const pixels = pctx.getImageData(0, 0, 400, 200).data
        let ink = 0; for (let p = 3; p < pixels.length; p += 4) if (pixels[p] > 20) ink++
        if (ink < 10) throw new Error('Empty mark: ' + id)
        const x = i % 4 * 300, y = Math.floor(i / 4) * 200
        logoSupport(ctx, image, id, x + 18, y + 15, 122)
        logoSupport(ctx, image, id, x + 175, y + 42, 68)
        ctx.fillStyle = '#291016'; ctx.font = '17px Arial'; ctx.fillText(id, x + 18, y + 168)
        checks.push({id, file: entry.file, support: entry.support, width: image.width, height: image.height, ink})
      }
      return {png: canvas.toDataURL(), checks}
    }, {ids: added.slice(offset, offset + 20), candidates})
    checks.push(...result.checks)
    await writeFile(`${root}/previews/logos-${offset / 20 + 1}.png`, Buffer.from(result.png.split(',')[1], 'base64'))
  }
  await writeFile(`${root}/visual-checks.json`, JSON.stringify(checks, null, 2) + '\n')
  console.log(`${checks.length} added logos decoded, nonempty and drawn on both unchanged export supports.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
