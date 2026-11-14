import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5189'],{stdio:'ignore'})
for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5189/shinny-potato/')).ok)break}catch{}await new Promise(resolve=>setTimeout(resolve,100))}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})
try{
 const page=await browser.newPage({viewport:{width:390,height:900}})
 const base='http://127.0.0.1:5189/shinny-potato/'
 console.log('Opening browser')
 await page.goto(base+'le-dca-de?mode=dca')
 console.log('Rendering series')
 const result=await page.evaluate(async()=>{
  const {renderImageSeries}=await import('/shinny-potato/src/pages/dca-profiles/image-series.js')
  const {newManualLine}=await import('/shinny-potato/src/pages/dca-profiles/placements.js')
  const {ALL_PROFILES}=await import('/shinny-potato/src/pages/dca-profiles/data.js')
  const {prepareProfile}=await import('/shinny-potato/src/pages/dca-profiles/engine.js')
  const prepared=prepareProfile(ALL_PROFILES[0])
  const lines=[{...prepared.lines[0],weight:50,amount:0},{asset:'livret-a',label:'Livret A',weight:25,amount:0,isin:''},...Array.from({length:18},(_,i)=>newManualLine({label:`Fonds euros Mutavie épargne à très long libellé personnalisé ${i}`,category:'Fonds en euros',weight:i===17?0:25/17,amount:i===17?100:0}))]
  const profile={...prepared,id:'subscriber:series',mode:'participant',imageOnly:false,name:'Élodie',lines,multiImage:true,showCompanies:false}
  const drawn=[];const original=CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){drawn.push({text,y,height:this.canvas.height});return original.call(this,text,x,y,...rest)}
  const pages=await renderImageSeries(profile,'all')
  CanvasRenderingContext2D.prototype.fillText=original
  const many={...profile,lines:Array.from({length:50},(_,i)=>newManualLine({label:`Placement ${i} · Épargne à très long libellé `+'personnalisé '.repeat(15),category:'Fonds en euros',weight:2,amount:0}))}
  const large=await renderImageSeries(many,'all')
  if(large[0].canvas.height<=pages[0].canvas.height||!large[0].canvas.toDataURL().startsWith('data:image/png'))throw Error('Large allocation PNG invalid')
  window.seriesProfile=profile
  return {pages:pages.map(p=>({id:p.id,width:p.canvas.width,height:p.canvas.height})),drawn,png:pages[0].canvas.toDataURL()}
 })
 console.log('Rendered series')
 assert.deepEqual(result.pages.map(p=>p.id),['allocation','countries','sectors'])
 assert.ok(result.pages[0].height>2500)
 assert.ok(result.drawn.every(t=>t.y<t.height&&t.y>=0))
 assert.ok(result.drawn.some(t=>/100\s€ \/ mois/.test(t.text)))
 assert.ok(!result.drawn.some(t=>t.text==='0 € / mois'))
 assert.ok(!result.drawn.some(t=>/autres positions/.test(t.text)))
 assert.ok(result.drawn.some(t=>t.text.includes('Périmètre pays/secteurs')))
 await mkdir('test-artifacts',{recursive:true})
 const {writeFile}=await import('node:fs/promises')
 await writeFile('test-artifacts/dca-series-allocation.png',Buffer.from(result.png.split(',')[1],'base64'))
 await page.evaluate(()=>localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile:window.seriesProfile,draft:'Texte personnalisé',draftEdited:true,field:'all'})))
 console.log('Reloading draft')
 await page.reload()
 await page.getByRole('navigation',{name:'Images à exporter'}).waitFor({timeout:60000})
 await page.getByRole('button',{name:'Exposition géographique',exact:true}).click()
 const downloadPromise=page.waitForEvent('download')
 await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
 assert.match((await downloadPromise).suggestedFilename(),/-countries\.png$/)
 console.log('Reloading draft')
 await page.reload()
 await page.getByRole('navigation',{name:'Images à exporter'}).waitFor({timeout:60000})
 assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true)
 await page.screenshot({path:'test-artifacts/dca-series-mobile.png',fullPage:true})
 await page.evaluate(()=>{const profile=JSON.parse(localStorage.getItem('el-dca-draft-v1')).profile;localStorage.setItem('epargnant-publication:v1:simple-exposure-draft',JSON.stringify({lines:profile.lines.filter(l=>l.weight>0),multiImage:true,field:'all',exposureLimit:4}))})
 await page.goto(base+'le-dca-de')
 await page.getByRole('navigation',{name:'Images à exporter'}).filter({visible:true}).waitFor({timeout:60000})
 await page.getByRole('button',{name:'Exposition sectorielle',exact:true}).filter({visible:true}).click()
 const exposureDownload=page.waitForEvent('download')
 await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).filter({visible:true}).click()
 assert.match((await exposureDownload).suggestedFilename(),/-sectors\.png$/)
 console.log('Chromium: mixed 20-line profile, full allocation, positive flows only, separate scopes, download, restored mode and mobile passed.')
}finally{await browser.close();server.kill()}
