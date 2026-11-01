// Repeated cold-context observations on a local static build. No production writes.
import assert from 'node:assert/strict'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {staticBrowser,staticBase} from './static-browser.mjs'
const label=process.argv[2]||'candidate',results=[]
for(const width of [390,1440])for(let repetition=0;repetition<3;repetition++){
 const {browser,page,context}=await staticBrowser(width)
 try{
  const session=await context.newCDPSession(page)
  // Mobile emulation isolates compute cost; network is the same local fixture.
  await session.send('Emulation.setCPUThrottlingRate',{rate:width===390?4:1})
  await page.addInitScript(()=>{window.__longTasks=[];new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true})})
  await page.goto(staticBase+'il-y-a-x-ans?asset=apple')
  await page.waitForFunction(()=>document.querySelector('.tool-preview pre')?.textContent.includes('Apple'))
  const load=await page.evaluate(()=>({readyMs:performance.now(),longTasks:window.__longTasks,resources:performance.getEntriesByType('resource').filter(e=>/\.js$|\/data\//.test(e.name)).map(e=>({url:new URL(e.name).pathname,bytes:e.encodedBodySize,durationMs:e.duration}))}))
  if(width<1024)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  const exports=[]
  for(let i=0;i<3;i++){
   const started=performance.now(),downloadPromise=page.waitForEvent('download')
   await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
   const download=await downloadPromise
   assert.equal(await download.failure(),null)
   const file=await readFile(await download.path());assert.equal(file.subarray(1,4).toString(),'PNG');assert(file.readUInt32BE(16)>300&&file.readUInt32BE(20)>300)
   exports.push({ms:performance.now()-started,bytes:file.length,width:file.readUInt32BE(16),height:file.readUInt32BE(20)})
  }
  results.push({width,repetition,load,exports})
 }finally{await browser.close()}
}
await mkdir('test-artifacts/technical-audit',{recursive:true})
await writeFile(`test-artifacts/technical-audit/performance-${label}.json`,JSON.stringify(results,null,2)+'\n')
console.log(results.map(r=>({width:r.width,readyMs:Math.round(r.load.readyMs),jsAndDataBytes:r.load.resources.reduce((n,e)=>n+e.bytes,0),exportMs:r.exports.map(e=>Math.round(e.ms))})))
