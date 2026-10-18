import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

// Preserve the approved marker-free headers and keep long names inside their cells.
const port = 4393
const base = `http://127.0.0.1:${port}/shinny-potato`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' })
let startupOutput = ''
server.stdout.on('data', chunk => { startupOutput += chunk })
server.stderr.on('data', chunk => { startupOutput += chunk })
let browser
try {
  let ready = false
  let lastResponse = ''
  for (let attempt = 0; attempt < 300; attempt++) {
    try { const response = await fetch(`${base}/`); lastResponse = String(response.status); if (response.ok) { ready = true; break } } catch (error) { lastResponse = error.cause?.code ?? error.message }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert(ready, `Serveur de rendu indisponible (${lastResponse}) : ${startupOutput}`)
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage()
  await page.goto(`${base}/classements-performances`, { waitUntil: 'networkidle' })
  const images = await page.evaluate(async () => {
    const { rankingImageLayout, renderRankingImage } = await import('/shinny-potato/src/pages/performance-rankings/image.js')
    const labels = ['STOXX Europe 600', 'EURO STOXX 50', 'MSCI Europe', 'S&P 500', 'MSCI World Small Cap', 'Nasdaq-100']
    const originals = { text: CanvasRenderingContext2D.prototype.fillText, arc: CanvasRenderingContext2D.prototype.arc }
    let boxes = [], markers = []
    CanvasRenderingContext2D.prototype.fillText = function (value, x, y, ...rest) {
      const measure = this.measureText(value)
      boxes.push({ value, centerY: y, left: x - measure.actualBoundingBoxLeft, right: x + measure.actualBoundingBoxRight,
        top: y - measure.actualBoundingBoxAscent, bottom: y + measure.actualBoundingBoxDescent })
      return originals.text.call(this, value, x, y, ...rest)
    }
    CanvasRenderingContext2D.prototype.arc = function (x, y, radius, ...rest) {
      markers.push({ x, y, radius })
      return originals.arc.call(this, x, y, radius, ...rest)
    }
    const output = []
    try {
      for (let count = 2; count <= 6; count++) for (let years = 1; years <= 10; years++) {
        const assets = labels.slice(0, count).map((label, index) => ({ id: String(index), label, shortLabel: label }))
        const columns = Array.from({ length: years }, (_, index) => ({ label: String(2010 + index),
          start: `${2009 + index}-12`, end: `${2010 + index}-12`,
          rows: assets.map((asset, order) => ({ id: asset.id, value: order - index, rank: order + 1 })) }))
        const layout = rankingImageLayout(count, years)
        boxes = []; markers = []
        const canvas = renderRankingImage({ assets, columns, coverage: { currency: 'EUR', basis: 'adjusted' },
          mode: 'years', start: columns[0].start, end: columns.at(-1).end })
        const headerBottom = layout.tableY + layout.headerHeight
        for (const marker of markers.filter(marker => marker.y < headerBottom)) for (const box of boxes) {
          if (box.right > marker.x - marker.radius && box.left < marker.x + marker.radius &&
              box.bottom > marker.y - marker.radius && box.top < marker.y + marker.radius) {
            throw new Error(`${count} actifs / ${years} années : la pastille chevauche « ${box.value} »`)
          }
        }
        if (markers.some(marker => marker.y < headerBottom)) throw new Error('Les anciennes pastilles ne doivent pas revenir dans les en-têtes approuvés')
        const headers = boxes.filter(box => box.centerY >= layout.tableY && box.centerY < headerBottom)
        if (layout.transposed) {
          if (headers.length < count + 1) throw new Error('Un nom d’actif manque dans les en-têtes')
          for (const box of headers) {
            if (box.top < layout.tableY || box.bottom >= headerBottom) throw new Error(`Le libellé « ${box.value} » dépasse l’en-tête`)
            if (box.value === 'Année') continue
            const column = Math.floor(((box.left + box.right) / 2 - layout.margin - layout.labelWidth) / layout.cellWidth)
            const left = layout.margin + layout.labelWidth + column * layout.cellWidth
            if (column < 0 || column >= count || box.left < left || box.right > left + layout.cellWidth) throw new Error(`Le libellé « ${box.value} » dépasse sa colonne`)
          }
        }
        if ((count === 3 || count === 6) && years === 6) output.push({ count, png: canvas.toDataURL('image/png') })
      }
      return output
    } finally {
      CanvasRenderingContext2D.prototype.fillText = originals.text
      CanvasRenderingContext2D.prototype.arc = originals.arc
    }
  })
  await mkdir('test-artifacts/ranking-header', { recursive: true })
  for (const image of images) await writeFile(`test-artifacts/ranking-header/${image.count}-assets.png`, Buffer.from(image.png.split(',')[1], 'base64'))
  console.log('50 formats de classement : visuel approuvé sans pastilles, noms longs contenus dans leurs colonnes, 2–6 actifs et 1–10 années vérifiés.')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
