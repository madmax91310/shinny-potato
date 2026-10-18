import { TOPICS } from '../src/data/practical-sheet-topics.js'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
const port=4389,base=`http://127.0.0.1:${port}/shinny-potato/`
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,args:['--disable-gpu','--disable-software-rasterizer'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage()
 await page.goto(base)
 await mkdir('test-artifacts/practical-images',{recursive:true})
 await page.exposeFunction('savePractical',({id,png})=>writeFile(`test-artifacts/practical-images/${id}.png`,Buffer.from(png.split(',')[1],'base64')))
 const count=await page.evaluate(async()=>{
  const {TOPICS}=await import('/shinny-potato/src/data/practical-sheet-topics.js')
  const {buildSheet}=await import('/shinny-potato/src/pages/practical-sheets/lib.js')
  const {drawSheet}=await import('/shinny-potato/src/pages/practical-sheets/image.js')
  const {imageCopy,practicalValue}=await import('/shinny-potato/src/pages/practical-sheets/imageCopy.js')
  const original=CanvasRenderingContext2D.prototype.fillText
  let labels=[],boxes=[]
  CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){
   labels.push(String(text));const w=this.measureText(text).width,size=Number(this.font.match(/(\d+(?:\.\d+)?)px/)[1])
   boxes.push({text,x:this.textAlign==='center'?x-w/2:this.textAlign==='right'?x-w:x,y,w,h:size*1.2})
   return original.call(this,text,x,y,...rest)
  }
  const norm=s=>String(s).toLocaleLowerCase('fr').replace(/\s+/g,'')
  try {
   for(const topic of TOPICS){
    labels=[];boxes=[];const sheet=buildSheet(topic.id),canvas=document.createElement('canvas')
    drawSheet(canvas,sheet)
    for(const b of boxes)if(b.x<0||b.x+b.w>canvas.width||b.y<0||b.y+b.h>canvas.height)throw Error(`${topic.id}: clipped ${b.text}`)
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
     const a=boxes[i],b=boxes[j]
     if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>3&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>3)throw Error(`${topic.id}: overlap ${a.text} / ${b.text}`)
    }
    const all=norm(labels.join(' '))
    if(/(?<!\p{L})(?:je|j[’']|mes|mon|moi|nous)(?!\p{L})/iu.test(all))throw Error(`${topic.id}: first-person image text`)
    // Each raw observation remains in the grid or shared context. Fee/ISIN
    // identity and AUM scope/date are checked against the source fund records.
    if(sheet.mode==='funds'){
     for(const fund of sheet.funds){
      for(const value of [fund.isin,fund.ticker,fund.terLabel+' %'].filter(Boolean))if(!all.includes(norm(value)))throw Error(`${topic.id}: missing fund ${value}`)
      if(fund.aum){
       const amount=(fund.aum.amount/1e6).toLocaleString('fr-FR',{maximumFractionDigits:0})
       if(!all.includes(norm(amount))||!all.includes(norm(fund.aum.asOf.split('-').reverse().join('/'))))throw Error(`${topic.id}: changed AUM`)
      }
     }
     const copy=imageCopy(sheet)
     for(const row of copy.rows)for(const value of row)if(!all.includes(norm(value)))throw Error(`${topic.id}: missing ${value}`)
     if(copy.subtitle&&!all.includes(norm(copy.subtitle)))throw Error('Missing common attributes')
    }else for(const row of sheet.rows)for(const value of row.slice(1)){
     if(/vais-je|puis-je/i.test(value))continue
     if(!all.includes(norm(practicalValue(value))))throw Error(`${topic.id}: missing ${value}`)
    }
    if(/sources:|pasunconseilfinancier|accumulating|distributing|àretenir/.test(all))throw Error(`${topic.id}: unapproved copy`)
    if(labels.filter(text=>text==='Épargnant Libre').length!==1)throw Error('Missing signature')
    for(const note of sheet.notes)if(all.includes(norm(note)))throw Error(`${topic.id}: small-print note`)
    const bg=canvas.getContext('2d').getImageData(800,0,1,1).data
    if(bg[0]<235||bg[1]<225||bg[2]<205)throw Error('Wrong ivory background')
    if(canvas.height/canvas.width>1.7)throw Error(`${topic.id}: too tall for X (${canvas.height})`)

    if(['pea-cto','world-pea','before-etf','europe-indices','fees-euros','em-pea','cloud-robotics-batteries-selection'].includes(topic.id))await window.savePractical({id:topic.id,png:canvas.toDataURL('image/png')})
   }
  } finally {CanvasRenderingContext2D.prototype.fillText=original}
  return TOPICS.length
 })
 assert.equal(count,TOPICS.length)
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  await page.setViewportSize(viewport)
  await page.goto(`${base}fiches-pratiques?fiche=pea-cto`,{waitUntil:'networkidle'})
  assert.equal(await page.locator('.practical-image').count(),1)
  assert.equal(await page.locator('[role=alert]').count(),0)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await page.screenshot({path:`test-artifacts/practical-images/ui-${viewport.width}.png`,fullPage:true})
 }
 const download=page.waitForEvent('download')
 await page.getByRole('button',{name:'Télécharger l’image PNG'}).click()
 assert.equal((await download).suggestedFilename(),'epargnant-libre-pea-cto.png')
 await page.goto(`${base}fiches-pratiques?fiche=world-pea`,{waitUntil:'networkidle'})
 const three=await page.locator('canvas').evaluate(c=>c.toDataURL())
 await page.getByRole('checkbox').last().uncheck()
 await page.waitForFunction(previous=>document.querySelector('canvas').toDataURL()!==previous,three)
 assert.equal(await page.locator('[role=alert]').count(),0)
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 await page.evaluate(()=>window.savePractical({id:'world-pea-two',png:document.querySelector('canvas').toDataURL('image/png')}))
 const twoDownload=page.waitForEvent('download')
 await page.getByRole('button',{name:'Télécharger l’image PNG'}).click()
 assert.equal((await twoDownload).suggestedFilename(),'epargnant-libre-world-pea.png')
 await page.goto(`${base}fiches-pratiques?fiche=fees-euros`,{waitUntil:'networkidle'})
 const before=await page.locator('canvas').evaluate(c=>c.toDataURL())
 await page.getByRole('spinbutton',{name:'Capital initial (€)'}).fill('20000')
 await page.waitForFunction(previous=>document.querySelector('canvas').toDataURL()!==previous,before)
 console.log('Tableau papier : '+count+' fiches. Images factuelles : chiffres conservés, pied de page retiré, aucun chevauchement ni rognage ; mobile, export PNG et scénario vérifiés.')
}finally{await browser?.close();server.kill('SIGTERM')}
