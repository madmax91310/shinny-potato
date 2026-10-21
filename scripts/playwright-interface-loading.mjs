import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
import {staticBrowser,staticBase as base} from './static-browser.mjs'
import {ASSETS} from '../src/data/market-history.js'
import {choose} from './card-selection.mjs'
for(const width of [390,1440]){
 const {browser,page,context}=await staticBrowser(width),errors=[],requests=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()))
 try{
  await page.goto(base+'duels-portefeuilles');await page.getByRole('button',{name:'Composer A et B',exact:true}).click()
  const left=page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true})
  await choose(left,'equity-apple');assert.equal(await left.getAttribute('data-value'),'equity-apple')
  assert.equal(await page.locator('.pd-editor-side').first().getByRole('searchbox').count(),0) // mounted, folded panel
  assert(await page.locator('.pd-editor-side').first().getByRole('button',{name:'Modifier',exact:true}).first().isVisible())
  await page.goto(base+'le-dca-de');const add=page.locator('.dca-simple .asset-picker')
  await add.getByRole('searchbox').fill('FR001400U5Q4');await add.locator('[data-option]').first().click()
  await page.locator('.dca-simple-line input').fill('100');await page.reload();assert.equal(await page.locator('.dca-simple-line input').inputValue(),'100')
  await page.locator('.dca-simple-preview img').waitFor()
  await page.getByRole('button',{name:'Le DCA d’un abonné',exact:true}).click()
  const dca=page.locator('.dca-profiles-scope:visible .asset-picker');await dca.getByRole('searchbox').fill('FR0000120073');await dca.locator('[data-option][data-value="airliquide"]').click();assert((await page.locator('.dca-profiles-scope:visible .dca-simple-line').last().innerText()).includes('FR0000120073'))
  await page.goto(base+'generateur-portefeuilles');await page.getByRole('button',{name:/Composition manuelle/}).click()
  await page.locator('.pg-manual-search').fill('World');await page.locator('.pg-manual-available [data-option]').first().click()
  assert(await page.locator('.pg-manual-selection-row').count()>0)
  await page.goto(base+'generateur-portefeuilles?asset=msci_world_ishares')
  assert.equal(await page.locator('.pg-manual-pct-input').inputValue(),'100')
  await page.goto(base+'duels-portefeuilles?asset=equity-apple')
  await page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true}).waitFor()
  assert.equal(await page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true}).getAttribute('data-value'),'equity-apple')
  await page.goto(base+'le-dca-de?isin=FR001400U5Q4')
  assert.equal(await page.locator('.dca-simple-line input').inputValue(),'100')
  requests.length=0
  await page.goto(base+'performance-depuis?isin=LU1681043599');await page.locator('#subject-select').waitFor()
  assert.equal(requests.filter(r=>r.includes('/data/history/')).length,0)
  if(width<1024)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByText('Ce que change la date de départ',{exact:true}).first().click()
  await page.getByText(/fenêtres disponibles, recalculées/).first().waitFor()
  assert.equal(requests.filter(r=>r.includes('/data/history/')).length,1)
  requests.length=0
  await page.goto(base+'calculateur-investissement?asset=apple');await page.getByRole('group',{name:'Choisir un actif',exact:true}).waitFor()
  assert.equal(requests.filter(r=>r.includes('/data/history/')).length,1)
  const loaded=await page.evaluate(async url=>(await fetch(url)).json(),requests.find(r=>r.includes('/data/history/')))
  assert.deepEqual(loaded.points,ASSETS.apple.points)
  await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2020')
  if(width<1024)await page.getByRole('button',{name:'Aperçu',exact:true}).click();assert(await page.locator('.ic-card').first().isVisible())
  await page.locator('.ic-video-export').getByRole('button',{name:'Comparatif',exact:true}).click()
  await choose(page.getByRole('group',{name:'Actif vidéo 2',exact:true}),'microsoft')
  await page.locator('#ic-comparison-text').waitFor()
  assert((await page.locator('#ic-comparison-text').inputValue()).includes('Microsoft'))
  let failed=false
  const failOnce=async route=>{if(!failed){failed=true;await route.fulfill({status:503,body:''})}else await route.fallback()}
  await context.route('**/data/history/*.json',failOnce)
  await page.goto(base+'calculateur-investissement?asset=microsoft')
  await page.getByRole('button',{name:'Réessayer',exact:true}).click()
  await page.getByRole('group',{name:'Choisir un actif',exact:true}).waitFor()
  assert(failed)
  await context.unroute('**/data/history/*.json',failOnce)
  requests.length=0
  await page.goto(base+'fiches-etf?isin=FR001400U5Q4');await page.locator('.es-card').waitFor({state:'attached'})
  assert.equal(requests.filter(r=>r.includes('/data/etf-sheets/')).length,1)
  assert((await page.locator('.es-card').textContent()).includes('FR001400U5Q4'))
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  assert.deepEqual(errors,[])
  await mkdir('test-artifacts/interface-loading',{recursive:true});await page.screenshot({path:`test-artifacts/interface-loading/sheet-${width}.png`,fullPage:true})
 }finally{await browser.close()}
}
console.log('Interface/loading: compact selectors, generator, saved exposure, lazy DCA, exact selected history/fiche and annual chart passed on mobile/desktop.')
