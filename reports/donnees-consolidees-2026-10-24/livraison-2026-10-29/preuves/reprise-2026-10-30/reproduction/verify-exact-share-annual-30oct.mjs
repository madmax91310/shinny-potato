import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import fs from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import {buildCustomDuel,buildTweet,formatCapital} from '../src/pages/portfolio-duels/lib.js'
import {buildManualPortfolio,renderTweetText} from '../src/pages/portfolio-generator/engine.js'
import {ASSETS} from '../src/data/portfolio-assets.js'
import {CATALOG} from '../src/data/duel-assets.js'
const isin=process.env.TEST_ISIN??'DE000A27Z304',g=ASSETS.find(a=>a.isin===isin),d=CATALOG.find(a=>a.isin===isin),id=g.id,duelId=d.id,port=Number(process.env.TEST_PORT??4408),external=process.env.TEST_BASE_URL
const base=external??`http://127.0.0.1:${port}/shinny-potato`
const out=process.env.TEST_OUTPUT_DIR??'/dev/shm/data-automation-20261028/proofs-29oct/exact-share-annual-local-30oct/'+isin+''
const server=external?null:spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=await chromium.launch({headless:true,...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{})})
const downloads=[],results=[],errors=[],normal=s=>s.replace(/\s+/gu,' ').trim()
try {
 await fs.mkdir(out,{recursive:true})
 if(!external)for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 for(const width of (process.env.TEST_VIEWPORT_WIDTH?[Number(process.env.TEST_VIEWPORT_WIDTH)]:[1280,390])){
  const context=await browser.newContext({viewport:{width,height:1000},ignoreHTTPSErrors:true,acceptDownloads:true,permissions:['clipboard-read','clipboard-write']})
  const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER PAGE ERROR',e.message)})
  page.on('console',message=>{if(message.type()==='error')console.error('BROWSER CONSOLE ERROR',message.text())})
  await page.addInitScript(()=>{window.__drawn=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.__drawn.push(String(value));return original.call(this,value,...args)}})
  async function settings(){const b=page.getByRole('button',{name:'Réglages',exact:true});if(await b.isVisible())await b.click()}
  async function preview(){const b=page.getByRole('button',{name:'Aperçu',exact:true});if(await b.isVisible())await b.click()}
  async function savePng(name,button){const pending=page.waitForEvent('download');await button.click();const d=await pending;await d.saveAs(`${out}/${name}-${width}.png`);const data=await fs.readFile(`${out}/${name}-${width}.png`);assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(data.length>10000);downloads.push({name:`${name}-${width}.png`,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});if(process.env.TEST_RETAIN_PNG==='0')await fs.unlink(`${out}/${name}-${width}.png`);return data.length}
  await page.goto(base+'/generateur-portefeuilles',{waitUntil:'networkidle'});await settings()
  try { await page.getByRole('button',{name:/Composition manuelle/}).click() } catch(error) { await fs.writeFile(`${out}/initial-failure-${width}.json`,JSON.stringify({base,errors,body:await page.locator('body').innerText()},null,2));await page.screenshot({path:`${out}/initial-failure-${width}.png`});throw error }
  await choose(page.locator('#pg-manual-profile'),'generaliste')
  await page.locator('.pg-manual-search').fill(isin)
  const option=page.locator('.pg-manual-available [data-option]').filter({hasText:isin})
  await option.waitFor();assert.equal(await option.count(),1,'One choice per exact ISIN')
  await option.click();await page.locator('.pg-manual-pct-input').fill('100')
  await page.evaluate(()=>{window.__drawn=[]});await page.getByRole('button',{name:'Générer le tweet',exact:true}).click()
  const expected=renderTweetText(buildManualPortfolio([{id,pct:100}],'generaliste',[]))
  try { await page.waitForFunction(expected=>document.querySelector('.pg-tweet-body')?.textContent.replace(/\s+/gu,'')===expected,expected.replace(/\s+/gu,'')) } catch(error) { await fs.writeFile(`${out}/debug-${width}.json`,JSON.stringify({actual:await page.locator('.pg-tweet-body').innerText(),expected,body:(await page.locator('body').innerText()).slice(-10000)},null,2));await page.screenshot({path:`${out}/debug-${width}.png`});throw error }
  await page.getByRole('button',{name:/Copier le texte/}).click()
  await page.getByRole('button',{name:/Copié/}).waitFor()
  const text=await page.evaluate(()=>navigator.clipboard.readText())
  assert.equal(normal(text),normal(expected))
  await preview()
  const pg=await savePng('manual',page.getByRole('link',{name:/Télécharger l’image PNG/}))
  const drawn=await page.evaluate(()=>window.__drawn.join('\n'))
  await fs.writeFile(`${out}/manual-drawn-${width}.json`,JSON.stringify(drawn))
  const years=Object.keys(buildManualPortfolio([{id,pct:100}],'generaliste',[]).perf).map(Number);assert(drawn.includes(String(years[0]))&&drawn.includes(String(years.at(-1))))
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  results.push({tool:'manual',width,years,pngBytes:pg,text})
  await page.goto(base+'/duels-portefeuilles?asset='+duelId,{waitUntil:'networkidle'})
  const duel=buildCustomDuel({left:[{id:duelId,pct:100}],right:[{id:'msci_world_ishares',pct:100}]})
  assert.equal(normal(await page.locator('#pd-tweet').inputValue()),normal(buildTweet(duel)))
  assert.deepEqual(await page.locator('.pd-table tbody th').allTextContents(),duel.years.map(String))
  await preview()
  const pd=await savePng('duel',page.getByRole('button',{name:'🖼️ Télécharger l’image PNG',exact:true}))
  const pdDrawn=normal(await page.evaluate(()=>window.__drawn.join('\n')))
  assert(pdDrawn.includes(normal(formatCapital(duel.a.final))),'Duel PNG uses the qualified EUR final capital')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  results.push({tool:'duel',width,years:duel.years,finalCapitalEUR:duel.a.final,pngBytes:pd})
  await context.close()
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({base,isin,downloads,checkedAt:new Date().toISOString(),results,errors},null,2)+'\n')
 console.log(`Exact share manual and Duels: actual selectors, six-year calculations, copy, image and ${results.length} PNGs verified.`)
} finally {await browser.close();server?.kill()}
