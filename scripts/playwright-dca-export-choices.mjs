import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
const base='http://127.0.0.1:4389/shinny-potato/'
const out='test-artifacts/dca-export-choices'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4389'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<180;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto(base+'le-dca-de?mode=dca')
 const preview=page.getByRole('region',{name:'Image des expositions',exact:true})
 await preview.getByRole('button',{name:'Vue complète',exact:true}).waitFor({timeout:90000})
 await mkdir(out,{recursive:true})
 async function download(label,name){
  await preview.getByRole('button',{name:label,exact:true}).click()
  const image=preview.locator('img');await image.evaluate(img=>img.decode())
  const pending=page.waitForEvent('download')
  await preview.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  const downloaded=await pending
  assert(downloaded.suggestedFilename().includes(name))
  await downloaded.saveAs(`${out}/${name}.png`)
  return downloaded.suggestedFilename()
 }
 const filenames=[]
 for(const [label,id] of [['Vue complète','complete'],['Répartition des actifs','allocation'],['Exposition géographique','countries'],['Exposition sectorielle','sectors']])filenames.push(await download(label,id))
 const fixture=await page.evaluate(async()=>{
  const {prepareProfile}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
  const {PROFILES}=await import('/shinny-potato/src/pages/dca-profiles/data.js')
  const {newManualLine}=await import('/shinny-potato/src/pages/dca-profiles/placements.js')
  const names=['ETF World','Livret A','Fonds en euros','ETF S&P 500','ETF Europe','ETF émergents','LDDS','Air Liquide','Vinci','TotalEnergies','ETF Nasdaq-100','ETF small caps','SCPI','Or physique','Bitcoin']
  const weights=[25,15,12,10,8,6,5,4,3,3,2,2,2,2,1]
  const profile={...prepareProfile(PROFILES[0]),name:'Test quinze actifs',multiImage:false,lines:names.map((label,i)=>newManualLine({label,category:'Fonds en euros',weight:weights[i],amount:20}))}
  localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft:'Test visuel',field:'all'}))
  return {names,weights}
 })
 await page.reload()
 await preview.getByRole('button',{name:'Répartition des actifs',exact:true}).waitFor({timeout:90000})
 await download('Répartition des actifs','allocation-15'.replace('-15',''))
 // Keep a distinct proof rather than overwrite the initial five-line fixture.
 const imageData=await preview.locator('img').evaluate(async img=>{
  const response=await fetch(img.src),blob=await response.blob();return Array.from(new Uint8Array(await blob.arrayBuffer()))
 })
 await writeFile(`${out}/allocation-15.png`,Buffer.from(imageData))
 const audit=await page.evaluate(async()=>{
  const {radialDonutLayout}=await import('/shinny-potato/src/pages/dca-profiles/donut-layout.js')
  const {renderImageSeries}=await import('/shinny-potato/src/pages/dca-profiles/image-series.js')
  const {newManualLine}=await import('/shinny-potato/src/pages/dca-profiles/placements.js')
  const saved=JSON.parse(localStorage.getItem('el-dca-draft-v1'))
  const ctx=document.createElement('canvas').getContext('2d');ctx.font='400 32px Arial'
  const run=(profile)=>radialDonutLayout(profile.lines.map(l=>({name:l.label,weight:l.weight})),s=>ctx.measureText(s).width)
  const plan=run(saved.profile)
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top
  const collisions=plan.labels.flatMap((a,i)=>plan.labels.slice(i+1).filter(b=>overlap(a,b)).map(b=>[a.name,b.name]))
  // An old multiImage=false draft with 50 holdings remains renderable and lossless.
  const fifty={...saved.profile,lines:Array.from({length:50},(_,i)=>newManualLine({label:`Placement ${i+1}`,category:'Fonds en euros',weight:2,amount:10}))}
  const fiftyPages=await renderImageSeries(fifty,'all')
  const texts=[],allocationCanvases=[];const original=CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText=function(value,...args){texts.push({text:String(value),canvas:this.canvas});return original.call(this,value,...args)}
  try{
   allocationCanvases.push((await renderImageSeries(saved.profile,'all')).find(p=>p.id==='allocation').canvas)
   const longEight={...saved.profile,lines:Array.from({length:8},(_,i)=>newManualLine({label:`Placement ${i} — `+'Libellé long '.repeat(15),category:'Fonds en euros',weight:12.5,amount:10}))}
   const pages=await renderImageSeries(longEight,'all')
   allocationCanvases.push(pages[1].canvas)
   if(pages[1].canvas.height<=1000)throw Error('Long labels must expand the individual image')
  }finally{CanvasRenderingContext2D.prototype.fillText=original}
  return {height:plan.height,width:plan.width,count:plan.labels.length,collisions,centerText:texts.filter(d=>allocationCanvases.includes(d.canvas)&&['100 %','du patrimoine','du portefeuille'].includes(d.text)).map(d=>d.text),names:plan.labels.map(l=>l.name),fiftyPages:fiftyPages.map(p=>p.id)}
 })
 assert.equal(audit.count,15);assert.deepEqual(audit.collisions,[]);assert.deepEqual(audit.centerText,[])
 assert.deepEqual(new Set(audit.names),new Set(fixture.names));assert.deepEqual(audit.fiftyPages,['complete','allocation','countries','sectors'])
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1050})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await preview.screenshot({path:`${out}/preview-${width}.png`})
 }
 assert.deepEqual(errors,[])
 await writeFile(`${out}/audit.json`,JSON.stringify({filenames,...audit},null,2))
 console.log(JSON.stringify({filenames,...audit}))
}finally{await browser?.close();server.kill()}
