import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {readFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
const base='http://127.0.0.1:4371/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4371'],{stdio:'ignore'})
for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
let browser
try{
browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {})})
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}})
  await page.goto(base+'le-dca-de')
  await page.getByRole('heading',{name:'Actifs & expositions',exact:true}).waitFor()
  assert.equal(await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).isDisabled(),true)
  await page.getByPlaceholder('Nom, ticker ou ISIN').fill('World')
  await page.locator('.dca-simple-results button').first().click()
  await page.getByPlaceholder('Nom, ticker ou ISIN').fill('Apple')
  await page.locator('.dca-simple-results button').first().click()
  const weights=page.locator('.dca-simple-line input')
  await weights.nth(0).fill('80');await weights.nth(1).fill('20')
  await page.getByText('Personnaliser l’image',{exact:true}).click()
  let previousSource
  for(const choice of ['all','both','countries','sectors']){
   await page.getByRole('group',{name:'Donuts de l’image',exact:true}).locator(`[data-option][data-value="${choice}"]`).click()
   await page.waitForFunction(previous=>{const img=document.querySelector('.dca-simple-preview img');return img?.src&&img.src!==previous&&img.complete&&img.naturalWidth>0},previousSource)
   const image=await page.locator('.dca-simple-preview img').evaluate(async img=>{await img.decode();return {source:img.src,width:img.naturalWidth,height:img.naturalHeight}})
   if(choice==='all'||choice==='both')assert.equal(image.width,1600,`${choice} retains its fixed canvas`)
   else assert(image.width>0&&image.height>0&&image.width<=16000&&image.height<=16000&&image.width*image.height<=32000000,`${choice} respects adaptive-canvas limits`)
   previousSource=image.source
  }
  const preview=await page.locator('.dca-simple-preview img').evaluate(async img=>({width:img.naturalWidth,height:img.naturalHeight,bytes:Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer()))}))
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  const png=await download
  assert.equal(png.suggestedFilename(),'epargnant-libre-expositions-sectors.png')
  const downloaded=await readFile(await png.path())
  assert.equal(downloaded.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
  assert.deepEqual(downloaded,Buffer.from(preview.bytes),'The download is exactly the current preview')
  assert.equal(downloaded.readUInt32BE(16),preview.width)
  assert.equal(downloaded.readUInt32BE(20),preview.height)
  const popupEvent=page.waitForEvent('popup');await page.getByRole('link',{name:'Ouvrir l’image',exact:true}).click()
  const popup=await popupEvent;await popup.waitForLoadState();const opened=await popup.locator('img').evaluate(async img=>{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight,bytes:Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer()))}});assert.equal(opened.width,preview.width);assert.equal(opened.height,preview.height);assert.deepEqual(Buffer.from(opened.bytes),downloaded);await popup.close()
  // An encoder failure is recoverable and never leaves a dead or stale download.
  await page.evaluate(()=>{window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback){callback(null)}})
  await page.getByRole('group',{name:'Donuts de l’image',exact:true}).locator('[data-option][data-value="both"]').click()
  await page.getByRole('button',{name:'Réessayer l’image',exact:true}).waitFor()
  assert(await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).isDisabled())
  await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=window.originalToBlob})
  await page.getByRole('button',{name:'Réessayer l’image',exact:true}).click()
  await page.locator('.dca-simple-preview img').evaluate(async img=>img.decode())
  await weights.nth(0).fill('70')
  assert.equal(await page.locator('.dca-simple-preview img').count(),0)
  assert(await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).isDisabled())
  await weights.nth(0).fill('80')
  await page.locator('.dca-simple-preview img').waitFor()
  assert(await page.locator('.dca-simple-preview img').evaluate(async img=>{await img.decode();return img.naturalWidth===1600}),'Restoring a valid allocation prepares a fresh usable URL')
  await page.getByRole('button',{name:'Le DCA d’un abonné',exact:true}).click()
  await page.getByRole('button',{name:'Analyser une allocation',exact:true}).click()
  assert.equal(await weights.nth(0).inputValue(),'80')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`/tmp/simple-exposure-${width}.png`,fullPage:true})
  await page.close()
 }
 console.log('Simple exposure: desktop/mobile, four images, validation and retained allocation passed')
}finally{await browser?.close();server.kill()}
