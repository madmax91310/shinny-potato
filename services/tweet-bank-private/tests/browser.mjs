import assert from 'node:assert/strict'
import {chromium,firefox,webkit} from 'playwright'
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
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
 for(const width of process.argv.includes('--backup-only')?[]:[390,1440]){
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
 if(process.env.BACKUP_BROWSER)assert(['chromium','firefox','webkit'].includes(process.env.BACKUP_BROWSER))
 for(const type of [chromium,firefox,webkit].filter(t=>!process.env.BACKUP_BROWSER||t.name()===process.env.BACKUP_BROWSER)){
  const probe=type===chromium?browser:await type.launch()
  try{for(const width of type===chromium?[390,1440]:[390])await backupScenario(probe,type.name(),width)}finally{if(probe!==browser)await probe.close()}
 }
 if(!process.argv.includes('--backup-only'))console.log('Private UI desktop/mobile: literal special characters, timed-out save preserves draft and allows retry, malformed refresh is atomic, downloaded JSON preserves saved rows.')
}finally{await browser?.close();server?.kill()}

async function backupScenario(browser,name,width){
 const context=await browser.newContext({viewport:{width,height:950}})
 await context.addInitScript(()=>{const make=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);window.backupUrls=new Set();URL.createObjectURL=b=>{const u=make(b);backupUrls.add(u);return u};URL.revokeObjectURL=u=>{backupUrls.delete(u);return revoke(u)}})
 const page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept())
 await context.route('**/api/catalog',route=>route.fulfill({json:{...CATALOG,tweets:CATALOG.tweets.slice(0,3),catalogSource:'snapshot'}}))
 try{
  await page.goto(base);await page.locator('#status').filter({hasText:'Synchronisé'}).waitFor()
  const text=`Restauration ${name} ${width} · éà 👀 <script>littéral</script>`
  await page.locator('#add').click();await page.locator('#text').fill(text);await page.locator('#save').click();await page.locator('#editor').waitFor({state:'hidden'})
  const card=page.locator('.card').filter({hasText:text});await card.waitFor()
  await card.locator('.star').click();await card.locator('.star[aria-pressed=true]').waitFor()
  const dated=page.waitForResponse(r=>r.url().endsWith('/api/preferences')&&r.request().method()==='PUT')
  await card.locator('input[type=date]').fill('2020-01-02');assert.equal((await dated).status(),200)
  let release,requests=0;const gate=new Promise(resolve=>{release=resolve})
  await context.route('**/api/backup',async route=>{requests++;await gate;await route.continue()})
  const pending=page.waitForEvent('download');await page.locator('#backup').dblclick();assert(await page.locator('#backup').isDisabled());release();const download=await pending
  assert.equal(requests,1,'a repeated click during loading starts only one backup');await context.unroute('**/api/backup')
  assert.equal(await download.failure(),null);const bytes=await readFile(await download.path()),backup=JSON.parse(bytes)
  const saved=backup.tweets.find(t=>t.text===text);assert(saved);assert.equal(backup.version,3)
  const prefs=backup.preferences.find(p=>p.tweet_id===saved.id);assert.equal(prefs.favorite,1);assert.equal(prefs.last_published,'2020-01-02')
  await mkdir('test-artifacts/private-backups',{recursive:true});await writeFile(`test-artifacts/private-backups/${name}-${width}.json`,bytes)
  await page.waitForFunction(()=>backupUrls.size===0)
  if(name==='chromium'&&width===390){
   let unexpected=0;const onDownload=()=>{unexpected++};page.on('download',onDownload)
   await context.route('**/api/backup',route=>route.fulfill({json:{version:3,owner:'local-preview-owner',tweets:[{}],preferences:[]}}))
   await page.locator('#backup').click();await page.locator('#status.error').filter({hasText:'Réponse de sauvegarde invalide'}).waitFor()
   assert.equal(unexpected,0,'a malformed response must not create a file or claim success');await context.unroute('**/api/backup');page.off('download',onDownload)
  }
  async function upload(buffer){const chooser=page.waitForEvent('filechooser');await page.locator('#restore').click();await(await chooser).setFiles({name:'sauvegarde.json',mimeType:'application/json',buffer})}
  await upload(Buffer.from('{broken'));await page.locator('#status.error').waitFor();assert(await card.isVisible())
  await card.getByRole('button',{name:'Supprimer',exact:true}).click();await card.waitFor({state:'hidden'})
  await upload(bytes);await page.locator('#status').filter({hasText:'Sauvegarde restaurée.'}).waitFor();await card.waitFor()
  assert.equal(await card.locator('.star').getAttribute('aria-pressed'),'true');assert.equal(await card.locator('input[type=date]').inputValue(),'2020-01-02')
  await page.reload();await card.waitFor();assert.equal(await card.locator('.star').getAttribute('aria-pressed'),'true')
  if(name==='chromium'&&width===390){
   const legacy={...backup,version:2};delete legacy.owner
   await upload(Buffer.from(JSON.stringify(legacy)));await page.locator('#status').filter({hasText:'Sauvegarde restaurée.'}).waitFor()
   await upload(Buffer.from(JSON.stringify({...backup,owner:'another-test-owner'})));await page.locator('#status.error').filter({hasText:'autre compte'}).waitFor();assert(await card.isVisible())
   await card.getByRole('button',{name:'Supprimer',exact:true}).click();await card.waitFor({state:'hidden'})
   await context.route('**/api/backup',async route=>{if(route.request().method()==='POST'){await route.fetch();await route.abort('failed')}else await route.continue()})
   await upload(bytes);await page.locator('#status.error').filter({hasText:'Aucun succès confirmé'}).waitFor()
   await context.unroute('**/api/backup');await page.locator('#refresh').click();await card.waitFor()
   await upload(bytes);await page.locator('#status').filter({hasText:'Sauvegarde restaurée.'}).waitFor();assert.equal(await card.count(),1)
  }
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('test permission denied')}}}))
  await card.getByRole('button',{name:'Copier',exact:true}).click();await page.locator('#status.error').filter({hasText:'Sélectionne le texte'}).waitFor();assert(await card.locator('details').evaluate(d=>d.open))
  assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`test-artifacts/private-backups/${name}-${width}.png`,fullPage:true})
  console.log(`Private backup ${name} ${width}px: downloaded JSON, corrupt refusal, actual restore/reload, publication/favorite history and denied clipboard recovery.`)
 }finally{await context.close()}
}
