import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const external = process.env.INDEX_TEST_BASE_URL
const base = external ?? 'http://127.0.0.1:4331/shinny-potato/'
if (!external) execFileSync('node', ['scripts/build-index-company-compositions.mjs'], { stdio: 'pipe' })
const server = external ? null : spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4331'],{stdio:'ignore'})
const directory = `test-artifacts/index-concentration${external ? '-published' : ''}`
const digest = value => createHash('sha256').update(value).digest('hex')
let browser
try {
  await mkdir(directory,{recursive:true})
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{} await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : process.env.CI ? {} : {executablePath:'/usr/bin/chromium'}),args:['--no-sandbox']})
  const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}tweets-factsheets`)
  await page.locator('#factsheet-subject').waitFor()
  async function select(id,title){
    const settings=page.getByRole('button',{name:'Réglages',exact:true})
    if(await settings.isVisible())await settings.click()
    await page.getByRole('searchbox',{name:'Rechercher : Choisir un indice',exact:true}).fill(title)
    await page.locator(`#factsheet-subject [data-option][data-value="${id}"]`).click()
    assert.equal(await page.locator('#factsheet-subject').getAttribute('data-value'),id)
  }
  const cases=[['cac40','CAC 40'],['nasdaq-pea','Nasdaq-100'],['dow-jones','Dow Jones Industrial Average'],['sp500-pea','S&P 500'],['world','MSCI World'],['acwi','MSCI ACWI'],['dax','DAX'],['msci-korea','MSCI Korea'],['russell-2000','Russell 2000']]
  for(const [id,title] of cases){
    await select(id,title)
    const preview=page.locator('.fs-composition-preview')
    await preview.evaluate(i=>i.decode())
    const data=await preview.getAttribute('src')
    const expected=Buffer.from(data.split(',')[1],'base64')
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger la composition en PNG',exact:true}).click()])
    assert.equal(download.suggestedFilename(),`${id}-composition-top-10.png`)
    assert.equal(await download.failure(),null)
    await download.saveAs(`${directory}/${id}.png`)
    assert.equal(digest(await readFile(`${directory}/${id}.png`)),digest(expected),'Downloaded PNG equals preview bytes')
    assert.equal(expected.subarray(1,4).toString(),'PNG')
    const w=expected.readUInt32BE(16), h=expected.readUInt32BE(20)
    assert.equal(w,1200);assert.ok(h>=1000 && h<=2000,`${id} ${w}x${h}`)
    // Original image and its explicit download remain available for every selection.
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    const original=page.locator('.publication-preview img, .publication-preview-stage img, .studio-preview img').first()
    await original.evaluate(i=>i.decode())
    const originalData=await original.getAttribute('src')
    const [main]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()])
    assert.ok(main.suggestedFilename().startsWith(id+'-'))
    await main.saveAs(`${directory}/${id}-fiche.png`)
    assert.equal(digest(await readFile(`${directory}/${id}-fiche.png`)),digest(Buffer.from(originalData.split(',')[1],'base64')))
    await page.screenshot({path:`${directory}/${id}-desktop.png`,fullPage:true})
  }
  await select('msci-usa','MSCI USA')
  await page.getByText(/ne certifient pas les dix premières entreprises/).first().waitFor()
  assert.equal(await page.locator('.fs-composition-preview').count(),0)
  assert.equal(await page.getByRole('button',{name:'Télécharger la composition en PNG',exact:true}).isDisabled(),true)
  // Back-to-back choices never expose the previous index's asynchronous canvas.
  await select('world','MSCI World');await select('dax','DAX');await select('world','MSCI World')
  await page.locator('.fs-composition-preview').evaluate(i=>i.decode())
  assert.match(await page.locator('.fs-composition-preview').getAttribute('alt'),/MSCI World/)
  await page.setViewportSize({width:390,height:844})
  for(const [id,title] of [cases[2],cases[4],cases[8]]){
    await select(id,title)
    await page.locator('.fs-composition-preview').evaluate(i=>i.decode())
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger la composition en PNG',exact:true}).click()])
    assert.equal(await download.failure(),null)
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile overflow')
    await page.locator('.fs-composition-panel').scrollIntoViewIfNeeded()
    await page.screenshot({path:`${directory}/${id}-mobile.png`,fullPage:true})
  }
  if(!external){
    // Exercise canvas geometry directly, including a very long name and tiny slices.
    const report=await page.evaluate(async()=>{
      const {SHEETS}=await import('/shinny-potato/src/pages/factsheet-tweets/data.js')
      const {getIndexConcentration,compositionImageSheet}=await import('/shinny-potato/src/data/index-company-compositions.js')
      const {renderCompositionImage,renderFactsheetImage}=await import('/shinny-potato/src/pages/factsheet-tweets/canvasImage.js')
      let text=[],boxes=[]
      const original=CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){
        const m=this.measureText(value),left=x-(this.textAlign==='center'?m.width/2:this.textAlign==='right'?m.width:0)
        text.push(String(value));boxes.push({value,x:left,y,w:m.width,h:parseFloat(this.font.split('px')[0].split(' ').at(-1))||42,canvas:this.canvas})
        return original.call(this,value,x,y,...rest)
      }
      let count=0
      try{
        for(const sheet of SHEETS){
          const c=getIndexConcentration(sheet.id);if(!c.available)continue
          text=[];boxes=[];const canvas=await renderCompositionImage(sheet,c)
          if(!text.includes('Autres entreprises')&&!text.some(t=>t.startsWith('Autres entreprises ·')))throw new Error(sheet.id+' missing remainder')
          if(text.some(t=>/source|2026|technique|approximation/i.test(t)))throw new Error(sheet.id+' unwanted metadata in PNG')
          if(text.filter(t=>t==='Épargnant Libre').length!==1)throw new Error('Signature')
          for(const b of boxes)if(b.x<0||b.x+b.w>canvas.width+.1||b.y+b.h>canvas.height)throw new Error(sheet.id+' clipping '+b.value)
          for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){
            const x=boxes[a],y=boxes[b]
            if(Math.min(x.x+x.w,y.x+y.w)-Math.max(x.x,y.x)>2&&Math.min(x.y+x.h,y.y+y.h)-Math.max(x.y,y.y)>2)throw new Error(sheet.id+' overlap '+x.value+' / '+y.value)
          }
          text=[];boxes=[];await renderFactsheetImage(compositionImageSheet(sheet,c))
          if(!text.includes('Poids des 10 premières entreprises'))throw new Error(sheet.id+' missing top-ten box')
          count++
        }
        const sheet=SHEETS.find(s=>s.id==='world'), c=getIndexConcentration('world')
        const fixture={...c,top:c.top.map((r,i)=>({...r,name:i===0?'Une entreprise au nom exceptionnellement long pour contrôler la lisibilité sur téléphone':r.name,weightPct:i===0?99.91:.001})),topWeight:99.919,otherWeight:.081}
        const canvas=await renderCompositionImage(sheet,fixture)
        return {count,fixture:canvas.toDataURL()}
      }finally{CanvasRenderingContext2D.prototype.fillText=original}
    })
    await writeFile(`${directory}/long-small-fixture.png`,Buffer.from(report.fixture.split(',')[1],'base64'))
    console.log(`${report.count} compositions: all canvas labels, geometry and metadata restrictions checked`)
  }
  assert.deepEqual(errors,[])
  console.log(`${external?'Published':'Local'}: own-index previews, PNG byte equality, real downloads, rapid switching, unavailable composition, 390px mobile and Dow verified`)
} finally {await browser?.close();server?.kill('SIGTERM')}
