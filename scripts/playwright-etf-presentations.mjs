import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { ETFS } from '../src/data/etf-cards.js'
import { buildText } from '../src/pages/etf-sheets/lib.js'
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js'
const base=process.env.ETF_REVIEW_URL ?? 'http://localhost:4173/shinny-potato'
const artifacts=process.env.ETF_REVIEW_ARTIFACTS ?? '/tmp/etf-presentation-browser'
await mkdir(artifacts,{recursive:true})
const browser=await chromium.launch({headless:true})
const errors=[],results=[],exports=[]
const representatives=['blockchain','msci-world','msci-em','oblig_eur_long_ishares','quality','world-energy','lifestrategy60','etc-brent-crude-oil','support-lqq','covered-call']
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true})
 const page=await context.newPage()
 page.on('pageerror',error=>errors.push(error.message))
 await page.addInitScript(()=>{
  window.__canvasText=[]
  const original=CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.__canvasText.push(String(value));return original.call(this,value,...args)}
 })
 await page.goto(base+'/fiches-etf?isin='+ETFS[0].isin)
 const search=page.getByRole('searchbox',{name:'Rechercher : Choisir un ETF'})
 for(const etf of ETFS) {
  await search.fill(etf.isin)
  await page.locator(`[data-asset-id="${etf.id}"]`).click()
  await page.waitForFunction(isin=>document.querySelector('.es-card .es-facts')?.textContent.includes(isin),etf.isin)
  const copy=getPresentationCopy(etf),card=page.locator('.es-card')
  const content=await card.innerText()
  assert(content.includes(copy.whatIs),etf.id+': composition réellement affichée')
  assert(content.includes(copy.whatToKnow),etf.id+': vigilance affichée')
  assert(content.includes('Pas un conseil financier.'),etf.id)
  if(copy.positions)assert(content.includes(copy.positions),etf.id)
  assert(content.includes(copy.aum),etf.id)
  await page.getByRole('button',{name:/Copier le texte|Copié !/}).click()
  const copied=await page.evaluate(()=>navigator.clipboard.readText())
  assert.equal(copied,buildText(etf),etf.id+': copie égale au moteur')
  results.push({id:etf.id,isin:etf.isin,display:true,copy:true})
  if(results.length%50===0)console.log(`${results.length} fiches OK`)
  if(representatives.includes(etf.id)) {
   await page.evaluate(()=>{window.__canvasText=[]})
   const pending=page.waitForEvent('download')
   await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()
   const download=await pending
   await download.saveAs(artifacts+'/'+download.suggestedFilename())
   const drawn=await page.evaluate(()=>window.__canvasText.join('\n'))
   assert(drawn.includes(etf.isin),etf.id+': identité PNG')
   if(/^(Part|Fonds)\s*:/.test(copy.aum))assert(drawn.includes(copy.aum.startsWith('Part')?'Encours de la part':'Encours du fonds'),etf.id+': périmètre PNG')
   exports.push({id:etf.id,png:true})
   if(etf.id==='blockchain') await card.screenshot({path:artifacts+'/blockchain-desktop.png'})
  }
 }
 // Parcours mobile : sélection réelle, presse-papiers et téléchargement pour chaque famille.
 await page.setViewportSize({width:390,height:844})
 for(const id of representatives) {
  const etf=ETFS.find(e=>e.id===id)
  await page.getByRole('button',{name:'Réglages',exact:true}).click()
  await search.fill(etf.isin);await page.locator(`[data-asset-id="${id}"]`).click()
  await page.waitForFunction(isin=>document.querySelector('.es-card .es-facts')?.textContent.includes(isin),etf.isin)
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  assert(await page.locator('.es-card').isVisible(),id+': aperçu mobile visible')
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)
  assert(!overflow,id+': débordement horizontal mobile')
  await page.getByRole('button',{name:/Copier le texte|Copié !/}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildText(etf))
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click();const download=await pending
  assert.equal(await download.failure(),null)
  exports.push({id,mobile:true,png:true})
  if(id==='blockchain')await page.locator('.es-card').screenshot({path:artifacts+'/blockchain-mobile.png'})
 }
 assert.deepEqual(errors,[])
 await writeFile(artifacts+'/results.json',JSON.stringify({checkedAt:new Date().toISOString(),desktop:{width:1440,height:1000},mobile:{width:390,height:844},results,exports,errors},null,2)+'\n')
 console.log(`${results.length} fiches affichées et copiées ; ${exports.length} exports PNG ordinateur/mobile ; aucune erreur navigateur.`)
} finally {await browser.close()}
