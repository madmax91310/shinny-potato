import {chromium}from'playwright'
import {spawn}from'node:child_process'
import {mkdir,writeFile}from'node:fs/promises'
const port=4329,base=`http://127.0.0.1:${port}/shinny-potato/`
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 const page=await browser.newPage();await page.goto(base)
 const samples=await page.evaluate(async()=>{
  const {HOUSEHOLD_STATISTICS,formatHouseholdNumber}=await import('/shinny-potato/src/data/household-statistics.js')
  const {renderHouseholdImage,DEFAULT_HOUSEHOLD_DESIGN}=await import('/shinny-potato/src/pages/france-100-menages/image.js')
  const {HOUSEHOLD_WALLET_ART}=await import('/shinny-potato/src/pages/france-100-menages/visualIdentity.js')
  if(DEFAULT_HOUSEHOLD_DESIGN!=='sculptural'||JSON.stringify(Object.keys(HOUSEHOLD_WALLET_ART).sort())!==JSON.stringify(HOUSEHOLD_STATISTICS.map(r=>r.id).sort()))throw new Error('Default or artwork coverage')
  const original=CanvasRenderingContext2D.prototype.fillText;let labels=[],boxes=[],current
  CanvasRenderingContext2D.prototype.fillText=function(t,x,y,...args){const m=this.measureText(t),box={text:String(t),l:x-m.actualBoundingBoxLeft,r:x+m.actualBoundingBoxRight,t:y-m.actualBoundingBoxAscent,b:y+m.actualBoundingBoxDescent};if(box.l<0||box.r>1600||box.t<0||box.b>1080)throw new Error(`Clipped ${current}: ${t}`);for(const p of boxes)if(Math.min(p.r,box.r)-Math.max(p.l,box.l)>1&&Math.min(p.b,box.b)-Math.max(p.t,box.t)>1)throw new Error(`Overlap ${current}: ${p.text} / ${t}`);boxes.push(box);labels.push(String(t));return original.call(this,t,x,y,...args)}
  const results=[]
  try{for(const r of HOUSEHOLD_STATISTICS){current=r.id;labels=[];boxes=[];const png=await renderHouseholdImage(r);const words=labels.join(' ')
   if(words.includes('La France en 100 ménages')||labels.includes('100')||labels.includes('10')||words.includes('…'))throw new Error('Series/device or truncation')
   if(!labels.includes(`${formatHouseholdNumber(r.value)} ${r.unit==='EUR'?'€':'%'}`))throw new Error('Changed metric')
   if(r.kind==='comparison'&&!labels.includes(`${formatHouseholdNumber(r.secondValue)} %`))throw new Error('Changed comparison')
   if(r.kind==='rate'&&!words.includes(`environ ${Math.round(r.value)} ${r.population} sur 100`))throw new Error('Changed rounding or population')
   if(r.id==='unexpected-expense'&&!labels.some(t=>t.includes('1 000 €')))throw new Error('Split amount in title')
   if(r.kind==='share'&&!words.includes('50 ménages les moins dotés en patrimoine brut'))throw new Error('Wealth share confused with population rate')
   if(words.includes('Source :')||words.includes('Données provisoires')||labels.filter(t=>t==='Épargnant Libre').length!==1)throw new Error('Footer must contain signature only')
   results.push({id:r.id,png,labels})
  }}finally{CanvasRenderingContext2D.prototype.fillText=original}
  return results
 })
 await mkdir('test-artifacts/household-sculpture',{recursive:true});for(const s of samples){await writeFile(`test-artifacts/household-sculpture/${s.id}.png`,Buffer.from(s.png.split(',')[1],'base64'));await writeFile(`test-artifacts/household-sculpture/${s.id}.txt`,s.labels.join('\n'))}
 await page.setViewportSize({width:390,height:844});await page.goto(`${base}france-100-menages?sujet=pea`)
 const link=page.getByRole('link',{name:'Télécharger le PNG',exact:true});await link.waitFor()
 await page.getByRole('button',{name:'Aperçu',exact:true}).click();await page.getByRole('tab',{name:'Image',exact:true}).click();const img=page.locator('.hh-scope img').first();await img.evaluate(i=>i.decode());const before=await img.getAttribute('src')
 await page.getByRole('button',{name:'Réglages',exact:true}).click();await page.getByLabel('Sujet',{exact:true}).selectOption('protein-meals');await page.getByRole('button',{name:'Aperçu',exact:true}).click();await page.getByRole('tab',{name:'Image',exact:true}).click();await page.waitForFunction(src=>{const next=document.querySelector('.hh-scope img')?.getAttribute('src');return next&&next!==src},before);await img.evaluate(i=>i.decode())
 const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);if(!download.suggestedFilename().endsWith('-protein-meals-sculptural.png'))throw new Error('Stale download')
 await page.getByRole('button',{name:'Réglages',exact:true}).click();await page.getByLabel('Design',{exact:true}).selectOption('ivory');await page.waitForFunction(()=>document.querySelector('.hh-scope a[download$="-ivory.png"]')?.href.startsWith('data:image/png'))
 console.log(`${samples.length} sculptural cards: real values/populations, comparisons, thresholds, share distinction, signature-only footer, no titles, no overlap; mobile refresh/download and legacy design verified.`)
}finally{await browser?.close();server.kill('SIGTERM')}
