import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
const port=4361,base=`http://127.0.0.1:${port}/shinny-potato`
const samples={etfUsaSmallValue:'€',etfWorldMidEqual:'$',etfEmValue:'$',etfEuroUltrashort:'€',etfWorldMaterialsDws:'$'}
const ids=Object.keys(samples)
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message))
  for (const route of ['calculateur-investissement','il-y-a-x-ans','performance-depuis']) {
    await page.goto(`${base}/${route}`,{waitUntil:'networkidle'})
    await page.evaluate(()=>{window.__painted=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__painted.push(String(text));return original.call(this,text,...args)}})
    await page.locator(`[data-option][data-value="${ids[0]}"]`).waitFor({state:'attached',timeout:60000})
    for(const id of ids) assert.equal(await page.locator(`[data-option][data-value="${id}"]`).count(),1,`${route}: ${id} available`)
    for(const [id,symbol] of Object.entries(samples)) {
      await page.locator(`[data-option][data-value="${id}"]`).click()
      if(route!=='calculateur-investissement') {
        await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
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
  console.log(`Browser: ${ids.length} new ETF histories in all 3 tools; ${Object.keys(samples).length*3} PNGs, EUR/USD and mobile verified.`)
} finally {await browser?.close();server.kill()}
