import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {ALL_PROFILES,ASSETS} from '../src/pages/dca-profiles/data.js'
import {prepareProfile} from '../src/pages/dca-profiles/engine.js'
const base=process.env.IMAGE_AUDIT_BASE||staticBase,out=process.env.IMAGE_AUDIT_OUT||'test-artifacts/image-density/journey'
const profile={...prepareProfile(ALL_PROFILES[0]),name:'Recette visuelle',mode:'participant',lines:Object.entries(ASSETS).sort((a,b)=>b[1][1].length-a[1][1].length).slice(0,8).map(([asset,[emoji,label]])=>({asset,emoji,label,weight:12.5,amount:100,isin:''}))}
await mkdir(out,{recursive:true})
const reports=[]
for(const width of [390,320]){
 let browser,context,page
 if(base===staticBase)({browser,context,page}=await staticBrowser(width))
 else{browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});context=await browser.newContext({viewport:{width,height:950}});page=await context.newPage()}
 try{
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(base)
 // Disposable browser storage only: an explicit synthetic editorial test, never
 // saved in the application's portfolio library or sent to a financial service.
 await page.evaluate(profile=>localStorage.setItem('el-dca-draft-v1',JSON.stringify({profile,draft:'Recette visuelle synthétique',draftEdited:true,field:'all'})),profile)
 await page.goto(base+'le-dca-de?mode=dca')
 const image=page.locator('.dca-publication-column .dca-simple-preview img')
 await image.evaluate(img=>img.decode())
 const bytes=await image.evaluate(async img=>Array.from(new Uint8Array(await(await fetch(img.src)).arrayBuffer())))
 const dimensions=await image.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight}))
 assert.equal(dimensions.width,1600);assert(dimensions.height>1000,'Dense names require more space')
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()])
 const path=`${out}/dense-${width}.png`;await download.saveAs(path)
 assert.deepEqual(await readFile(path),Buffer.from(bytes),'Real download must match the current preview bytes')
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 assert.equal(await page.locator('#dca-draft').inputValue(),'Recette visuelle synthétique')
 assert.deepEqual(errors,[])
 await page.screenshot({path:`${out}/dense-${width}-ui.png`,fullPage:true})
 reports.push({width,...dimensions,identical:true,errors})
 }finally{await context?.close();await browser?.close()}
}
await writeFile(`${out}/results.json`,JSON.stringify(reports,null,2))
console.log('Dense canonical eight-position portfolios: real downloads equal preview bytes at 390/320px, no horizontal overflow, unchanged draft, isolated storage discarded.')
