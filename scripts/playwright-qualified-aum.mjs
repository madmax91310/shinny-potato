import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawn}from'node:child_process'
import {chromium}from'playwright'
import {ETFS}from'../src/data/etf-cards.js'
import {buildText}from'../src/pages/etf-sheets/lib.js'
import {getPresentationCopy}from'../src/pages/etf-sheets/editorial.js'
import {AUTOMATED_ETF}from'../src/data/automated-etf.js'
const ids=JSON.parse(await fs.readFile('scripts/fixtures/qualified-aum-retention.json','utf8')).pairs.map(r=>r.isin)
const external=process.env.TEST_BASE_URL,port=4410,base=external??`http://127.0.0.1:${port}/shinny-potato`,out=process.env.TEST_OUTPUT_DIR??'/tmp/qualified-aum-browser'
const server=external?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
let browser
try{
 await fs.mkdir(out,{recursive:true})
 if(!external)for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(external?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
 const results=[],errors=[]
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true,ignoreHTTPSErrors:true,permissions:['clipboard-read','clipboard-write']})
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{window.__drawn=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.__drawn.push(String(value));return original.call(this,value,...args)}})
  await page.goto(base+'/fiches-etf',{waitUntil:'networkidle'})
  for(const isin of ids){
   const etf=ETFS.find(e=>e.isin===isin);assert(etf)
   const settings=page.getByRole('button',{name:'Réglages',exact:true});if(await settings.isVisible())await settings.click()
   await page.getByRole('searchbox',{name:'Rechercher : Choisir un ETF'}).fill(isin)
   await page.locator(`[data-asset-id="${etf.id}"]`).click()
   const copy=getPresentationCopy(etf)
   await page.waitForFunction(isin=>document.querySelector('.es-card .es-facts')?.textContent.includes(isin),isin)
   assert((await page.locator('.es-card').innerText()).includes(copy.aum))
   await page.getByRole('button',{name:/Copier le texte|Copié !/}).click()
   assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildText(etf))
   let png=false
   if(['IE00BYZK4776','IE00B1XNHC34'].includes(isin)){
    await page.evaluate(()=>{window.__drawn=[]})
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click();await(await pending).saveAs(`${out}/${isin}-${width}.png`)
    const body=await fs.readFile(`${out}/${isin}-${width}.png`);assert.equal(body.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(body.length>10000)
    const drawn=await page.evaluate(()=>window.__drawn.join('\n'))
    await fs.writeFile(`${out}/${isin}-${width}-drawn.json`,JSON.stringify({aum:copy.aum,drawn}))
    const amount=AUTOMATED_ETF[isin].aum,expected=Math.round(amount.amount/1e6).toLocaleString('fr-FR')+' M'+({USD:'$',EUR:'€'}[amount.currency]);
    assert(drawn.includes(isin));assert(drawn.replace(/\s/gu,'').includes(expected.replace(/\s/gu,'')),'Current numeric AUM, with the existing image rounding');assert(drawn.includes(amount.asOf.split('-').reverse().join('/')),'Observation date stays visible')
    png=true
   }
   results.push({isin,id:etf.id,width,aum:copy.aum,png})
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await context.close()
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/results.json',JSON.stringify({base,checkedAt:new Date().toISOString(),results,errors},null,2)+'\n');console.log('Twelve exact AUM consumers, copy and four PNGs verified on desktop/mobile.')
}finally{await browser?.close();server?.kill()}
