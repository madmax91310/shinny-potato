import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { chromium } from 'playwright'
import { RANKING_ASSETS, ANNUAL_ASSETS } from '../src/pages/performance-rankings/data.js'

// Exercise the production canvas renderer in Chromium with synthetic financial data.
const root = resolve('.'), artifacts = 'test-artifacts/performance-rankings'
let browser
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 1000 } })
  // Serve source modules through Playwright routing; no network or HTTP listener needed.
  await page.route('http://annual.test/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}canvas{display:block;width:100%;height:auto}</style><main></main>' })
    const file = resolve(root, `.${pathname}`)
    if (!file.startsWith(`${root}/src/`)) return route.fulfill({ status: 404 })
    try { await route.fulfill({ contentType: extname(file) === '.js' ? 'text/javascript; charset=utf-8' : 'text/plain', body: await readFile(file) }) }
    catch { await route.fulfill({ status: 404 }) }
  })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://annual.test/')
  const registryNames = Object.values({ ...RANKING_ASSETS, ...ANNUAL_ASSETS }).map(asset => asset.shortLabel ?? asset.label)
  await page.evaluate(async names => {
    const { annualNameLines } = await import('/src/pages/performance-rankings/image.js')
    const ctx = document.createElement('canvas').getContext('2d')
    for (const name of names) annualNameLines(ctx, name, 202)
  }, registryNames)
  const renders = await page.evaluate(async () => {
    const { buildRanking } = await import('/src/pages/performance-rankings/engine.js')
    const { renderRankingImage, annualNameLines } = await import('/src/pages/performance-rankings/image.js')
    const { annualRankingColumns } = await import('/src/pages/performance-rankings/annualRanking.js')
    await document.fonts.ready
    const names = ['MSCI Marchés émergents hors Chine', 'Obligations mondiales couvertes EUR', 'Consommation discrétionnaire mondiale', 'Actions américaines petites capitalisations', 'Or physique (ETC)', 'Bitcoin']
    const images = [], fillText = CanvasRenderingContext2D.prototype.fillText
    let canvasCount = 0
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value)
      const left = this.textAlign === 'center' ? x - m.width / 2 : this.textAlign === 'right' ? x - m.width : x
      if (left < 0 || left + m.width > this.canvas.width || y - m.actualBoundingBoxAscent < 0 || y + m.actualBoundingBoxDescent > this.canvas.height) throw new Error(`Texte hors image : ${value}`)
      return fillText.call(this, value, x, y, ...rest)
    }
    for (let count = 2; count <= 6; count++) for (let years = 2; years <= 7; years++) {
      const assets = names.slice(0, count).map((label, i) => ({ id: `asset-${i}`, shortLabel: label, label, currency: 'EUR', basis: 'fund-nav', frequency: 'annual', years: Object.fromEntries(Array.from({ length: years }, (_, j) => [2010 + j, j === 0 ? 5 : ((i * 7 + j * 11) % 50) - 20])) }))
      const result = buildRanking(assets, { mode: 'years', startYear: 2010, endYear: 2009 + years })
      const before = JSON.stringify(result)
      const canvas = renderRankingImage(result, 'Sélection', null, 'annual')
      if (before !== JSON.stringify(result)) throw new Error('Calcul modifié par le rendu')
      const columns = annualRankingColumns(result)
      for (const column of columns) for (const row of column.rows) annualNameLines(canvas.getContext('2d'), row.label, (canvas.width - 138) / years - 34)
      if (columns[0].rows.some(row => !row.tied)) throw new Error('Ex æquo absents')
      canvasCount++
      if ((count === 2 && years === 2) || (count === 3 && years === 7) || (count === 6 && years === 7)) images.push({ name: `annual-${count}-${years}`, png: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height })
      document.querySelector('main').replaceChildren(canvas)
      window.rankingCanvas = canvas
      if (canvas.toDataURL() !== renderRankingImage(result, 'Sélection', null, 'annual').toDataURL()) throw new Error('Aperçu et export différents')
    }
    CanvasRenderingContext2D.prototype.fillText = fillText
    return { canvasCount, images }
  })
  assert.equal(renders.canvasCount, 30)
  await mkdir(artifacts, { recursive: true })
  for (const image of renders.images) await writeFile(`${artifacts}/${image.name}.png`, Buffer.from(image.png.split(',')[1], 'base64'))
  const downloadEvent = page.waitForEvent('download')
  await page.evaluate(() => {
    const link = document.createElement('a'); link.href = window.rankingCanvas.toDataURL('image/png'); link.download = 'annual-fixture.png'; document.body.append(link); link.click(); link.remove()
  })
  const download = await downloadEvent
  await download.saveAs(`${artifacts}/annual-downloaded.png`)
  const bytes = await readFile(`${artifacts}/annual-downloaded.png`)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.toString('base64'), renders.images.at(-1).png.split(',')[1])
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: `${artifacts}/annual-mobile.png`, fullPage: true })
  assert.deepEqual(errors, [])
  console.log('Annual canvas: all 30 configurations, long names, text bounds, deterministic preview/export, downloaded PNG bytes and mobile passed.')
} finally { await browser?.close() }
