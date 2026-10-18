import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import GLOBAL from '../src/data/global-equities.json' with {type:'json'}
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:4361/shinny-potato'
const server=process.env.TEST_BASE_URL ? null : spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4361'],{stdio:'ignore'})
const samples=GLOBAL.filter(a=>['rolls-royce','catl','hdfc-bank','roche','netflix'].includes(a.id))
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await mkdir('test-artifacts/global-equities',{recursive:true})
  for(const asset of samples){
    await page.goto(`${base}/le-dca-de?isin=${asset.isin}`,{waitUntil:'networkidle'})
    await page.locator('.dca-simple-preview img').waitFor()
    const exposure=page.getByAltText('Répartition et expositions du portefeuille')
    await exposure.waitFor({state:'visible'})
    assert(await exposure.evaluate(img=>img.naturalWidth>=1000))
    assert(!(await page.locator('body').innerText()).includes('non ventilés'))
    await page.screenshot({path:`test-artifacts/global-equities/exposure-${asset.id}.png`,fullPage:true})
    await page.getByRole('button',{name:'Le DCA de…',exact:true}).click()
    const dca=page.locator('.dca-profiles-scope:visible')
    await dca.getByLabel('Pseudonyme',{exact:true}).waitFor()
    while(await dca.locator('.dca-simple-line').count())await dca.locator('.dca-simple-line > button').first().click()
    await dca.getByRole('searchbox',{name:'Rechercher : Ajouter un actif',exact:true}).fill(asset.isin)
    await dca.locator(`[data-option][data-value="${asset.id}"]`).click()
    await dca.locator('.dca-simple-preview img').evaluate(async img=>img.decode())

    await page.goto(`${base}/generateur-portefeuilles?asset=equity-${asset.id}`,{waitUntil:'networkidle'})
    await page.getByRole('button',{name:'Générer le tweet',exact:true}).click()
    await page.locator('.pg-alloc-list').waitFor()
    assert((await page.locator('body').innerText()).includes(asset.label))
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    await page.locator('.publication-image-stage img').waitFor({state:'visible'})
    await page.screenshot({path:`test-artifacts/global-equities/generator-${asset.id}.png`,fullPage:true})

    await page.goto(`${base}/duels-portefeuilles?asset=equity-${asset.id}`,{waitUntil:'networkidle'})
    assert((await page.locator('#pd-tweet').inputValue()).includes(asset.label))
    assert.equal(await page.locator('.pd-table tbody tr').count()>=3,true)
    const download=page.waitForEvent('download')
    await page.getByRole('button',{name:'🖼️ Télécharger l’image PNG',exact:true}).click()
    assert((await download).suggestedFilename().endsWith('.png'))
  }
  await page.goto(`${base}/classements-performances`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).click()
  const search=page.getByRole('searchbox',{name:'Rechercher dans l’univers',exact:true})
  for(const asset of GLOBAL){
    await search.fill(asset.isin)
    assert.equal(await page.getByRole('checkbox',{name:`Sélectionner ${asset.label}`,exact:true}).count(),1,`${asset.id}: stock with ISIN remains in stock universe`)
  }
  await page.getByRole('group',{name:'Catégorie',exact:true}).locator('[data-option][data-value="india-stocks"]').click()
  const tweet=await page.getByLabel('Texte à publier',{exact:true}).inputValue()
  assert(tweet.includes('HDFC Bank')&&tweet.includes('Infosys')&&!tweet.includes('ces ETF'))
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.locator('.publication-image-stage img').waitFor({state:'visible'})
  await page.setViewportSize({width:390,height:844})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.screenshot({path:'test-artifacts/global-equities/ranking-mobile.png',fullPage:true})
  await page.setViewportSize({width:1440,height:1000})
  await page.goto(`${base}/performance-depuis?isin=CNE100003662`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Euros (EUR)',exact:true}).click()
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  await page.waitForFunction(()=>/CATL/.test(document.querySelector('pre')?.textContent??'')&&/EUR/.test(document.querySelector('pre')?.textContent??''))
  assert.match(await page.locator('pre').innerText(),/conversion BCE/)
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.locator('.publication-image-stage img').waitFor({state:'visible'})
  assert.deepEqual(errors,[])
  console.log('Global equities browser: 50 searchable stocks, 5 exposure/DCA/generator/duel PNGs, Indian ranking, native currencies and mobile verified.')
} finally {await browser?.close();server?.kill()}
