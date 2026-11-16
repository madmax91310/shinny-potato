import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {expect} from 'playwright/test'
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
  for(const choice of ['all','both','countries','sectors']){
   await page.getByRole('group',{name:'Donuts de l’image',exact:true}).locator(`[data-option][data-value="${choice}"]`).click()
   await expect(page.getByRole('region',{name:'Image des expositions',exact:true})).toHaveAttribute('aria-busy','false',{timeout:30000})
   const size=await page.locator('.dca-simple-preview img').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]})
   if(['all','both'].includes(choice))assert.equal(size[0],1600,'Combined DCA image keeps its approved width')
   else assert(size[0]>=2000,'Individual DCA donuts use the approved expanded readable geometry')
   assert(size[1]>300)
  }
  const selected=await page.locator('.dca-simple-preview img').evaluate(async img=>({size:[img.naturalWidth,img.naturalHeight],bytes:[...new Uint8Array(await(await fetch(img.src)).arrayBuffer())]}))
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  const png=await download
  assert.equal(png.suggestedFilename(),'epargnant-libre-expositions-sectors.png')
  const pngBytes=await readFile(await png.path())
  assert.equal(pngBytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
  assert.deepEqual(pngBytes,Buffer.from(selected.bytes),'Downloaded individual image matches the selected preview exactly')
  assert.deepEqual([pngBytes.readUInt32BE(16),pngBytes.readUInt32BE(20)],selected.size)
  const popupEvent=page.waitForEvent('popup');await page.getByRole('link',{name:'Ouvrir l’image',exact:true}).click()
  const popup=await popupEvent;await popup.waitForLoadState();assert.deepEqual(await popup.locator('img').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]}),selected.size);await popup.close()
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
