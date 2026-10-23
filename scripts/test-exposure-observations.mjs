import assert from 'node:assert/strict'
import { holdingConcentration, concentrationCopy, comparisonConcentration } from '../src/data/exposure-observations.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { ETFS } from '../src/data/etf-cards.js'
import { getInstrumentFacts } from '../src/data/instrument-facts.js'
import { presentationComposition } from '../src/pages/etf-sheets/presentationDetails.js'
import { buildText } from '../src/pages/etf-sheets/lib.js'
import { QUALIFIED_ETF_COMPARISONS } from '../src/data/qualified-etf-comparisons.js'
import { ASSETS } from '../src/data/portfolio-assets.js'
import { buildSheet, buildTweet } from '../src/pages/practical-sheets/lib.js'
const record = (weights, basis='fund', asOf='2026-09-30') => ({holdings:{basis,asOf,rows:weights.map((weightPct,i)=>({name:`Position ${i}`,weightPct}))}})
assert.equal(holdingConcentration(record([3,15,10,5])).weight,30)
assert.equal(holdingConcentration(record([3,15,10,5])).top[0].name,'Position 1')
assert.equal(concentrationCopy(record([1,2,3])), '')
assert.match(concentrationCopy(record([10,20,30],'index')),/de l’indice suivi/)
assert.equal(holdingConcentration(record([50,40,30])),null)
assert.equal(holdingConcentration(record([10,20,NaN])),null)
assert.equal(holdingConcentration(record([10,20,30],'substitution-basket')),null)
assert.equal(holdingConcentration(record([10,20,30],'fund','')),null)
const duplicate=record([10,20,30]);duplicate.holdings.rows[1].name='Position 0';assert.equal(holdingConcentration(duplicate),null)
const funds=[{isin:'a',nom:'Fonds A'},{isin:'b',nom:'Fonds B'}]
assert.match(comparisonConcentration(funds,{a:record([10,20,30]),b:record([5,10,15])}),/60 %.*30 %/)
assert.equal(comparisonConcentration(funds,{a:record([10,20,30]),b:record([5,10,15],'index')}),'')
assert.equal(comparisonConcentration(funds,{a:record([10,20,30]),b:record([5,10,15],'fund','2026-08-31')}),'')
for(const etf of ETFS){
 const text=buildText(etf)
 for(const section of ['🔍 Ce que tu achètes','✅ Pourquoi s’y intéresser ?','⚠️ Le point de vigilance','💬']) assert.equal(text.split(section).length,2)
 assert.ok(!/undefined|NaN/.test(text))
 const observation=presentationComposition(AUTOMATED_ETF[etf.isin],getInstrumentFacts(etf.isin));if(observation)assert.ok(text.includes(observation))
}
for(const id of ['etf-pe','etf-volatility','sector-theme','em-small']) {const sheet=buildSheet(id);assert.equal(sheet.blocked,false);assert.ok(buildTweet(sheet).includes('🔖 Sauvegarde ce tweet'))}
for(const id of ['em_pea_amundi','europe_pea_amundi','health_europe_pea','tech_europe_pea','industry_world_dws','em_small_ishares']) {const asset=ASSETS.find(a=>a.id===id);assert.ok(asset);assert.equal(asset.manualOnly,false);assert.equal(asset.r.length,6);assert.ok(asset.r.every(Number.isFinite))}
for(const id of ['europe-food-retail','europe-media-telecom','em-large-small']) assert.equal(QUALIFIED_ETF_COMPARISONS.find(c=>c.id===id)?.funds.length,2)
console.log(`${ETFS.length} publications ; concentration datée, périmètres, six supports et quatre fiches vérifiés.`)

if(process.argv.includes('--browser')) {
 const { chromium } = await import('playwright')
 const { spawn } = await import('node:child_process')
 const base='http://127.0.0.1:4397/shinny-potato'
 const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4397'],{stdio:'ignore'})
 let browser
 try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/generateur-portefeuilles`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:/Composition manuelle/}).click()
  for(const id of ['em_pea_amundi','europe_pea_amundi','health_europe_pea','tech_europe_pea','industry_world_dws','em_small_ishares']) {
   const a=ASSETS.find(a=>a.id===id)
   await page.locator('.pg-manual-search').fill(a.isin)
   await page.locator(`[data-asset-id="${id}"]`).click()
   assert.ok(!/NaN|undefined/.test(await page.locator('body').innerText()))
  }
  const inputs=page.locator('.pg-manual-pct-input')
  for(let i=0;i<await inputs.count();i++)await inputs.nth(i).fill(i===0?'20':'16')
  await page.getByRole('button',{name:'Générer le tweet',exact:true}).click()
  assert.ok(!/NaN|undefined/.test(await page.locator('.pg-tweet-body').innerText()))
  await page.setViewportSize({width:390,height:844})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  const counts=await page.evaluate(async()=>{
   const {ETFS}=await import('/shinny-potato/src/data/etf-cards.js')
   const {buildText}=await import('/shinny-potato/src/pages/etf-sheets/lib.js')
   const {DEFAULT_THEMES}=await import('/shinny-potato/src/data/etf-themes.js')
   const {buildTweetText}=await import('/shinny-potato/src/pages/etf-tweets/lib/tweetFormat.js')
   for(const e of ETFS) if(/undefined|NaN/.test(buildText(e)))throw Error(e.id)
   for(const t of DEFAULT_THEMES) if(/undefined|NaN/.test(buildTweetText(t)))throw Error(t.id)
   return [ETFS.length,DEFAULT_THEMES.length]
  })
  assert.deepEqual(errors,[])
  console.log(`Chromium : six sélections manuelles, mobile, ${counts[0]} fiches ETF et ${counts[1]} comparatifs.`)
 } finally {await browser?.close();server.kill('SIGTERM')}
}
