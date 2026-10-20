import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {readFileSync,mkdirSync} from 'node:fs'
import {chromium} from 'playwright'
import {getInstrumentAnnualPerformance} from '../src/data/instrument-returns.js'
import {REVIEWED_PERFORMANCE_META} from '../src/data/instrument-performance-review.js'
const raw=JSON.parse(readFileSync('src/data/dca-complete-holdings.json'))
const selected=['IE00BFY0GT14','IE00BKWQ0Q14']
for(const isin of selected)assert(raw[isin]?.complete&&raw[isin].checkedAt&&raw[isin].sha256&&raw[isin].rows.length>10,`Fresh complete portfolio required: ${isin}`)
const qyld=getInstrumentAnnualPerformance('IE00BM8R0J59')
assert(!REVIEWED_PERFORMANCE_META.IE00BM8R0J59.observations?.length,'Legacy unqualified rolling returns must not be published')
assert.equal(REVIEWED_PERFORMANCE_META.IE00BM8R0J59.archivedObservations.length,3)
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4392'],{stdio:'ignore'})
const base='http://127.0.0.1:4392/shinny-potato'
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true})
 mkdirSync('test-artifacts/live-data-connections',{recursive:true})
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/le-dca-de?isin=${selected[0]}`,{waitUntil:'networkidle'})
  await page.getByRole('searchbox',{name:'Ajouter un actif'}).fill(selected[1])
  await page.getByRole('button',{name:new RegExp(selected[1])}).click()
  const weights=page.getByRole('spinbutton');await weights.nth(0).fill('50');await weights.nth(1).fill('50')
  await page.getByAltText('Répartition et expositions du portefeuille').waitFor()
  await page.getByText('Voir l’analyse détaillée',{exact:true}).click()
  await page.locator('.dca-pair-grid article').first().waitFor()
  const pair=await page.locator('.dca-pair-grid article').first().innerText()
  assert(!pair.includes('Partiel'),'Real overlap must use complete issuer portfolios')
  assert(Number(/(\d+) titres communs/.exec(pair)?.[1])>10,'Overlap includes more than the editorial top ten')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  await page.screenshot({path:`test-artifacts/live-data-connections/holdings-${width}.png`,fullPage:true})
  await page.goto(`${base}/fiches-etf?isin=IE00BM8R0J59`,{waitUntil:'networkidle'})
  if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByRole('tab',{name:'Texte',exact:true}).click()
  await page.locator('.es-card .es-facts').getByText('ISIN : IE00BM8R0J59',{exact:true}).waitFor()
  const text=await page.locator('.es-card').innerText()
  for(const observation of REVIEWED_PERFORMANCE_META.IE00BM8R0J59.archivedObservations)assert(!text.includes(observation.value.toLocaleString('fr-FR')+' %'),'Unqualified manual rolling return must stay in archive')
  await page.screenshot({path:`test-artifacts/live-data-connections/qyld-${width}.png`,fullPage:true})
  assert.deepEqual(errors,[]);await page.close()
 }
 console.log('New complete portfolios reach real DCA overlap calculations; unqualified QYLD rolling figures are archived. Desktop and mobile passed.')
}finally{await browser?.close();server.kill()}
