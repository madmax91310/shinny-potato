import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {readFile} from 'node:fs/promises'
import CATALOG from '../worker/catalog.js'
const root=fileURLToPath(new URL('../',import.meta.url)),base='http://127.0.0.1:4419'
const server=process.env.PRIVATE_BANK_PREVIEW_RUNNING?null:spawn(process.execPath,['scripts/preview.mjs'],{cwd:root,env:{...process.env,PORT:'4419'},stdio:'ignore'})
let browser
try{
 for(let i=0;;i++){
  try{if((await fetch(base)).ok)break}catch{}
  assert(i<100,'Private preview unavailable');await new Promise(resolve=>setTimeout(resolve,100))
 }
 browser=await chromium.launch()
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await context.route('**/api/catalog',route=>route.fulfill({json:{...CATALOG,tweets:CATALOG.tweets.slice(0,3),catalogSource:'snapshot'}}))
  await page.goto(base)
  await page.locator('#status').filter({hasText:'Synchronisé'}).waitFor()
  const text=`Texte d’audit ${width} 👀 <img src=x onerror=alert(1)>\nAccents éà & brouillon.`
  await page.locator('#add').click();await page.locator('#text').fill(text);await page.locator('#save').click()
  await page.locator('#editor').waitFor({state:'hidden'})
  const card=page.locator('.card').filter({hasText:`Texte d’audit ${width}`})
  await card.getByRole('button',{name:'Modifier',exact:true}).click()
  await page.locator('#text').fill(text+' Modifié.')
  let held
  await context.route('**/api/tweets',route=>{if(route.request().method()==='PUT'){held=route;return}return route.continue()})
  await page.locator('#save').click()
  await page.locator('#editor-status').filter({hasText:'Connexion interrompue'}).waitFor({timeout:20000})
  assert.equal(await page.locator('#text').inputValue(),text+' Modifié.')
  assert(await page.locator('#save').isEnabled())
  await context.unroute('**/api/tweets');await held.abort().catch(()=>{})
  await page.locator('#save').click();await page.locator('#editor').waitFor({state:'hidden'})
  await context.route('**/api/tweets',route=>route.fulfill({json:{tweets:[]}}))
  await context.route('**/api/preferences',route=>route.fulfill({json:{preferences:null}}))
  await page.locator('#refresh').click()
  await page.locator('#status').filter({hasText:'Réponse de synchronisation invalide'}).waitFor()
  assert((await card.innerText()).includes(text+' Modifié.'),'failed refresh keeps the last valid snapshot')
  const downloadPromise=page.waitForEvent('download');await page.locator('#export').click()
  const download=await downloadPromise;assert.equal(await download.failure(),null)
  const exported=JSON.parse(await readFile(await download.path(),'utf8'))
  assert(exported.tweets.some(t=>t.text===text+' Modifié.'),'export retains valid rows after malformed refresh')
  assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await context.close()
 }
 console.log('Private UI desktop/mobile: literal special characters, timed-out save preserves draft and allows retry, malformed refresh is atomic, downloaded JSON preserves saved rows.')
}finally{await browser?.close();server?.kill()}
