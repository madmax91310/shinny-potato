import assert from 'node:assert/strict'
import { staticBrowser, staticBase as base } from './static-browser.mjs'
const prefix='epargnant-publication:v1:'
const legacy='favorites:/shinny-potato/calculateur-investissement:Choisir un actif'
const records={
 'epargnant-libre:home-view':'{broken',
 'epargnant-libre:home-favorites':'{"wrong":"shape"}',
 [prefix+'simple-exposure-draft']:'{broken',
 [prefix+'investment-settings']:'{"assetId":"unavailable"}',
 [prefix+'comparison-subject']:'{broken',
 [prefix+'performance-currency']:'"invalid"',
 [prefix+'asset-picker:favorites']:'{broken',
 [prefix+'asset-picker:recents']:'{"wrong":"shape"}',
 [prefix+legacy]:'["apple"]',
}
for(const width of [1440,390]){
 const {browser,page}=await staticBrowser(width),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 try{
  await page.goto(base)
  await page.evaluate(records=>{for(const [key,raw]of Object.entries(records))localStorage.setItem(key,raw)},records)
  for(const [path,ready]of [['','.workspace-home'],['le-dca-de','.dca-simple'],['calculateur-investissement?asset=apple','.ic-select-wrap .asset-picker'],['comparatif-etf','.tool-preview']]){
   await page.goto(base+path);await page.locator(ready).first().waitFor({state:'attached'})
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
   assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(records)),records,path+' preserves every unreadable record')
  }
  await page.goto(base+'calculateur-investissement?asset=apple')
  const picker=page.locator('.ic-select-wrap .asset-picker').first()
  await picker.getByRole('button',{name:'☆ Ajouter aux favoris',exact:true}).click()
  await picker.getByRole('searchbox').fill('Microsoft')
  await picker.locator('[data-option][data-value="microsoft"]').click()
  await page.waitForFunction(()=>document.querySelector('.ic-select-wrap [data-selector]')?.getAttribute('data-value')==='microsoft')
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),prefix+'asset-picker:migrated:'+legacy),null,'failed favorite import is never acknowledged')
  assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(records)),records)
  await page.goto(base+'le-dca-de')
  await page.getByRole('alert').filter({hasText:'Le brouillon ne peut pas être enregistré'}).waitFor()
  const add=page.locator('.dca-simple .asset-picker').first()
  await add.getByRole('searchbox').fill('FR001400U5Q4');await add.locator('[data-option]').first().click()
  assert.equal(await page.locator('.dca-simple-line input').first().inputValue(),'100')
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),prefix+'simple-exposure-draft'),'{broken')
  await page.goto(base)
  await page.evaluate(()=>localStorage.setItem('epargnant-libre:home-favorites',JSON.stringify(['/radar-editorial','/older-route'])))
  await page.reload();await page.getByRole('heading',{name:'Mes outils',exact:true}).waitFor()
  await page.locator('[data-favorite-path="/le-dca-de"]').first().click()
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('epargnant-libre:home-favorites')).includes('/le-dca-de'))
  assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('epargnant-libre:home-favorites')))).includes('/older-route'))
  // A committed favorite must survive an immediate reload, without waiting on storage.
  const favorite=page.getByRole('button',{name:'Favori : Impact des frais',exact:true})
  for(let attempt=0;attempt<6;attempt++){
   const active=await favorite.getAttribute('aria-pressed')==='true'
   await favorite.click()
   assert.equal(await page.locator('.home-favorites a[href$="/impact-frais"]').count(),active?0:1)
   await page.reload({waitUntil:'networkidle'})
   assert.equal(await favorite.getAttribute('aria-pressed'),String(!active))
  }
  assert.deepEqual(errors,[])
  console.log(`Preference integrity ${width}px: Home, exposure draft, calculator, comparison, favorites/recents and interrupted migration preserve raw data; selection and unknown Home favorites retained.`)
 }finally{await browser.close()}
}
