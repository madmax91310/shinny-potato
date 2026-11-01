import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'
import {choose} from '../../../../../../scripts/card-selection.mjs'
import {fmtEUR} from '../../../../../../src/lib/format-currency.js'
import {formatPercent} from '../../../../../../src/pages/performance-rankings/engine.js'

const base=process.env.TEST_BASE_URL??'https://madmax91310.github.io/shinny-potato'
const out=process.env.PROOF_DIR??'/dev/shm/automation-20261101/proofs/public-history-consumers'
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,proxy:{server:process.env.HTTPS_PROXY}})
try {
 const context=await browser.newContext({viewport:{width:Number(process.env.SCREEN_WIDTH??1440),height:1000},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']})
 const page=await context.newPage(),errors=[],calculations=[],downloads=[]
 page.on('pageerror',e=>errors.push(e.message))
 const get=async path=>{const r=await context.request.get(base+path,{headers:{'cache-control':'no-cache'}});assert(r.ok(),path);return r.json()}
 const buildInfo=await get('/build-info.json'),manifest=await get('/data/publication-manifest.json')
 const paths=['src/data/automated-monthly.json','src/data/non-bond-monthly-records.json']
 const sources=Object.fromEntries(paths.map(path=>{
  const hash=manifest.files[path];assert.match(hash,/^[a-f0-9]{40}$/)
  const bytes=execFileSync('git',['cat-file','blob',hash],{maxBuffer:64*1024*1024});return [path,{hash,records:JSON.parse(bytes)}]
 }))
 const nonbond=['adobe','booking','caterpillar','disney','exxonmobil','home-depot','johnson-johnson','jpmorgan','mastercard','nike','pepsico','procter-gamble','unitedhealth','waste-management']
 const scope=process.env.HISTORY_SCOPE??'all';assert(['all','nonbond'].includes(scope));const entries=[...(scope==='all'?[['paypal',paths[0]]]:[]),...nonbond.map(id=>[id,paths[1]])].filter(([id])=>!process.env.HISTORY_ONLY_IDS||process.env.HISTORY_ONLY_IDS.split(',').includes(id))
 async function download(name,button) {
  const pending=page.waitForEvent('download');await button.click();await(await pending).saveAs(out+'/'+name+'.png')
  const bytes=await fs.readFile(out+'/'+name+'.png');assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(bytes.length>10000)
  downloads.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})
 }
 for(const [id,path]of entries) {
  const record=sources[path].records[id];assert(record,id)
  assert.equal(record.currency,'USD',id);assert.equal(record.periodEnd,'2026-10',id+' not yet published through October')
  const points=Object.fromEntries(record.points),expected=1000*points['2026-10']/points['2020-01'];assert(Number.isFinite(expected),id)
  await page.goto(base+'/calculateur-investissement?asset='+id,{waitUntil:'networkidle'})
  await choose(page.getByRole('group',{name:'Devise de l’investissement',exact:true}),'USD')
  await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2020')
  await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),'1')
  await page.locator('.ic-current-level').filter({hasText:/oct.*2026/i}).waitFor()
  const latestText=await page.locator('.ic-current-level').innerText()
  if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  const hero=page.locator('.ic-hero-number');await hero.filter({hasText:fmtEUR(expected,'USD')}).waitFor()
  const result={id,manifestPath:path,manifestBlob:sources[path].hash,periodEnd:record.periodEnd,checkedAt:record.checkedAt,latest:latestText,expected:fmtEUR(expected,'USD'),actual:await hero.innerText(),independentUnroundedValue:expected}
  calculations.push(result)
  if(['paypal','adobe'].includes(id)) {
   if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
   await page.getByRole('tab',{name:'Image',exact:true}).click()
   await download('calculator-'+id,page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
   await page.getByRole('tab',{name:'Texte',exact:true}).click();await page.getByRole('button',{name:/Copier le texte du post/}).click()
   result.text=await page.evaluate(()=>navigator.clipboard.readText());assert.doesNotMatch(result.text,/NaN|undefined/)
  }
 }
 let comparison=null
 {
 const comparisonId=scope==='all'?'paypal':'adobe',comparisonLabel=scope==='all'?'PayPal':'Adobe'
 const comparisonRecord=sources[paths[scope==='all'?0:1]].records[comparisonId],prices=Object.fromEntries(comparisonRecord.points)
 const expectedAnnualized=(Math.sqrt(prices['2026-10']/prices['2024-10'])-1)*100,expectedYtd=(prices['2026-10']/prices['2025-12']-1)*100
 await page.goto(base+'/classements-performances',{waitUntil:'networkidle'})
 if(!await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).isVisible()&&await page.getByRole('button',{name:'Réglages',exact:true}).isVisible())await page.getByRole('button',{name:'Réglages',exact:true}).click()
 await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).click()
 await page.getByRole('button',{name:'Nouvelle sélection',exact:true}).click()
 await page.getByRole('button',{name:'Un par un',exact:true}).click()
 const search=page.getByRole('searchbox',{name:'Rechercher : Actif du classement',exact:true})
 for(const [id,label]of [[comparisonId,comparisonLabel],['etfNasdaqEqual','NASDAQ']]){await search.fill(label);await page.locator(`.rk-manual [data-option][data-value="${id}"]`).click()}
 await choose(page.getByRole('group',{name:'Devise du classement',exact:true}),'USD')
 await page.getByRole('button',{name:'Période libre',exact:true}).click()
 await page.getByLabel('Début, fin de mois',{exact:true}).fill('2024-10');await page.getByLabel('Fin, fin de mois',{exact:true}).fill('2026-10')
 await page.locator('.rk-coverage').filter({hasText:'2026-10'}).waitFor()
 const row=page.locator('.rk-table tbody tr').filter({hasText:comparisonLabel});await row.locator('td').last().filter({hasText:formatPercent(expectedYtd)}).waitFor({state:'attached'})
 comparison={id:comparisonId,coverage:await page.locator('.rk-coverage').innerText(),row:await row.innerText(),expectedAnnualized,expected2026Partial:expectedYtd,text:await page.getByLabel('Texte à publier',{exact:true}).inputValue()}
 assert(comparison.text.includes(formatPercent(expectedAnnualized)+'/an'));assert.doesNotMatch(comparison.text,/NaN|undefined/)
 if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
 await page.getByRole('tab',{name:'Image',exact:true}).click();await download('comparison-'+comparisonId,page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 }
 assert.deepEqual(await get('/build-info.json'),buildInfo,'Release changed while checking financial consumers')
 const lastManifest=await get('/data/publication-manifest.json');for(const path of paths)assert.equal(lastManifest.files[path],manifest.files[path],'Data changed during checks')
 assert.deepEqual(errors,[])
 await fs.writeFile(out+'/proof.json',JSON.stringify({checkedAt:new Date().toISOString(),base,buildInfo,scope,viewportWidth:Number(process.env.SCREEN_WIDTH??1440),manifestSourceFiles:Object.fromEntries(paths.map(path=>[path,sources[path].hash])),calculations,comparison,downloads,errors,limit:'Actual published source hashes and numerical UI checks, not certification of every field or old financial divergence.'},null,2)+'\n')
 console.log(`Public monthly histories: ${calculations.length} calculations, ${comparison?'two shared consumers':'calculator'}, text and ${downloads.length} real PNG exports passed`)
} finally {await browser.close()}
