import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'
import {choose} from './card-selection.mjs'
import {ASSETS} from '../src/data/market-history.js'
import {getValidYearsBackOptions} from '../src/pages/tweet-midi/data/marketHistory.js'
const base=process.env.AUDIT_BASE??'http://127.0.0.1:4173/shinny-potato',out=process.env.AUDIT_OUT??'test-artifacts/investment-protections'
mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true}),results=[]
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 for(const id of ['etfLU1829219390','etfImie','booking']){
  await page.goto(`${base}/il-y-a-x-ans?asset=${id}`,{waitUntil:'networkidle'})
  const reason=await page.getByRole('alert').innerText()
  assert(reason.includes(id==='etfLU1829219390'?'division des parts par 80':ASSETS[id].anniversaryExclusionReason))
  assert.equal(await page.locator('pre, .publication-image-stage img').count(),0)
  results.push({width,id,url:page.url(),reason});await page.screenshot({path:`${out}/${id}-${width}.png`,fullPage:true})
 }
 await page.goto(`${base}/il-y-a-x-ans?asset=apple`,{waitUntil:'networkidle'})
 await choose(page.locator('#subject-select'),'apple')
 assert.equal(await page.getByRole('note').filter({hasText:'prix historique réellement coté non certifié'}).innerText(),ASSETS.apple.anniversaryExclusionReason)
 const actual=await page.locator('#secondary-select [data-option]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.value)).filter(n=>Number.isInteger(n)&&n>0))
 assert.deepEqual(actual,getValidYearsBackOptions('apple',new Date()),'Only qualified years remain selectable')
 await choose(page.locator('#secondary-select'),String(actual[0]));await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
 const preview=page.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click()
 await page.getByRole('tab',{name:'Texte',exact:true}).click();await page.locator('pre').waitFor();assert((await page.locator('pre').innerText()).includes('Apple'))
 results.push({width,id:'apple',qualifiedYears:actual,note:ASSETS.apple.anniversaryExclusionReason,text:await page.locator('pre').innerText()})
 assert.deepEqual(errors,[]);await context.close()
}
}finally{await browser.close()}
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2)+'\n')
console.log('Direct URLs refuse unqualified assets; partial Apple selector explains its boundary and preserves every valid year, desktop/mobile.')
