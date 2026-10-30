import {mockRadarChrome,isRadarChromeRequest} from './lib/browser-radar-chrome.mjs'
import { choose } from './card-selection.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { ANNIVERSARY_ART } from '../src/pages/tweet-midi/anniversaryArt.js'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS } from '../src/pages/tweet-midi/data/marketHistory.js'

for (const asset of ANNIVERSAIRE_ELIGIBLE_ASSETS) {
  const art = ANNIVERSARY_ART[asset.id]
  assert.ok(art, `${asset.id}: no verified visual identity`)
  for (const file of [art.scene || 'titanium.webp', art.mark].filter(Boolean)) await readFile(`public/asset-art/${file}`)
}
assert.ok(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a => a.id === 'sp500'), 'S&P 500 absent')
assert.ok(ANNIVERSAIRE_ELIGIBLE_ASSETS.find(a => a.id === 'sp500').anniversaryVariant.includes('Total Return'))
const port = 4314, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for (let attempt=0;attempt<100;attempt++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve=>setTimeout(resolve,200))
  }
  browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page = await browser.newPage()
  await mockRadarChrome(page)
  const requests=[]; page.on('request', request=>{if(!isRadarChromeRequest(request))requests.push(request.url())})
  await page.goto(base)
  await page.goto(`${base}tweet-midi`)
  await page.getByRole('button', {name:'Il y a X ans', exact:true}).click()
  await choose(page.locator('#subject-select'), 'sp500')
  await page.getByRole('button', {name:'🔄 Générer', exact:true}).click()
  await page.locator('#niveau-actuel').fill('15000')
  assert.ok(await page.getByText('S&P 500 : Total Return', {exact:false}).isVisible(), 'Index variant missing in input')
  // Stream each export separately: a growing catalogue must not build a
  // single >512 MB Playwright message containing every PNG.
  await mkdir('test-artifacts/anniversary',{recursive:true})
  await page.exposeFunction('saveAnniversaryExport',async record=>{
    await writeFile(`test-artifacts/anniversary/${record.name}.png`,Buffer.from(record.png.split(',')[1],'base64'))
    await writeFile(`test-artifacts/anniversary/${record.name}.txt`,record.labels.join('\n'))
  })
  const records=await page.evaluate(async()=>{
    const { renderAnniversaryImage }=await import('/shinny-potato/src/pages/tweet-midi/anniversaryImage.js')
    const { ANNIVERSARY_ART }=await import('/shinny-potato/src/pages/tweet-midi/anniversaryArt.js')
    const { ANNIVERSAIRE_ELIGIBLE_ASSETS,getHistoricalPrice,ymForYearsBack,getValidYearsBackOptions }=await import('/shinny-potato/src/pages/tweet-midi/data/marketHistory.js')
    const { TODAY }=await import('/shinny-potato/src/pages/tweet-midi/lib.js')
    const { getMarketAsset }=await import('/shinny-potato/src/pages/tweet-midi/engines/anniversaire.js')
    const records=[];let labels=[], bounds=[]
    const original=CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){
      // Only compare text on the exported canvas, not an offscreen metal mask.
      if (this.canvas.width === 1400 && this.canvas.height === 380) return original.call(this,value,x,y,...rest)
      const metric=this.measureText(value)
      const start=this.textAlign==='center'?x-metric.width/2:this.textAlign==='right'?x-metric.width:x
      if(start<0 || start+metric.width>this.canvas.width+1) throw new Error(`Text clipped: ${value}`)
      const t=this.getTransform()
      const box={text:String(value),left:t.a*(x-metric.actualBoundingBoxLeft)+t.e,right:t.a*(x+metric.actualBoundingBoxRight)+t.e,top:t.d*(y-metric.actualBoundingBoxAscent)+t.f,bottom:t.d*(y+metric.actualBoundingBoxDescent)+t.f}
      for(const previous of bounds){
        if(Math.min(box.right,previous.right)-Math.max(box.left,previous.left)>1 && Math.min(box.bottom,previous.bottom)-Math.max(box.top,previous.top)>1)throw new Error(`Overlapping text: ${JSON.stringify(previous)} / ${JSON.stringify(box)}`)
      }
      bounds.push(box);labels.push(String(value));return original.call(this,value,x,y,...rest)
    }
    for(const asset of ANNIVERSAIRE_ELIGIBLE_ASSETS){
      const options=getValidYearsBackOptions(asset.id,TODAY)
      const yearsBack=options.filter(year=>year<=7).at(-1)??options[0]
      if(!options.includes(yearsBack))throw new Error(`No qualified anniversary window: ${asset.id}`)
      const past=getHistoricalPrice(asset.id,ymForYearsBack(yearsBack,TODAY))
      const current=past*1.5
      labels=[];bounds=[]
      const canvas=await renderAnniversaryImage({mode:'simple',assetId:asset.id,yearsBack},String(current))
      if(!labels.includes('+50,0 %'))throw new Error(`${asset.id}: ratio changed`)
      if(!labels.includes('AUJOURD’HUI'))throw new Error(`${asset.id}: current label missing`)
      if(labels.filter(v=>v==='ÉPARGNANT LIBRE').length!==1)throw new Error(`${asset.id}: signature count`)
      if(!labels.includes(ANNIVERSARY_ART[asset.id].title))throw new Error(`${asset.id}: mismatched title`)
      if(getMarketAsset(asset.id).currency!==asset.currency)throw new Error(`${asset.id}: displayed currency differs from history`)
      // CLDR versions differ on narrow symbols (for example $ versus $CA).
      // Assert the history currency and the browser's exact localized unit.
      const expectedUnit=ANNIVERSARY_ART[asset.id].unit || (asset.currency==='GBp'?'GBp':new Intl.NumberFormat('fr-FR',{style:'currency',currency:asset.currency,currencyDisplay:'narrowSymbol'}).formatToParts(0).find(part=>part.type==='currency').value)
      if(!expectedUnit || !labels.some(v=>v.endsWith(expectedUnit)))throw new Error(`${asset.id}: wrong unit for ${asset.currency}`)
      if(asset.id==='or'&&!labels.some(v=>v.includes('CC BY 4.0')))throw new Error('Gold attribution lost')
      if(canvas.width!==1600||canvas.height!==2000)throw new Error('Incorrect single aspect ratio')
      await window.saveAnniversaryExport({name:asset.id,png:canvas.toDataURL(),labels:[...labels]})
      records.push({name:asset.id})
    }
    for(const [a,b] of [['apple','or'],['bitcoin','ethereum'],['asml','berkshire'],['nasdaq100','soxx'],['sp500','cac40'],['msciWorld','stoxx600'],['nvidia','amazon'],['google','meta'],['lvmh','airliquide'],['netflix','visa'],['cocacola','nvidia'],['costco','mcdonalds'],['intel','paypal'],['schneider','hermes'],['loreal','nestle'],['sap','msciEurope'],['msciUsa','msciIndia'],['russell2000','msciEmergingExChina'],['msciWorldMomentum','msciWorldQuality'],['msciWorldValue','ftseAllWorld']]){
      const common=getValidYearsBackOptions(a,TODAY).filter(year=>getValidYearsBackOptions(b,TODAY).includes(year))
      const yearsBack=common.filter(year=>year<=3).at(-1)??common[0], pastA=getHistoricalPrice(a,ymForYearsBack(yearsBack,TODAY)),pastB=getHistoricalPrice(b,ymForYearsBack(yearsBack,TODAY))
      labels=[];bounds=[]
      const canvas=await renderAnniversaryImage({mode:'comparatif',assetIdA:a,assetIdB:b,yearsBack},String(pastA*1.5),String(pastB*.75))
      if(!labels.includes('+50,0 %')||!labels.includes('−25,0 %'))throw new Error('Comparative inputs mixed up')
      if(labels.filter(v=>v==='ÉPARGNANT LIBRE').length!==1||labels.filter(v=>v===`EN ${yearsBack} ${yearsBack===1?'AN':'ANS'}`).length!==1)throw new Error('Comparative repetitions')
      if(canvas.width!==2400||canvas.height!==1500)throw new Error('Incorrect comparative aspect ratio')
      await window.saveAnniversaryExport({name:`${a}-${b}`,png:canvas.toDataURL(),labels:[...labels]})
      records.push({name:`${a}-${b}`})
    }
    for(const current of ['no', '0', '-1', 'Infinity']){
      let rejected=false;try{await renderAnniversaryImage({mode:'simple',assetId:'apple',yearsBack:3},current)}catch{rejected=true}
      if(!rejected)throw new Error(`Invalid current accepted: ${current}`)
    }
    labels=[];bounds=[]
    const long=await renderAnniversaryImage({mode:'simple',assetId:'bitcoin',yearsBack:1},'1234567890123.45')
    if(!long.toDataURL().startsWith('data:image/png;'))throw new Error('Large levels break export')
    return records
  })
  assert.ok(!requests.some(url=>!url.startsWith(`http://127.0.0.1:${port}`)), 'External request during export')
  // A failed logo load uses a clean name; failed cache entries allow recovery.
  const retry=await browser.newPage();await retry.goto(base)
  await retry.route('**/asset-art/official-logos/apple.svg', route=>route.abort())
  const inspectApple = async () => {
    const labels = [], original = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function(value, ...args) { labels.push(value); return original.call(this, value, ...args) }
    try {
      const {renderAnniversaryImage} = await import('/shinny-potato/src/pages/tweet-midi/anniversaryImage.js')
      const canvas = await renderAnniversaryImage({mode:'simple',assetId:'apple',yearsBack:1},'200')
      return { names: labels.filter(value => value === 'APPLE').length, png: canvas.toDataURL().startsWith('data:image/png;') }
    } finally { CanvasRenderingContext2D.prototype.fillText = original }
  }
  assert.deepEqual(await retry.evaluate(inspectApple), {names:2,png:true}, 'Missing logo must export a clean text fallback')
  await retry.unroute('**/asset-art/official-logos/apple.svg')
  assert.deepEqual(await retry.evaluate(inspectApple), {names:1,png:true}, 'Retry must restore the official logo')
  console.log(`${records.length} anniversary exports: every eligible identity, units, ratios, comparisons, long levels, local resources and fallback/retry verified.`)
}finally{await browser?.close();server.kill('SIGTERM')}
