import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { SCPI } from '../src/data/scpi.js'
import { INSURANCE } from '../src/data/insurance.js'
import { presentationImageModel, presentationCardModel } from '../src/pages/presentation-shared/imageExport.js'

const base='http://127.0.0.1:4334/shinny-potato'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4334','--strictPort'],{stdio:'ignore'})
let browser
const output='test-artifacts/presentation-images'
try {
  await mkdir(output,{recursive:true})
  for(let i=0;;i++) {try {if((await fetch(`${base}/`)).ok)break} catch{/* starting */} assert(i<100);await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/presentation-scpi`,{waitUntil:'networkidle'})
  for(const [kind,records] of [['scpi',SCPI],['insurance',INSURANCE]]) {
    for(const record of records) {
      const result=await page.evaluate(async({record,kind})=>{
        const {renderPresentationImage}=await import('/shinny-potato/src/pages/presentation-shared/imageExport.js')
        const original=CanvasRenderingContext2D.prototype.fillText,calls=[]
        CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){
          if(this.canvas.width===1600){const m=this.measureText(value);let left=x;if(this.textAlign==='center')left-=m.width/2;calls.push({value,left,right:left+m.width,top:y,bottom:y+m.actualBoundingBoxDescent})}
          return original.call(this,value,x,y,...rest)
        }
        try {const canvas=await renderPresentationImage(record,kind);return {width:canvas.width,height:canvas.height,calls,url:canvas.toDataURL('image/png')}} finally {CanvasRenderingContext2D.prototype.fillText=original}
      },{record,kind})
      assert.equal(result.width,1600)
      for(const c of result.calls)assert(c.left>=55 && c.right<=1545 && c.top>=45 && c.bottom<result.height-45,`${record.id}: overflowing text ${c.value}`)
      const copy=result.calls.map(c=>c.value).join(' ').replace(/\s+/g,' ')
      assert.equal(copy.split('Épargnant Libre').length-1,1)
      assert.equal(result.height,1600)
      const model=presentationCardModel(record,kind)
      assert.equal(model.cards.length,3)
      for(const card of model.cards) {
        assert(copy.includes(card.title))
        for(const r of card.rows)assert(copy.includes(r.value.replace(/\s+/g,' ')),`${record.id}: missing summary fact ${r.value}`)
        assert(copy.includes(card.note.replace(/\s+/g,' ')),`${record.id}: missing summary condition`)
      }
      if(record.id==='iroko-zen')assert(copy.includes('≤ 14,4 %'))
      if(record.id==='placement-direct-vie')assert(copy.includes('1,9 à 3,45 %') && copy.includes('selon la part'))
      await writeFile(`${output}/${record.id}.png`,Buffer.from(result.url.split(',')[1],'base64'))
      console.log(`${record.id}: ${result.width}×${result.height}, conditions and bounds OK`)
    }
    const route=kind==='scpi'?'presentation-scpi':'presentation-assurance-vie'
    const draft=kind==='scpi'?'#scpi-draft':'#insurance-draft'
    await page.goto(`${base}/${route}`,{waitUntil:'networkidle'})
    await page.locator(draft).fill('Mon texte conservé')
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    let img=page.getByRole('img',{name:`Visuel de ${records[0].name}`,exact:true})
    await img.waitFor()
    const imageUrl=await img.getAttribute('src')
    const pending=page.waitForEvent('download')
    await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()
    const download=await pending
    assert.equal(download.suggestedFilename(),`${records[0].id}-epargnant-libre.png`)
    assert.deepEqual(await readFile(await download.path()),Buffer.from(imageUrl.split(',')[1],'base64'))
    await page.getByRole('tab',{name:'Texte',exact:true}).click()
    assert.equal(await page.locator(draft).inputValue(),'Mon texte conservé')
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    await page.getByRole('button',{name:records.at(-1).name,exact:true}).click()
    img=page.getByRole('img',{name:`Visuel de ${records.at(-1).name}`,exact:true})
    await img.waitFor()
    assert.notEqual(await img.getAttribute('src'),imageUrl)
    for(const width of [320,390]) {
      await page.setViewportSize({width,height:844})
      await page.getByRole('button',{name:'Aperçu',exact:true}).click()
      await img.waitFor({state:'visible'})
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
      await page.screenshot({path:`${output}/${kind}-${width}.png`,fullPage:true})
      await page.getByRole('button',{name:'Réglages',exact:true}).click()
    }
    await page.setViewportSize({width:1440,height:1000})
    await page.screenshot({path:`${output}/${kind}-desktop.png`,fullPage:true})
  }
  const awaiting=structuredClone(INSURANCE.at(-1))
  awaiting.euroFunds[0].publication={latestPublishedYear:2025,expectedYear:2026,awaitingPublication:true}
  const waitingNotes=presentationImageModel(awaiting,'insurance').sections.flatMap(s=>s.notes ?? []).join(' ')
  assert(waitingNotes.includes('Dernier exercice publié : 2025') && waitingNotes.includes('chiffres 2026 restent en attente'))
  const expired=structuredClone(INSURANCE.find(r=>r.id==='linxea-vie'))
  const netissima=expired.euroFunds.find(f=>f.name==='Netissima')
  netissima.accessValidUntil='2000-12-31'
  const expiredNotes=presentationImageModel(expired,'insurance').sections.find(s=>s.title==='Netissima').notes.join(' ')
  assert(expiredNotes.includes('Conditions d’accès échues'))
  assert(!expiredNotes.includes('Jusqu’à 100 %') && !expiredNotes.includes('sans quota'))
  // A modified observation must alter the exported facts rather than decorative artwork.
  const changed=structuredClone(SCPI[0]);changed.price.value=1234
  assert(presentationImageModel(changed,'scpi').sections.flatMap(s=>s.columns ?? []).flatMap(c=>c.rows).some(r=>r.value.includes('1 234')))
  // Asset failure must give a visible error and a later export must be able to retry.
  const failurePage=await browser.newPage()
  await failurePage.route('**/asset-art/mineral-scpi.webp',route=>route.abort())
  await failurePage.goto(`${base}/presentation-scpi`,{waitUntil:'networkidle'})
  await failurePage.getByRole('tab',{name:'Image',exact:true}).click()
  await failurePage.getByRole('alert').filter({hasText:'Illustration indisponible'}).waitFor()
  await failurePage.unroute('**/asset-art/mineral-scpi.webp')
  const retry=failurePage.waitForEvent('download')
  await failurePage.getByRole('button',{name:'Télécharger l’image',exact:true}).click()
  await retry
  assert.deepEqual(errors,[])
  console.log('Presentation images: summary facts and conditions, text bounds, identical preview/download, selection, mobile and asset retry OK.')
} finally {await browser?.close();server.kill('SIGTERM')}
