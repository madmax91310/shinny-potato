import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn, execFileSync} from 'node:child_process'
import {mkdir, writeFile} from 'node:fs/promises'
const original = JSON.parse(execFileSync('git',['show','93affb1d012ec8fede186784c4887dd7e486bc41:src/pages/factsheet-tweets/companyLogoRegistry.json'],{encoding:'utf8'}))
const root='reports/index-logo-completion/previews',base='http://127.0.0.1:4344/shinny-potato/'
const examples=[['nasdaq-pea','main'],['sp500-pea','main'],['cac40','main'],['world','main'],['msci-em-latin-america-selection','main'],['msci-world-enhanced-value','main'],['nasdaq-pea','top10'],['world','top10']]
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4344'],{stdio:'ignore'})
let browser
const snapshots={},checks=[]
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
 await mkdir(root,{recursive:true})
 for(const version of ['before','after']){
  const page=await browser.newPage()
  if(version==='before')await page.route('**/companyLogoRegistry.json*',route=>route.fulfill({contentType:'application/javascript',body:`export default ${JSON.stringify(original)}`}))
  await page.goto(base,{waitUntil:'domcontentloaded'})
  for(const [id,mode]of examples){
   const result=await page.evaluate(async({id,mode})=>{
    const {SHEETS}=await import('/shinny-potato/src/pages/factsheet-tweets/data.js')
    const {getIndexConcentration}=await import('/shinny-potato/src/data/index-company-compositions.js')
    const {renderFactsheetImage,renderCompositionImage}=await import('/shinny-potato/src/pages/factsheet-tweets/canvasImage.js')
    const labels=[],supports=[],originalText=CanvasRenderingContext2D.prototype.fillText,originalRect=CanvasRenderingContext2D.prototype.roundRect
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){if(!/(?:41\.48|23\.12)px/.test(this.font))labels.push({text,x,y,font:this.font,color:this.fillStyle});return originalText.call(this,text,x,y,...rest)}
    CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,...rest){if(w===h&&[68,122].includes(w))supports.push({x,y,w,h});return originalRect.call(this,x,y,w,h,...rest)}
    try{const sheet=SHEETS.find(s=>s.id===id),canvas=mode==='main'?await renderFactsheetImage(sheet):await renderCompositionImage(sheet,getIndexConcentration(id));return {png:canvas.toDataURL(),labels,supports}}finally{CanvasRenderingContext2D.prototype.fillText=originalText;CanvasRenderingContext2D.prototype.roundRect=originalRect}
   },{id,mode})
   const key=id+'-'+mode
   await writeFile(`${root}/${key}-${version}.png`,Buffer.from(result.png.split(',')[1],'base64'))
   if(version==='before')snapshots[key]=result
   else{
    assert.deepEqual(result.labels,snapshots[key].labels,'Text/layout changed: '+key)
    const differences=await page.evaluate(async({before,after,supports})=>{const a=new Image(),b=new Image();a.src=before;b.src=after;await Promise.all([a.decode(),b.decode()]);const c=document.createElement('canvas');c.width=a.width;c.height=a.height;const ctx=c.getContext('2d');ctx.drawImage(a,0,0);const pa=ctx.getImageData(0,0,c.width,c.height).data;ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(b,0,0);const pb=ctx.getImageData(0,0,c.width,c.height).data;let changed=0,outside=0;for(let i=0;i<pa.length;i+=4)if(pa[i]!==pb[i]||pa[i+1]!==pb[i+1]||pa[i+2]!==pb[i+2]||pa[i+3]!==pb[i+3]){changed++;const x=i/4%c.width,y=Math.floor(i/4/c.width);if(!supports.some(r=>x>=r.x-1&&x<=r.x+r.w+1&&y>=r.y-1&&y<=r.y+r.h+1))outside++}return{changed,outside}}, {before:snapshots[key].png,after:result.png,supports:result.supports})
    assert.equal(differences.outside,0,'Pixels outside company supports changed: '+key)
    checks.push({id,mode,labelsUnchanged:true,...differences})
   }
  }
  await page.close()
 }
 await writeFile('reports/index-logo-completion/render-comparison.json',JSON.stringify(checks,null,2)+'\n')
 console.log(`${checks.length} before/after exports: identical text, positions and pixels outside company supports.`)
}finally{await browser?.close();server.kill('SIGTERM')}
