import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

const port = 4318, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage(); await page.goto(base)
  const result = await page.evaluate(async () => {
    const { ASSETS, YEARS } = await import('/shinny-potato/src/data/portfolio-assets.js')
    const { ensurePortfolioAssets } = await import('/shinny-potato/src/data/portfolio-asset-loader.js')
    await ensurePortfolioAssets(ASSETS.map(asset => asset.id))
    const { buildManualPortfolio, generatePortfolio } = await import('/shinny-potato/src/pages/portfolio-generator/engine.js')
    const { MODEL_FAMILIES, buildModelPortfolio } = await import('/shinny-potato/src/pages/portfolio-generator/modelPortfolios.js')
    const { computeYearlyPerf } = await import('/shinny-potato/src/pages/portfolio-generator/performance.js')
    const { renderPortfolioImage } = await import('/shinny-potato/src/pages/portfolio-generator/canvasImage.js')
    const { loadPortfolioBackground } = await import('/shinny-potato/src/pages/portfolio-generator/background.js')
    const background = await loadPortfolioBackground()
    const original = CanvasRenderingContext2D.prototype.fillText
    const originalRect = CanvasRenderingContext2D.prototype.fillRect
    let labels = [], boxes = [], rects = [], current
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value), transform = this.getTransform()
      const box = { text: String(value), l: (x - m.actualBoundingBoxLeft) * transform.a, r: (x + m.actualBoundingBoxRight) * transform.a,
        t: (y - m.actualBoundingBoxAscent) * transform.d, b: (y + m.actualBoundingBoxDescent) * transform.d }
      if (box.l < 0 || box.r > this.canvas.width || box.t < 0 || box.b > this.canvas.height) throw new Error(`Clipped ${current}: ${value}`)
      for (const prior of boxes) if (Math.min(box.r, prior.r) - Math.max(box.l, prior.l) > 1 && Math.min(box.b, prior.b) - Math.max(box.t, prior.t) > 1) throw new Error(`Overlap ${current}: ${prior.text} / ${value}`)
      boxes.push(box); labels.push(String(value)); return original.call(this, value, x, y, ...rest)
    }
    CanvasRenderingContext2D.prototype.fillRect = function(x,y,w,h) { rects.push({x,y,w,h}); return originalRect.call(this,x,y,w,h) }
    let count = 0
    const samples = []
    const fmt = v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
    const check = (name, portfolio, keep = false) => {
      current = name; labels = []; boxes = []; rects = []
      const perf = computeYearlyPerf(portfolio.selection)
      const YEARS = Object.keys(perf).map(Number).sort((a,b)=>a-b)
      const canvas = renderPortfolioImage(portfolio, background)
      const words = labels.join(' ')
      if (!words.includes('Performances annuelles simulées') || !words.includes('EUR · rééquilibrage annuel')) throw new Error('Missing simulation convention')
      if (/change BCE|hors courtage et fiscalité/.test(words)) throw new Error('Technical detail should remain in the tool')
      if (/devises non converties|ÉQUILIBRÉ|EXEMPLE DE PORTEFEUILLE|Le Généraliste|…/i.test(words)) throw new Error(`Forbidden heading/footer ${name}`)
      if (!labels.includes('Pas un conseil.')) throw new Error('Missing disclaimer')
      if (labels.filter(label => label === 'Épargnant Libre').length !== 1) throw new Error('Signature')
      for (const asset of portfolio.selection.filter(a => a.pct > 0)) {
        if (!words.includes(asset.name) || !labels.includes(`${asset.pct.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`)) throw new Error(`Lost holding ${asset.name}`)
      }
      for (const year of YEARS) if (!labels.includes(String(year)) || !labels.includes(Number.isFinite(perf[year]) ? fmt(perf[year]) : 'n.d.')) throw new Error(`Lost annual return ${name}/${year}`)
      const available = YEARS.map(year => perf[year])
      if (available.every(Number.isFinite)) {
        const growth = available.reduce((product,v) => product * (1 + v/100),1)
        const annual = growth >= 0 ? (growth ** (1 / YEARS.length) - 1) * 100 : null
        if (!labels.includes(annual === null ? 'n.d.' : fmt(annual))) throw new Error('Annualized changed')
      } else if (!labels.includes('n.d.')) throw new Error('Missing value invented')
      // All nonzero bars must use one common absolute scale, and share the correct
      // side of zero; material highlights cannot alter their quantitative height.
      const baseline = rects.find(rect => rect.w === 1240 && rect.h === 1)?.y
      const bars = rects.filter(rect => rect.w === 96 && rect.h > 0)
      const plotted = available.filter(v => Number.isFinite(v) && v !== 0)
      if (bars.length !== plotted.length) throw new Error('Wrong bar count')
      const scale = bars[0]?.h / Math.abs(plotted[0])
      bars.forEach((bar,i) => {
        if (Math.abs(bar.h / Math.abs(plotted[i]) - scale) > 1e-8) throw new Error('Different scales')
        if (Math.abs((plotted[i] > 0 ? bar.y + bar.h : bar.y) - baseline) > 1e-8) throw new Error('Wrong side of zero')
      })
      if (keep) samples.push({ name, png: canvas.toDataURL(), words, width: canvas.width, height: canvas.height })
      // Release the backing store between hundreds of complete image checks.
      // Samples already contain their PNG bytes and original dimensions.
      canvas.width = 1; canvas.height = 1
      count++
    }
    try {
      for (const family of MODEL_FAMILIES) for (const preset of family.presets) check(`model-${family.id}-${preset.id}`, buildModelPortfolio(family.id, preset.id), ['ivy','swensen'].includes(family.id))
      const example = buildManualPortfolio([{id:'msci_world',pct:55},{id:'ftse_em_vanguard',pct:6},{id:'oblig_corp_vanguard',pct:39}], 'generaliste', [])
      check('selected-example', example, true)
      for (const asset of ASSETS) check(`single-${asset.id}`, buildManualPortfolio([{id:asset.id,pct:100}], 'generaliste', []))
      // 3.05 and 3.0499999999999994 must not produce different labels after sorting.
      const boundary = [27.95, 6.75, -9.13].map((value, index) => ({
        ...ASSETS.find(a => a.id === 'fonds_euros'), name: `Arrondi ${index + 1}`,
        pct: [20, 30, 50][index], calendarReturns: Object.fromEntries(YEARS.map(year => [year, value])),
      }))
      const reference = computeYearlyPerf(boundary)
      for (const ordered of [boundary, boundary.slice().reverse(), [boundary[1], boundary[0], boundary[2]]]) {
        if (JSON.stringify(computeYearlyPerf(ordered)) !== JSON.stringify(reference)) throw new Error('Order changed annual returns')
        check('rounding-boundary', { ...example, selection: ordered })
      }
      for (let i=0;i<30;i++) check(`auto-${i}`, generatePortfolio([], 'auto', 'auto'), i===0)
      const many = buildManualPortfolio(ASSETS.slice(0,12).map((a,i)=>({id:a.id,pct:i===11?12:8})), 'generaliste', [])
      check('twelve-holdings',many,true)
      const nameMeasure = document.createElement('canvas').getContext('2d')
      nameMeasure.font = '700 49px Arial, sans-serif'
      const longestNames = ASSETS.slice().sort((a, b) => nameMeasure.measureText(b.name).width - nameMeasure.measureText(a.name).width).slice(0, 5)
      check('five-long-names', { ...example, selection: longestNames.map((asset, index) => ({ ...asset, pct: [35, 25, 20, 15, 5][index] })) }, true)
      for (let index = 0; index < ASSETS.length; index += 5) {
        check(`five-holdings-${index}`, { ...example, selection: Array.from({ length: 5 }, (_, offset) => ({ ...ASSETS[(index + offset) % ASSETS.length], pct: [35, 25, 20, 15, 5][offset] })) })
      }
      check('all-holdings',{...example,selection:ASSETS.map(a=>({...a,pct:100/ASSETS.length}))})
      const synthetic = perf => ({ ...example, selection: [{ ...ASSETS.find(a => a.id === 'fonds_euros'), pct: 100, calendarReturns: perf }], perf })
      check('negative',synthetic(Object.fromEntries(YEARS.map((y,i)=>[y,-(i+1)*5]))),true)
      check('zero',synthetic(Object.fromEntries(YEARS.map(y=>[y,0]))))
      check('missing',synthetic({...example.perf,2021:undefined}))
    } finally { CanvasRenderingContext2D.prototype.fillText = original; CanvasRenderingContext2D.prototype.fillRect=originalRect }
    return {count,samples}
  })
  await mkdir('test-artifacts/portfolio-metallic', { recursive: true })
  for (const sample of result.samples) await writeFile(`test-artifacts/portfolio-metallic/${sample.name}.png`, Buffer.from(sample.png.split(',')[1], 'base64'))
  console.log(`${result.count} exports verified: names, weights, annual and annualized returns, shared bar scale, zero/missing/negative values, no headings, EUR currency and source footer, no clipping or overlap.`)
  // Check the real application on mobile, image replacement, and downloaded bytes.
  await page.setViewportSize({width:390,height:844})
  await page.goto(`${base}generateur-portefeuilles`)
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  // The shared workspace markup uses a regular image in its Image pane.
  const preview=page.locator('.pg-main img').first()
  await preview.evaluate(img=>img.decode())
  const before=await preview.getAttribute('src')
  await page.getByRole('button',{name:'Réglages',exact:true}).click()
  await page.getByRole('button',{name:/Générer un nouveau portefeuille/}).click()
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.waitForFunction(previous=>document.querySelector('.pg-main img')?.getAttribute('src')!==previous,before)
  await preview.evaluate(img=>img.decode())
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:/Télécharger l’image PNG/}).click()])
  if(download.suggestedFilename()!=='repartition-portefeuille.png') throw new Error('Download')
  console.log('Mobile image updates and PNG download verified.')
  // A missing backdrop must not expose a downloadable fallback; retry restores it.
  const retryPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  let failBackdrop = true
  await retryPage.route('**/portfolio-donut-studio.webp', route => failBackdrop ? route.abort() : route.continue())
  await retryPage.goto(`${base}generateur-portefeuilles`)
  await retryPage.getByRole('button', { name: 'Aperçu', exact: true }).click()
  await retryPage.getByRole('button', { name: 'Réessayer le visuel', exact: true }).waitFor()
  if (await retryPage.getByRole('link', { name: /Télécharger l’image PNG/ }).count()) throw new Error('Download offered before backdrop loaded')
  failBackdrop = false
  await retryPage.getByRole('button', { name: 'Réessayer le visuel', exact: true }).click()
  await retryPage.getByRole('link', { name: /Télécharger l’image PNG/ }).waitFor()
  await retryPage.getByRole('tab', { name: 'Image', exact: true }).click()
  await retryPage.locator('.pg-main img').first().evaluate(img => img.decode())
  await retryPage.close()
  console.log('Backdrop failure and retry verified; no incomplete PNG download.')
} finally { await browser?.close(); server.kill('SIGTERM') }
