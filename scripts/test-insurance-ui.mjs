import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { INSURANCE } from '../src/data/insurance.js'
import { buildTweet } from '../src/pages/insurance-presentation/lib.js'
const base = 'http://127.0.0.1:4333/shinny-potato'
const server = spawn('node', ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4333','--strictPort'],{stdio:'ignore'})
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
  await page.goto(`${base}/presentation-assurance-vie`,{waitUntil:'networkidle'})
  const chooser=page.getByRole('group',{name:'Choisir une assurance-vie',exact:true})
  for(const record of INSURANCE) {
    await chooser.getByRole('button',{name:record.name,exact:true}).click()
    assert.equal(await page.locator('#insurance-draft').inputValue(),buildTweet(record))
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildTweet(record))
    await page.locator('#insurance-draft').fill('Ma retouche personnelle')
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'Ma retouche personnelle')
    await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
    assert.equal(await page.locator('#insurance-draft').inputValue(),buildTweet(record))
  }
  await page.getByText('Les fonds euros et leurs conditions',{exact:true}).click()
  assert.equal(await page.locator('.insurance-return-history tbody tr').count(),INSURANCE.at(-1).euroFunds.reduce((sum,fund)=>sum+fund.years.length,0))
  await page.getByText('Barème de rendement 2025',{exact:true}).click()
  assert.equal(await page.locator('.insurance-rate-tiers[open] tbody tr').count(),6)
  assert((await page.locator('.insurance-rate-tiers[open]').innerText()).includes('250 000'))
  await mkdir('test-artifacts/insurance',{recursive:true})
  await page.screenshot({path:'test-artifacts/insurance/desktop.png',fullPage:true})
  for(const width of [320,390]) {
    await page.setViewportSize({width,height:844})
    await page.reload({waitUntil:'networkidle'})
    await page.getByRole('button',{name:'Linxea Avenir 2',exact:true}).click()
    await page.getByRole('button',{name:'Placement-direct Vie',exact:true}).click()
    await page.getByText('Les fonds euros et leurs conditions',{exact:true}).click()
    await page.getByText('Barème de rendement 2025',{exact:true}).click()
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:`test-artifacts/insurance/barème-${width}.png`,fullPage:true})
    await page.getByRole('button',{name:'Linxea Avenir 2',exact:true}).click()
    await page.getByRole('button',{name:'Aperçu',exact:true}).click()
    assert(await page.locator('#insurance-draft').isVisible())
    assert.equal(await page.locator('#insurance-draft').inputValue(),buildTweet(INSURANCE.find(row => row.id === 'linxea-avenir-2')))
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    await page.getByRole('status').filter({hasText:'Texte copié.'}).waitFor()
  }
  await page.screenshot({path:'test-artifacts/insurance/mobile.png',fullPage:true})
  await page.goto(`${base}/bibliotheque-donnees?type=insurance&q=Linxea%20Avenir%202`,{waitUntil:'networkidle'})
  await page.getByRole('heading',{name:'Linxea Avenir 2',exact:true}).waitFor()
  const dataSearch=page.getByRole('searchbox',{name:'ISIN, ticker, nom ou identifiant',exact:true})
  await dataSearch.fill('Linxea Spirit 2')
  await page.getByRole('heading',{name:'Linxea Spirit 2',exact:true}).waitFor()
  assert((await page.locator('.ds-detail').innerText()).includes('Présentation d’assurance-vie'))
  assert.deepEqual(errors,[])
  console.log('INSURANCE UI: selection, edition, reset, clipboard, full allocation and mobile preview OK.')
} finally { await browser?.close(); server.kill('SIGTERM') }
