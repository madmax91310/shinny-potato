import {choose} from './card-selection.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { ASSETS } from '../src/data/market-history.js'
const port=4359,base=`http://127.0.0.1:${port}/shinny-potato`
const ids=JSON.parse(readFileSync('scripts/monthly-automation.json')).series.filter(s=>s.consumerScope==='equity').map(s=>s.id)
const samples={roche:'CHF','rolls-royce':'GBp',catl:'¥','hdfc-bank':'₹',dbs:'$',xiaomi:'$',keyence:'¥',netflix:'$',rheinmetall:'€',walmart:'$',airbus:'€',samsung:'₩','sk-hynix':'₩',thales:'€',tsmc:'$',novartis:'CHF','novo-nordisk':'kr',nintendo:'¥',tencent:'$'}
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message))
  for (const route of ['calculateur-investissement','il-y-a-x-ans','performance-depuis']) {
    await page.goto(`${base}/${route}`,{waitUntil:'networkidle'})
    await page.evaluate(()=>{window.__painted=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__painted.push(String(text));return original.call(this,text,...args)}})
    const picker=route==='calculateur-investissement'?page.getByRole('group',{name:'Choisir un actif',exact:true}):page.locator('#subject-select')
    await picker.waitFor()
    const more=picker.getByRole('button',{name:/^Afficher davantage/})
    while(await more.count()) await more.click()
    for(const id of ids) assert.equal(await picker.locator(`[data-option][data-value="${id}"]`).count(),1,`${route}: ${id} available`)
    for(const [id,symbol] of Object.entries(samples)) {
      console.log(`Checking ${route}/${id}`)
      await choose(picker,id)
      if(route!=='calculateur-investissement') {
        await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
        await page.waitForFunction(({label,symbol})=>{
          const text=document.querySelector('pre')?.textContent??''
          return text.includes(label)&&(!symbol||text.includes(symbol))
        },{label:ASSETS[id].label,symbol:route==='il-y-a-x-ans'?symbol:null})
        // Selected histories load asynchronously; wait for the generated text before checking its currency.
        await page.waitForFunction(()=>Boolean(document.querySelector('pre')?.textContent.trim()),{},{timeout:60000})
        const post=await page.locator('pre').innerText()
        assert(!/NaN|undefined|\[à saisir\]/.test(post),post)
        if(route==='il-y-a-x-ans') assert(post.includes(symbol),`${id}: currency in text`)
      } else {
        assert(!(await page.locator('body').innerText()).includes('NaN'))
        assert((await page.locator('.ic-current-level').innerText()).includes(symbol),`${id}: currency in current level`)
      }
      await page.evaluate(()=>{window.__painted=[]})
      await page.getByRole('tab',{name:'Image',exact:true}).click()
      await page.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000})
      assert((await page.locator('.publication-image-stage img').getAttribute('src')).startsWith('data:image/png'))
      if(route!=='performance-depuis') assert(await page.evaluate(symbol=>window.__painted.some(t=>t.includes(symbol)),symbol),`${route}/${id}: currency on exported image`)
      await page.getByRole('tab',{name:'Texte',exact:true}).click()
    }
    await page.setViewportSize({width:390,height:844})
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route}: mobile overflow`)
    await page.setViewportSize({width:1280,height:900})
  }
  assert.deepEqual(errors,[])
  console.log(`Browser: ${ids.length} equities in all 3 tools; ${Object.keys(samples).length*3} PNGs, all quote currencies and mobile verified.`)
} finally {await browser?.close();server.kill()}
