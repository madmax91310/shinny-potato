import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
const port = 4328, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 200)) }
  browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--disable-software-rasterizer'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage()
  await page.goto(base)
  await mkdir('test-artifacts/index-ribbon', { recursive: true })
  await page.exposeFunction('saveIndex', async ({ id, png, labels }) => {
    await writeFile(`test-artifacts/index-ribbon/${id}.png`, Buffer.from(png.split(',')[1], 'base64'))
    await writeFile(`test-artifacts/index-ribbon/${id}.txt`, labels.join('\n'))
  })
  const total = await page.evaluate(async sectorOnly => {
    const { SHEETS } = await import('/shinny-potato/src/data/index-factsheets.js')
    const { renderFactsheetImage, imageCompanyLabel } = await import('/shinny-potato/src/pages/factsheet-tweets/canvasImage.js')
    const { sortedRows } = await import('/shinny-potato/src/pages/factsheet-tweets/editorial.js')
    const { factsheetCurrency, factsheetCurrencies, factsheetInCurrency } = await import('/shinny-potato/src/pages/factsheet-tweets/performanceCurrency.js')
    const fmt = (n, signed = false) => `${signed && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
    let labels = [], boxes = []
    const original = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function (t, x, y, ...args) {
      if (![x, y].every(Number.isFinite)) throw new Error(`Invalid position ${t}: ${x}, ${y}`)
      const m = this.measureText(t), box = { t: String(t), l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, top: y - m.actualBoundingBoxAscent, bottom: y + m.actualBoundingBoxDescent }
      const matrix = this.getTransform()
      const points = [[box.l,box.top],[box.r,box.top],[box.l,box.bottom],[box.r,box.bottom]].map(([x,y])=>matrix.transformPoint({x,y}))
      box.l=Math.min(...points.map(p=>p.x));box.r=Math.max(...points.map(p=>p.x));box.top=Math.min(...points.map(p=>p.y));box.bottom=Math.max(...points.map(p=>p.y))
      boxes.push(box); labels.push(String(t)); return original.call(this, t, x, y, ...args)
    }
    const normalize = text => text.replace(/\s+/g, '').toLowerCase()
    let count = 0
    async function check(sheet, id = sheet.id) {
      labels = []; boxes = []
      const before = JSON.stringify(sheet), canvas = await renderFactsheetImage(sheet)
      if (before !== JSON.stringify(sheet)) throw new Error(`Mutated source ${id}`)
      for (const box of boxes) {
        if (box.l < 0 || box.r > canvas.width || box.top < 0 || box.bottom > canvas.height) throw new Error(`Clipped ${id}: ${box.t}`)
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        if (Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) throw new Error(`Overlap ${id}: ${a.t} / ${b.t}`)
      }
      const annotation = labels.join(' '), normalized = normalize(annotation)
      if (/Composition (?:au|:)|BCE|couverture de change|dividendes.*réinvestis/i.test(annotation)) throw new Error(`Removed metadata returned ${id}`)
      const currency = factsheetCurrency(sheet)
      if (sheet.returns.length && currency && !labels.includes(`PERFORMANCES ANNUELLES EN ${currency}`)) throw new Error(`Wrong displayed currency ${id}`)
      if (labels.filter(t => t === 'Épargnant Libre').length !== 1) throw new Error('Signature')
      if (/COULISSES|ISIN|…|Pas un conseil|Source\s*:/i.test(annotation)) throw new Error(`Unwanted copy ${id}`)
      if (!normalized.includes(normalize(sheet.index ?? sheet.title))) throw new Error(`Missing title ${id}`)
      if (sheet.constituents != null && (!labels.some(label => normalize(label) === normalize(sheet.constituents.toLocaleString('fr-FR'))) || !labels.includes('titres'))) throw new Error(`Wrong count ${id}`)
      for (const [year, value] of sheet.returns) if (!labels.includes(String(year)) || !labels.includes(fmt(value, true))) throw new Error(`Changed return ${id}: ${year} / ${fmt(value, true)}; ${labels.join(" | ")}`)
      for (const heading of ['PAYS', 'SECTEURS', 'ENTREPRISES', 'PERFORMANCES ANNUELLES']) if (!labels.some(label => label === heading || (heading === 'PERFORMANCES ANNUELLES' && label.startsWith(heading)))) throw new Error(`Missing block ${id}`)
      for (const rows of [sortedRows(sheet.countries).filter(([name]) => !/autres|others/i.test(name)).slice(0, 4), sortedRows(sheet.sectors).slice(0, 4), sortedRows(sheet.holdings).slice(0, 4)]) {
        for (const [, value] of rows) if (!labels.includes(fmt(value))) throw new Error(`Changed composition ${id}`)
      }
      for (const [name] of sortedRows(sheet.holdings).slice(0, 4)) if (!normalized.includes(normalize(imageCompanyLabel(name)))) throw new Error(`Missing company ${id}`)
      const background = canvas.getContext('2d').getImageData(0, 0, 1, 1).data
      if (background[0] > 40 || background[1] > 100 || background[2] > 80) throw new Error('Missing emerald magazine background')
      if (canvas.width !== 1600 || canvas.height < 1600 || canvas.height / canvas.width > 1.6) throw new Error(`Wrong dimensions ${id}: ${canvas.height}`)
      await window.saveIndex({ id, png: canvas.toDataURL(), labels })
      count++
    }
    try {
      for (const sheet of SHEETS.filter(sheet => !sectorOnly || ['msci-world-health-care', 'msci-world-financials', 'msci-world-energy'].includes(sheet.id))) await check(sheet)
      // Layout-only fixtures: the real sources are never edited. New years,
      // sparse composition and missing count/date must remain exportable.
      const sample = SHEETS.find(sheet => sheet.id === 'stoxx600')
      for (const currency of factsheetCurrencies(sample)) await check(factsheetInCurrency(sample, currency), `layout-${currency}`)
      for (const years of [1, 3, 6, 7, 10]) await check({ ...sample, returns: Array.from({ length: years }, (_, i) => [2010 + i, [-10.64, 0, 24.91][i % 3]]) }, `layout-${years}-years`)
      await check({ ...sample, constituents: null, indexFacts: { ...sample.indexFacts, targetConstituents: null, asOf: null }, snapshot: 'archive non datée' }, 'layout-undated')
    } finally { CanvasRenderingContext2D.prototype.fillText = original }
    return count
  }, process.argv.includes('--world-sectors'))
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(`${base}tweets-factsheets`)
    if (width === 390) await page.getByRole('button', { name: 'Aperçu', exact: true }).click()
    await page.getByRole('tab', { name: 'Image', exact: true }).click()
    await page.locator('.fs-scope img').first().evaluate(i => i.decode())
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Télécharger l’image', exact: true }).click()])
    assert.ok(download.suggestedFilename().endsWith('-dans-les-coulisses.png'))
    assert.equal(await download.failure(), null)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow')
    await page.screenshot({ path: `test-artifacts/index-ribbon/ui-${width}.png` })
  }
  assert.deepEqual(errors, [])
  console.log(`${total} images d’indices : magazine émeraude, sources inchangées, poids/comptages et rendements conservés, mentions retirées, aucun chevauchement ni rognage ; export desktop et mobile OK.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
