import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {chromium} from 'playwright'

const base='http://127.0.0.1:4393/shinny-potato/',out='test-artifacts/unlimited-rendering'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4393'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<180;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(resolve=>setTimeout(resolve,250))}
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:320,height:950}})
 await page.goto(base+'le-dca-de?mode=dca')
 const baseline=process.env.DCA_STYLE_BASELINE?await readFile(process.env.DCA_STYLE_BASELINE,'utf8'):null
 const result=await page.evaluate(async baseline=>{
  const root='/shinny-potato/src/pages/dca-profiles/'
  const {renderImageSeries}=await import(root+'image-series.js')
  const {renderIndividualDonut,holdingImageRows}=await import(root+'image-individual.js')
  const {renderDcaImage,loadDcaFont}=await import(root+'image.js')
  const {newManualLine}=await import(root+'placements.js')
  await loadDcaFont()
  const audits=[],samples=[],comparisons=[]
  if(baseline){
   const code=baseline.replaceAll("'./image.js'",JSON.stringify(location.origin+root+'image.js')).replaceAll("'./donut-layout.js'",JSON.stringify(location.origin+root+'donut-layout.js'))
   const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}))
   const old=await import(url);URL.revokeObjectURL(url)
   for(const count of [1,2,9,18,50]){
    for(const skewed of [false,true]){
     const rows=holdingImageRows(Array.from({length:count},(_,i)=>({label:`Placement ${i}`,weight:skewed?(i?.01:100-(count-1)*.01):100/count})))
     const before=old.renderIndividualDonut('Répartition des actifs',rows,{allocation:true}),after=renderIndividualDonut('Répartition des actifs',rows,{allocation:true})
     if(before.toDataURL()!==after.toDataURL())throw Error(`Style changed: ${count}/${skewed}`)
     before.width=before.height=after.width=after.height=1;comparisons.push({count,skewed})
    }
   }
  }
  for(const count of [51,200,1000,20001]){
   const lines=Array.from({length:count},(_,i)=>newManualLine({label:`Placement ${i}`,category:'Fonds en euros',weight:100/count,amount:1}))
   const profile={id:'subscriber:render',mode:'participant',name:'Test',scope:'Portefeuille investi',lines,showCompanies:true}
   const original=JSON.stringify(profile),drawn=new Map(),fill=CanvasRenderingContext2D.prototype.fillText
   CanvasRenderingContext2D.prototype.fillText=function(value,...args){
    if(!drawn.has(this.canvas))drawn.set(this.canvas,[])
    drawn.get(this.canvas).push(String(value));return fill.call(this,value,...args)
   }
   const start=performance.now()
   async function audit({canvas,id}){
    const texts=drawn.get(canvas)||[]
    if(!canvas.width||!canvas.height||canvas.width>16000||canvas.height>16000||canvas.width*canvas.height>32000000)throw Error('Canvas budget '+id+'/'+count)
    if(['complete','allocation','flows'].includes(id)){
     const names=new Set(texts)
     for(let i=0;i<count;i++)if(!names.has(`Placement ${i}`))throw Error(`Missing ${i} in ${id}/${count}`)
    }
    if(id==='allocation'&&texts.filter(v=>v.includes('%')).length!==count)throw Error('Lost percentage')
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
    if(!blob?.size)throw Error('Empty PNG')
    const bitmap=await createImageBitmap(blob)
    if(bitmap.width!==canvas.width||bitmap.height!==canvas.height)throw Error('PNG dimensions changed')
    bitmap.close()
    audits.push({count,id,width:canvas.width,height:canvas.height,bytes:blob.size})
    if(count===200&&id==='allocation'||count===1000&&id==='complete')samples.push({id:`${id}-${count}`,png:canvas.toDataURL()})
    canvas.width=canvas.height=1
    return {id}
   }
   try{
    const pages=await renderImageSeries(profile,'all',Infinity,audit)
    if(pages.map(p=>p.id).join(',')!=='complete,allocation,countries,sectors,companies')throw Error('Missing export choice')
    await audit({id:'flows',canvas:await renderDcaImage({...profile,showCompanies:false},'countries')})
    if(JSON.stringify(profile)!==original)throw Error('Input mutation')
   }finally{CanvasRenderingContext2D.prototype.fillText=fill}
   audits.push({count,milliseconds:Math.round(performance.now()-start)})
  }
  return {audits,samples,comparisons}
 },baseline)
 await mkdir(out,{recursive:true})
 for(const sample of result.samples)await writeFile(`${out}/${sample.id}.png`,Buffer.from(sample.png.split(',')[1],'base64'))
 assert.equal(result.audits.filter(a=>a.id).length,24)
 const report={audits:result.audits,comparisons:result.comparisons}
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n')
 console.log(JSON.stringify(report))
}finally{await browser?.close();server.kill()}
