import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
const base=process.env.IMAGE_AUDIT_BASE||'http://127.0.0.1:4173/shinny-potato/'
import {choose} from './card-selection.mjs'
import {MODEL_INVESTORS} from '../src/data/investor-models.js'
const out='test-artifacts/image-audit/secondary';await mkdir(out,{recursive:true});const reports=[]
for(const width of [390,320]){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
 const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage()
 try{
 page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);console.log('Start',width)
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 async function save(id,button,image){
  if(image){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode())}
  const bytes=image?await image.evaluate(async i=>Array.from(new Uint8Array(await(await fetch(i.src)).arrayBuffer()))):null
  const [d]=await Promise.all([page.waitForEvent('download'),button.click()]);const file=`${out}/${id}-${width}.png`;await d.saveAs(file)
  if(bytes)assert.deepEqual(await readFile(file),Buffer.from(bytes),`${id} preview/download`)
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
  reports.push({id,width,filename:d.suggestedFilename(),previewIdentical:!!bytes,overflow,errors:[...errors]})
  assert(!overflow,id+' horizontal overflow')
  await writeFile(`${out}/results.json`,JSON.stringify(reports,null,2))
  console.log(id,width)
 }
 await page.goto(base+'banque-tweets?category=Guide%20ETF');console.log('Bank ready')
 for(const [needle,id] of [['8 ETF','8-etf-dividendes'],['20 ETF','20-etf-14-themes']]){
  await page.getByRole('searchbox',{name:'Rechercher dans les archives'}).fill(needle)
  console.log('Search',needle);const figure=page.locator('figure').filter({has:page.locator(`img[src$="${id}.png"]`)}).first()
  await save(id,figure.getByRole('link',{name:'Télécharger l’image PNG'}),figure.locator('img'))
 }
 await page.goto(base+'portefeuilles-investisseurs')
 for(const [id] of MODEL_INVESTORS){
  const settings=page.getByRole('button',{name:'Réglages',exact:true});if(await settings.isVisible())await settings.click()
  await choose(page.locator('#ip-investor'),id)
  const preview=page.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click()
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  const img=page.locator('.studio-preview img');await img.evaluate(i=>i.decode())
  await save(id,page.getByRole('button',{name:/Télécharger le PNG/}),img)
 }
 await page.goto(base+'classements-performances')
 await page.getByRole('button',{name:'Classement annuel',exact:true}).click()
 await page.getByRole('button',{name:'Aperçu',exact:true}).click()
 await page.getByRole('tab',{name:'Image',exact:true}).click()
 await save('ranking-annual',page.getByRole('button',{name:'Télécharger l’image',exact:true}),page.locator('.studio-preview img'))
 assert.deepEqual(errors,[])
 }finally{await context.close();await browser.close()}
}
