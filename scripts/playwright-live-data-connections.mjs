import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {readFileSync,mkdirSync} from 'node:fs'
import {chromium} from 'playwright'
import {getInstrumentAnnualPerformance} from '../src/data/instrument-returns.js'
import {REVIEWED_PERFORMANCE_META} from '../src/data/instrument-performance-review.js'
const raw=JSON.parse(readFileSync('src/data/dca-complete-holdings.json'))
const topix=process.argv.includes('--topix')
const newIssuers=process.argv.includes('--new-issuers')
const physical=process.argv.includes('--physical')||newIssuers
const selected=topix?['FR0013411980','FR0013411998']:newIssuers?['IE00B4K6B022','IE0003UVYC20']:physical?['IE00BK5BQT80','IE00BFMXXD54']:['IE00BFY0GT14','IE00BKWQ0Q14']
for(const isin of selected)assert(raw[isin]?.complete&&raw[isin].checkedAt&&raw[isin].sha256&&raw[isin].rows.length>10,`Fresh complete portfolio required: ${isin}`)
if(physical){
 const targets=JSON.parse(readFileSync('scripts/generated-holdings-sources.json'))
 const catalog=JSON.parse(readFileSync('src/pages/dca-profiles/catalog.json'))
 const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
 const shards=new Map()
 for(const [isin,target]of Object.entries(targets).filter(([,r])=>r.catalog!==false&&(r.parser?.endsWith('-complete')||r.parser==='lifestrategy-lookthrough'))){
  const source=raw[isin]
  assert(source?.complete&&source.checkedAt&&source.sha256&&source.rows.length>10,`Missing qualified physical source ${isin}`)
  const asset=Object.keys(catalog).find(key=>catalog[key].isin===isin)
  assert(asset&&manifest[asset]!==undefined,`Missing physical portfolio in DCA ${isin}`)
  const shard=manifest[asset]
  if(!shards.has(shard))shards.set(shard,JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${shard}.json`)))
  const projected=shards.get(shard)[asset]
  assert.equal(projected.asOf,source.asOf,`${isin}: published date differs`)
  assert.equal(projected.rows.length,source.rows.length,`${isin}: truncated physical portfolio`)
  assert.equal(projected.complete,true,`${isin}: full source lost its scope`)
  assert(Math.abs(projected.rows.reduce((sum,r)=>sum+r.weightPct,0)-source.rows.reduce((sum,r)=>sum+r.weightPct,0))<1e-8,`${isin}: NAV weights changed`)
  if(target.parser==='lifestrategy-lookthrough'){
   assert.equal(projected.scope,'equity-lookthrough')
   assert(projected.sourceUrls.length>1,'Look-through dependency provenance must reach the application')
   assert(projected.rows.reduce((sum,r)=>sum+r.weightPct,0)<85,'LifeStrategy equity sleeve must never be scaled to 100%')
  }
 }
}
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
  await page.getByText(/^Recouvrement entre les supports ·/).click()
  await page.locator('.dca-pair-grid article').first().waitFor()
  const pair=await page.locator('.dca-pair-grid article').first().innerText()
  if(newIssuers||topix&&selected.some(isin=>raw[isin].unidentifiedWeightPct>0))assert(pair.includes('Partiel'),'Cash and option sleeves must prevent an integral overlap claim')
  else assert(!pair.includes('Partiel'),'Real overlap must use complete issuer portfolios')
  assert(Number(/(\d+) titres communs/.exec(pair)?.[1])>10,'Overlap includes more than the editorial top ten')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  await page.screenshot({path:`test-artifacts/live-data-connections/${newIssuers?'new-issuers-':physical?'physical-':''}holdings-${width}.png`,fullPage:true})
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
