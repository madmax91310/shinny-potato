import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { ETFS } from '../src/data/etf-cards.js'

// Exercise the production build without depending on a listening TCP server.
const root = resolve('dist'), base = 'https://asset-picker.test/shinny-potato/'
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}
const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {})})
try {
 await mkdir('test-artifacts/asset-picker', {recursive:true})
 for (const width of [390,1440]) {
  const context = await browser.newContext({viewport:{width,height:950}})
  await context.route('**/*', async route => {
   const url = route.request().url()
   if (!url.startsWith(base)) return route.abort()
   const path = decodeURIComponent(new URL(url).pathname).slice('/shinny-potato/'.length)
   const file = resolve(root, path || 'index.html')
   if (!file.startsWith(root+'/')) return route.abort()
   try { await route.fulfill({body:await readFile(file),contentType:mime[extname(file)]||'application/octet-stream'}) }
   catch { if (!extname(path)) await route.fulfill({body:await readFile(resolve(root,'index.html')),contentType:'text/html'}); else await route.fulfill({status:404,body:''}) }
  })
  const page = await context.newPage(), errors=[]
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(base+'fiches-etf')
  const picker=page.locator('.asset-picker').first(), world=ETFS.find(e=>e.isin==='FR001400U5Q4')
  await picker.getByRole('searchbox').fill('FR001400U5Q4')
  await picker.locator(`[data-option][data-value="${world.id}"]`).click()
  await picker.getByRole('button',{name:'☆ Ajouter aux favoris',exact:true}).click()
  await picker.getByRole('button',{name:'Parcourir',exact:true}).click()
  assert.equal(await picker.getByRole('searchbox').count(),0)
  await picker.getByRole('button',{name:'Europe',exact:true}).click()
  await picker.getByRole('button',{name:'Éligibles PEA',exact:true}).click()
  assert(await picker.locator('[data-option]').count()>0)
  const selected=await picker.locator('[data-selector]').getAttribute('data-value')
  await picker.getByRole('button',{name:'Rechercher',exact:true}).click()
  await picker.getByRole('searchbox').fill('introuvable-xyz')
  assert((await picker.locator('.asset-picker-results').innerText()).includes('Aucun résultat'))
  assert.equal(await picker.locator('[data-selector]').getAttribute('data-value'),selected)
  await page.screenshot({path:`test-artifacts/asset-picker/search-${width}.png`})
  await page.goto(base+'le-dca-de')
  const add=page.locator('.dca-simple .asset-picker')
  await add.getByRole('group',{name:'Favoris : Ajouter un actif',exact:true}).getByRole('button').click()
  assert((await page.locator('.dca-simple-line').first().innerText()).includes('FR001400U5Q4'))
  await add.getByRole('searchbox').fill('Apple')
  await add.locator('[data-option]').first().click()
  assert.equal(await page.locator('.dca-simple-line').count(),2)
  await add.getByRole('button',{name:'Parcourir',exact:true}).click()
  await add.getByRole('button',{name:'Europe',exact:true}).click()
  await add.getByRole('button',{name:'Éligibles PEA',exact:true}).click()
  assert(await add.locator('[data-option]').count()>0)
  await page.screenshot({path:`test-artifacts/asset-picker/browse-${width}.png`,fullPage:true})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.reload()
  await page.locator('.dca-simple-line').nth(1).waitFor()
  assert.equal(await page.locator('.dca-simple-line').count(),2)
  while(await page.locator('.dca-simple-line').count()) await page.getByRole('button',{name:/^Retirer /}).first().click()
  await page.locator('.dca-simple .asset-picker summary').filter({hasText:'Derniers actifs utilisés'}).click()
  assert(await page.getByRole('group',{name:'Récents : Ajouter un actif',exact:true}).getByRole('button').count()>=2)
  await page.goto(base+'fiches-etf')
  await picker.getByRole('group',{name:'Favoris : Choisir un ETF',exact:true}).getByRole('button').click()
  await picker.getByRole('button',{name:'★ Retirer des favoris',exact:true}).click()
  await page.goto(base+'le-dca-de')
  assert.equal(await add.getByRole('group',{name:'Favoris : Ajouter un actif',exact:true}).count(),0)
  assert.deepEqual(errors,[])
  await context.close()
 }
 console.log('Asset selection: search, browse, PEA, shared favorites/removal, recents, reload and desktop/mobile layout passed.')
} finally { await browser.close() }
