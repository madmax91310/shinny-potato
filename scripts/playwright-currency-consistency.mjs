import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { choose } from './card-selection.mjs'
import fs from 'node:fs/promises'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4387','--strictPort'],{stdio:'ignore'})
let browser
try {
 let ready=false
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error(`Preview exited ${server.exitCode}`)
  try{if((await fetch('http://127.0.0.1:4387/shinny-potato/',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break}}catch{}
  await new Promise(resolve=>setTimeout(resolve,100))
 }
 assert(ready,'Preview did not become available')
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 const go=async route=>{await page.goto(`http://127.0.0.1:4387/shinny-potato/${route}`);await page.locator('h1').waitFor()}
 const download=async button=>{const promise=page.waitForEvent('download');await button.click();const d=await promise;assert.equal(await d.failure(),null)}
 await go('performance-depuis?asset=msciAcwi')
 await page.getByRole('button',{name:'Euros (EUR)',exact:true}).click()
 await page.getByText(/Net Return · EUR · dividendes nets réinvestis/).waitFor()
 await download(page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}))
 // The same exact share was already offered as an annual JPY calendar by the
 // ranking tool. Its performance selector must now use the existing conversion.
 await fs.mkdir('test-artifacts/nikkei-annual',{recursive:true})
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900})
  await go('performance-depuis?isin=LU2196470426')
  const settings=page.locator('.workspace-view-switch').getByRole('button',{name:'Réglages',exact:true})
  if(await settings.isVisible())await settings.click()
  assert.equal(await page.locator('#subject-select').getAttribute('data-value'),'annual-LU2196470426')
  await choose(page.locator('#secondary-select'),'2025')
  for(const [label,currency] of [['Euros (EUR)','EUR'],['Dollars (USD)','USD']]){
   if(await settings.isVisible())await settings.click()
   await page.getByRole('button',{name:label,exact:true}).click()
   await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
   const text=await page.locator('pre').innerText()
   assert(text.includes('2025')&&text.includes('VL')&&text.includes(currency))
   assert(!/NaN|undefined/.test(text))
   if(currency==='EUR')assert(text.includes('13,6'),'JPY total return must be converted, not relabelled EUR: '+text)
   const preview=page.locator('.workspace-view-switch').getByRole('button',{name:'Aperçu',exact:true})
   if(await preview.isVisible())await preview.click()
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
   const file=await pending,path=`test-artifacts/nikkei-annual/${currency}-${width}.png`;await file.saveAs(path)
   const data=await fs.readFile(path);assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(data.length>10000)
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
 }
 await page.setViewportSize({width:1280,height:900})
 await go('tweets-factsheets')
 await choose(page.locator('#factsheet-subject'),'acwi')
 await choose(page.getByRole('group',{name:'Dividendes réinvestis',exact:true}),'NETR')
 await choose(page.locator('#factsheet-currency'),'EUR')
 assert.match(await page.locator('#factsheet-draft').inputValue(),/EUR.*dividendes nets/)
 await download(page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await choose(page.getByRole('group',{name:'Dividendes réinvestis',exact:true}),'GRTR')
 assert.match(await page.locator('#factsheet-draft').inputValue(),/dividendes bruts/)
 await go('fiches-etf?isin=IE00B4L5Y983')
 await choose(page.getByRole('group',{name:'Devise des performances',exact:true}),'EUR')
 assert.match(await page.locator('.es-card').innerText(),/Performances annuelles \(EUR\)/)
 await download(page.getByRole('button',{name:'Télécharger l’image',exact:true}))
 await go('comparatif-etf?subject=usa')
 const euro=page.getByRole('button',{name:'Euros (EUR)',exact:true})
 await euro.click()
 assert.match(await page.locator('.tool-preview').innerText(),/Performances annuelles en euros/)
 await go('calculateur-investissement?asset=apple')
 await choose(page.getByRole('group',{name:'Devise de l’investissement',exact:true}),'EUR')
 await page.locator('.ic-hero-number').waitFor()
 assert.match(await page.locator('.ic-hero-number').innerText(),/€/)
 assert.match(await page.locator('.ic-card').innerText(),/Livret A/)
 const livret = page.locator('.ic-compare-item').filter({hasText:'Livret A'})
 assert.doesNotMatch(await livret.innerText(),/\+0,0 %/)
 await page.getByRole('button',{name:'Mensuel (DCA)',exact:true}).click()
 assert.match(await page.locator('.ic-hero-number').innerText(),/€/)
 assert.match(await page.locator('.ic-hero-label').innerText(),/mois/)
 await choose(page.getByRole('group',{name:'Devise de l’investissement',exact:true}),'USD')
 assert.match(await page.locator('.ic-hero-number').innerText(),/\$/)
 assert.equal(await page.locator('.ic-compare-item').filter({hasText:'Livret A'}).count(),0)
 await choose(page.getByRole('group',{name:'Devise de l’investissement',exact:true}),'EUR')
 await page.screenshot({path:'/tmp/currency-calculator.png',fullPage:true})
 await go('classements-performances')
 await page.locator('main').waitFor()
 await go('duels-portefeuilles?asset=equity-rolls-royce')
 assert.match(await page.locator('#pd-tweet').inputValue(),/Rolls-Royce/)
 assert.doesNotMatch(await page.locator('#pd-tweet').inputValue(),/NaN|undefined/)
 await go('tweet-midi')
 await page.getByRole('button',{name:'Comparatif ETF',exact:true}).click()
 await choose(page.getByLabel(/Sujet/),'usa')
 await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
 await page.getByRole('button',{name:'Euros (EUR)',exact:true}).click()
 assert.match(await page.locator('.tool-preview').innerText(),/Performances annuelles en euros/)
 assert.deepEqual(errors,[])
 await page.setViewportSize({width:320,height:844})
 for(const route of ['tweets-factsheets','fiches-etf','calculateur-investissement']){
  await go(route)
  assert.equal(await page.locator('select').count(),0,`${route}: use existing selection buttons`)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route}: mobile overflow`)
 }
 console.log('Browser: EUR ACWI, explicit net/gross, ETF/comparison EUR, calculator EUR, compiled duel and three PNG downloads passed.')
} finally {await browser?.close();server.kill()}
