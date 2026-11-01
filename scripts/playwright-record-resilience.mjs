import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {choose} from './card-selection.mjs'
for(const width of [390,1440]){
 const {browser,page,context}=await staticBrowser(width),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 async function ready(name){await page.waitForFunction(value=>document.querySelector('.tool-preview pre')?.textContent.includes(value),name)}
 async function preview(){if(width<1024)await page.getByRole('button',{name:'Aperçu',exact:true}).click()}
 try{
  for(const body of ['', '{broken', JSON.stringify({unrelated:true}), JSON.stringify({id:'microsoft',points:[{date:'2000-01',price:1}]})]){
   await context.route('**/data/history/*.json',route=>route.fulfill({contentType:'application/json',body}))
   await page.goto(staticBase+'il-y-a-x-ans?asset=microsoft')
   await preview()
   await page.getByText('L’historique n’a pas pu être chargé.',{exact:false}).waitFor()
   assert.equal(await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).count(),0,'no export from unvalidated input')
   await context.unroute('**/data/history/*.json')
   await page.getByRole('button',{name:'Réessayer',exact:true}).click();await ready('Microsoft')
  }
  // A request that never answers must leave loading and allow an explicit retry.
  let stalled
  await context.route('**/data/history/*.json',route=>{stalled=route})
  await page.goto(staticBase+'il-y-a-x-ans?asset=microsoft');await preview()
  await page.getByText('L’historique n’a pas pu être chargé.',{exact:false}).waitFor({timeout:20000})
  await context.unroute('**/data/history/*.json')
  await stalled.abort().catch(()=>{})
  await page.getByRole('button',{name:'Réessayer',exact:true}).click();await ready('Microsoft')
  // Select Apple while Microsoft is still in flight; late completion stays obsolete.
  let held,seen
  const requested=new Promise(resolve=>{seen=resolve})
  await context.route('**/data/history/*.json',async route=>{
   const path=new URL(route.request().url()).pathname.slice('/shinny-potato/'.length)
   const bytes=await readFile(resolve('dist',path)),record=JSON.parse(bytes)
   if(record.label==='Microsoft'){held={route,bytes};seen();return}
   await route.fulfill({body:bytes,contentType:'application/json'})
  })
  await page.goto(staticBase+'il-y-a-x-ans?asset=microsoft');await Promise.race([requested,new Promise((_,reject)=>setTimeout(()=>reject(Error('Expected Microsoft request was not intercepted')),10000))])
  await choose(page.locator('#subject-select'),'apple');await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();await ready('Apple')
  await held.route.fulfill({body:held.bytes,contentType:'application/json'})
  await page.waitForLoadState('networkidle');assert((await page.locator('.tool-preview pre').textContent()).includes('Apple'))
  await preview()
  const downloadPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
  const download=await downloadPromise;assert.equal(await download.failure(),null)
  const png=await readFile(await download.path());assert.equal(png.subarray(1,4).toString(),'PNG')
  await mkdir('test-artifacts/technical-audit',{recursive:true})
  await writeFile(`test-artifacts/technical-audit/recovered-${width}.png`,png)
  await page.screenshot({path:`test-artifacts/technical-audit/recovered-${width}.webp`,fullPage:true})
  await context.unroute('**/data/history/*.json')
  await page.goto(staticBase+'calculateur-investissement?asset=apple')
  const amount=page.locator('.ic-amount-wrap input')
  await amount.fill('1e308')
  await page.getByText('Ces valeurs dépassent la capacité de calcul. Réduis le montant ou les prix saisis.',{exact:true}).first().waitFor()
  assert(!/∞|NaN|Infinity/.test(await page.locator('#workspace-main').innerText()))
  await amount.fill('100')
  if(width<1024)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  assert(await page.getByRole('button',{name:/Copier le texte du post/}).isEnabled())
  assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 }finally{await browser.close()}
}
console.log('Mobile/desktop: corrupt, empty, wrong and older records, real 15s deadline/retry, rapid selection with late completion, validated PNG download.')
