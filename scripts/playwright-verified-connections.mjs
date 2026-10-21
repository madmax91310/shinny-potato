import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { ASSETS } from '../src/data/portfolio-assets.js'
import { getPerformanceAssetId } from '../src/data/performance-links.js'
import { getAnnualReturns, getAnnualReturnStartYears } from '../src/pages/tweet-midi/data/performanceHistory.js'
import { ANNUAL_ASSETS } from '../src/pages/performance-rankings/data.js'
import { choose as choosePicker } from './card-selection.mjs'
import { CERTIFIED_INDEX_HISTORIES } from '../src/data/certified-monthly-indices.js'
import { CATALOG } from '../src/data/duel-assets.js'
const port=4376,base=process.env.TEST_BASE_URL??`http://127.0.0.1:${port}/shinny-potato`,out='test-artifacts/verified-connections'
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser,page
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true})
 const errors=[],results=[]
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000)
 await mkdir(out,{recursive:true})
 const choose=async(group,value)=>group.locator(`[data-option][data-value="${value}"]`).click()
 async function png(name,button){const pending=page.waitForEvent('download');await button.click();const file=await pending;await file.saveAs(`${out}/${name}.png`);const data=await readFile(`${out}/${name}.png`);assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(data.length>10000);results.push({name,bytes:data.length});console.log(name,'PNG valid')}
 if(!process.argv.includes('--rankings-only')){
 for(const [id,asset] of Object.entries(CERTIFIED_INDEX_HISTORIES)){
  await page.goto(`${base}/calculateur-investissement?asset=${id}`,{waitUntil:'networkidle'})
  assert.equal(await page.getByRole('group',{name:'Choisir un actif',exact:true}).getAttribute('data-value'),id)
  await choosePicker(page.getByRole('group',{name:'Année de départ',exact:true}),asset.points[0].date.slice(0,4))
  await choosePicker(page.getByRole('group',{name:'Mois de départ',exact:true}),String(Number(asset.points[0].date.slice(5))))
  await choosePicker(page.getByRole('group',{name:'Devise de l’investissement',exact:true}),'EUR')
  await png(`monthly-${id}-lump`,page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
  await page.getByRole('button',{name:'Mensuel (DCA)',exact:true}).click()
  await png(`monthly-${id}-dca`,page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
  await page.goto(`${base}/performance-depuis?asset=${id}`,{waitUntil:'networkidle'})
  assert.equal(await page.locator('#subject-select').getAttribute('data-value'),id)
  const first=getAnnualReturnStartYears(id)[0]
  await choosePicker(page.locator('#secondary-select'),String(first))
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  const text=await page.locator('pre').innerText();assert(text.includes(String(first)));assert.doesNotMatch(text,/undefined|NaN/)
  await png(`monthly-${id}-performance`,page.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/i}))
 }
 for(const isin of ['IE000QDFFK00','LU2903252349']){
  await page.goto(`${base}/performance-depuis?isin=${isin}`,{waitUntil:'networkidle'})
  assert.equal(await page.locator('#subject-select').getAttribute('data-value'),getPerformanceAssetId(isin))
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  const text=await page.locator('pre').innerText();assert.doesNotMatch(text,/undefined|NaN/);assert(text.includes(String(getAnnualReturns(getPerformanceAssetId(isin),getAnnualReturnStartYears(getPerformanceAssetId(isin))[0]).at(-1).year)))
  await png(`performance-${isin}`,page.getByRole('button',{name:/Télécharger.*image|Télécharger.*PNG/i}))
 }
 for(const a of ASSETS.filter(a=>a.annualManual)){
  await page.goto(`${base}/generateur-portefeuilles?asset=${a.id}`,{waitUntil:'networkidle'})
  assert(await page.getByRole('searchbox',{name:'Rechercher : Ajouter un actif',exact:true}).isVisible())
  await page.getByRole('button',{name:'Générer le tweet',exact:true}).click()
  const text=await page.locator('.pg-tweet-body').innerText();assert(text.includes('2025'));assert.doesNotMatch(text,/undefined|NaN/)
  await png(`manual-${a.isin}`,page.getByRole('link',{name:/Télécharger l’image PNG/}))
 }
 for(const a of CATALOG.filter(a=>a.annualManual)){
  await page.goto(`${base}/duels-portefeuilles?asset=${a.id}`,{waitUntil:'networkidle'})
  assert.equal(await page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true}).getAttribute('data-value'),a.id)
  await png(`duel-${a.isin}`,page.getByRole('button',{name:/Télécharger l’image PNG/}))
 }
 await page.goto(`${base}/generateur-portefeuilles`,{waitUntil:'networkidle'})
 await page.getByRole('group',{name:"Choisir un profil d'investisseur",exact:true}).getByRole('button',{name:'Le Pro-Européen',exact:true}).click()
 await page.getByRole('group',{name:'Choisir un niveau de risque cible',exact:true}).getByRole('button',{name:'Équilibré',exact:true}).click()
 let foundFactor=false
 for(let i=0;i<40;i++){
  await page.getByRole('button',{name:/Générer un nouveau portefeuille/i}).click()
  if((await page.locator('.pg-recipe-label').innerText()).includes('Europe et filtre factoriel')){foundFactor=true;break}
 }
 assert(foundFactor,'Qualified European factor recipe must be reachable in the built application')
 assert.doesNotMatch(await page.locator('.pg-tweet-body').innerText(),/undefined|NaN/)
 await png('automatic-europe-factor',page.getByRole('link',{name:/Télécharger l’image PNG/}))
 for(const isin of ['IE00BFMXYX26','IE00BK5BQZ41','IE00BKX55R35']){
  await page.goto(`${base}/le-dca-de?isin=${isin}`,{waitUntil:'networkidle'})
  assert((await page.locator('body').innerText()).includes(isin))
  await png(`exposure-${isin}`,page.getByRole('button',{name:'Télécharger le PNG',exact:true}))
 }
 }
 await page.goto(`${base}/classements-performances`,{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).click()
 await page.getByRole('button',{name:'Un par un',exact:true}).click()
 await page.getByRole('button',{name:'Nouvelle sélection',exact:true}).click()
 const monthlySearch=page.getByRole('searchbox',{name:'Rechercher : Actif du classement',exact:true})
 for(const [id,query] of [['aerospace-paris-eur','Aerospace'],['etfIE00B4L5Y983','IE00B4L5Y983']]){
  await monthlySearch.fill(query);await choose(page.getByRole('group',{name:'Actif du classement',exact:true}),id)
 }
 await page.getByRole('button',{name:'Une année',exact:true}).click()
 await choose(page.getByRole('group',{name:'Année',exact:true}),'2025')
 await png('aerospace-monthly-comparison',page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await page.getByRole('button',{name:'Classement annuel',exact:true}).click()
 assert(await page.getByRole('button',{name:'Télécharger l’image',exact:true}).isDisabled(),'One complete Paris year cannot satisfy the current annual-ranking minimum')
 await page.getByRole('button',{name:'Présentation actuelle',exact:true}).click()
 await choose(page.getByRole('group',{name:'Historique disponible',exact:true}),'annual')
 const search=page.getByRole('searchbox',{name:'Rechercher : Actif du classement',exact:true})
 for(const [id,query] of [['annual-IE00BDFBTQ78','IE00BDFBTQ78'],['annual-IE00B4L5Y983','IE00B4L5Y983']]){
  await search.fill(query);await choose(page.getByRole('group',{name:'Actif du classement',exact:true}),id)
 }
 const navYears=Object.keys(ANNUAL_ASSETS['annual-IE00BDFBTQ78'].years).map(Number).filter(year=>Number.isFinite(ANNUAL_ASSETS['annual-IE00B4L5Y983'].years[year])).sort((a,b)=>a-b)
 await page.getByRole('button',{name:'Année par année',exact:true}).click()
 await choose(page.getByRole('group',{name:'Première année',exact:true}),String(navYears.at(-2)))
 await choose(page.getByRole('group',{name:'Dernière année',exact:true}),String(navYears.at(-1)))
 await page.getByRole('button',{name:'Classement annuel',exact:true}).click()
 await png('mining-nav-annual-ranking',page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await page.getByRole('button',{name:'Présentation actuelle',exact:true}).click()
 await page.getByRole('button',{name:'Nouvelle sélection',exact:true}).click()
 for(const [id,query] of [['annual-index-msci-world-growth','MSCI World Growth'],['annual-index-msci-world-materials','MSCI World Materials']]){
  await search.fill(query);await choose(page.getByRole('group',{name:'Actif du classement',exact:true}),id)
 }
 const commonYears=Object.keys(ANNUAL_ASSETS['annual-index-msci-world-growth'].years).map(Number).filter(year=>Number.isFinite(ANNUAL_ASSETS['annual-index-msci-world-materials'].years[year]))
 await page.getByRole('button',{name:'Année par année',exact:true}).click()
 await choose(page.getByRole('group',{name:'Première année',exact:true}),String(commonYears.sort((a,b)=>a-b).at(-2)))
 await choose(page.getByRole('group',{name:'Dernière année',exact:true}),String(commonYears.at(-1)))
 await png('indices-comparison',page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await page.getByRole('button',{name:'Classement annuel',exact:true}).click()
 await png('indices-annual-ranking',page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await page.screenshot({path:`${out}/indices-annual-ranking-page.png`,fullPage:true})
 assert.deepEqual(errors,[])
 await writeFile(`${out}/results.json`,JSON.stringify({results,errors},null,2))
 console.log(`${results.length} actual PNG downloads, selectors, text, images and no browser errors verified.`)
}catch(error){if(page){await page.screenshot({path:`${out}/failure.png`,fullPage:true});await writeFile(`${out}/failure.txt`,await page.locator('body').innerText())}throw error}finally{await browser?.close();server?.kill()}
