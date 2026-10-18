import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const base='http://127.0.0.1:4372/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4372'],{stdio:'ignore'})
let browser,page
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {})})
 page=await browser.newPage({viewport:{width:1440,height:1100}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(base+'le-dca-de')
 const search=page.getByRole('searchbox',{name:'Ajouter un actif'})
 await search.fill('IE00B4L5Y983')
 await page.getByRole('button').filter({hasText:'IE00B4L5Y983'}).click()
 await page.getByRole('spinbutton').fill('80')
 await search.fill('Bitcoin')
 await page.locator('.dca-simple-results button').first().click()
 await page.getByRole('spinbutton').nth(1).fill('5')
 await search.fill('IE00B4ND3602')
 await page.locator('.dca-simple-results button').first().click()
 await page.getByText('Personnaliser l’image',{exact:true}).click()
 await page.getByRole('group',{name:'Catégories par donut',exact:true}).locator('[data-value="6"]').click()
 await page.getByText('Voir l’analyse détaillée',{exact:true}).click()
 await page.getByText('Tous les pays et secteurs',{exact:true}).click()
 await page.getByRole('table').first().waitFor()
 const countryRows=await page.getByRole('table').first().locator('tbody tr').count()
 assert(countryRows>6,`Expected detailed physical World country table, received ${countryRows} rows`)
 assert((await page.locator('.dca-exposure-detail').innerText()).includes('80 % du portefeuille'))
 await page.locator('.dca-simple-preview img').waitFor()
 await page.getByAltText('Répartition et expositions du portefeuille').waitFor()
 const original=await page.getByAltText('Répartition et expositions du portefeuille').getAttribute('src')
 await mkdir('test-artifacts/exposure-scope',{recursive:true})
 await writeFile('test-artifacts/exposure-scope/portfolio.png',Buffer.from(await page.evaluate(async url=>Array.from(new Uint8Array(await (await fetch(url)).arrayBuffer())),original)))
 const results=await page.evaluate(async()=>{
  const {renderDcaImage}=await import('/shinny-potato/src/pages/dca-profiles/image.js')
  const {references}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
  const out=[],original=CanvasRenderingContext2D.prototype.fillText
  let boxes=[],labels=[],activeField
  CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...rest){const m=this.measureText(value),b={left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent,value}
   if(b.left<0||b.right>1601||b.top<0||b.bottom>1068)throw Error('Clipped '+value)
   if(activeField==='all'&&x>=1070&&y<950&&b.bottom>(y<545?512:932))throw Error('Legend outside its panel: '+value)
   for(const a of boxes)if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)throw Error('Overlap '+a.value+' / '+value)
   boxes.push(b);labels.push(String(value));return original.call(this,value,x,y,...rest)}
  try{
   for(const lines of [ [['world',80],['gold',15],['btc',5]], [['gold',50],['btc',50]], [['world',60],['lifestrategy20',20],['gold',20]] ])
   for(const limit of [3,4,6])for(const field of ['countries','sectors','both','all']){
    boxes=[];labels=[];activeField=field
    const p={imageOnly:true,name:'',scope:'Portefeuille investi',exposureLimit:limit,lines:lines.map(([asset,weight])=>({asset,weight,label:references[asset]?.name||asset,isin:references[asset]?.isin||''}))}
    await renderDcaImage(p,field)
    if(!labels.some(t=>/Poche actions|Aucune poche actions/.test(t)))throw Error('Missing scope')
    if(labels.some(t=>/couverture|ventilés|Synthèse indicative|Pourcentages arrondis|\d{4}-\d{2}-\d{2}/i.test(t)))throw Error('Technical annotation restored in image')
    out.push({limit,field})
   }
  }finally{CanvasRenderingContext2D.prototype.fillText=original}
  return out
 })
 assert.equal(results.length,36)
 await page.setViewportSize({width:390,height:844})
 assert(await page.locator('.dca-simple-card').first().evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Mobile composer overflow')
 await page.screenshot({path:'test-artifacts/exposure-scope/mobile.png',fullPage:true})
 assert.deepEqual(errors,[])
 console.log('Exposure UI: 80/15/5, complete detail, six categories, PNG, mobile and 36 canvas layouts verified.')
}catch(error){await mkdir('test-artifacts/exposure-scope',{recursive:true});if(page&&!page.isClosed())await page.screenshot({path:'test-artifacts/exposure-scope/failure.png',fullPage:true});throw error}
finally{await browser?.close();server.kill()}
