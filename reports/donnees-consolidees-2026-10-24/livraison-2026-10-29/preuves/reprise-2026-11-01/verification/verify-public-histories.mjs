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
 const paths=['src/data/automated-monthly.json','src/data/non-bond-monthly-records.json','src/data/monthly-fx.json','src/data/automated-etf-monthly.json',...(process.env.HISTORY_SINGLE_RECORD_PATH?[process.env.HISTORY_SINGLE_RECORD_PATH]:[])]
 const targetCurrency=process.env.HISTORY_CURRENCY??'USD';assert(['USD','EUR'].includes(targetCurrency))
 const sources=Object.fromEntries(paths.map(path=>{
  const hash=manifest.files[path];assert.match(hash,/^[a-f0-9]{40}$/)
  const bytes=execFileSync('git',['cat-file','blob',hash],{maxBuffer:64*1024*1024});const parsed=JSON.parse(bytes);return [path,{hash,records:path===process.env.HISTORY_SINGLE_RECORD_PATH?{[process.env.HISTORY_SINGLE_RECORD_ID]:parsed}:parsed}]
 }))
 const nonbond=['adobe','booking','caterpillar','disney','exxonmobil','home-depot','johnson-johnson','jpmorgan','mastercard','nike','pepsico','procter-gamble','unitedhealth','waste-management']
 const scope=process.env.HISTORY_SCOPE??'all';assert(['all','nonbond'].includes(scope));const entries=[...(scope==='all'?[['paypal',paths[0]]]:[]),...nonbond.map(id=>[id,paths[1]]),...(process.env.HISTORY_INCLUDE_IDS??'').split(',').filter(Boolean).map(id=>[id,process.env.HISTORY_EXTRA_PATH??paths[0]])].filter(([id])=>!process.env.HISTORY_ONLY_IDS||process.env.HISTORY_ONLY_IDS.split(',').includes(id))
 async function download(name,button) {
  const pending=page.waitForEvent('download');await button.click();await(await pending).saveAs(out+'/'+name+'.png')
  const bytes=await fs.readFile(out+'/'+name+'.png');assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(bytes.length>10000)
  downloads.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})
 }
 for(const [id,path]of entries) {
  const record=sources[path].records[id];assert(record,id)
  assert(['USD','EUR'].includes(record.currency),id);assert.equal(record.periodEnd,'2026-10',id+' not yet published through October')
  const points=Object.fromEntries(record.points),converted=(month)=>points[month]*(record.currency===targetCurrency?1:sources[paths[2]].records.months[month].rates[targetCurrency]/sources[paths[2]].records.months[month].rates[record.currency]),expected=1000*converted('2026-10')/converted('2020-01');assert(Number.isFinite(expected),id)
  await page.goto(base+'/calculateur-investissement?asset='+id,{waitUntil:'networkidle'})
  await choose(page.getByRole('group',{name:'Devise de l’investissement',exact:true}),targetCurrency)
  await choose(page.getByRole('group',{name:'Année de départ',exact:true}),'2020')
  await choose(page.getByRole('group',{name:'Mois de départ',exact:true}),'1')
  await page.locator('.ic-current-level').filter({hasText:/oct.*2026/i}).waitFor()
  const latestText=await page.locator('.ic-current-level').innerText()
  if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  const hero=page.locator('.ic-hero-number');await hero.filter({hasText:fmtEUR(expected,targetCurrency)}).waitFor()
  const result={id,targetCurrency,nativeCurrency:record.currency,manifestPath:path,manifestBlob:sources[path].hash,periodEnd:record.periodEnd,checkedAt:record.checkedAt,latest:latestText,expected:fmtEUR(expected,targetCurrency),actual:await hero.innerText(),independentUnroundedValue:expected}
  calculations.push(result)
  if(['paypal','adobe','sbux'].includes(id)||process.env.HISTORY_DOWNLOAD_EACH==='true') {
   if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
   await page.getByRole('tab',{name:'Image',exact:true}).click()
   await download('calculator-'+id,page.getByRole('button',{name:'📊 Télécharger une image',exact:true}))
   await page.getByRole('tab',{name:'Texte',exact:true}).click();await page.getByRole('button',{name:/Copier le texte du post/}).click()
   result.text=await page.evaluate(()=>navigator.clipboard.readText());assert.doesNotMatch(result.text,/NaN|undefined/)
  }
 }
 let comparison=null
 {
 const comparisonId=process.env.HISTORY_COMPARISON_ID??(scope==='all'?'paypal':'adobe'),comparisonLabel=process.env.HISTORY_COMPARISON_LABEL??(scope==='all'?'PayPal':'Adobe')
 const comparisonRecord=sources[process.env.HISTORY_EXTRA_PATH??paths[scope==='all'?0:1]].records[comparisonId],nativePrices=Object.fromEntries(comparisonRecord.points),prices=Object.fromEntries(Object.entries(nativePrices).map(([month,p])=>[month,p*(comparisonRecord.currency===targetCurrency?1:(sources[paths[2]].records.months[month]?.rates[targetCurrency]??NaN)/(sources[paths[2]].records.months[month]?.rates[comparisonRecord.currency]??NaN))]))
 const expectedAnnualized=(Math.sqrt(prices['2026-10']/prices['2024-10'])-1)*100,expectedYtd=(prices['2026-10']/prices['2025-12']-1)*100
 await page.goto(base+'/classements-performances',{waitUntil:'networkidle'})
 if(!await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).isVisible()&&await page.getByRole('button',{name:'Réglages',exact:true}).isVisible())await page.getByRole('button',{name:'Réglages',exact:true}).click()
 await page.getByRole('button',{name:'Personnaliser les actifs',exact:true}).click()
 await page.getByRole('button',{name:'Nouvelle sélection',exact:true}).click()
 await page.getByRole('button',{name:'Un par un',exact:true}).click()
 await choose(page.getByRole('group',{name:'Devise du classement',exact:true}),targetCurrency)
 const search=page.getByRole('searchbox',{name:'Rechercher : Actif du classement',exact:true})
 for(const [id,label]of [[comparisonId,comparisonLabel],[process.env.HISTORY_REFERENCE_ID??'etfNasdaqEqual',process.env.HISTORY_REFERENCE_SEARCH??'NASDAQ']]){await search.fill(label);try{await page.locator(`.rk-manual [data-option][data-value="${id}"]`).click({timeout:10000})}catch(error){await fs.writeFile(out+"/selector-debug.txt",await page.locator("body").innerText());throw error}}
 await choose(page.getByRole('group',{name:'Devise du classement',exact:true}),targetCurrency)
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
