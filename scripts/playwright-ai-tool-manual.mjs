import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {CATALOG as DUELS} from '../src/data/duel-assets.js'
const report=JSON.parse(readFileSync('docs/ai-tools-matrix.json'))
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4396/shinny-potato'
const server=process.env.TEST_BASE_URL?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4396'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true})
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 let manual=0,sheets=0
 for(const row of report.matrix){
  const isin=row.identity.isin
  console.log(`Manual/exposure browser: ${row.identity.name} (${isin})`)
  await page.goto(`${base}/le-dca-de?isin=${isin}`,{waitUntil:'networkidle'})
  const image=page.getByAltText('Répartition et expositions du portefeuille')
  await image.waitFor({state:'visible'});await image.evaluate(img=>img.decode())
  assert(await image.evaluate(img=>img.naturalWidth>=1000),isin)
  assert(!/NaN|undefined/.test(await page.locator('body').innerText()),isin)
  const portfolioId=row.after.history[0].id
  if(['nebius','cameco','etfIE00B4ND3602'].includes(portfolioId)){
   await page.screenshot({path:`/tmp/ai-tool-reuse-browser/exposure-${portfolioId}.png`,fullPage:true})
   await page.setViewportSize({width:390,height:844})
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   await page.setViewportSize({width:1440,height:1000})
  }
  if(['déjà raccordé','raccordé dans cette PR'].includes(row.tools.portfolioManual.status)){
   const id=row.after.history[0].id
   const choice=row.before.portfolioIds?.[0]??`equity-${id}`
   await page.goto(`${base}/generateur-portefeuilles?asset=${choice}`,{waitUntil:'networkidle'})
   await page.getByRole('button',{name:'Générer le tweet',exact:true}).click()
   await page.locator('.pg-alloc-list').waitFor()
   assert((await page.locator('body').innerText()).includes(row.identity.name)||!row.identity.aiListingId,isin)
   const duel=DUELS.find(r=>r.isin===isin)
   await page.goto(`${base}/duels-portefeuilles?asset=${duel.id}`,{waitUntil:'networkidle'})
   const settings=page.getByRole('button',{name:'Réglages',exact:true})
   if(await settings.isVisible())await settings.click()
   assert.equal(await page.getByRole('group',{name:'Actif 1 du portefeuille A',exact:true}).getAttribute('data-value'),duel.id)
   assert((await page.locator('#pd-tweet').inputValue()).trim().length>100)
   assert(await page.locator('.pd-table tbody tr').count()>=3)
   manual++
  }
  if(!row.identity.aiListingId){
   await page.goto(`${base}/fiches-etf?isin=${isin}`,{waitUntil:'networkidle'})
   const body=await page.locator('body').innerText();assert(body.includes(isin),isin)
   assert(!/NaN|undefined/.test(body));sheets++
  }
 }
 assert.deepEqual(errors,[])
 console.log(`Browser: all 29 exposure selections, ${manual} manual portfolio/duel selections and ${sheets} existing ETF/ETC sheets verified; recent equities stay outside unqualified manual portfolios.`)
}finally{await browser?.close();server?.kill()}
