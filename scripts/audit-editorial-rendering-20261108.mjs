import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173/shinny-potato'
const out=process.env.TEST_OUTPUT_DIR??'test-artifacts/editorial-rendering-20261108'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH??process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
try {
 const page=await browser.newPage();await page.goto(base)
 const results=await page.evaluate(async()=>{
  const [{ETFS},{renderETFImage},{ANNIVERSARY_ART},{ANNIVERSAIRE_ELIGIBLE_ASSETS,getValidYearsBackOptions},{renderAnniversaryImage},{TODAY}]=await Promise.all([
   import('/shinny-potato/src/data/etf-cards.js'),import('/shinny-potato/src/pages/etf-sheets/canvasImage.js'),import('/shinny-potato/src/pages/tweet-midi/anniversaryArt.js'),import('/shinny-potato/src/pages/tweet-midi/data/anniversaryHistory.js'),import('/shinny-potato/src/pages/tweet-midi/anniversaryImage.js'),import('/shinny-potato/src/pages/tweet-midi/engines/anniversaire.js')])
  const fill=CanvasRenderingContext2D.prototype.fillText,draw=CanvasRenderingContext2D.prototype.drawImage
  let labels=[],bounds=[],logos=[]
  CanvasRenderingContext2D.prototype.drawImage=function(img,...args){if(img instanceof HTMLImageElement&&img.src.includes('official-logos/'))logos.push({src:img.src,alpha:this.globalAlpha,filter:this.filter});return draw.call(this,img,...args)}
  CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
   const m=this.measureText(value),t=this.getTransform()
   const b={text:String(value),font:this.font,left:t.a*(x-m.actualBoundingBoxLeft)+t.e,right:t.a*(x+m.actualBoundingBoxRight)+t.e,top:t.d*(y-m.actualBoundingBoxAscent)+t.f,bottom:t.d*(y+m.actualBoundingBoxDescent)+t.f}
   if(b.left<0||b.right>this.canvas.width+1||b.top<0||b.bottom>this.canvas.height+1)throw new Error('Clipped '+JSON.stringify(b))
   for(const previous of bounds)if(Math.min(previous.right,b.right)-Math.max(previous.left,b.left)>1&&Math.min(previous.bottom,b.bottom)-Math.max(previous.top,b.top)>1)throw new Error('Overlap '+JSON.stringify({previous,b}))
   bounds.push(b);labels.push(String(value));return fill.call(this,value,x,y,...args)
  }
  const sheets=[],anniversaries=[],refused=[]
  for(const etf of ETFS){labels=[];bounds=[];const canvas=await renderETFImage(etf);if(!labels.some(l=>l.includes(etf.isin)))throw new Error('Missing ISIN '+etf.id);sheets.push({id:etf.id,width:canvas.width,height:canvas.height,minFactFont:Math.min(...bounds.filter(b=>b.top>=724&&b.top<956&&b.left>=600).map(b=>Number(b.font.match(/(\d+)px/)[1])))})}
  for(const asset of ANNIVERSAIRE_ELIGIBLE_ASSETS){
   const years=getValidYearsBackOptions(asset.id,TODAY);if(!years.length){refused.push(asset.id);continue}
   labels=[];bounds=[];logos=[]
   try{await renderAnniversaryImage({mode:'simple',assetId:asset.id,yearsBack:years[0]},'100')}catch(e){throw new Error(asset.id+': '+e.message)}
   const title=ANNIVERSARY_ART[asset.id].title
   if(labels.filter(l=>l===title).length!==1)throw new Error('Duplicate/missing identity '+asset.id+' '+title)
   if(!labels.includes('AUJOURD’HUI'))throw new Error('Today missing '+asset.id)
   if(logos.some(l=>l.alpha!==1||l.filter!=='none'))throw new Error('Official logo modified '+asset.id)
   anniversaries.push({id:asset.id,title,officialLogo:logos.length>0})
  }
  return {sheets,anniversaries,refused}
 })
 assert(results.sheets.length>0&&results.anniversaries.length>0)
 await writeFile(`${out}/results.json`,JSON.stringify(results,null,2))
 console.log(JSON.stringify({sheets:results.sheets.length,anniversaries:results.anniversaries.length,noLogo:results.anniversaries.filter(a=>!a.officialLogo).length,refused:results.refused.length,minFactFont:Math.min(...results.sheets.map(s=>s.minFactFont)),bounds:'No overlaps or clipping',identity:'Exactly one title per anniversary'}))
} finally {await browser.close()}
