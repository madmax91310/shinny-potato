import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
import { PRICE_OBSERVATION } from '../src/data/purchasing-power.js'
import { choose } from './card-selection.mjs'
const port=4342,base=`http://127.0.0.1:${port}/shinny-potato`
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/tweet-midi`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Il y a X ans',exact:true}).click()
  await choose(page.locator('#subject-select'),'bitcoin')
  await choose(page.locator('#secondary-select'),'1')
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  const obs=resolveAnniversaryLevel('bitcoin','')
  if(obs){assert.equal(Number(await page.locator('#niveau-actuel').inputValue()),obs.value);assert.ok((await page.locator('pre').innerText()).includes(obs.label))}
  await page.locator('#niveau-actuel').fill('100000')
  assert.ok((await page.locator('pre').innerText()).includes('Niveau saisi manuellement'))
  await page.locator('#niveau-actuel').fill('-1')
  assert.ok(await page.getByRole('button',{name:/pour copier/}).isDisabled())
  await page.locator('#niveau-actuel').fill('100000')
  const [image]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()])
  assert.ok(image.suggestedFilename().endsWith('.png'))
  await page.getByRole('button',{name:"Pouvoir d'achat",exact:true}).click()
  assert.ok((await page.locator('body').innerText()).includes(PRICE_OBSERVATION.label))
  // Exercise the shared image consumer and inspect the actual canvas labels.
  const painted=await page.evaluate(async()=>{
    const {renderPurchasingPowerImage}=await import('/shinny-potato/src/pages/tweet-midi/purchasingPowerImage.js')
    const labels=[],original=CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText=function(text,...args){labels.push(text);return original.call(this,text,...args)}
    try{const canvas=await renderPurchasingPowerImage({amount:1000,startYear:2020,mode:'brut'});return {labels,width:canvas.width}}finally{CanvasRenderingContext2D.prototype.fillText=original}
  })
  assert.ok(painted.width>0)
  assert.equal(painted.labels.some(x=>x.includes('provisoire')),PRICE_OBSERVATION.provisional)
  await page.setViewportSize({width:390,height:844})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  assert.deepEqual(errors,[])
  console.log('Navigateur : niveau automatique, correction manuelle, validation, PNG, date INSEE, qualification et mobile vérifiés.')
}finally{await browser?.close();server.kill()}
