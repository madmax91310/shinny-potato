import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium, devices } from 'playwright'
import { expect } from 'playwright/test'
import { choose } from './card-selection.mjs'
import { waitPreview } from './wait-preview.mjs'

// Exercise the built route, not Vite's development module cache. No image code
// may be fetched after the text/history are ready (offline or an old open tab).
const base = process.env.PERFORMANCE_PUBLIC_BASE ?? 'http://127.0.0.1:4387/shinny-potato'
const server = process.env.PERFORMANCE_PUBLIC_BASE ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4387', '--strictPort'], { stdio: 'ignore' })
const output = 'test-artifacts/performance-export'
await mkdir(output, { recursive: true })
let browser
try {
  if (server) await waitPreview(server, base)
  browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})})
  for (const mobile of [false, true]) {
    const context = await browser.newContext(mobile ? {...devices['Pixel 7']} : {viewport:{width:1440,height:1000}})
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const asset of ['msciWorld', 'bitcoin', 'annual-FR0013412004']) {
      await context.setOffline(false)
      await page.goto(`${base}/performance-depuis?asset=${asset}`, {waitUntil:'networkidle'})
      const download = page.getByRole('button', {name:'Télécharger l’image PNG',exact:true})
      await expect(download).toBeEnabled()
      if (mobile) await page.getByRole('button',{name:'Aperçu',exact:true}).click()
      await expect(page.getByRole('heading',{name:'Aperçu du tweet',exact:true})).toBeVisible()
      await context.setOffline(true)
      // Download directly first: it must work even if Image was never opened.
      const pngEvent = page.waitForEvent('download')
      await download.click()
      const png = await pngEvent
      assert.equal(await png.failure(), null)
      const bytes = await readFile(await png.path())
      assert.equal(bytes.subarray(1,4).toString(), 'PNG')
      assert(bytes.length > 10000, 'A real image must be encoded')
      await page.getByRole('tab',{name:'Image',exact:true}).click()
      const image = page.getByAltText('Visuel Performance depuis', {exact:true})
      await expect(image).toBeVisible()
      const preview = await image.evaluate(img => ({src:img.src, width:img.naturalWidth, height:img.naturalHeight}))
      assert.equal(preview.width, 1600)
      assert(preview.height >= 1280)
      assert.deepEqual(bytes, Buffer.from(preview.src.split(',')[1], 'base64'), 'Preview and direct download must be identical')
      const previewEvent = page.waitForEvent('download')
      await page.getByRole('button',{name:'Télécharger cet aperçu',exact:true}).click()
      const previewDownload = await previewEvent
      assert.equal(await previewDownload.failure(), null)
      assert.deepEqual(await readFile(await previewDownload.path()), bytes)
      await png.saveAs(`${output}/${mobile?'mobile':'desktop'}-${asset}.png`)
      await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}-${asset}-page.png`,fullPage:true})
      console.log(`Offline simple preview + both downloads: ${mobile?'mobile':'desktop'} ${asset}`)
    }
    // Exact long share names need more than two lines in the narrow comparison panels.
    for (const currency of ['Devise d’origine', 'Euros (EUR)', 'Dollars (USD)']) {
      await context.setOffline(false)
      await page.goto(`${base}/performance-depuis?asset=annual-FR0013412004`, {waitUntil:'networkidle'})
      await page.getByRole('button',{name:'Comparatif (2 actifs)',exact:true}).click()
      await choose(page.locator('#subject-select-b'),'annual-LU2196470426')
      await choose(page.locator('#secondary-select'),'2025')
      await page.getByRole('button',{name:currency,exact:true}).click()
      await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
      if (mobile) await page.getByRole('button',{name:'Aperçu',exact:true}).click()
      await context.setOffline(true)
      const pending=page.waitForEvent('download')
      await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
      const file=await pending, bytes=await readFile(await file.path())
      assert.equal(await file.failure(),null)
      assert.equal(bytes.subarray(1,4).toString(),'PNG')
      await page.getByRole('tab',{name:'Image',exact:true}).click()
      const preview=page.getByAltText('Visuel Performance depuis',{exact:true})
      await expect(preview).toBeVisible()
      assert.deepEqual(bytes,Buffer.from((await preview.getAttribute('src')).split(',')[1],'base64'))
      await file.saveAs(`${output}/${mobile?'mobile':'desktop'}-long-comparison-${currency.slice(0,3)}.png`)
      console.log(`Offline long comparison preview/download: ${mobile?'mobile':'desktop'} ${currency}`)
    }
    assert.deepEqual(errors, [])
    await context.close()
  }
} finally {
  await browser?.close()
  server?.kill()
}
