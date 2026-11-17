import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import { choose } from './card-selection.mjs'
import { sample } from './test-investor-publication.mjs'
const port=4329,base=`http://127.0.0.1:${port}/shinny-potato/`,out='test-artifacts/investor-screenprint'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const context=await browser.newContext({acceptDownloads:true,permissions:['clipboard-read','clipboard-write']})
  const page=await context.newPage();await page.goto(base+'portefeuilles-investisseurs')
  await page.waitForFunction(()=>Boolean(document.querySelector('#ip-draft')?.value))
  await mkdir(out,{recursive:true})
  const results=[]
  const cases=[['concentre',sample([999900,100])],['dense',sample(Array(300).fill(1))],['longs',sample([5,4,3,2,1],true)],['petite',sample([999999,1])]]
  for(const [slug] of (await import('../src/pages/investor-portfolio/data.js')).INVESTORS)cases.push([slug,JSON.parse(await readFile(`public/data/investors/${slug}.json`,'utf8'))])
  for(const [id,payload] of cases){
    const result=await page.evaluate(async({payload,id})=>{
      const {normalizePortfolio,buildTweet}=await import('/shinny-potato/src/pages/investor-portfolio/data.js')
      const {publicationPlan,editorialSeries,weightLabel}=await import('/shinny-potato/src/pages/investor-portfolio/publication.js')
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
      const named=plan.entries.filter(r=>!r.other),coverage=named.reduce((sum,r)=>sum+r.value,0)/plan.total
      if(editorialSeries(portfolio).coverage<.5){
        if(!boxes.some(b=>b.text.includes(`${named.length} positions affichées`)) || !boxes.some(b=>b.text.includes(weightLabel(coverage))))throw Error('Main coverage must describe the actually named positions')
        if(boxes.some(b=>/premières/.test(b.text)))throw Error('Editorial coverage leaked into main image')
      }
      for(const r of plan.entries)if(!tweet.includes(r.label))throw Error('Text/image mismatch')
      return {id,status:'ready',png,entries:plan.entries.map(r=>({label:r.label,value:r.value,weight:r.weight,other:r.other||false})),total:plan.total,boxes}
    },{payload,id})
    if(result.png){await writeFile(`${out}/${id}.png`,Buffer.from(result.png.split(',')[1],'base64'));delete result.png}
    results.push(result)
  }
  const seriesChecks=[]
  for(const [id,payload] of cases){
    const check=await page.evaluate(async({id,payload})=>{
      const {normalizePortfolio}=await import('/shinny-potato/src/pages/investor-portfolio/data.js')
      const {editorialSeries}=await import('/shinny-potato/src/pages/investor-portfolio/publication.js')
      const {renderSeriesPage}=await import('/shinny-potato/src/pages/investor-portfolio/series-image.js')
      const p=normalizePortfolio(payload);if(p.problem)return {id,blocked:true}
      const series=editorialSeries(p),original=CanvasRenderingContext2D.prototype.fillText
      for(let i=1;i<series.pages.length;i++){
        const boxes=[]
        CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
          const m=this.measureText(value),b={value,l:x-m.actualBoundingBoxLeft,r:x+m.actualBoundingBoxRight,t:y-m.actualBoundingBoxAscent,b:y+m.actualBoundingBoxDescent}
          if(b.l<0||b.r>1080||b.t<0||b.b>1350)throw Error(`Series clipped ${id}: ${value}`)
          for(const a of boxes)if(Math.min(a.r,b.r)-Math.max(a.l,b.l)>1&&Math.min(a.b,b.b)-Math.max(a.t,b.t)>1)throw Error(`Series overlap ${id}: ${a.value} / ${value}`)
          boxes.push(b);return original.call(this,value,x,y,...args)
        }
        try{await renderSeriesPage(p,i)}finally{CanvasRenderingContext2D.prototype.fillText=original}
      }
      return {id,pages:series.pages.length,covered:series.coveredCount,coverage:series.coverage}
    },{id,payload})
    seriesChecks.push(check)
  }
  await writeFile(`${out}/series-layout.json`,JSON.stringify(seriesChecks,null,2))
  // An explicitly sourced historical illustration never changes corporate ownership.
  await page.evaluate(async()=>{
    const {portfolioPortrait}=await import('/shinny-potato/src/pages/investor-portfolio/media.js')
    const {portfolioOwner}=await import('/shinny-potato/src/pages/investor-portfolio/publication.js')
    const {normalizePortfolio}=await import('/shinny-potato/src/pages/investor-portfolio/data.js')
    const manifest=await(await fetch('/shinny-potato/data/investors/media/manifest.json')).json()
    const p=normalizePortfolio(await(await fetch('/shinny-potato/data/investors/berkshire.json')).json())
    const portrait=await portfolioPortrait(p.identity,manifest.berkshire)
    if(!portrait.image||portrait.person!=='Warren Buffett'||portfolioOwner(p)!=='Berkshire Hathaway')throw Error('Historical illustration/ownership')
    const wrong=await portfolioPortrait(p.identity,{...manifest.berkshire,person:'Homonyme'})
    if(wrong.image)throw Error('Unverified historical portrait accepted')
    const entity=await portfolioPortrait({slug:'gates-trust',displayName:'Gates Foundation Trust'},manifest['gates-trust'])
    if(!entity.image||entity.person!=='Bill Gates')throw Error('Verified Gates trustee illustration missing')
    const baker=await portfolioPortrait({slug:'baker-bros',displayName:'Baker Bros. Advisors'},manifest['baker-bros'])
    if(baker.image)throw Error('Unverified founder illustration accepted')
    for(const slug of ['pabrai','li-lu','renaissance']){
      const payload=await(await fetch(`/shinny-potato/data/investors/${slug}.json`)).json()
      const p=normalizePortfolio(payload),photo=await portfolioPortrait(p.identity,manifest[slug])
      if(!photo.image)throw Error(`Verified photograph missing: ${slug}`)
    }
  })
  // The actual paginated Canvas must keep each security's name, identifiers and
  // monetary line together. Reproduce the orphaned Monro/Gayner amounts from the audit.
  for(const slug of ['icahn','gayner','tepper']) {
    const payload=JSON.parse(await readFile(`public/data/investors/${slug}.json`,'utf8'))
    await page.evaluate(async payload=>{
      const {normalizePortfolio}=await import('/shinny-potato/src/pages/investor-portfolio/data.js')
      const {renderDetailedPages}=await import('/shinny-potato/src/pages/investor-portfolio/exports.js')
      const {reportedAmount,weightLabel}=await import('/shinny-potato/src/pages/investor-portfolio/publication.js')
      const {labelLines}=await import('/shinny-potato/src/pages/investor-portfolio/detail-labels.js')
      const portfolio=normalizePortfolio(payload),draws=new Map(),original=CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText=function(value,...args){const rows=draws.get(this.canvas)||[];rows.push(value);draws.set(this.canvas,rows);return original.call(this,value,...args)}
      try { await renderDetailedPages(portfolio) } finally { CanvasRenderingContext2D.prototype.fillText=original }
      const pages=[...draws.values()]
      for(const row of portfolio.holdings) {
        const required=[...labelLines(row.issuerName,56),...labelLines([row.ticker,row.shareClass,row.cusip,row.securityId].filter(Boolean).join(' · '),56),...labelLines(`${reportedAmount(row)} · ${weightLabel(row.weight)}`,56)]
        if(!pages.some(page=>required.every(line=>page.includes(line))))throw Error(`Position split across pages: ${row.issuerName}`)
      }
    },payload)
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
    assert(download.url().startsWith('blob:'),'Main PNG must use the same Blob download path as the preview')
    await download.saveAs(`${out}/download-${width}.png`)
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    const preview=page.getByRole('img',{name:'Portefeuille David Tepper',exact:true});await preview.waitFor()
    const previewBytes=Buffer.from((await preview.getAttribute('src')).split(',')[1],'base64')
    assert.deepEqual(await readFile(`${out}/download-${width}.png`),previewBytes)
    const [previewDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger cet aperçu',exact:true}).click()]);await previewDownload.saveAs(`${out}/preview-download-${width}.png`)
    assert.deepEqual(await readFile(`${out}/preview-download-${width}.png`),previewBytes,'Both buttons must save the exact same PNG')
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:`${out}/mobile-image-${width}.png`,fullPage:true})
    await page.getByRole('tab',{name:'Texte',exact:true}).click()
    const detailSummary=page.getByText('Détail intégral · 3 positions',{exact:true})
    await detailSummary.click()
    await page.waitForFunction(()=>[...document.querySelectorAll('details')].some(d=>d.open&&d.querySelector('summary')?.textContent==='Détail intégral · 3 positions'&&d.querySelectorAll('p').length===3))
    assert((await detailSummary.locator('..').innerText()).includes('037833100'))
    await detailSummary.click()
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
  // A fresh snapshot invalidates the shared successful preview/download cache.
  await page.getByRole('button',{name:'Actualiser les données disponibles'}).click()
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Actualiser les données disponibles')&&!b.disabled))
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
  const incompleteDetail=await page.evaluate(async payload=>{
    const {normalizePortfolio}=await import('/shinny-potato/src/pages/investor-portfolio/data.js')
    const {renderDetailedPages,detailedCSV,detailedExport}=await import('/shinny-potato/src/pages/investor-portfolio/exports.js')
    const portfolio=normalizePortfolio(payload),labels=[],original=CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText=function(value,...args){labels.push(value);return original.call(this,value,...args)}
    let pages;try{pages=await renderDetailedPages(portfolio)}finally{CanvasRenderingContext2D.prototype.fillText=original}
    if(!labels.includes('DONNÉES INCOMPLÈTES')||!detailedCSV(portfolio).includes('INCOMPLET')||detailedExport(portfolio).status!=='incomplete')throw Error('Unqualified detailed export')
    return pages[0]
  },incomplete)
  await writeFile(`${out}/incomplete-detail.png`,Buffer.from(incompleteDetail.split(',')[1],'base64'))
  // Exercise the full real broad portfolio, not only the grouped main image.
  await page.getByRole('button',{name:'Réglages',exact:true}).click()
  await choose(page.getByLabel('Choisir un investisseur'),'renaissance')
  await page.waitForFunction(()=>document.querySelector('#ip-draft')?.value.startsWith('Portefeuille de Renaissance Technologies'))
  await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  const started=Date.now(),allPending=page.waitForEvent('download',{timeout:240000})
  await page.getByRole('button',{name:'Télécharger les PNG détaillés (ZIP)',exact:true}).click()
  const all=await allPending,archive=`${out}/full-renaissance.zip`;await all.saveAs(archive)
  const summary=JSON.parse(execFileSync('python3',['-c',`
import csv,io,json,struct,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 data=json.loads(z.read('positions.json'))
 rows=list(csv.reader(io.StringIO(z.read('positions.csv').decode('utf-8-sig')),delimiter=';'))
 assert len(rows)-1==len(data['snapshot']['holdings'])
 images=[name for name in z.namelist() if name.endswith('.png')]
 assert images
 for name in images:
  png=z.read(name)
  assert png[:8]==b'\\x89PNG\\r\\n\\x1a\\n'
  assert struct.unpack('>II',png[16:24])==(1080,1350)
 print(json.dumps({'sourceRows':len(data['snapshot']['holdings']),'csvRows':len(rows)-1,'pngPages':len(images),'crc':True,'dimensions':'1080x1350'}))
`,archive],{encoding:'utf8'}))
  const source=JSON.parse(await readFile('public/data/investors/renaissance.json','utf8'))
  assert.equal(summary.sourceRows,source.data.snapshot.holdings.length)
  await writeFile(`${out}/large-export.json`,JSON.stringify({...summary,elapsedMs:Date.now()-started},null,2))
  await unlink(archive) // keep compact proof instead of a 100+ MiB CI artifact
  await writeFile(`${out}/results.json`,JSON.stringify(results,null,2))
  console.log(`${results.filter(r=>r.status==='ready').length} PNG contrôlés ; mobile/ordinateur, téléchargement identique, copie, JSON/ZIP, pannes et réessai validés.`)
}catch(error){console.error(error);throw error}finally{await browser?.close();server.kill('SIGTERM')}
