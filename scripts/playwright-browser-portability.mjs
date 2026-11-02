// Targeted engine coverage: the exhaustive storage/migration suite remains Chromium-only.
import assert from 'node:assert/strict'
import {readFile, mkdir} from 'node:fs/promises'
import {expect} from 'playwright/test'
import {staticBrowser,staticBase} from './static-browser.mjs'
import {BUDGET_PROFILES} from '../src/pages/budget-profiles/data.js'
import {DRAFT_KEY,WORKSPACE_KEY} from '../src/pages/budget-profiles/storage.js'
const dir='test-artifacts/browser-portability'
await mkdir(dir,{recursive:true})
const custom='Brouillon synthétique — été & caractères < > « »\nDeuxième ligne.'
async function png(page,action,name){
 const pending=page.waitForEvent('download'); await action();const download=await pending
 assert.equal(await download.failure(),null)
 const bytes=await readFile(await download.path())
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
 assert(bytes.readUInt32BE(16)>300&&bytes.readUInt32BE(20)>300,'PNG dimensions')
 await download.saveAs(`${dir}/${name}.png`)
 // Real browser decoding, not merely a matching file extension/header.
 assert(await page.evaluate(async data=>{const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();return img.naturalWidth>300&&img.naturalHeight>300},bytes.toString('base64')))
}
for(const engine of ['chromium','firefox','webkit']){
 const {browser,context,page}=await staticBrowser(390,engine)
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 try{
  await page.addInitScript(({key,profile,text})=>{
   if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify({profile,text,edited:true}));sessionStorage.setItem('seeded','1')}
   const active=new Set(),create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL)
   URL.createObjectURL=b=>{const url=create(b);active.add(url);return url}
   URL.revokeObjectURL=url=>{active.delete(url);revoke(url)}
   window.__activeExports=active
  },{key:DRAFT_KEY,profile:BUDGET_PROFILES[0],text:custom})
  await page.goto(staticBase+'le-budget-de')
  const editor=page.getByLabel('Texte prêt à publier')
  await expect(editor).toHaveValue(custom)
  const edited=custom+'\nDernière frappe.'
  await editor.fill(edited);await page.reload();await expect(editor).toHaveValue(edited)
  // Exercise the native write path with a trusted click, then paste into an unrelated field.
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  await expect(page.locator('#workspace-main p[role=status]').filter({hasText:'Texte copié.'})).toBeVisible()
  await page.evaluate(()=>{const target=document.createElement('textarea');target.id='clipboard-proof';document.body.append(target);target.focus()})
  await page.keyboard.press('Control+V')
  await expect(page.locator('#clipboard-proof')).toHaveValue(edited)
  await page.locator('#clipboard-proof').evaluate(node=>node.remove())
  // Explicitly denied clipboard: manual recovery must preserve the draft and never claim success.
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('Denied','NotAllowedError')}}});document.execCommand=()=>false})
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  await expect(page.getByRole('status').filter({hasText:'Copie impossible. Sélectionne le texte.'})).toBeVisible()
  await expect(editor).toHaveValue(edited)
  const imageButton=page.getByRole('button',{name:'Télécharger le PNG',exact:true})
  await expect(imageButton).toBeEnabled()
  const initialUrls=await page.evaluate(()=>[...window.__activeExports])
  for(let n=0;n<3;n++)await png(page,()=>imageButton.click(),`${engine}-budget-${n}`)
  assert.deepEqual(await page.evaluate(()=>[...window.__activeExports]),initialUrls,'PNG downloads reuse only the live preview URL')
  await page.getByText('Brouillons et transfert entre appareils',{exact:true}).click()
  async function backup(text){
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les brouillons et statuts',exact:true}).click()
   const download=await pending;assert.equal(await download.failure(),null)
   const data=JSON.parse(await readFile(await download.path(),'utf8'))
   assert.equal(data.version,2);assert.equal(data.workspace.drafts.find(d=>d.profile.id===BUDGET_PROFILES[0].id).text,text)
   await download.saveAs(`${dir}/${engine}-budget.json`)
   await expect.poll(()=>page.evaluate(()=>[...window.__activeExports])).toEqual(initialUrls)
  }
  await backup(edited)
  const previous=await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY)
  await page.evaluate(()=>{window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError')}})
  await editor.fill(custom+'\nEn mémoire après saturation.')
  await expect(page.getByRole('status').filter({hasText:'Brouillon en mémoire'})).toBeVisible()
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),previous,'Last valid persistent bytes survive quota failure')
  await backup(custom+'\nEn mémoire après saturation.')
  await page.evaluate(()=>{Storage.prototype.setItem=window.__setItem})
  await editor.fill(custom+'\nReprise après erreur.');await page.reload();await expect(editor).toHaveValue(custom+'\nReprise après erreur.')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile page fits viewport')
  await page.screenshot({path:`${dir}/${engine}-mobile.png`,fullPage:true})
  // Real SPA navigation releases the previous tool's preview resource.
  await page.locator('.workspace-mobile-menu > summary').click()
  await page.locator('.workspace-mobile-menu a[href$="/fiches-etf"]').click()
  await page.getByLabel('Plus d’actions',{exact:true}).click()
  await page.getByRole('button',{name:'🖼️ Image récapitulative',exact:true}).click()
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible()
  await expect.poll(()=>page.evaluate(()=>window.__activeExports.size)).toBe(0)
  // Only Chromium needs capability branches: these are JS API contracts, not an OS share-sheet test.
  if(engine==='chromium'){
   await page.evaluate(()=>{
    window.__shares=[];window.__shareMode='unsupported'
    Object.defineProperty(navigator,'canShare',{value:()=>window.__shareMode!=='unsupported',configurable:true})
    Object.defineProperty(navigator,'share',{value:async payload=>{
     window.__shares.push({keys:Object.keys(payload),type:payload.files?.[0]?.type,size:payload.files?.[0]?.size})
     if(window.__shareMode==='cancel')throw new DOMException('Cancelled','AbortError')
    },configurable:true})
   })
   await png(page,()=>dialog.getByRole('button',{name:/Partager \/ Enregistrer/}).click(),'unsupported-share-fallback')
   assert.deepEqual(await page.evaluate(()=>window.__shares),[],'No title-only share replaces a PNG')
   await page.evaluate(()=>{window.__shareMode='cancel'})
   await expect(dialog.getByRole('button',{name:/Partager \/ Enregistrer/})).toBeVisible()
   let downloads=0;const listener=()=>downloads++;page.on('download',listener)
   await dialog.getByRole('button',{name:/Partager \/ Enregistrer/}).click()
   await expect.poll(()=>page.evaluate(()=>window.__shares.length)).toBe(1)
   await expect(dialog.getByRole('button',{name:/Partager \/ Enregistrer/})).toBeVisible()
   await page.evaluate(()=>{window.__shareMode='files'})
   await dialog.getByRole('button',{name:/Partager \/ Enregistrer/}).click()
   await expect(dialog.getByRole('button',{name:'✅ Partagé',exact:true})).toBeVisible()
   const calls=await page.evaluate(()=>window.__shares)
   assert.equal(calls.length,2);assert(calls.every(c=>c.keys.includes('files')&&c.type==='image/png'&&c.size>1000))
   assert.equal(downloads,0,'Cancellation must not trigger an unsolicited download; subsequent share can recover')
   page.off('download',listener)
  }else{
   await png(page,()=>dialog.getByRole('button',{name:'⬇️ Télécharger',exact:true}).click(),`${engine}-etf`)
  }
  assert.deepEqual(errors,[])
  console.log(`${engine}: PNG decoded, JSON read, legacy draft/reload, native clipboard paste and denied clipboard, quota/recovery, repeated exports and resource cleanup passed`)
 }finally{await context.close();await browser.close()}
}
