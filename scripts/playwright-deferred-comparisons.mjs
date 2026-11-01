import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {choose} from './card-selection.mjs'
for(const width of [390,1440])for(const route of ['il-y-a-x-ans','performance-depuis']){
 const {browser,page}=await staticBrowser(width),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 try{
  await page.goto(staticBase+route+'?asset=apple')
  await page.waitForFunction(()=>document.querySelector('.tool-preview pre')?.textContent.includes('Apple'))
  await page.getByRole('button',{name:'Comparatif (2 actifs)',exact:true}).click()
  await choose(page.locator('#subject-select-a'),'apple')
  await choose(page.locator('#subject-select-b'),'microsoft')
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  await page.waitForFunction(()=>{const text=document.querySelector('.tool-preview pre')?.textContent;return text?.includes('Apple')&&text.includes('Microsoft')})
  if(width<1024)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  const downloadPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
  const download=await downloadPromise;assert.equal(await download.failure(),null)
  const bytes=await readFile(await download.path());assert.equal(bytes.subarray(1,4).toString(),'PNG')
  await mkdir('test-artifacts/deferred-comparisons',{recursive:true});await writeFile(`test-artifacts/deferred-comparisons/${route}-${width}.png`,bytes)
  if(width<1024)await page.getByRole('button',{name:'Réglages',exact:true}).click()
  await page.getByRole('button',{name:'Simple',exact:true}).click()
  await choose(page.locator('#subject-select'),'apple')
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  await page.waitForFunction(()=>{const text=document.querySelector('.tool-preview pre')?.textContent;return text?.includes('Apple')&&!text.includes('Microsoft')})
  assert.deepEqual(errors,[])
 }finally{await browser.close()}
}
console.log('Deferred comparisons: both market tools, mobile/desktop, simple -> pair generation -> downloaded PNG -> simple, with both exact assets preserved.')
