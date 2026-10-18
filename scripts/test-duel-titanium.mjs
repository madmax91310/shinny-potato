import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { choose } from './card-selection.mjs'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { CATALOG } from '../src/data/duel-assets.js'
import { DUEL_EXPOSURE_ART, getDuelArt } from '../src/pages/portfolio-duels/visualIdentity.js'
assert.deepEqual(Object.keys(DUEL_EXPOSURE_ART).sort(), [...new Set(CATALOG.map(a => a.exposure))].sort())
for (const asset of CATALOG) {
  const art = getDuelArt(asset)
  assert(['illustration','asset-symbol'].includes(art.kind))
  if(art.kind==='asset-symbol') {assert(['bitcoin.svg','ethereum.svg'].includes(art.mark));assert.equal(art.scene,art.mark)}
  await readFile(`public/asset-art/${art.scene}`)
}
assert.equal(getDuelArt(CATALOG.find(a => a.id === 'stoxx600_bnp')).theme, 'europe')
assert.equal(getDuelArt(CATALOG.find(a => a.id === 'sect_robotique')).theme, 'robotics')
assert.equal(getDuelArt(CATALOG.find(a => a.id === 'sect_cyber_lg')).theme, 'security')
assert.equal(getDuelArt(CATALOG.find(a => a.id === 'oblig_0_1_ishares')).theme, 'bonds')
assert.notEqual(DUEL_EXPOSURE_ART['construction-europe'].scene, DUEL_EXPOSURE_ART.infrastructure.scene, 'Construction and infrastructure must have distinct artwork')
assert.throws(() => getDuelArt({ id: 'unknown', exposure: 'unreviewed' }))
const port = 4328, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage(); await page.goto(base)
  await mkdir('test-artifacts/duel-titanium', { recursive: true })
  await page.exposeFunction('saveDuelSample', async sample => {
    await writeFile(`test-artifacts/duel-titanium/${sample.name}.png`, Buffer.from(sample.png.split(',')[1], 'base64'))
    await writeFile(`test-artifacts/duel-titanium/${sample.name}.txt`, sample.labels.join('\n'))
  })
  await page.evaluate(async () => {
    const { CATALOG } = await import('/shinny-potato/src/data/duel-assets.js')
    const { DUELS } = await import('/shinny-potato/src/pages/portfolio-duels/data.js')
    const { buildDuel, buildCustomDuel, buildTweet, formatCapital, formatPercent } = await import('/shinny-potato/src/pages/portfolio-duels/lib.js')
    const { renderDuelImage } = await import('/shinny-potato/src/pages/portfolio-duels/canvasImage.js')
    const originalText = CanvasRenderingContext2D.prototype.fillText, originalImage = CanvasRenderingContext2D.prototype.drawImage
    let boxes = [], labels = [], scenes = [], current
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value), box = { text: value, l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, t: y - m.actualBoundingBoxAscent, b: y + m.actualBoundingBoxDescent }
      if (box.l < 0 || box.r > this.canvas.width || box.t < 0 || box.b > this.canvas.height) throw new Error(`Clipped ${current}: ${value}`)
      for (const prior of boxes) if (Math.min(box.r, prior.r) - Math.max(box.l, prior.l) > 1 && Math.min(box.b, prior.b) - Math.max(box.t, prior.t) > 1) throw new Error(`Overlap ${current}: ${prior.text} / ${value}`)
      boxes.push(box); labels.push(String(value)); return originalText.call(this, value, x, y, ...rest)
    }
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (image instanceof HTMLImageElement) scenes.push(image.src.split('/asset-art/')[1])
      return originalImage.call(this, image, ...args)
    }
    const check = async (name, duel, keep = false) => {
      boxes = []; labels = []; scenes = []; current = name
      const before = JSON.stringify(duel), tweet = buildTweet(duel), png = await renderDuelImage(duel)
      if (JSON.stringify(duel) !== before || buildTweet(duel) !== tweet) throw new Error('Calculation or tweet changed')
      if (JSON.stringify(scenes) !== JSON.stringify(['duel-paper/ivory-corners.webp'])) throw new Error(`Wrong paper background in ${name}`)
      const image = new Image(); image.src = png; await image.decode()
      if (image.naturalWidth !== 1600 || image.naturalHeight !== 1600) throw new Error('Duel must stay square')
      for (const item of [duel.a, duel.b]) {
        for (const asset of item.assets) {
          if (!labels.join(' ').includes(asset.label) || !labels.includes(`${asset.pct} %`)) throw new Error(`Lost asset/weight: ${asset.id}`)
        }
        if (!labels.includes(formatCapital(item.final, duel.currency)) || !labels.includes(formatPercent((item.final / 10000 - 1) * 100))) throw new Error('Wrong result')
        for (const year of duel.years) if (!labels.includes(`${item === duel.a ? 'A' : 'B'} ${formatPercent(item.annual[year])}`)) throw new Error('Lost annual result')
      }
      if (!labels.includes(`Début ${duel.years[0]} → Fin ${duel.years.at(-1)}`)) throw new Error('Wrong common dates')
      if (labels.filter(label => /[ée]pargnant.?libre/i.test(label)).length !== 1) throw new Error('Signature must appear once')
      if (labels.join(' ').includes(duel.title) || /DUEL DE PORTEFEUILLES|sans conversion|devise non convertie/i.test(labels.join(' '))) throw new Error('Unwanted title/series')
      if (keep) await window.saveDuelSample({ name, png, labels })
      return png
    }
    try {
      for (const definition of DUELS) await check(definition.id, buildDuel(definition), ['world-quality-momentum', 'sp500-equal-europe', 'oblig-courtes-longues', 'usa-europe-sante-ou-acwi-tech', 'oblig-0-1-ou-1-3', 'oblig-etat-ou-entreprises', 'oblig-ig-ou-high-yield', 'oblig-etat-ou-inflation'].includes(definition.id))
      for (const asset of CATALOG) {
        const left = asset.role === 'base' ? [{ id: asset.id, pct: 80 }, { id: 'msci_em', pct: 20 }] : [{ id: 'msci_world_ishares', pct: 80 }, { id: asset.id, pct: 20 }]
        const right = [{ id: 'msci_world_ishares', pct: 80 }, { id: 'msci_em', pct: 20 }]
        await check(asset.id, buildCustomDuel({ left, right }), ['sect_robotique', 'immo_ishares_yield', 'sect_energie_propre'].includes(asset.id))
      }
      const stockIds = ['apple', 'microsoft', 'broadcom', 'tesla', 'berkshire', 'asml']
      for (const count of [1, 5, 6]) {
        const left = [{id: 'msci_world_ishares', pct: 100}]
        const right = stockIds.slice(0, count).map((id, i) => ({id: `equity-${id}`, pct: Math.floor(100 / count) + (i < 100 % count ? 1 : 0)}))
        await check(`world-vs-${count}-stocks`, buildCustomDuel({left, right}), true)
        await check(`${count}-stocks-vs-world`, buildCustomDuel({left:right, right:left}))
      }
      const three = buildCustomDuel({ left: [{ id: 'msci_world_ishares', pct: 80 }, { id: 'oblig_global_agg_eur_hedged', pct: 10 }, { id: 'immo_ishares_yield', pct: 10 }], right: [{ id: 'msci_acwi_ishares', pct: 70 }, { id: 'stoxx600_bnp', pct: 20 }, { id: 'sect_robotique', pct: 10 }] })
      await check('three-assets-short-history', three, true)
      const same = buildCustomDuel({ left: [{ id: 'msci_world_ishares', pct: 80 }, { id: 'msci_em', pct: 20 }], right: [{ id: 'msci_world_ishares', pct: 80 }, { id: 'msci_em', pct: 20 }] })
      await check('equal-results', same)
      const negative = structuredClone(same)
      negative.a.final = 5600; negative.b.final = 7000
      await check('negative-results', negative, true)
      const large = structuredClone(same); large.a.final = 9876543210123; large.b.final = 9999999999999
      await check('large-results', large)
    } finally { CanvasRenderingContext2D.prototype.fillText = originalText; CanvasRenderingContext2D.prototype.drawImage = originalImage }
  })
  // Real UI: failed art does not silently substitute a different asset, and retry works.
  await page.route('**/asset-art/duel-paper/ivory-corners.webp', route => route.abort())
  await page.goto(`${base}duels-portefeuilles`)
  const failureDuel = DUELS.findIndex(duel => duel.id === 'sp500-equal-europe')
  assert(failureDuel >= 0, 'An American exposure is required for the failed-art/retry test')
  await choose(page.locator('#pd-select'), String(failureDuel))
  await page.getByRole('button', { name: /Télécharger l’image PNG/i }).click()
  await page.getByRole('alert').filter({ hasText: 'n’a pas pu être chargé' }).waitFor()
  await page.unroute('**/asset-art/duel-paper/ivory-corners.webp')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Télécharger l’image PNG/i }).click()])
  assert.match(download.suggestedFilename(), /^duel-.*\.png$/)
  await page.getByRole('tab', { name: 'Image', exact: true }).click()
  await page.getByRole('img', { name: 'Duel de portefeuilles', exact: true }).waitFor()
  await page.getByRole('button', {name: 'Composer A et B', exact:true}).click()
  await page.getByRole('button', {name: 'Exemple : World vs 6 actions', exact:true}).click()
  // AllocationEditor is lazy: wait for the six rendered rows before counting.
  await page.locator('.pd-editor-side').nth(1).locator('.pd-editor-line').nth(5).waitFor()
  assert.equal(await page.locator('.pd-editor-side').nth(0).locator('.pd-editor-line').count(),1)
  assert.equal(await page.locator('.pd-editor-side').nth(1).locator('.pd-editor-line').count(),6)
  assert(await page.getByRole('button',{name:'Ajouter un actif à B',exact:true}).isDisabled())
  assert.match(await page.locator('#pd-tweet').inputValue(), /portefeuille de 6 actions/)
  await page.getByRole('button',{name:'Retirer actif 6 du portefeuille B',exact:true}).click()
  await page.getByRole('button',{name:'Répartir à parts égales sur B',exact:true}).click()
  assert.match(await page.locator('#pd-tweet').inputValue(), /portefeuille de 5 actions/)
  const [manualDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', {name:/Télécharger l’image PNG/i}).click()])
  assert.match(manualDownload.suggestedFilename(), /duel/)
  await page.reload()
  await page.getByRole('group', {name: 'Actif 5 du portefeuille B', exact:true}).waitFor()
  assert.equal(await page.locator('.pd-editor-side').nth(1).locator('.pd-editor-line').count(),5)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  console.log(`${CATALOG.length} supports, ${DUELS.length} duels, 1–6 actifs par côté : fond papier text-free et format carré effectivement dessinés, poids, dates communes, capitaux, performances, pertes, égalités, grands montants, textes sans chevauchement et téléchargement/reprise vérifiés dans Chromium.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
