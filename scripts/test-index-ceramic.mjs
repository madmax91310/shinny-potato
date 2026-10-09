import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
const port = 4337, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 200)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage(); await page.goto(base)
  await mkdir('test-artifacts/index-ceramic', { recursive: true })
  await page.exposeFunction('saveCeramic', async ({ id, png }) => writeFile(`test-artifacts/index-ceramic/${id}.png`, Buffer.from(png.split(',')[1], 'base64')))
  const count = await page.evaluate(async () => {
    const { FAMILIES } = await import('/shinny-potato/src/data/index-comparisons.js')
    const { getIndexComparisonPairs } = await import('/shinny-potato/src/data/index-comparison-pairs.js')
    const pairs = FAMILIES.flatMap(getIndexComparisonPairs)
    const { renderIndexImage, getIndexImageFacts } = await import('/shinny-potato/src/pages/index-comparator/imageExport.js')
    const { buildTweetText } = await import('/shinny-potato/src/pages/index-comparator/lib.js')
    const original = CanvasRenderingContext2D.prototype.fillText
    let boxes = [], labels = [], current
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value), b = { value: String(value), l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, t: y - m.actualBoundingBoxAscent, b: y + m.actualBoundingBoxDescent }
      if (b.l < 0 || b.r > this.canvas.width || b.t < 0 || b.b > this.canvas.height) throw Error(`Clipped ${current}: ${value}`)
      for (const p of boxes) if (Math.min(p.r,b.r)-Math.max(p.l,b.l)>1 && Math.min(p.b,b.b)-Math.max(p.t,b.t)>1) throw Error(`Overlap ${current}: ${p.value} / ${value}`)
      boxes.push(b); labels.push(String(value)); return original.call(this, value, x, y, ...rest)
    }
    try {
      for (const family of pairs) {
        const before = JSON.stringify(family), tweet = buildTweetText(family, {})
        boxes = []; labels = []; current = family.pairId
        const image = await renderIndexImage(family), all = labels.join(' ')
        if (before !== JSON.stringify(family) || tweet !== buildTweetText(family, {})) throw Error('Data or tweet changed')
        if (labels.filter(v => v === 'Épargnant Libre').length !== 1 || /ISIN|…/.test(all)) throw Error('Signature or truncated content')
        for (const index of family.indices) {
          const name = (index.indexFacts?.index ?? index.name).replace(' (rappel, non-PEA)', '').replace(' (PEA)', '').replace('Émergents global (indice ESG)', 'Émergents ESG')
          if (!all.includes(name)) throw Error(`Lost name ${name}`)
          const facts = getIndexImageFacts(index)
          if (Number.isFinite(facts?.count) && !labels.includes(facts.count.toLocaleString('fr-FR'))) throw Error(`Wrong count ${name}`)
          for (const [name, value] of [...(facts?.countries ?? []), ...(facts?.sectors ?? [])]) {
            if (!all.includes(name.replace(/^[^\p{L}\p{N}]+/u, '').trim()) || !labels.includes(`${value.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`)) throw Error('Lost composition')
          }
          if (facts?.asOf && !all.includes(facts.asOf.split('-').reverse().join('/'))) throw Error('Lost snapshot date')
        }
        await window.saveCeramic({ id: family.pairId, png: image.toDataURL() })
      }
      const absent = { ...FAMILIES.find(f => f.id === 'monde'), indices: FAMILIES.find(f => f.id === 'monde').indices.map(i => ({ ...i, indexFacts: { ...i.indexFacts, metadata: { sourceStatus: 'archive-unverifiable' } } })) }
      labels = []; boxes = []; current = 'undocumented'
      await renderIndexImage(absent)
      if (labels.includes('titres') || labels.includes('SECTEURS') || labels.includes('PRINCIPAUX PAYS')) throw Error('Undocumented facts exposed')
    } finally { CanvasRenderingContext2D.prototype.fillText = original }
    return pairs.length
  })
  console.log(`${count} archived comparison renders: documented facts and no overlap/clipping.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
