import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { derive, buildTweetText } from '../src/pages/investment-calculator/lib.js'
const base=(process.argv[2] ?? 'http://127.0.0.1:4173/shinny-potato').replace(/\/$/,'')
const browser=await chromium.launch({args:['--no-sandbox'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
const results=[]
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:900},permissions:['clipboard-read','clipboard-write']})
  const page=await context.newPage(), errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  for(const [route,selector] of [
   ['/le-dca-de?mode=dca','#dca-draft'],['/tweets-factsheets','#factsheet-draft'],
   ['/classements-performances','textarea[aria-label="Texte à publier"]'],
   ['/portefeuilles-investisseurs','#ip-draft'],['/comparatif-etf','pre'],
   ['/generateur-portefeuilles','.pg-tweet-body'],['/calculateur-investissement',null],
  ]) {
   await page.goto(base+route,{waitUntil:'networkidle'})
   let expected
   if(selector) {
    const element=page.locator(selector).first(); await element.waitFor({state:'attached'})
    expected=await element.evaluate(e=>e.tagName==='TEXTAREA'?e.value:e.classList.contains('pg-tweet-body')?[...e.children].map(p=>p.textContent).join('\n\n'):e.textContent)
   } else {
    const state={currency:'native',assetId:'bitcoin',startYear:2020,startMonth:1,amountRaw:'1000',mode:'lump',overridePriceRaw:''}
    expected=buildTweetText(state,derive(state))
   }
   await page.getByRole('button',{name:/Copier le texte|Copier le tweet|Copier le texte du post/}).first().click()
   const copied=await page.evaluate(()=>navigator.clipboard.readText())
   assert.equal(copied,expected,`${width} ${route}: copie exacte`)
   assert(!/undefined|NaN/.test(copied))
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route}: débordement`)
   results.push({width,route,text:copied,copyExact:true})
   if(route==='/calculateur-investissement') {
    await page.getByRole('button',{name:'Mensuel (DCA)',exact:true}).click()
    for(const overridePriceRaw of ['', '50']) {
     if(overridePriceRaw) {
      await page.locator('summary').filter({hasText:'Actualiser le prix'}).click()
      await page.locator('input[type="number"]').first().fill(overridePriceRaw)
     }
     await page.getByRole('button',{name:/Copier le texte du post|^✓ Copié$/}).click()
     const state={currency:'native',assetId:'bitcoin',startYear:2020,startMonth:1,amountRaw:'1000',mode:'dca',overridePriceRaw}
     const text=await page.evaluate(()=>navigator.clipboard.readText())
     assert.equal(text,buildTweetText(state,derive(state)))
     results.push({width,route,variant:overridePriceRaw?'dca-prix-saisi-perte':'dca',text,copyExact:true})
    }
   }
   if(route.startsWith('/le-dca-de')) {
    const marker='Texte personnel conservé — audit éditorial.'
    await page.locator(selector).fill(marker)
    await page.reload({waitUntil:'networkidle'})
    assert.equal(await page.locator(selector).inputValue(),marker)
    await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),marker)
    results.push({width,route,customDraftPreserved:true})
   }
  }
  assert.deepEqual(errors,[])
  await context.close()
 }
 if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify({base,results},null,2)+'\n')
 console.log(`${base} : ${results.length} contrôles, copies exactes desktop/mobile, brouillon DCA conservé, aucune erreur JavaScript.`)
} finally { await browser.close() }
