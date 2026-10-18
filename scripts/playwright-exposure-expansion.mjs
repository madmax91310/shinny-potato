import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import config from './exposure-etf-expansion.json' with {type:'json'}
const base='http://127.0.0.1:4377/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4377'],{stdio:'ignore'})
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto(base+'le-dca-de')
 for(const isin of ['FR0011869304','IE000716YHJ7','DE0002635307']){
  const s=config.instruments.find(s=>s.isin===isin)
  await page.getByRole('searchbox',{name:'Ajouter un actif'}).fill(isin)
  await page.getByRole('button',{name:new RegExp(isin)}).click()
  await page.locator('.dca-simple-preview img').waitFor()
  await page.getByAltText('Répartition et expositions du portefeuille').waitFor()
  assert(await page.getByAltText('Répartition et expositions du portefeuille').evaluate(el=>el.naturalWidth>1000))
  await page.getByRole('button',{name:'Retirer '+s.name,exact:true}).click()
 }
 await page.setViewportSize({width:390,height:844})
 await page.getByRole('searchbox',{name:'Ajouter un actif'}).fill('IE00BKLF1R75')
 await page.getByRole('button',{name:/IE00BKLF1R75/}).click()
 await page.locator('.dca-simple-preview img').waitFor()
 await page.getByAltText('Répartition et expositions du portefeuille').waitFor()
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 const results=await page.evaluate(async(config)=>{
  const {renderDcaImage}=await import('/shinny-potato/src/pages/dca-profiles/image.js')
  const result=[]
  for(const s of config){
   const canvas=await renderDcaImage({name:'',imageOnly:true,scope:'Portefeuille investi',lines:[{asset:s.isin,isin:s.isin,label:s.name,weight:100,amount:0}]},'both')
   result.push([s.isin,canvas.width,canvas.height])
  }
  return result
 },config.instruments)
 assert.equal(results.length,35)
 assert(results.every(([,w,h])=>w>1000&&h>500))
 await page.screenshot({path:'/tmp/exposure35-mobile.png',fullPage:true})
 await page.goto(base+'bibliotheque-donnees?q=IE000716YHJ7')
 // The data-library route uses its own projected index and fetched record.
 await page.getByRole('heading',{name:'Bibliothèque de données',exact:true}).waitFor()
 await page.getByRole('searchbox').count().then(()=>{})
 assert.deepEqual(errors,[])
 console.log('35 PNG renders, desktop/mobile exact-ISIN selection, and data-library route verified.')
}finally{await browser?.close();server.kill()}
