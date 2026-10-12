import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
const ids = ['etfWorldMultifactor','etfIbondsEuro2028','etcSilverPhysical','etfSilverMiners']
const port = 4324, base = `http://127.0.0.1:${port}/shinny-potato`
const server = spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++) { try { if((await fetch(base+'/')).ok)break }catch{} await new Promise(r=>setTimeout(r,200)) }
  browser = await chromium.launch({headless:true})
  const page = await browser.newPage({viewport:{width:1280,height:900}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await mkdir('test-artifacts/round4',{recursive:true})
  for(const id of ids) {
    await page.goto(`${base}/calculateur-investissement?asset=${id}`)
    await page.locator('.ic-hero-number').waitFor()
    await page.getByRole('button',{name:'Mensuel (DCA)',exact:true}).first().click()
    assert(!/NaN|undefined/.test(await page.locator('.ic-card').innerText()))
    await page.screenshot({path:`test-artifacts/round4/${id}.png`})
    const image=await page.evaluate(async id=>{
      const {ASSETS}=await import('/shinny-potato/src/data/market-history.js')
      const {derive}=await import('/shinny-potato/src/pages/investment-calculator/lib.js')
      const {renderInvestmentImage}=await import('/shinny-potato/src/pages/investment-calculator/imageExport.js')
      const {renderPerformanceImage}=await import('/shinny-potato/src/pages/tweet-midi/performanceImage.js')
      const a=ASSETS[id],date=a.points[0].date,s={assetId:id,amountRaw:'100',startYear:Number(date.slice(0,4)),startMonth:Number(date.slice(5)),mode:'dca',overridePriceRaw:''}
      const investment=await renderInvestmentImage(s,derive(s))
      const performance=await renderPerformanceImage({mode:'simple',assetId:id,year:Number(date.slice(0,4))+1})
      if(!investment.width||!performance.width)throw Error('Empty export')
      return investment.toDataURL()
    },id)
    await writeFile(`test-artifacts/round4/${id}-export.png`,Buffer.from(image.split(',')[1],'base64'))
    await page.goto(`${base}/performance-depuis?asset=${id}`)
    await page.locator(`[data-option][data-value="${id}"][aria-pressed="true"]`).waitFor()
  }
  await page.goto(`${base}/fiches-etf`)
  for(const [id,isin]of [['world-multifactor','IE00BZ0PKT83'],['ibonds-euro-2028','IE0008UEVOE0']]){
    await page.locator(`#es-etf-select [data-option][data-value="${id}"]`).click()
    assert((await page.locator('.es-card').innerText()).includes(isin))
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    await page.getByRole('tabpanel').locator('img').waitFor()
    await page.screenshot({path:`test-artifacts/round4/${id}-sheet.png`})
    await page.getByRole('tab',{name:'Texte',exact:true}).click()
  }
  assert.deepEqual(errors,[])
  console.log('Round 4: four DCA simulations, performance exports and two issuer sheets exercised in Chromium.')
}finally{await browser?.close();server.kill('SIGTERM')}
