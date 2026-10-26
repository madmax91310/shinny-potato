import {chromium,devices} from 'playwright'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const external=process.env.INDEX_PUBLIC_BASE
const base=external??'http://127.0.0.1:4337/shinny-potato/'
const server=external?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4337'],{stdio:'ignore'})
const out=`test-artifacts/index-relief/${external?'public':'built'}-journey`
const digest=b=>createHash('sha256').update(b).digest('hex')
let browser
const reports=[]
try{
for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:process.env.CI?{}:{executablePath:'/usr/bin/chromium'}),args:['--no-sandbox']})
await mkdir(out,{recursive:true})
for(const mobile of [false,true]){
 const context=await browser.newContext(mobile?{...devices['iPhone 13'],acceptDownloads:true}:{viewport:{width:1280,height:900},acceptDownloads:true})
 await context.addInitScript(()=>{
  const texts=new WeakMap(),original=CanvasRenderingContext2D.prototype.fillText,serialize=HTMLCanvasElement.prototype.toDataURL
  window.__exports=[]
  CanvasRenderingContext2D.prototype.fillText=function(t,...args){const labels=texts.get(this.canvas)??[];labels.push(String(t));texts.set(this.canvas,labels);return original.call(this,t,...args)}
  HTMLCanvasElement.prototype.toDataURL=function(...args){const png=serialize.apply(this,args);window.__exports.push({png,labels:texts.get(this)??[]});return png}
 })
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/asset-art/official-logos/apple.svg',async route=>{await new Promise(r=>setTimeout(r,1800));await route.continue()})
 await page.goto(`${base}tweets-factsheets`,{waitUntil:'domcontentloaded'})
 await page.locator('#factsheet-subject').waitFor()
 async function settings(){const button=page.getByRole('button',{name:'Réglages',exact:true});if(await button.isVisible())await button.click()}
 async function select(id,name){await settings();await page.getByRole('searchbox',{name:'Rechercher : Choisir un indice',exact:true}).fill(name);await page.locator(`#factsheet-subject [data-option][data-value="${id}"]`).click()}
 async function preview(){const button=page.getByRole('button',{name:'Aperçu',exact:true});if(await button.isVisible())await button.click();await page.getByRole('tab',{name:'Image',exact:true}).click();const image=page.locator('.publication-preview img, .publication-preview-stage img, .studio-preview img').first();await image.evaluate(i=>i.decode());return image}
 // Start rendering before switching: an obsolete canvas must never win a delayed-logo race.
 const initialPreview=page.getByRole('button',{name:'Aperçu',exact:true});if(await initialPreview.isVisible())await initialPreview.click()
 await page.getByRole('tab',{name:'Image',exact:true}).click()
 await select('world','MSCI World');await select('sp500-pea','S&P 500');await select('nasdaq-pea','Nasdaq-100')
 let image=await preview()
 await page.waitForFunction(()=>{const i=document.querySelector('.publication-preview img, .publication-preview-stage img, .studio-preview img');return i&&window.__exports.some(e=>e.png===i.src&&e.labels.includes('Nasdaq-100'))})
 let png=await image.getAttribute('src')
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()])
 assert.match(download.suggestedFilename(),/^nasdaq-pea-/);assert.equal(await download.failure(),null)
 const path=`${out}/${mobile?'mobile':'desktop'}-nasdaq.png`;await download.saveAs(path)
 await writeFile(path.replace('.png','-preview.png'),Buffer.from(png.split(',')[1],'base64'))
 await writeFile(path.replace('.png','-labels.json'),JSON.stringify(await page.evaluate(()=>window.__exports.map(e=>({labels:e.labels}))),null,2))
 assert.equal(digest(await readFile(path)),digest(Buffer.from(png.split(',')[1],'base64')))
 await settings();await page.locator('#factsheet-currency [data-option][data-value="EUR"]').click();image=await preview()
 await page.waitForFunction(()=>{const i=document.querySelector('.publication-preview img, .publication-preview-stage img, .studio-preview img');return i&&window.__exports.some(e=>e.png===i.src&&e.labels.includes('PERFORMANCES ANNUELLES EN EUR'))})
 png=await image.getAttribute('src');const [euros]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger l’image',exact:true}).click()]);assert.match(euros.suggestedFilename(),/-EUR-/)
 const euroPath=`${out}/${mobile?'mobile':'desktop'}-nasdaq-eur.png`;await euros.saveAs(euroPath);assert.equal(digest(await readFile(euroPath)),digest(Buffer.from(png.split(',')[1],'base64')))
 await page.getByRole('tab',{name:'Composition top 10',exact:true}).click()
 const composition=page.locator('.fs-composition-preview');await composition.evaluate(i=>i.decode());const cpng=await composition.getAttribute('src')
 const [top]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger la composition en PNG',exact:true}).click()]);const topPath=`${out}/${mobile?'mobile':'desktop'}-nasdaq-top10.png`;await top.saveAs(topPath);assert.equal(digest(await readFile(topPath)),digest(Buffer.from(cpng.split(',')[1],'base64')))
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-page.png`,fullPage:true})
 assert.deepEqual(errors,[]);reports.push({mobile,downloads:3,previewEquality:true,rapidSelection:true,currency:'EUR',errors});await context.close()
}
await writeFile(`${out}/result.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),reports},null,2)+'\n');console.log(JSON.stringify({base,reports}))
}finally{await browser?.close();server?.kill('SIGTERM')}
