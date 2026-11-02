import {CATALOG as DUEL_ASSETS} from '../src/data/duel-assets.js'
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {choose} from './card-selection.mjs'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import IDENTITIES from '../src/data/new-instrument-identities.json' with {type:'json'}
import {ASSETS} from '../src/data/portfolio-assets.js'
import {ANNUAL_ASSETS} from '../src/pages/performance-rankings/data.js'
const base='https://madmax91310.github.io/shinny-potato/',out=process.env.PROOF_DIR??'/dev/shm/automation-20261101/proofs/public-restored-manual-portfolios'
let browser
async function part(page,name){const b=page.locator('.workspace-view-switch').getByRole('button',{name,exact:true});if(await b.isVisible())await b.click()}
async function compactSearch(picker,query){const toggle=picker.getByRole('button',{name:'Modifier',exact:true});if(await toggle.count() && await toggle.getAttribute('aria-expanded')==='false')await toggle.click();await picker.getByRole('searchbox').fill(query)}
async function download(page,button,id){const [file]=await Promise.all([page.waitForEvent('download'),button.click()]);await file.saveAs(out+'/'+id+'.png');const b=await readFile(out+'/'+id+'.png');assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(b.length>10000)}
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,proxy:{server:process.env.HTTPS_PROXY},...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});const errors=[]
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>errors.push(e.message))
  await page.goto(base+'classements-performances',{waitUntil:'networkidle'});await part(page,'Réglages');await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).click();await page.getByRole('button',{name:'Nouvelle sélection',exact:true}).click();await choose(page.getByRole('group',{name:'Historique disponible',exact:true}),'annual')
  const search=page.getByRole('searchbox',{name:'Rechercher : Actif du classement',exact:true})
  for(const identity of IDENTITIES){
   const id='annual-'+identity.isin;assert(ANNUAL_ASSETS[id]);await search.fill(identity.isin);const option=page.locator(`.rk-manual [data-option][data-value="${id}"]`);await option.click();assert((await page.locator('.rk-selected').innerText()).includes(ANNUAL_ASSETS[id].shortLabel));await page.locator('.rk-selected button[aria-label^="Retirer "]').first().click()
  }
  for(const isin of ['IE00B14X4S71','IE00BZ6V7883']){await search.fill(isin);await page.locator(`.rk-manual [data-option][data-value="annual-${isin}"]`).click()}
  await part(page,'Aperçu');assert(!(await page.getByLabel('Texte à publier',{exact:true}).inputValue()).includes('NaN'));await download(page,page.getByRole('button',{name:'Télécharger l’image',exact:true}),'rankings-'+width);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.goto(base+'generateur-portefeuilles',{waitUntil:'networkidle'});await part(page,'Réglages');await page.getByRole('button',{name:'✍️ Composition manuelle',exact:true}).click()
  const picker=page.getByRole('group',{name:'Ajouter un actif',exact:true})
  for(const {isin} of IDENTITIES){const asset=ASSETS.find(a=>a.isin===isin);assert(asset?.manualOnly);await picker.getByRole('searchbox').fill(isin);await picker.locator(`[data-option][data-value="${asset.id}"]`).click();assert((await page.locator('.pg-manual-selection-name').innerText()).includes(asset.name));await page.getByRole('button',{name:'Retirer '+asset.name,exact:true}).click()}
  for(const isin of ['IE00B0M63516','IE00B1FZSC47']){const asset=ASSETS.find(a=>a.isin===isin);await picker.getByRole('searchbox').fill(isin);await picker.locator(`[data-option][data-value="${asset.id}"]`).click();await page.getByRole('spinbutton',{name:'Pourcentage pour '+asset.name,exact:true}).fill('50')}
  await page.getByRole('button',{name:'Générer le tweet',exact:true}).click();await part(page,'Aperçu');await page.locator('.pg-image-download').waitFor();await download(page,page.locator('.pg-image-download'),'manual-'+width);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:out+'/manual-'+width+'-page.png',fullPage:true})
  const initialDuel=DUEL_ASSETS.find(a=>a.isin===IDENTITIES[0].isin)
  await page.goto(base+'duels-portefeuilles?asset='+initialDuel.id,{waitUntil:'networkidle'});await part(page,'Réglages')
  const left=page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true})
  for(const identity of IDENTITIES){
   const asset=DUEL_ASSETS.find(a=>a.isin===identity.isin);assert(asset)
   await compactSearch(left,identity.isin);await choose(left,asset.id);await part(page,'Aperçu')
   await page.waitForFunction(name=>document.querySelector('#pd-tweet')?.value.includes(name),identity.name)
   assert(!/NaN|undefined/.test(await page.locator('#pd-tweet').inputValue()));await part(page,'Réglages')
  }
  await compactSearch(left,'IE00B0M63516');await choose(left,DUEL_ASSETS.find(a=>a.isin==='IE00B0M63516').id)
  const right=page.getByRole('group',{name:'Actif 1 du portefeuille B',exact:true});await compactSearch(right,'IE00B14X4S71');await choose(right,DUEL_ASSETS.find(a=>a.isin==='IE00B14X4S71').id)
  await part(page,'Aperçu');await page.waitForFunction(()=>document.querySelector('#pd-tweet')?.value.includes('Brazil'))
  await download(page,page.getByRole('button',{name:'🖼️ Télécharger l’image PNG',exact:true}),'duel-'+width)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.close()
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/result.json',JSON.stringify({instruments:IDENTITIES.length,widths:[1440,390],pngDownloads:6,errors},null,2));console.log('All new annual ranking and manual-generator and manual-duel choices searched and selected on desktop/mobile; two coherent native-currency portfolios/rankings, six downloaded PNGs inspected.')
}finally{await browser?.close();}
