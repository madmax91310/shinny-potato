import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {TWEETS} from '../src/pages/tweet-bank/data.js'
import CATALOG from '../services/tweet-bank-private/worker/catalog.js'
const out=process.env.GUIDE_QA_DIR||'/tmp/lifestrategy-qa'
await mkdir(out,{recursive:true})
const short=TWEETS.find(t=>t.id==='guide:lifestrategy-court'),original=TWEETS.find(t=>t.id==='guide:multi-asset')
for(const width of [1440,390]) {
 const {browser,page}=await staticBrowser(width)
 try {
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(staticBase+'banque-tweets')
  await page.getByLabel('Rechercher dans les archives').fill('LifeStrategy')
  const group=page.locator('.tb-variant-group')
  await group.waitFor();assert.equal(await page.locator('.tb-variant-group').count(),1)
  assert.equal(await group.getByLabel('Texte de la publication').inputValue(),short.text)
  await group.getByRole('button',{name:/Guide multi-actifs original/}).click()
  assert.equal(await group.getByLabel('Texte de la publication').inputValue(),original.text)
  await group.getByRole('button',{name:/LifeStrategy · version courte/}).click()
  await group.getByText('Sources de ce texte',{exact:true}).click()
  assert.equal(await group.locator('a[href*="fund-docs.vanguard.com"]').count(),8)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`${out}/public-${width}.png`,fullPage:true})
  await page.getByLabel('Rechercher dans les archives').fill('NL0009272772')
  assert.equal(await page.locator('.tb-variant-group').count(),1)
  assert.deepEqual(errors,[])
 }finally{await browser.close()}
}
const server=spawn(process.execPath,['services/tweet-bank-private/scripts/preview.mjs'],{env:{...process.env,PORT:'4420'},stdio:'ignore'})
try {
 for(let i=0;;i++){try{if((await fetch('http://127.0.0.1:4420')).ok)break}catch{}assert(i<100);await new Promise(r=>setTimeout(r,100))}
 for(const width of [1440,390]) {
  const browser=await chromium.launch(),context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage()
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message))
   await page.route('**/api/catalog',r=>r.fulfill({json:{...CATALOG,catalogSource:'snapshot'}}))
   await page.goto('http://127.0.0.1:4420');await page.locator('#status').filter({hasText:'Synchronisé'}).waitFor()
   await page.locator('#search').fill('LifeStrategy')
   assert.equal(await page.locator('.card').count(),1)
   let card=page.locator('.card');assert.equal(await card.getAttribute('data-tweet-id'),'archive:'+short.id)
   await card.locator('details').click();assert.equal(await card.locator('.full').innerText(),short.text)
   assert.equal(await card.locator('a[href*="fund-docs.vanguard.com"]').count(),8)
   await card.locator('select').selectOption('archive:'+original.id)
   assert.equal(await card.locator('.full').textContent(),original.text)
   await card.getByRole('button',{name:'Créer ma version',exact:true}).click()
   assert.equal(await page.locator('#text').inputValue(),original.text)
   await page.locator('#cancel').click()
   await page.locator('#search').fill('NL0009272772');assert.equal(await page.locator('.card').count(),1)
   await card.locator('select').selectOption('archive:'+short.id)
   assert(await card.getByRole('button',{name:'Copier',exact:true}).isEnabled())
   assert(await page.locator('#backup').isVisible());assert(await page.locator('#restore').isVisible())
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
   await page.screenshot({path:`${out}/private-${width}.png`,fullPage:true});assert.deepEqual(errors,[])
  }finally{await browser.close()}
 }
}finally{server.kill()}
console.log('LifeStrategy public/private 1440/390: one group, short default, both exact texts, 8 sources, original ISIN search, personal copy, backup controls, no overflow or JS errors.')
