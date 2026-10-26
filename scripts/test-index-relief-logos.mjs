import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFile, mkdir } from 'node:fs/promises'

export async function verifyReliefLogos(browser, base) {
  execFileSync('node',['scripts/build-index-logo-registry.mjs','--check'],{stdio:'pipe'})
  const page=await browser.newPage()
  await page.goto(base)
  const report=await page.evaluate(async()=>{
    const {SHEETS}=await import('/shinny-potato/src/pages/factsheet-tweets/data.js')
    const {factsheetCurrencies,factsheetInCurrency,factsheetVariants,factsheetInVariant}=await import('/shinny-potato/src/pages/factsheet-tweets/performanceCurrency.js')
    const {renderFactsheetImage,renderCompositionImage}=await import('/shinny-potato/src/pages/factsheet-tweets/canvasImage.js')
    const {companyLogoIdentity}=await import('/shinny-potato/src/pages/factsheet-tweets/companyLogos.js')
    const {default:registry}=await import('/shinny-potato/src/pages/factsheet-tweets/companyLogoRegistry.json')
    const logos=[]
    for(const [id,entry]of Object.entries(registry.companies))if(entry.file){
      const image=new Image();image.src='/shinny-potato/asset-art/'+entry.file;await image.decode()
      if(!image.naturalWidth||!image.naturalHeight)throw new Error('Invalid logo '+id)
      logos.push({id,file:entry.file,width:image.naturalWidth,height:image.naturalHeight})
    }
    const sheet=SHEETS.find(s=>s.id==='world')
    if(companyLogoIdentity(sheet,'Apple', ['US0378331005'])?.id!=='apple')throw new Error('ISIN resolution')
    if(companyLogoIdentity(sheet,'APPLE UNKNOWN')!==null)throw new Error('Fuzzy alias admitted')
    if(companyLogoIdentity(sheet,'NVIDIA',['UNKNOWN'])!==null)throw new Error('Unknown security matched name')
    if(companyLogoIdentity(sheet,'Alphabet',['US02079K3059','US02079K1079'])?.id!=='alphabet')throw new Error('Share classes')
    if(companyLogoIdentity(sheet,'Apple',['US0378331005','US5949181045'])!==null)throw new Error('Mixed companies')
    let count=0, labels=[], boxes=[], imageBoxes=[]
    const original=CanvasRenderingContext2D.prototype.fillText,drawImage=CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.fillText=function(t,x,y,...args){
      const m=this.measureText(t);labels.push(String(t));boxes.push({text:String(t),l:x-m.actualBoundingBoxLeft,r:x+m.actualBoundingBoxRight,t:y-m.actualBoundingBoxAscent,b:y+m.actualBoundingBoxDescent,color:this.fillStyle});return original.call(this,t,x,y,...args)
    }
    CanvasRenderingContext2D.prototype.drawImage=function(image,x,y,w,h,...args){if(image.src&&!image.src.includes('/index-flags/')&&Math.abs(w/h-image.width/image.height)>1e-6)throw new Error('Distorted logo '+image.src);if(/\.(png|avif|webp)$/.test(image.src??'')&&(w>image.width+.01||h>image.height+.01))throw new Error('Upscaled raster '+image.src);if(image.src&&!image.src.includes('/index-flags/'))imageBoxes.push({l:x,r:x+w,t:y,b:y+h,file:image.src});return drawImage.call(this,image,x,y,w,h,...args)}
    try{
      for(const s of SHEETS)for(const variant of ['native',...factsheetVariants(s)]){
        const version=factsheetInVariant(s,variant)
        for(const currency of ['native',...factsheetCurrencies(version)]){
          const converted=factsheetInCurrency(version,currency),before=JSON.stringify(converted)
          boxes=[];imageBoxes=[];labels=[]
          const canvas=await renderFactsheetImage(converted)
          if(before!==JSON.stringify(converted))throw new Error('Mutated '+s.id)
          for(const b of boxes){
            if(b.l<0||b.r>canvas.width||b.t<0||b.b>canvas.height)throw new Error('Clipped '+s.id+' '+b.text)
            for(const image of imageBoxes)if(Math.min(b.r,image.r)-Math.max(b.l,image.l)>1&&Math.min(b.b,image.b)-Math.max(b.t,image.t)>1)throw new Error('Logo overlaps text '+s.id+' '+b.text)
            if(b.text.startsWith('−')&&b.color!=='#d52e39')throw new Error('Negative return colour')
          }
          for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.r,b.r)-Math.max(a.l,b.l)>1&&Math.min(a.b,b.b)-Math.max(a.t,b.t)>1)throw new Error('Overlap '+s.id+' '+a.text+' / '+b.text)}
          count++
        }
      }
      // A missing/non-applicable observation is never converted to 0.00%.
      labels=[];await renderFactsheetImage({...sheet,countries:[],sectors:[],holdings:[],returns:[[2024,null]]})
      if(labels.includes('0,00 %')||labels.includes('2025')||!labels.includes('Indisponible'))throw new Error('Missing observations fabricated')
      labels=[];await renderFactsheetImage({...sheet,countries:[],sectors:[],holdings:[['Une entreprise au nom exceptionnellement long entièrement visible',.001]],returns:[]})
      if(!labels.includes('< 0,01 %')||labels.some(t=>t==='0,00 %'||t==='ment'))throw new Error('Tiny weight or long word')
      const {getIndexConcentration}=await import('/shinny-potato/src/data/index-company-compositions.js')
      const c=getIndexConcentration('world')
      labels=[];await renderCompositionImage(sheet,{...c,top:c.top.map((r,i)=>({...r,weightPct:i===0?99.91:.001})),topWeight:99.919,otherWeight:.081})
      if(labels.includes('0,00 %')||!labels.includes('< 0,01 %'))throw new Error('Tiny top-ten weight became zero')
    }finally{CanvasRenderingContext2D.prototype.fillText=original;CanvasRenderingContext2D.prototype.drawImage=drawImage}
    return {count,logos}
  })
  await page.close()
  const failures=[]
  for(const mode of ['missing','corrupt','delayed','timeout']){
    const p=await browser.newPage();await p.goto(base)
    await p.route('**/asset-art/official-logos/apple.svg',async route=>{
      if(mode==='missing')return route.fulfill({status:404,body:''})
      if(mode==='corrupt')return route.fulfill({contentType:'image/svg+xml',body:'not an SVG'})
      await new Promise(resolve=>setTimeout(resolve,mode==='timeout'?6000:900))
      try{await route.continue()}catch{}
    })
    async function render(){return p.evaluate(async()=>{
      const {SHEETS}=await import('/shinny-potato/src/pages/factsheet-tweets/data.js')
      const {renderFactsheetImage}=await import('/shinny-potato/src/pages/factsheet-tweets/canvasImage.js')
      const original=CanvasRenderingContext2D.prototype.drawImage,files=[]
      CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image.src)files.push(image.src);return original.call(this,image,...args)}
      const start=performance.now()
      try{const canvas=await renderFactsheetImage(SHEETS.find(s=>s.id==='nasdaq-pea'));return {elapsed:performance.now()-start,files,png:canvas.toDataURL()}}finally{CanvasRenderingContext2D.prototype.drawImage=original}
    })}
    const result=await render(),hasApple=result.files.some(f=>f.endsWith('/apple.svg'))
    assert.equal(hasApple,mode==='delayed',mode)
    if(mode==='delayed')assert(result.elapsed>=800,'Logo not awaited')
    if(mode==='timeout')assert(result.elapsed<5800,'Logo timeout blocked export')
    await mkdir('test-artifacts/index-relief',{recursive:true})
    await writeFile(`test-artifacts/index-relief/logo-${mode}.png`,Buffer.from(result.png.split(',')[1],'base64'))
    await p.unroute('**/asset-art/official-logos/apple.svg')
    const recovered=await render();assert(recovered.files.some(f=>f.endsWith('/apple.svg')),'Failed cache did not retry')
    failures.push({mode,elapsed:result.elapsed,recovered:true})
    await p.close()
  }
  await writeFile('test-artifacts/index-relief/verification.json',JSON.stringify({...report,failures},null,2)+'\n')
  console.log(`Relief: ${report.count} index/variant/currency renders, ${report.logos.length} decoded logos; missing/corrupt/delayed/timed-out logos and retry verified.`)
}
