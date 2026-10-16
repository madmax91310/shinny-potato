import assert from 'node:assert/strict'
import {chromium} from 'playwright'
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
  assert.equal(await page.getByRole('button',{name:'Générer l’image',exact:true}).isDisabled(),true)
  await page.getByPlaceholder('Nom, ticker ou ISIN').fill('World')
  await page.locator('.dca-simple-results button').first().click()
  await page.getByPlaceholder('Nom, ticker ou ISIN').fill('Apple')
  await page.locator('.dca-simple-results button').first().click()
  const weights=page.locator('.dca-simple-line input')
  await weights.nth(0).fill('80');await weights.nth(1).fill('20')
  for(const choice of ['all','both','countries','sectors']){
   await page.getByLabel('Donuts de l’image',{exact:true}).selectOption(choice)
   await page.getByRole('button',{name:'Générer l’image',exact:true}).click()
   await page.locator('.dca-simple-preview img').waitFor()
   assert(await page.locator('.dca-simple-preview img').evaluate(async img=>{await img.decode();return img.naturalWidth===1600}))
  }
  await weights.nth(0).fill('70')
  assert.equal(await page.locator('.dca-simple-preview img').count(),0)
  assert(await page.getByRole('button',{name:'Générer l’image',exact:true}).isDisabled())
  await weights.nth(0).fill('80')
  await page.getByRole('button',{name:'Le DCA de…',exact:true}).click()
  await page.getByRole('button',{name:'Actifs & expositions',exact:true}).click()
  assert.equal(await weights.nth(0).inputValue(),'80')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`/tmp/simple-exposure-${width}.png`,fullPage:true})
  await page.close()
 }
 console.log('Simple exposure: desktop/mobile, four images, validation and retained allocation passed')
}finally{await browser?.close();server.kill()}
