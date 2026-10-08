import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { computeBrut, purchasingPowerStory, buildTweetText } from '../src/pages/purchasing-power/lib.js'
import { POSTES } from '../src/data/purchasing-power.js'

const d = purchasingPowerStory({ mode: 'erosion', amount: 1000, startYear: 2025 })
assert.ok(Math.abs(d.endAmount - 1000 / computeBrut(1000, 2025).factor) < 1e-9)
assert.ok(Math.abs(d.equivalentPct - (1 / computeBrut(1000, 2025).factor - 1) * 100) < 1e-9)
assert.notEqual(Math.abs(d.equivalentPct), computeBrut(1000, 2025).inflationCumPct)
assert.equal(POSTES.carburant.label, 'Énergie')
assert.doesNotMatch(buildTweetText({ mode: 'par-poste', posteId: 'carburant', amount: 100, startYear: 2020 }), /à la pompe \?/)
assert.throws(() => purchasingPowerStory({ mode: 'brut', amount: 0, startYear: 2020 }))
assert.throws(() => purchasingPowerStory({ mode: 'brut', amount: 100, startYear: 2026 }))
assert.throws(() => purchasingPowerStory({ mode: 'par-poste', posteId: 'unknown', amount: 100, startYear: 2020 }))
for (const scene of ['courses', 'energie', 'revenu', 'loyer']) await readFile(`public/asset-art/purchasing-power/${scene}.webp`)
const port = 4338, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 200)) }
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage()
  await page.goto(base)
  const result = await page.evaluate(async () => {
    const { renderPurchasingPowerImage, downloadPurchasingPowerImage } = await import('/shinny-potato/src/pages/tweet-midi/purchasingPowerImage.js')
    const { ALL_ITEMS, FORMATS, buildTweetText } = await import('/shinny-potato/src/pages/tweet-midi/lib.js')
    const { purchasingPowerStory, fmtEUR, fmtPct } = await import('/shinny-potato/src/pages/purchasing-power/lib.js')
    const original = CanvasRenderingContext2D.prototype.fillText
    let boxes, labels
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value)
      const box = { text: value, l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, t: y - m.actualBoundingBoxAscent, b: y + m.actualBoundingBoxDescent }
      if (box.l < 0 || box.r > this.canvas.width || box.t < 0 || box.b > this.canvas.height) throw new Error(`Clipped: ${value}`)
      for (const prior of boxes) if (Math.min(box.r, prior.r) - Math.max(box.l, prior.l) > 1 && Math.min(box.b, prior.b) - Math.max(box.t, prior.t) > 1) throw new Error(`Overlap: ${prior.text} / ${value}`)
      boxes.push(box); labels.push(String(value)); return original.call(this, value, x, y, ...rest)
    }
    const samples = [], items = ALL_ITEMS.filter(i => i.format === FORMATS.POUVOIR_ACHAT)
    items.push({ format: FORMATS.POUVOIR_ACHAT, mode: 'brut', amount: 12345678, startYear: 2010 })
    try {
      for (const item of items) {
        boxes = []; labels = []
        const canvas = await renderPurchasingPowerImage(item), story = purchasingPowerStory(item), text = buildTweetText(item)
        if (!labels.includes(fmtEUR(story.endAmount)) || !text.includes(fmtEUR(story.endAmount))) throw new Error('PNG and tweet disagree')
        if (!labels.includes(story.observation)) throw new Error('Observation date missing')
        if (!labels.includes(`${story.period}${story.provisional ? " · provisoire" : ""} · ${fmtPct(story.erosion ? story.equivalentPct : story.pricePct)}`)) throw new Error('Percentage disagrees')
        if (labels.filter(t => /epargnantlibre/.test(t)).length !== 1) throw new Error('Signature missing or duplicated')
        if (labels.some(t => /POUVOIR D’ACHAT,|COMBIEN EN PLUS|Exemple fictif/.test(t))) throw new Error('Old heading or mockup data returned')
        if (canvas.width !== 1200 || canvas.height !== 1500) throw new Error('Wrong export dimensions')
        if (item.amount === 1000 && item.startYear === 2020) samples.push({ name: `${item.mode}-${item.posteId ?? 'general'}`, png: canvas.toDataURL(), labels })
      }
    } finally { CanvasRenderingContext2D.prototype.fillText = original }
    // Exercise the same public download function as the UI; no external artwork fetches.
    await downloadPurchasingPowerImage(items[0])
    return { samples, count: items.length }
  })
  await mkdir('test-artifacts/purchasing-power', { recursive: true })
  for (const sample of result.samples) {
    await writeFile(`test-artifacts/purchasing-power/${sample.name}.png`, Buffer.from(sample.png.split(',')[1], 'base64'))
    await writeFile(`test-artifacts/purchasing-power/${sample.name}.txt`, sample.labels.join('\n'))
  }
  await page.goto(`${base}tweet-midi`)
  await page.getByRole('button', { name: "Pouvoir d'achat", exact: true }).click()
  await page.getByLabel('Hausse de revenu testée (%)').fill('25')
  await page.getByRole('button', { name: /Générer/ }).last().click()
  assert.match(await page.locator('pre').innerText(), /\+25,0 %/)
  await page.getByRole('button', { name: 'Budget inchangé', exact: true }).click()
  await page.getByRole('button', { name: /Générer/ }).last().click()
  await page.getByText('Même budget…', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Par poste', exact: true }).click()
  await page.getByRole('button', { name: /Énergie/, exact: false }).click()
  await page.getByRole('button', { name: /Générer/ }).last().click()
  await page.getByText('pour les prix en général.', { exact: false }).waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Aperçu', exact: true }).click()
  await page.getByRole('tab', { name: 'Image', exact: true }).click()
  await page.getByAltText('Visuel Tweet Midi').waitFor()
  await page.screenshot({ path: 'test-artifacts/purchasing-power/mobile.png', fullPage: true })
  console.log(`${result.count} PNG: dates, montants, inverse inflation, signature, absence de coupure/chevauchement; export et contrôles UI desktop/mobile validés.`)
} finally { await browser?.close(); server.kill('SIGTERM') }
