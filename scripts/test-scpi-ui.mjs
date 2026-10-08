import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { SCPI } from '../src/data/scpi.js'
import { buildTweet } from '../src/pages/scpi-presentation/lib.js'
const base = 'http://127.0.0.1:4332/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4332','--strictPort'],{stdio:'ignore'})
let browser
try {
  for(let i=0; ;i++) {
    try { if((await fetch(`${base}/`)).ok) break } catch { /* starting */ }
    assert(i < 100); await new Promise(resolve=>setTimeout(resolve,100))
  }
  browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}: {})
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']})
  const page=await context.newPage()
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto(`${base}/presentation-scpi`,{waitUntil:'networkidle'})
  const chooser=page.getByRole('group',{name:'Choisir une SCPI',exact:true})
  for(const record of SCPI) {
    await chooser.getByRole('button',{name:record.name,exact:true}).click()
    assert.equal(await page.locator('#scpi-draft').inputValue(),buildTweet(record))
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildTweet(record))
    await page.locator('#scpi-draft').fill('Ma retouche personnelle')
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'Ma retouche personnelle')
    await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
    assert.equal(await page.locator('#scpi-draft').inputValue(),buildTweet(record))
  }
  await page.getByText('Toute la répartition',{exact:true}).click()
  assert.equal(await page.locator('details').filter({has:page.getByText('Toute la répartition',{exact:true})}).locator('tbody tr').count(),SCPI.at(-1).snapshot.countries.length+SCPI.at(-1).snapshot.sectors.length)
  await page.getByText('Patrimoine, occupation et prix de part',{exact:true}).click()
  const portfolio=page.locator('details').filter({has:page.getByText('Patrimoine, occupation et prix de part',{exact:true})})
  assert.equal(await portfolio.locator('tbody tr').count(),SCPI.at(-1).priceHistory.years.length)
  assert((await portfolio.innerText()).includes('31/12/2025'))
  assert((await portfolio.innerText()).includes('30/06/2026'))
  await mkdir('test-artifacts/scpi',{recursive:true})
  await page.screenshot({path:'test-artifacts/scpi/desktop.png',fullPage:true})
  for(const width of [320,390]) {
    await page.setViewportSize({width,height:844})
    await page.reload({waitUntil:'networkidle'})
    await page.getByRole('button',{name:'Remake Live',exact:true}).click()
    await page.getByRole('button',{name:'Aperçu',exact:true}).click()
    assert(await page.locator('#scpi-draft').isVisible())
    assert.equal(await page.locator('#scpi-draft').inputValue(),buildTweet(SCPI[1]))
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    await page.getByRole('status').filter({hasText:'Texte copié.'}).waitFor()
  }
  await page.screenshot({path:'test-artifacts/scpi/mobile.png',fullPage:true})
  await page.goto(`${base}/bibliotheque-donnees?type=scpi&q=Remake%20Live`,{waitUntil:'networkidle'})
  await page.getByRole('heading',{name:'Remake Live',exact:true}).waitFor()
  const dataSearch=page.getByRole('searchbox',{name:'ISIN, ticker, nom ou identifiant',exact:true})
  await dataSearch.fill('Iroko Zen')
  await page.getByRole('heading',{name:'Iroko Zen',exact:true}).waitFor()
  assert((await page.locator('.ds-detail').innerText()).includes('Présentation de SCPI'))
  assert.deepEqual(errors,[])
  console.log('SCPI UI: selection, edition, reset, clipboard, full allocation and mobile preview OK.')
} finally { await browser?.close(); server.kill('SIGTERM') }
