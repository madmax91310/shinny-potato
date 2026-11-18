import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
const base=process.env.BUDGET_PUBLIC_BASE||'http://127.0.0.1:4498/shinny-potato'
const server=process.env.BUDGET_PUBLIC_BASE?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4498','--strictPort'],{stdio:'ignore'})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
const widths=process.argv.length>2?process.argv.slice(2).map(Number):[1440,390,320]
assert(widths.every(w=>[1440,390,320].includes(w)))
const out=process.env.BUDGET_ARTIFACTS||'test-artifacts/budget-studio';mkdirSync(out,{recursive:true})
const key='el-budget-workspace-v2',guillaume=BUDGET_PROFILES.find(p=>p.name==='Guillaume'),second=BUDGET_PROFILES.find(p=>p.name==='Émilie'),keptText='Mon texte personnel à garder exactement.\nMes propres questions.'
const fixture={version:4,drafts:[{profile:guillaume,text:keptText,edited:true,textFinance:budgetFinancialReference(guillaume)}],activeId:guillaume.id,published:[guillaume.id],publicationDates:{[guillaume.id]:'2026-10-12'},used:[second.id],queued:[guillaume.id,second.id]}
const receipts=[]
async function readZip(path){
 const bytes=new Uint8Array(readFileSync(path)),view=new DataView(bytes.buffer),files=[]
 let offset=0
 while(view.getUint32(offset,true)===0x04034b50){const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),name=new TextDecoder().decode(bytes.slice(offset+30,offset+30+nameLength)),start=offset+30+nameLength+extraLength;files.push({name,bytes:bytes.slice(start,start+size)});offset=start+size}
 assert.equal(view.getUint32(offset,true),0x02014b50)
 return files
}
async function pngReady(page) {
 const region=page.getByRole('region',{name:'Image du budget',exact:true})
 await expect(region).toHaveAttribute('aria-busy','false',{timeout:30000})
 await expect(region.locator('img')).toHaveCount(1)
 await region.locator('img').evaluate(img=>img.decode())
}
try{
 if(server)await waitPreview(server,base)
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:950},permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'})
  await ctx.addInitScript(({key,fixture})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(fixture))},{key,fixture})
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/le-budget-de');await page.evaluate(()=>document.fonts.ready)
  await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(keptText)
  const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
  await expect.poll(async()=>(await state()).version).toBe(5)
  await page.getByText(/^Ma file de publication ·/).click()
  const queue=page.getByRole('region',{name:'File de publication'})
  await queue.getByLabel('Date prévue pour Guillaume',{exact:true}).fill('2026-12-05')
  await queue.getByRole('button',{name:'Monter Émilie dans la file',exact:true}).click()
  assert.deepEqual((await state()).queued,[second.id,guillaume.id]);assert.equal((await state()).scheduledDates[guillaume.id],'2026-12-05')
  assert.deepEqual((await state()).publicationDates,fixture.publicationDates)
  await page.getByText('Préparer les prochaines publications',{exact:true}).click()
  const selection=page.getByRole('region',{name:'Sélection de publications'})
  await selection.getByRole('button',{name:'Renouveler les suggestions',exact:true}).click()
  const offered=await selection.locator('input[type=checkbox]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')))
  assert(!offered.includes('Préparer Guillaume'));assert(!offered.includes('Préparer Émilie'));assert(offered.length>0)
  await page.getByRole('button',{name:'Adapter ce budget',exact:true}).click()
  await expect(page.getByLabel('Questions pour les lecteurs')).toHaveValue('')
  await expect.poll(async()=>(await state()).activeId).not.toBe(guillaume.id)
  const adaptedState=await state(),adapted=adaptedState.drafts.find(d=>d.profile.id===adaptedState.activeId)
  assert.equal(adapted.profile.savings.find(r=>/PEL/.test(r.label)).amount,45);assert(!adapted.profile.editorialCreation);assert(!adapted.profile.source)
  await page.getByRole('button',{name:'Nouveau profil d’abonné',exact:true}).click()
  await page.getByLabel('Prénom ou pseudonyme',{exact:true}).fill('Dana')
  await page.getByLabel('Revenus · poste 1',{exact:true}).fill('Salaire')
  await page.getByLabel('Revenus · montant 1',{exact:true}).fill('2000')
  await page.getByLabel('Dépenses · poste 1',{exact:true}).fill('Cadeaux')
  const expenses=page.getByRole('group',{name:'Dépenses',exact:true})
  await expenses.getByText('Options du poste 1',{exact:true}).click()
  await page.getByLabel('Dépenses · fréquence 1',{exact:true}).selectOption('annual')
  await page.getByLabel('Dépenses · montant annuel 1',{exact:true}).fill('100')
  await expect(page.getByLabel('Dépenses · montant 1',{exact:true})).toHaveValue('8.33')
  await page.getByText('Ajouter une dépense courante',{exact:true}).click()
  await page.getByLabel('Poste courant à ajouter',{exact:true}).selectOption('food')
  await page.getByRole('button',{name:'Ajouter cette dépense',exact:true}).click()
  await page.getByLabel('Dépenses · montant 2',{exact:true}).fill('300')
  await page.getByLabel('Contexte',{exact:true}).fill('La réserve reste séparée du budget du mois.')
  const manualQuestion='Vous gardez cette provision toute l’année ?'
  await page.getByLabel('Questions pour les lecteurs',{exact:true}).fill(manualQuestion)
  await page.getByRole('button',{name:'Descendre dépenses 1',exact:true}).click()
  const text=page.getByLabel('Texte prêt à publier')
  await expect(text).toHaveValue(/Provision Cadeaux : 8,33/)
  const generated=await text.inputValue();assert.equal((generated.match(/\?/g)||[]).length,1);assert(generated.includes(manualQuestion));assert(generated.indexOf('Courses')<generated.indexOf('Provision Cadeaux'))
  const originalId=(await state()).activeId
  await text.fill('Mon texte sur mesure à conserver.')
  // An annual amount changes the monthly ledger, without replacing custom text.
  await expenses.getByText('Options du poste 2',{exact:true}).click()
  await page.getByLabel('Dépenses · montant annuel 2',{exact:true}).fill('120')
  await expect(text).toHaveValue('Mon texte sur mesure à conserver.')
  await expect(page.getByText(/Les montants du budget ont changé/)).toBeVisible()
  await page.getByRole('button',{name:'Dupliquer ce profil',exact:true}).click()
  await expect(text).toHaveValue('Mon texte sur mesure à conserver.')
  await expect(page.getByLabel('Questions pour les lecteurs',{exact:true})).toHaveValue(manualQuestion)
  await expect.poll(async()=>(await state()).activeId).not.toBe(originalId)
  await page.getByLabel('Prénom ou pseudonyme',{exact:true}).fill('Dana copie')
  await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
  const exactText=await text.inputValue();assert(exactText.includes(manualQuestion));assert.match(exactText,/Provision Cadeaux : 10/)
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),exactText)
  const pngButton=page.getByRole('button',{name:'Télécharger le PNG',exact:true})
  await pngReady(page);await expect(pngButton).toBeEnabled()
  const pngPromise=page.waitForEvent('download');await pngButton.click();const png=await pngPromise;await png.saveAs(`${out}/${width}-selected.png`)
  await page.getByText('Vérifier et télécharger la publication',{exact:true}).click()
  const review=page.getByRole('region',{name:'Relecture de la publication'})
  await expect(review.locator('pre')).toHaveText(exactText)
  const packetPromise=page.waitForEvent('download');await review.getByRole('button',{name:/Télécharger texte \+ \d+ PNG/}).click();const packet=await packetPromise;const zipPath=`${out}/${width}-publication.zip`;await packet.saveAs(zipPath)
  const files=await readZip(zipPath);assert.equal(new TextDecoder().decode(files.find(f=>f.name==='publication.txt').bytes),exactText)
  const pngs=files.filter(f=>f.name.endsWith('.png'));assert.equal(pngs.length,1)
  for(const file of pngs){const bytes=Buffer.from(file.bytes);assert.equal(bytes.toString('ascii',1,4),'PNG');assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1350);writeFileSync(`${out}/${width}-${file.name}`,bytes);assert(await page.evaluate(async bytes=>{const bmp=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));const ok=bmp.width===1080&&bmp.height===1350;bmp.close();return ok},[...file.bytes]))}
  assert.deepEqual(pngs[0].bytes,new Uint8Array(readFileSync(`${out}/${width}-selected.png`)),'ZIP is the exact selected-format PNG, not a second renderer')
  await page.getByText('Points à vérifier dans la fiche',{exact:true}).click()
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow in expanded review/editor')
  await page.screenshot({path:`${out}/${width}-workspace.png`,fullPage:true})
  await page.getByText('Brouillons et transfert entre appareils',{exact:true}).click()
  const backupPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les brouillons et statuts',exact:true}).click();const backupDownload=await backupPromise,backup=JSON.parse(readFileSync(await backupDownload.path(),'utf8'))
  assert.equal(backup.version,5);assert.equal(backup.workspace.scheduledDates[guillaume.id],'2026-12-05');assert.deepEqual(backup.workspace.queued,[second.id,guillaume.id]);assert.deepEqual(backup.workspace.publicationDates,fixture.publicationDates);assert.deepEqual(backup.workspace.used,fixture.used)
  assert.equal(backup.workspace.drafts.find(d=>d.profile.id===originalId).text,'Mon texte sur mesure à conserver.');assert.equal(backup.workspace.drafts.find(d=>d.profile.id===guillaume.id).text,keptText)
  // A changed planned date and queue order are explicit import conflicts.
  const incoming=structuredClone(backup);incoming.workspace.queued.reverse();incoming.workspace.scheduledDates[guillaume.id]='2026-12-06'
  await page.getByLabel('Restaurer une sauvegarde').setInputFiles({name:'queue.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))})
  await expect(page.getByRole('region',{name:'Aperçu de l’import'})).toContainText('Prévu le 06/12/2026')
  await page.getByLabel('Gestion des conflits',{exact:true}).selectOption('use-imported')
  await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click()
  assert.deepEqual((await state()).queued,[guillaume.id,second.id]);assert.equal((await state()).scheduledDates[guillaume.id],'2026-12-06')
  await page.reload();await expect(text).toHaveValue(exactText)
  assert.deepEqual((await state()).published,fixture.published);assert.deepEqual((await state()).publicationDates,fixture.publicationDates)
  await page.getByRole('button',{name:'Profils',exact:true}).click()
  const david=BUDGET_PROFILES.find(p=>p.id==='editorial-studio-alternance-demenagement-2026-11-16')
  // Hold the real encoder callback and verify the download is unavailable until it resolves.
  if(width===390)await page.evaluate(()=>{
   window.budgetStudioNativeToBlob=HTMLCanvasElement.prototype.toBlob
   window.budgetStudioPendingPng=[];window.budgetStudioReleasePng=false
   HTMLCanvasElement.prototype.toBlob=function(callback,...args){
    window.budgetStudioNativeToBlob.call(this,blob=>{
     if(window.budgetStudioReleasePng)callback(blob)
     else window.budgetStudioPendingPng.push(()=>callback(blob))
    },...args)
   }
  })
  await page.getByRole('group',{name:'Choisir un profil',exact:true}).locator(`[data-value='${david.id}']`).click()
  if(width===390){
   await expect(page.getByRole('region',{name:'Image du budget',exact:true})).toHaveAttribute('aria-busy','true')
   await expect(pngButton).toBeDisabled()
   await page.evaluate(()=>{
    window.budgetStudioReleasePng=true
    HTMLCanvasElement.prototype.toBlob=window.budgetStudioNativeToBlob
    window.budgetStudioPendingPng.splice(0).forEach(release=>release())
   })
  }
  await pngReady(page);await expect(pngButton).toBeEnabled()
  const pngPromiseForDavid=page.waitForEvent('download');await pngButton.click();const davidPng=await pngPromiseForDavid
  await page.getByText('Vérifier et télécharger la publication',{exact:true}).click()
  const zipPromise=page.waitForEvent('download');await page.getByRole('region',{name:'Relecture de la publication'}).getByRole('button',{name:'Télécharger texte + 1 PNG (ZIP)',exact:true}).click()
  const zip=await zipPromise
  const davidFiles=await readZip(await zip.path())
  assert.deepEqual(davidFiles.map(file=>file.name),['publication.txt','image-01.png'])
  assert.deepEqual(davidFiles[1].bytes,new Uint8Array(readFileSync(await davidPng.path())))
  if (width === 390) {
   await page.evaluate(() => {
    const native = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback) {
     HTMLCanvasElement.prototype.toBlob = native
     callback(null)
    }
   })
   await page.getByRole('group',{name:'Choisir un profil',exact:true}).locator(`[data-value='${guillaume.id}']`).click()
   await expect(page.getByRole('button',{name:'Réessayer l’image',exact:true})).toBeVisible()
   await expect(pngButton).toBeDisabled()
   await page.getByRole('button',{name:'Réessayer l’image',exact:true}).click()
   await pngReady(page)
   await expect(pngButton).toBeEnabled()
  }
  assert.deepEqual((await state()).published,fixture.published)
  assert.deepEqual(errors,[])
  receipts.push({width,legacyVersion:4,currentVersion:5,annualAmount:120,monthlyProvision:10,manualQuestionsPreserved:true,customDraftsPreserved:true,zipFiles:files.map(f=>f.name),exactPng:true,singleImageZip:true,queueImportConflicts:true,publishedUnchanged:true})
  await ctx.close()
 }
 writeFileSync(`${out}/receipt-${widths.join('-')}.json`,JSON.stringify(receipts,null,2)+'\n')
 console.log(`Budget studio: duplication, manual questions, annual provisions, row ordering, queue planning/order conflicts, exact text + real PNG ZIP, legacy migration and personalized drafts verified at ${widths.join('/')}.`)
}finally{await browser.close();server?.kill()}
