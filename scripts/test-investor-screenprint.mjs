import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { INVESTORS } from '../src/pages/investor-portfolio/data.js'
const sources = JSON.parse(await readFile('public/asset-art/investors/sources.json','utf8'))
assert.deepEqual(Object.keys(sources).sort(), INVESTORS.map(([slug])=>slug).sort())
assert.equal(new Set(Object.values(sources).map(p=>p.file)).size, INVESTORS.length)
for (const p of Object.values(sources)) { await readFile(`public/asset-art/${p.file}`); assert.ok(p.source && p.author) }
const port = 4329, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{} await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage(); await page.goto(base)
  await mkdir('test-artifacts/investor-screenprint',{recursive:true})
  await page.exposeFunction('saveInvestor',async sample=>{await writeFile(`test-artifacts/investor-screenprint/${sample.slug}.png`,Buffer.from(sample.png.split(',')[1],'base64'))})
  await page.evaluate(async()=>{
    const {INVESTORS,normalizePortfolio,holdingName,percentage,dateFR,buildTweet}=await import('/shinny-potato/src/pages/investor-portfolio/data.js')
    const {renderPortfolioImage}=await import('/shinny-potato/src/pages/investor-portfolio/image.js')
    const {investorPortrait}=await import('/shinny-potato/src/pages/investor-portfolio/portrait.js')
    let boxes=[],labels=[],photos=[]
    const originalText=CanvasRenderingContext2D.prototype.fillText,originalImage=CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
      const m=this.measureText(value),b={text:value,l:x-m.actualBoundingBoxLeft,r:x+m.actualBoundingBoxRight,t:y-m.actualBoundingBoxAscent,b:y+m.actualBoundingBoxDescent}
      if(b.l<0||b.r>this.canvas.width||b.t<0||b.b>this.canvas.height)throw Error(`Clipped: ${value}`)
      for(const p of boxes)if(Math.min(p.r,b.r)-Math.max(p.l,b.l)>1&&Math.min(p.b,b.b)-Math.max(p.t,b.t)>1)throw Error(`Overlap: ${p.text} / ${value}`)
      boxes.push(b); labels.push(value); return originalText.call(this,value,x,y,...args)
    }
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image instanceof HTMLImageElement)photos.push(image.src.split('/asset-art/')[1]);return originalImage.call(this,image,...args)}
    try{
      for(const [slug] of INVESTORS){
        boxes=[];labels=[];photos=[]
        const portfolio=normalizePortfolio(await(await fetch(`/shinny-potato/data/investors/${slug}.json`)).json()),before=JSON.stringify(portfolio),tweet=buildTweet(portfolio)
        const png=await renderPortfolioImage(portfolio)
        if(before!==JSON.stringify(portfolio)||tweet!==buildTweet(portfolio))throw Error('Data changed')
        if(photos[0]!=='approved/investor-glass.webp'||photos.length!==2||photos[1]!==investorPortrait(slug).file)throw Error(`Wrong portrait ${slug}`)
        const all=labels.join(' ')
        for(const row of portfolio.holdings.slice(0,5))if(!all.includes(holdingName(row))||!labels.includes(percentage(row.weight)))throw Error(`Lost holding ${slug}: ${row.issuerName}`)
        if(!all.includes(portfolio.identity.displayName)||!labels.includes(`Positions au ${dateFR(portfolio.snapshot.periodEnd)}`)||!labels.includes(investorPortrait(slug).person))throw Error('Lost identity/date')
        if(!labels.includes('Autres positions'))throw Error('Lost remainder')
        await window.saveInvestor({slug,png})
      }
      let rejected=false;try{investorPortrait('unknown')}catch{rejected=true}if(!rejected)throw Error('Unknown profile silently substituted')
    }finally{CanvasRenderingContext2D.prototype.fillText=originalText;CanvasRenderingContext2D.prototype.drawImage=originalImage}
  })
  await page.route('**/asset-art/investors/tepper.webp',route=>route.abort())
  await page.goto(`${base}portefeuilles-investisseurs`)
  const button=page.getByRole('button',{name:/Télécharger le PNG/});await button.click()
  await page.getByRole('alert').filter({hasText:'n’a pas pu être chargé'}).waitFor()
  await page.unroute('**/asset-art/investors/tepper.webp')
  const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);assert.match(download.suggestedFilename(),/^portefeuille-tepper-.*\.png$/)
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  await page.getByRole('img',{name:'Portefeuille David Tepper',exact:true}).waitFor()
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  console.log(`${INVESTORS.length} vrais portraits distincts, positions, poids, dates, absence de chevauchement, export asynchrone, reprise après erreur et mobile vérifiés dans Chromium.`)
}finally{await browser?.close();server.kill('SIGTERM')}
