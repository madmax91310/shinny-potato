import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
const base='http://127.0.0.1:4391/shinny-potato/',out='test-artifacts/dca-individual-style'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4391'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<180;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:390,height:1000}})
 await page.goto(base+'le-dca-de?mode=dca')
 const result=await page.evaluate(async()=>{
  const {ALL_PROFILES}=await import('/shinny-potato/src/pages/dca-profiles/data.js')
  const {prepareProfile,analyzeProfile}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
  const {holdingImageRows,renderIndividualDonut}=await import('/shinny-potato/src/pages/dca-profiles/image-individual.js')
  const {loadDcaFont,donutData}=await import('/shinny-potato/src/pages/dca-profiles/image.js')
  const {exposureRecords}=await import('/shinny-potato/src/pages/dca-profiles/records.js')
  const {radialDonutLayout,holdingPercentage}=await import('/shinny-potato/src/pages/dca-profiles/donut-layout.js')
  await loadDcaFont()
  const prepared=ALL_PROFILES.map(prepareProfile)
  await Promise.all([...new Set(prepared.flatMap(p=>p.lines.map(l=>l.asset)))].map(id=>exposureRecords.load(id)))
  const samples=[],audits=[]
  const original=CanvasRenderingContext2D.prototype.fillText
  let draws=[]
  CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){
   const m=this.measureText(value),t=this.getTransform(),points=[[-m.actualBoundingBoxLeft,-m.actualBoundingBoxAscent],[m.actualBoundingBoxRight,-m.actualBoundingBoxAscent],[m.actualBoundingBoxRight,m.actualBoundingBoxDescent],[-m.actualBoundingBoxLeft,m.actualBoundingBoxDescent]].map(([dx,dy])=>({x:t.a*(x+dx)+t.c*(y+dy)+t.e,y:t.b*(x+dx)+t.d*(y+dy)+t.f}))
   draws.push({points,value:String(value),font:this.font,x:t.e,y:t.f,left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))})
   return original.call(this,value,x,y,...rest)
  }
  function audit(id,rows,allocation,scope='',sample=false){
   draws=[]
   const before=JSON.stringify(rows),canvas=renderIndividualDonut(allocation?'Répartition des actifs':id.includes('countries')?'Exposition géographique':'Exposition sectorielle',rows,{allocation,scope})
   if(JSON.stringify(rows)!==before)throw Error(id+': mutated input')
   const positive=rows.filter(r=>r.weight>0)
   const percentages=draws.filter(d=>d.value.includes('%')&&!d.value.startsWith('Périmètre'))
   if(percentages.length!==positive.length)throw Error(id+': missing percentage')
   for(const d of draws){
    if(d.left<0||d.right>canvas.width+1||d.top<0||d.bottom>canvas.height+1)throw Error(id+': clipped '+d.value)
    if(d.value.includes('%')&&!d.value.startsWith('Périmètre')&&!(d.x&&d.y))throw Error(id+': outside percentage '+d.value)
   }
   const overlap=(a,b)=>[a,b].every(poly=>poly.every((p,i)=>{const q=poly[(i+1)%4],axis={x:p.y-q.y,y:q.x-p.x},pa=a.map(v=>v.x*axis.x+v.y*axis.y),pb=b.map(v=>v.x*axis.x+v.y*axis.y);return Math.min(Math.max(...pa),Math.max(...pb))-Math.max(Math.min(...pa),Math.min(...pb))>2*Math.hypot(axis.x,axis.y)}))
   for(const [i,a] of draws.entries())for(const b of draws.slice(i+1))if(overlap(a.points,b.points))throw Error(id+': overlapping '+a.value+' / '+b.value)
   if(allocation){
    for(const row of positive)if(!percentages.some(d=>d.value===holdingPercentage(row.weight)))throw Error(id+': wrong value '+row.weight)
    const probe=document.createElement('canvas').getContext('2d');probe.font='600 56px Arial'
    const plan=radialDonutLayout(rows,v=>probe.measureText(v).width)
    for(const label of plan.labels)if(label.lines.some(line=>line.includes('%')))throw Error(id+': percent in outside name')
   }
   if(canvas.width>16000||canvas.height>16000||canvas.width*canvas.height>32000000)throw Error(id+': canvas budget exceeded')
   audits.push({id,rows:positive.length,width:canvas.width,height:canvas.height,percentages:percentages.length})
   if(sample)samples.push({id,png:canvas.toDataURL('image/png')})
  }
  try{
   for(const [i,p] of prepared.entries()){
    const analysis=analyzeProfile(p)
    audit('profile-'+i+'-allocation',holdingImageRows(p.lines),true,'',i===0)
    for(const field of ['countries','sectors']){const data=donutData(analysis,field,p.exposureLimit);audit('profile-'+i+'-'+field,data.rows,false,data.scope,i===0)}
   }
   const names=['MSCI ACWI','Or physique','S&P 500','MSCI','Nasdaq-100','Mastercard','Meta','Airbus','Alphabet','Nvidia','Novo Nordisk','Booking','Amazon','Safran','Uber','BNP Paribas','MercadoLibre','Medpace']
   const weights=[15,.8,12,2,12,2,8,2,7,3,6,3,5,3,5,4,5,5.2]
   audit('reference-18',holdingImageRows(names.map((label,i)=>({label,weight:weights[i]}))),true,'',true)
   for(const count of [1,2,9,50])audit('dense-'+count,holdingImageRows(Array.from({length:count},(_,i)=>({label:`Placement ${i+1}`,weight:100/count}))),true,'',true)
   audit('tiny',holdingImageRows([{label:'Position principale',weight:99.99},{label:'Toute petite position',weight:.01}]),true,'',true)
   audit('skewed-50',holdingImageRows(Array.from({length:50},(_,i)=>({label:`Placement ${i+1}`,weight:i?.01:99.51}))),true)
   audit('long-50',holdingImageRows(Array.from({length:50},(_,i)=>({label:`Placement ${i+1} — `+'Libellé long '.repeat(18),weight:2}))),true,'',true)
  }finally{CanvasRenderingContext2D.prototype.fillText=original}
  return {profiles:prepared.length,audits,samples}
 })
 await mkdir(out,{recursive:true})
 for(const sample of result.samples)await writeFile(`${out}/${sample.id}.png`,Buffer.from(sample.png.split(',')[1],'base64'))
 assert.equal(result.audits.length,result.profiles*3+8)
 console.log(JSON.stringify({profiles:result.profiles,images:result.audits.length,samples:result.samples.map(s=>s.id)}))
}finally{await browser?.close();server.kill()}
