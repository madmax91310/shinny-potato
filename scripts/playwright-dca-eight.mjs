import assert from 'node:assert/strict'
import {mkdir,readFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile,references} from '../src/pages/dca-profiles/engine.js'
import {equalWeights} from '../src/pages/dca-profiles/allocation-actions.js'
import {exportPortfolio} from '../src/pages/dca-profiles/portable-portfolios.js'
const base=process.env.DCA_EIGHT_BASE_URL||staticBase
const output=process.env.DCA_EIGHT_ARTIFACTS||'test-artifacts/dca-eight'
async function openBrowser(width){
 if(!process.env.DCA_EIGHT_BASE_URL)return staticBrowser(width)
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
 const context=await browser.newContext({viewport:{width,height:950}})
 return {browser,page:await context.newPage()}
}
const assets=['world','europe','emerging','sp500','gold','btc','small','nasdaq','eth']
const profile={...prepareProfile(PROFILES[0]),mode:'participant',approved:true,lines:assets.slice(0,8).map((asset,i)=>({asset,label:references[asset]?.name||asset,isin:references[asset]?.isin||'',weight:[10,30,20,15,8,7,6,4][i],amount:[100,0,500,400,300,200,150,50][i]}))}
const legacy={...profile,lines:equalWeights([...profile.lines,{asset:'eth',label:'Ethereum',isin:references.eth.isin,weight:0,amount:9876.54}])}
const draft='Mon texte personnalisé exact\n\n🟡 À conserver.'
const record={id:'legacy-nine',title:'Neuf positions historiques',profile:legacy,draft,field:'all'}
await mkdir(output,{recursive:true})
for(const width of [1440,390]){
 const {browser,page}=await openBrowser(width),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 try{
  await page.goto(base)
  await page.evaluate(({profile,draft,record})=>{
   localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft,field:'all',draftEdited:true}))
   localStorage.setItem('el-dca-portfolios-v2',JSON.stringify({version:2,items:[record]}))
   localStorage.setItem('el-dca-used-v1',JSON.stringify(['julien']))
  },{profile,draft,record})
  await page.goto(base+'le-dca-de?mode=dca')
  const holdings=page.getByRole('region',{name:'Allocation actuelle',exact:true}),flows=page.getByRole('region',{name:'Versements mensuels',exact:true})
  const values=async(region)=>region.locator('input[type=number]').evaluateAll(inputs=>inputs.map(input=>Number(input.value)))
  await holdings.locator('input[type=number]').first().waitFor()
  assert.deepEqual(await values(holdings),[30,20,15,10,8,7,6,4])
  assert.deepEqual(await values(flows),[500,400,300,200,150,100,50,0])
  await page.getByText('8 / 8 positions',{exact:false}).waitFor()
  const options=page.getByRole('group',{name:'Ajouter un actif',exact:true}).locator('[data-option]');assert(await options.count()>0);assert(await options.first().isDisabled());await options.first().evaluate(button=>button.click());assert.equal(await holdings.locator('input[type=number]').count(),8)
  assert(await page.getByText(/Déjà publié · date inconnue/).isVisible())
  await page.getByRole('button',{name:`Retirer ${profile.lines[7].label}`,exact:true}).click()
  await page.getByRole('group',{name:'Ajouter un actif',exact:true}).locator('[data-option][data-value=nasdaq]').click()
  await page.getByRole('spinbutton',{name:'DCA position 8',exact:true}).fill('50')
  await page.getByRole('spinbutton',{name:'DCA position 8',exact:true}).press('Enter')
  assert.equal(await holdings.locator('input[type=number]').count(),8)
  // Replacing an asset removes the focused picker: commit its order explicitly.
  for(const asset of ['silver','world']){
   await page.getByRole('button',{name:'Changer l’actif position 1',exact:true}).click()
   await page.getByRole('searchbox',{name:'Rechercher : Remplacer l’actif position 1',exact:true}).fill(references[asset].isin)
   await page.getByRole('group',{name:'Remplacer l’actif position 1',exact:true}).locator(`[data-option][data-value="${asset}"]`).click()
   assert.deepEqual(await values(holdings),[30,20,15,10,8,7,6,4])
   assert.equal(await page.getByRole('spinbutton',{name:'DCA position 1',exact:true}).inputValue(),'100')
  }
  const first=holdings.locator('input').first(),weight=page.getByRole('spinbutton',{name:'Poids position 1',exact:true})
  await weight.fill('35')
  assert.equal(await first.inputValue(),'30','No jump during typing')
  assert(await weight.evaluate(input=>document.activeElement===input))
  await page.getByRole('spinbutton',{name:'Poids position 2',exact:true}).focus()
  assert.equal(await first.inputValue(),'30','No jump inside the group')
  await page.getByLabel('Pseudonyme',{exact:true}).focus()
  assert.equal(await first.inputValue(),'35','Sort on group exit')
  await weight.fill('10');await weight.press('Enter')
  await holdings.locator('input[type=number]').first().waitFor()
  assert.deepEqual(await values(holdings),[30,20,15,10,8,7,6,4])
  const amount=page.getByRole('spinbutton',{name:'DCA position 2',exact:true})
  await amount.fill('600')
  assert.equal((await values(flows))[0],500)
  await amount.press('Enter')
  assert.equal((await values(flows))[0],600)
  await amount.fill('0');await amount.press('Enter')
  const tied=page.getByRole('spinbutton',{name:'DCA position 1',exact:true})
  await tied.fill('500');await tied.press('Enter')
  assert.deepEqual(await flows.locator('input').evaluateAll(inputs=>inputs.slice(0,2).map(input=>input.getAttribute('aria-label'))),['DCA position 1','DCA position 3'])
  await tied.fill('100');await tied.press('Enter')
  assert.equal(await page.locator('#dca-draft').inputValue(),draft)
  await page.context().grantPermissions(['clipboard-read','clipboard-write'])
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),draft)
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('el-dca-used-v1'))),['julien'],'Copy does not mark published')
  const preview=page.locator('.dca-publication-column img')
  await preview.waitFor();await preview.evaluate(img=>img.decode())
  const previewBytes=await preview.evaluate(async img=>Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())))
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  const download=await pending,path=`${output}/download-${width}.png`;await download.saveAs(path)
  assert.deepEqual(await readFile(path),Buffer.from(previewBytes),'Downloaded PNG exactly matches preview')
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('el-dca-used-v1'))),['julien'],'Download does not mark published')
  await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
  await page.getByRole('button',{name:'Ouvrir Neuf positions historiques',exact:true}).click()
  assert.equal(await holdings.locator('input[type=number]').count(),9)
  assert(await page.getByRole('alert').filter({hasText:'Publication bloquée'}).isVisible())
  assert(await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).isDisabled())
  assert(await page.getByRole('button',{name:'Copier le texte',exact:true}).isDisabled())
  await page.getByRole('button',{name:'Exporter ce portefeuille',exact:true}).isEnabled().then(assert)
  await page.reload()
  await holdings.locator('input[type=number]').first().waitFor()
  assert.equal(await holdings.locator('input[type=number]').count(),9,'Oversized automatic draft is fully restored')
  assert.equal(await page.locator('#dca-draft').inputValue(),draft)
  await page.getByText('Mes portefeuilles',{exact:true}).filter({visible:true}).click()
  await page.getByLabel('Importer un portefeuille JSON',{exact:true}).filter({visible:true}).setInputFiles({name:'ancien.json',mimeType:'application/json',buffer:Buffer.from(exportPortfolio(record))})
  await page.getByRole('button',{name:'Ouvrir le fichier importé',exact:true}).click()
  assert.equal(await holdings.locator('input[type=number]').count(),9)
  assert.equal(await page.locator('#dca-draft').inputValue(),draft)
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('el-dca-draft-v1')))
  assert.deepEqual(restored.profile.lines,legacy.lines)
  assert.equal(restored.profile.approved,false)
  await page.getByRole('button',{name:'Retirer Ethereum',exact:true}).click()
  await page.getByRole('button',{name:'Répartir à parts égales',exact:true}).filter({visible:true}).click()
  await preview.waitFor()
  assert.deepEqual(await values(holdings),Array(8).fill(12.5))
  await page.reload();await preview.waitFor()
  assert.deepEqual(await values(flows),[500,400,300,200,150,100,50,0])
  assert.equal(await page.locator('#dca-draft').inputValue(),draft)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.screenshot({path:`${output}/editor-${width}.png`,fullPage:true})
  // Exposure workspace keeps its own 50-position capacity after the shared engine change.
  await page.getByRole('button',{name:'Analyser une allocation',exact:true}).click()
  const fifty={lines:equalWeights(Object.entries(references).slice(0,50).map(([asset,r])=>({asset,label:r.name,isin:r.isin,weight:0,amount:0}))),field:'all',exposureLimit:4}
  await page.evaluate(fifty=>localStorage.setItem('epargnant-publication:v1:simple-exposure-draft',JSON.stringify(fifty)),fifty)
  await page.reload()
  await page.getByText('50 / 50 positions',{exact:false}).waitFor()
  await page.locator('.dca-simple-preview img').filter({visible:true}).waitFor()
  assert.deepEqual(errors,[])
  console.log(`DCA ${width}px: 8 positions, stable independent editing orders/focus, legacy nine-line saves/imports/draft without loss, exact downloaded PNG, local publication history, exposure fifty-line regression OK.`)
 }finally{await browser.close()}
}
