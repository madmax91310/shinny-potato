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
  const requests=[]; page.on('request', request=>requests.push(request.url()))
  await page.goto(base)
  const records=await page.evaluate(async()=>{
    const { renderAnniversaryImage }=await import('/shinny-potato/src/pages/tweet-midi/anniversaryImage.js')
    const { ANNIVERSARY_ART }=await import('/shinny-potato/src/pages/tweet-midi/anniversaryArt.js')
    const { ANNIVERSAIRE_ELIGIBLE_ASSETS,getHistoricalPrice,ymForYearsBack,getValidYearsBackOptions }=await import('/shinny-potato/src/pages/tweet-midi/data/marketHistory.js')
    const { TODAY }=await import('/shinny-potato/src/pages/tweet-midi/lib.js')
    const records=[];let labels=[], bounds=[]
    const original=CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){
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
      const yearsBack=Math.min(7,...[Math.max(...getValidYearsBackOptions(asset.id,TODAY))])
      const past=getHistoricalPrice(asset.id,ymForYearsBack(yearsBack,TODAY))
      const current=past*1.5
      labels=[];bounds=[]
      const canvas=await renderAnniversaryImage({mode:'simple',assetId:asset.id,yearsBack},String(current))
      if(!labels.includes('+50,0 %'))throw new Error(`${asset.id}: ratio changed`)
      if(labels.filter(v=>v==='ÉPARGNANT LIBRE').length!==1)throw new Error(`${asset.id}: signature count`)
      if(!labels.includes(ANNIVERSARY_ART[asset.id].title))throw new Error(`${asset.id}: mismatched title`)
      if(!labels.some(v=>v.endsWith(ANNIVERSARY_ART[asset.id].unit || (asset.currency==='USD'?'$':'€'))))throw new Error(`${asset.id}: wrong unit`)
      if(asset.id==='or'&&!labels.some(v=>v.includes('CC BY 4.0')))throw new Error('Gold attribution lost')
      if(canvas.width!==1600||canvas.height!==2000)throw new Error('Incorrect single aspect ratio')
      records.push({name:asset.id,png:canvas.toDataURL(),labels:[...labels]})
    }
    for(const [a,b] of [['apple','or'],['bitcoin','ethereum'],['asml','berkshire'],['nasdaq100','soxx']]){
      const yearsBack=3, pastA=getHistoricalPrice(a,ymForYearsBack(yearsBack,TODAY)),pastB=getHistoricalPrice(b,ymForYearsBack(yearsBack,TODAY))
      labels=[];bounds=[]
      const canvas=await renderAnniversaryImage({mode:'comparatif',assetIdA:a,assetIdB:b,yearsBack},String(pastA*1.5),String(pastB*.75))
      if(!labels.includes('+50,0 %')||!labels.includes('−25,0 %'))throw new Error('Comparative inputs mixed up')
      if(labels.filter(v=>v==='ÉPARGNANT LIBRE').length!==1||labels.filter(v=>v==='EN 3 ANS').length!==1)throw new Error('Comparative repetitions')
      if(canvas.width!==2400||canvas.height!==1500)throw new Error('Incorrect comparative aspect ratio')
      records.push({name:`${a}-${b}`,png:canvas.toDataURL(),labels:[...labels]})
    }
    for(const current of ['', 'no', '0', '-1', 'Infinity']){
      let rejected=false;try{await renderAnniversaryImage({mode:'simple',assetId:'apple',yearsBack:3},current)}catch{rejected=true}
      if(!rejected)throw new Error(`Invalid current accepted: ${current}`)
    }
    labels=[];bounds=[]
    const long=await renderAnniversaryImage({mode:'simple',assetId:'bitcoin',yearsBack:1},'1234567890123.45')
    if(!long.toDataURL().startsWith('data:image/png;'))throw new Error('Large levels break export')
    return records
  })
  assert.ok(!requests.some(url=>!url.startsWith(`http://127.0.0.1:${port}`)), 'External request during export')
  await mkdir('test-artifacts/anniversary',{recursive:true})
  for(const record of records){
    await writeFile(`test-artifacts/anniversary/${record.name}.png`,Buffer.from(record.png.split(',')[1],'base64'))
    await writeFile(`test-artifacts/anniversary/${record.name}.txt`,record.labels.join('\n'))
  }
  // A failed visual load must not silently export a wrong generic logo, and retry works.
  const retry=await browser.newPage();await retry.goto(base)
  await retry.route('**/asset-art/apple.svg', route=>route.abort())
  const failed=await retry.evaluate(async()=>{try{const{renderAnniversaryImage}=await import('/shinny-potato/src/pages/tweet-midi/anniversaryImage.js');await renderAnniversaryImage({mode:'simple',assetId:'apple',yearsBack:1},'200');return false}catch{return true}})
  assert.ok(failed,'Missing logo should block export')
  await retry.unroute('**/asset-art/apple.svg')
  assert.ok(await retry.evaluate(async()=>{const{renderAnniversaryImage}=await import('/shinny-potato/src/pages/tweet-midi/anniversaryImage.js');return(await renderAnniversaryImage({mode:'simple',assetId:'apple',yearsBack:1},'200')).toDataURL().startsWith('data:image/png;')}),'Retry after missing logo failed')
  console.log(`${records.length} titanium exports: every eligible identity, units, ratios, comparisons, long levels, local resources and retry verified.`)
}finally{await browser?.close();server.kill('SIGTERM')}
