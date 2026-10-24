import assert from 'node:assert/strict'
import fs from 'node:fs'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
const output='test-artifacts/removed-ai';fs.mkdirSync(output,{recursive:true})
const publicBase=process.env.REMOVAL_PUBLIC_BASE
const base=publicBase??'http://127.0.0.1:4392/shinny-potato'
const server=publicBase?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4392','--strictPort'],{stdio:'ignore'})
let browser
try{
 if(server){let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert(ready)}
 browser=await chromium.launch({headless:true});const errors=[],removedRequests=[],writes=[],results=[]
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage()
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/data\/ai-portfolios\//.test(r.url()))removedRequests.push(r.url());if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(r.method()+' '+r.url())})
  for(const suffix of ['/','/portefeuilles-ia','/portefeuilles-ia/competition?ai-rehearsal=obsolete']){
   await page.goto(base+suffix,{waitUntil:'networkidle'});await page.waitForURL(u=>u.pathname.replace(/\/$/,'')===new URL(base).pathname.replace(/\/$/,''))
   assert.equal(await page.getByRole('link',{name:'Portefeuilles IA',exact:true}).count(),0)
   assert(!(await page.getByRole('link').evaluateAll(links=>links.map(l=>l.getAttribute('href')))).some(h=>h?.includes('/portefeuilles-ia')))
  }
  await page.goto(base+'/fiches-etf?isin=IE00B4L5Y983',{waitUntil:'networkidle'})
  const preview=page.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click()
  await page.getByRole('tab',{name:'Texte',exact:true}).click();await page.locator('.es-card .es-facts').getByText('ISIN : IE00B4L5Y983',{exact:true}).waitFor()
  await page.getByRole('tab',{name:'Image',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.publication-image-stage img')?.naturalWidth>=1000)
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:/Télécharger/}).first().click();const file=await pending;const name=`world-${width}.png`;await file.saveAs(output+'/'+name);assert.equal(fs.readFileSync(output+'/'+name).subarray(1,4).toString(),'PNG')
  await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'});await page.getByRole('region',{name:'Surveillance des données',exact:true}).getByRole('searchbox').waitFor();const search=page.getByRole('region',{name:'Surveillance des données',exact:true}).getByRole('searchbox');await search.fill('update-ai-portfolios.yml');await page.waitForTimeout(200);assert.equal(await page.getByRole('region',{name:'Surveillance des données',exact:true}).locator('article').count(),0)
  results.push({width,oldUrlsRedirect:true,noNavigationEntry:true,sharedEtfText:true,sharedPng:name,noActiveIaIncident:true});await context.close()
 }
 assert.deepEqual(errors,[]);assert.deepEqual(removedRequests,[]);assert.deepEqual(writes,[])
 fs.writeFileSync(output+'/results.json',JSON.stringify({checkedAt:new Date().toISOString(),base,results,errors,removedRequests,writes,responseInterception:false},null,2)+'\n');console.log('Removed tool: home/navigation, old URL redirect, no IA data requests, shared ETF text/PNG, supervision; mobile and desktop passed.')
}finally{await browser?.close();server?.kill()}
