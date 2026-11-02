import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
const out='test-artifacts/image-density/after'
const base='http://127.0.0.1:4398/shinny-potato/'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4398','--strictPort'],{stdio:'ignore'})
let browser
try{
 for(let i=0;;i++){try{if((await fetch(base)).ok)break}catch{}assert(i<300);await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
 const page=await browser.newPage();await page.goto(base)
 const records=await page.evaluate(async()=>{
  const {renderRankingImage}=await import('/shinny-potato/src/pages/performance-rankings/image.js')
  const {renderDcaImage}=await import('/shinny-potato/src/pages/dca-profiles/image.js')
  const {ALL_PROFILES,ASSETS}=await import('/shinny-potato/src/pages/dca-profiles/data.js')
  const {prepareProfile,references}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
  const orig=CanvasRenderingContext2D.prototype.fillText;let boxes=[]
  CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){const m=this.measureText(value);boxes.push({value:String(value),font:this.font,l:x-m.actualBoundingBoxLeft,r:x+m.actualBoundingBoxRight,t:y-m.actualBoundingBoxAscent,b:y+m.actualBoundingBoxDescent,width:this.canvas.width,height:this.canvas.height});return orig.call(this,value,x,y,...rest)}
  const records=[]
  try{
   const assets=['Monétaire','Obligations','Actions'].map((label,i)=>({id:String(i),label,shortLabel:label}))
   const columns=[2024,2025].map(year=>({label:String(year),rows:assets.map((a,i)=>({id:a.id,value:[-.04,.004,0][i],rank:[3,1,2][i]}))}))
   for(const mode of ['current','annual']){boxes=[];const c=renderRankingImage({assets,columns,mode:'years',coverage:{currency:'EUR',basis:'adjusted'}},'',null,mode);records.push({name:'ranking-'+mode,png:c.toDataURL(),boxes})}
   for(const count of [1,4,8])for(const companies of [false,true])for(const exposureLimit of [3,4,6]){
    boxes=[]
    const p={...prepareProfile(ALL_PROFILES[0]),showCompanies:companies,exposureLimit,lines:Object.keys(ASSETS).slice(0,count).map((asset,i)=>({asset,label:ASSETS[asset][1]+' — allocation diversifiée de long terme',weight:100/count,amount:i?1000000:0,isin:''}))}
    const c=await renderDcaImage(p,'all',8);records.push({name:`dca-${count}-${companies}-${exposureLimit}`,png:c.toDataURL(),boxes})
   }
   boxes=[]
   const canonical={...prepareProfile(ALL_PROFILES[0]),lines:Object.entries(ASSETS).sort((a,b)=>b[1][1].length-a[1][1].length).slice(0,8).map(([asset,[emoji,label]])=>({asset,emoji,label,weight:12.5,amount:100,isin:''}))}
   const c=await renderDcaImage(canonical,'all',8);records.push({name:'dca-canonical-8',png:c.toDataURL(),boxes})
   boxes=[]
   const covered={...canonical,exposureLimit:6,lines:['world','europe','emerging','sp500','gold','btc','small','nasdaq'].map(asset=>({asset,label:ASSETS[asset][1]+' — allocation diversifiée de long terme',weight:12.5,amount:100,isin:references[asset].isin}))}
   const coveredCanvas=await renderDcaImage(covered,'all',8);records.push({name:'dca-8-covered',png:coveredCanvas.toDataURL(),boxes})
  }finally{CanvasRenderingContext2D.prototype.fillText=orig}
  return records
 })
 await mkdir(out,{recursive:true})
 for(const r of records){await writeFile(`${out}/${r.name}.png`,Buffer.from(r.png.split(',')[1],'base64'));await writeFile(`${out}/${r.name}.json`,JSON.stringify(r.boxes,null,2))}
 {
 for(const r of records){
  for(const b of r.boxes)assert(b.l>=0&&b.r<=b.width&&b.t>=0&&b.b<=b.height,`${r.name}: clipped ${b.value}`)
  for(const [i,a] of r.boxes.entries())for(const b of r.boxes.slice(i+1))assert(!(Math.min(a.r,b.r)-Math.max(a.l,b.l)>1&&Math.min(a.b,b.b)-Math.max(a.t,b.t)>1),`${r.name}: overlap ${a.value} / ${b.value}`)
  if(r.name.startsWith('ranking')){const labels=r.boxes.map(b=>b.value);assert(!labels.includes('−0,0 %'));assert.equal(labels.filter(v=>v==='+0,0 %').length,r.name==='ranking-annual'?2:0);assert(labels.includes('−0,04 %'));assert(labels.includes('+< 0,01 %'))}
  if(r.name.startsWith('dca'))assert(!r.boxes.some(b=>/Poche actions|100 % du portefeuille/.test(b.value)),'Removed scope banners must not return in the full image')
  if(r.name.startsWith('dca-8'))assert(r.boxes.filter(b=>/allocation|diversifiée|long terme/.test(b.value)).every(b=>parseFloat(b.font.match(/[\d.]+px/)[0])>=36),'Dense allocation labels must not shrink')
 }
 }
 console.log(`${records.length} synthetic rendering cases saved; bounds, collisions, signed small returns and dense label type verified. No browser financial storage written.`)
}finally{await browser?.close();server.kill()}
