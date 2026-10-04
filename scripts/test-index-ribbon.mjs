import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir,writeFile } from 'node:fs/promises'
const port=4328,base=`http://127.0.0.1:${port}/shinny-potato/`
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage();await page.goto(base)
 const samples=await page.evaluate(async()=>{
  const {SHEETS}=await import('/shinny-potato/src/data/index-factsheets.js')
  const {renderFactsheetImage}=await import('/shinny-potato/src/pages/factsheet-tweets/canvasImage.js')
  const {getIndexArt,INDEX_RIBBON_ART}=await import('/shinny-potato/src/pages/factsheet-tweets/visualIdentity.js')
  if(JSON.stringify(Object.keys(INDEX_RIBBON_ART).sort())!==JSON.stringify(SHEETS.map(s=>s.id).sort()))throw new Error('Incomplete identities')
  let labels=[],boxes=[],current;const original=CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText=function(t,x,y,...args){
   const m=this.measureText(t),box={t:String(t),l:x-m.actualBoundingBoxLeft,r:x+m.actualBoundingBoxRight,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent}
   if(box.l<0||box.r>1600||box.top<0||box.bottom>1080)throw new Error(`Clipped ${current}: ${t}`)
   for(const p of boxes)if(Math.min(p.r,box.r)-Math.max(p.l,box.l)>1&&Math.min(p.bottom,box.bottom)-Math.max(p.top,box.top)>1)throw new Error(`Overlap ${current}: ${p.t} / ${t}`)
   boxes.push(box);labels.push(String(t));return original.call(this,t,x,y,...args)
  }
  const results=[],fmt=n=>`${n>0?'+':n<0?'−':''}${Math.abs(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} %`
  try{for(const sheet of SHEETS){
   labels=[];boxes=[];current=sheet.id;const canvas=await renderFactsheetImage(sheet)
   if(labels.filter(t=>t==='Épargnant Libre').length!==1)throw new Error('Signature')
   if(labels.some(t=>/COULISSES|ISIN|…/.test(t)))throw new Error('Series heading or truncation')
   for(const [year,value]of sheet.returns)if(!labels.includes(String(year))||!labels.includes(fmt(value)))throw new Error('Changed return')
   if(sheet.methodologyPanels){for(const [title]of sheet.methodologyPanels)if(!labels.includes(title))throw new Error('Missing methodology');if(labels.includes('PRINCIPALES POSITIONS'))throw new Error('Invented holdings')}
   else for(const [name]of sheet.holdings.slice(0,3))if(!labels.includes(name))throw new Error('Changed company')
   if(['world','acwi','ftse-all-world','world-ex-usa','world-small-cap','mscieurope'].includes(sheet.id)&&getIndexArt(sheet).scene!=='world')throw new Error('Wrong numeric scene')
   results.push({id:sheet.id,png:canvas.toDataURL(),labels})
  }}finally{CanvasRenderingContext2D.prototype.fillText=original}
  return results
 })
 await mkdir('test-artifacts/index-ribbon',{recursive:true})
 for(const s of samples){await writeFile(`test-artifacts/index-ribbon/${s.id}.png`,Buffer.from(s.png.split(',')[1],'base64'));await writeFile(`test-artifacts/index-ribbon/${s.id}.txt`,s.labels.join('\n'))}
 await page.setViewportSize({width:390,height:844});await page.goto(`${base}tweets-factsheets`)
 await page.getByRole('button',{name:'Aperçu',exact:true}).click();await page.getByRole('tab',{name:'Image',exact:true}).click()
 await page.locator('.fs-scope img').first().evaluate(i=>i.decode())
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()])
 if(!download.suggestedFilename().endsWith('-dans-les-coulisses.png'))throw new Error('Download')
 console.log(`${samples.length} index cards: illustrations, methodology, real companies, annual returns, no overlap or clipping; mobile download OK.`)
}finally{await browser?.close();server.kill('SIGTERM')}
