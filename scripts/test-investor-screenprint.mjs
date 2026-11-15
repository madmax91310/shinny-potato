import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { sample } from './test-investor-publication.mjs'
const port=4329,base=`http://127.0.0.1:${port}/shinny-potato/`,out='test-artifacts/investor-screenprint'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true})
  const context=await browser.newContext({acceptDownloads:true,permissions:['clipboard-read','clipboard-write']})
  const page=await context.newPage();await page.goto(base)
  await mkdir(out,{recursive:true})
  const results=[]
  const cases=[['concentre',sample([999900,100])],['dense',sample(Array(300).fill(1))],['longs',sample([5,4,3,2,1],true)],['petite',sample([999999,1])]]
  for(const [slug] of (await import('../src/pages/investor-portfolio/data.js')).INVESTORS)cases.push([slug,JSON.parse(await readFile(`public/data/investors/${slug}.json`,'utf8'))])
  for(const [id,payload] of cases){
    const result=await page.evaluate(async({payload,id})=>{
      const {normalizePortfolio,buildTweet}=await import('/shinny-potato/src/pages/investor-portfolio/data.js')
      const {publicationPlan}=await import('/shinny-potato/src/pages/investor-portfolio/publication.js')
      const {renderPortfolioImage}=await import('/shinny-potato/src/pages/investor-portfolio/image.js')
      const portfolio=normalizePortfolio(payload)
      if(portfolio.problem){let refused=false;try{await renderPortfolioImage(portfolio)}catch{refused=true}if(!refused)throw Error('Incomplete filing rendered');return {id,status:'incomplete',reason:portfolio.problem}}
      const boxes=[], original=CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
        const m=this.measureText(value),align=this.textAlign==='center'?m.width/2:this.textAlign==='right'?m.width:0
        const b={text:value,l:x-align-m.actualBoundingBoxLeft,r:x-align+m.actualBoundingBoxRight,t:y-m.actualBoundingBoxAscent,b:y+m.actualBoundingBoxDescent}
        // actualBoundingBoxLeft/Right already account for textAlign in Chromium.
        b.l=x-m.actualBoundingBoxLeft;b.r=x+m.actualBoundingBoxRight
        if(b.l<0||b.r>this.canvas.width||b.t<0||b.b>this.canvas.height)throw Error(`Clipped ${id}: ${value} ${JSON.stringify(b)}`)
        for(const p of boxes)if(Math.min(p.r,b.r)-Math.max(p.l,b.l)>1&&Math.min(p.b,b.b)-Math.max(p.t,b.t)>1)throw Error(`Overlap ${id}: ${p.text} / ${value}`)
        boxes.push(b);return original.call(this,value,x,y,...args)
      }
      let png
      try{png=await renderPortfolioImage(portfolio)}finally{CanvasRenderingContext2D.prototype.fillText=original}
      const img=new Image();img.src=png;await img.decode()
      if(img.width!==1080||img.height!==1350)throw Error('Dimensions')
      const plan=publicationPlan(portfolio),tweet=buildTweet(portfolio)
      for(const r of plan.entries)if(!tweet.includes(r.label))throw Error('Text/image mismatch')
      return {id,status:'ready',png,entries:plan.entries.map(r=>({label:r.label,value:r.value,weight:r.weight,other:r.other||false})),total:plan.total,boxes}
    },{payload,id})
    if(result.png){await writeFile(`${out}/${id}.png`,Buffer.from(result.png.split(',')[1],'base64'));delete result.png}
    results.push(result)
  }
  // Real app download, preview bytes, copy, full exports, errors and retry.
  const fixture=sample([900000,99999,1]);Object.assign(fixture.data.snapshot.holdings[0],{issuerName:'Apple Inc.',ticker:'AAPL',cusip:'037833100'});fixture.data.identity.personVerified=true;fixture.data.identity.personSource='https://foliofact.com/api/v1/funds/appaloosa';fixture.data.identity.personPeriod='2026-06-30'
  await page.route('**/data/investors/tepper.json',route=>route.fulfill({json:fixture}))
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});await page.goto(`${base}portefeuilles-investisseurs`)
    if(width<700)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
    await page.getByRole('button',{name:'📋 Copier le tweet'}).click()
    const draft=await page.locator('#ip-draft').inputValue();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),draft)
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'⬇️ Télécharger le PNG',exact:true}).click()])
    await download.saveAs(`${out}/download-${width}.png`)
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    const preview=page.getByRole('img',{name:'Portefeuille David Tepper',exact:true});await preview.waitFor()
    const previewBytes=Buffer.from((await preview.getAttribute('src')).split(',')[1],'base64')
    assert.deepEqual(await readFile(`${out}/download-${width}.png`),previewBytes)
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:`${out}/mobile-image-${width}.png`,fullPage:true})
    await page.getByRole('tab',{name:'Texte',exact:true}).click()
    const [json]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger le détail JSON et les crédits'}).click()]);await json.saveAs(`${out}/detail-${width}.json`)
    assert.equal(JSON.parse(await readFile(`${out}/detail-${width}.json`,'utf8')).holdings.length,3)
    const [zip]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger les PNG détaillés (ZIP)'}).click()]);await zip.saveAs(`${out}/detail-${width}.zip`)
  }
  // Source outage preserves the last valid snapshot and can be retried.
  await page.route('**/data/investors/tepper.json',route=>route.fulfill({status:503,body:'Unavailable'}))
  await page.getByRole('button',{name:'Actualiser les données disponibles'}).click()
  await page.getByRole('alert').filter({hasText:'503'}).waitFor()
  assert.equal(await page.locator('#ip-draft').inputValue(),await page.evaluate(async p=>(await import('/shinny-potato/src/pages/investor-portfolio/data.js')).buildTweet((await import('/shinny-potato/src/pages/investor-portfolio/data.js')).normalizePortfolio(p)),fixture))
  await page.unroute('**/data/investors/tepper.json')
  await page.route('**/data/investors/tepper.json',route=>route.fulfill({json:fixture}))
  await page.getByRole('button',{name:'Réessayer le chargement'}).click();await page.getByRole('alert').filter({hasText:'503'}).waitFor({state:'hidden'})
  // One real Canvas export failure exposes a retry action and then succeeds.
  await page.evaluate(()=>{const original=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(){HTMLCanvasElement.prototype.toDataURL=original;throw new Error('Erreur de génération simulée')}})
  await page.getByRole('button',{name:'⬇️ Télécharger le PNG',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'Erreur de génération simulée'}).waitFor()
  const [retried]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Réessayer le PNG',exact:true}).click()]);await retried.saveAs(`${out}/retry.png`)
  // Portrait/logos unavailable => initials, no unusable or invented portrait.
  await page.route('**/data/investors/media/*.png',route=>route.abort())
  await page.route(/asset-art\/(?:official|index)-logos\/.*\.(?:svg|png|webp|jpg)(?:\?|$)/,route=>route.abort())
  await page.reload();await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  const [fallback]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'⬇️ Télécharger le PNG',exact:true}).click()]);await fallback.saveAs(`${out}/fallback.png`)
  assert(await page.evaluate(async()=>!(await (await import('/shinny-potato/src/pages/investor-portfolio/media.js')).positionLogo({issuerName:'Apple Inc.',cusip:'037833100'})).image))
  await page.unroute(/asset-art\/(?:official|index)-logos\/.*\.(?:svg|png|webp|jpg)(?:\?|$)/)
  assert(await page.evaluate(async()=>Boolean((await (await import('/shinny-potato/src/pages/investor-portfolio/media.js')).positionLogo({issuerName:'Apple Inc.',cusip:'037833100'})).image)))
  const incomplete=sample([3,2]);delete incomplete.data.snapshot.holdings[0].value
  await page.unroute('**/data/investors/tepper.json');await page.route('**/data/investors/tepper.json',route=>route.fulfill({json:incomplete}));await page.reload()
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByText(/Données incomplètes : Montants/).first().waitFor();assert(await page.getByRole('button',{name:'⬇️ Télécharger le PNG',exact:true}).isDisabled())
  await writeFile(`${out}/results.json`,JSON.stringify(results,null,2))
  console.log(`${results.filter(r=>r.status==='ready').length} PNG contrôlés ; mobile/ordinateur, téléchargement identique, copie, JSON/ZIP, pannes et réessai validés.`)
}catch(error){console.error(error);throw error}finally{await browser?.close();server.kill('SIGTERM')}
