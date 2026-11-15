import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { waitPreview } from './wait-preview.mjs'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const base=process.env.PUBLICATION_BASE||'http://127.0.0.1:4499/shinny-potato/'
const output=process.env.PUBLICATION_OUTPUT||'test-artifacts/profile-publication'
await mkdir(output,{recursive:true})
const results=[]
const server=process.env.PUBLICATION_BASE?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4499','--strictPort'],{stdio:'ignore'})
try {
if(server)await waitPreview(server,base)
for(const width of [1440,390]){
 const userDataDir=await mkdtemp(join(tmpdir(),'profile-publication-'))
 let context,page
 const launch=async()=>{context=await chromium.launchPersistentContext(userDataDir,{headless:true,permissions:['clipboard-read','clipboard-write'],isMobile:width<600,hasTouch:width<600,viewport:{width,height:950},timezoneId:'Pacific/Honolulu',...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});page=context.pages()[0]||await context.newPage()}
 await launch()
 const errors=[]
 const goto=async path=>{await page.goto(base+path);page.on('pageerror',e=>errors.push(e.message))}
 const panel=()=>page.getByRole('region',{name:'Suivi de publication',exact:true}).last()
 const mark=async(date='2026-01-03')=>{await panel().getByRole('button',{name:'Marquer publié',exact:true}).click();await panel().getByLabel('Date de publication',{exact:true}).fill(date);await panel().getByRole('button',{name:'Confirmer la publication',exact:true}).click();await expect(panel().getByText('Publié le 03/01/2026',{exact:true})).toBeVisible()}
 const correct=async()=>{await panel().getByRole('button',{name:'Modifier la date de publication',exact:true}).click();await panel().getByLabel('Date de publication',{exact:true}).fill('2026-01-04');await panel().getByRole('button',{name:'Enregistrer la date',exact:true}).click();await expect(panel().getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()}
 const remove=async()=>{await panel().getByRole('button',{name:'Retirer le statut publié',exact:true}).click();await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()}
 const dcaSnapshot=()=>page.evaluate(()=>({draft:JSON.parse(localStorage.getItem('el-dca-draft-v1')),saves:JSON.parse(localStorage.getItem('el-dca-portfolios-v2')),usage:JSON.parse(localStorage.getItem('el-dca-used-v1'))}))
 const budgetSnapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('el-budget-workspace-v2')))
 try{
  // Start with an empty on-disk browser profile. No storageState or value reinjection.
  await goto('le-dca-de?mode=dca')
  await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  await panel().getByRole('button',{name:'Marquer publié',exact:true}).click()
  assert.equal(await panel().getByLabel('Date de publication',{exact:true}).inputValue(),await page.evaluate(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}))
  await panel().getByRole('button',{name:'Annuler',exact:true}).click()
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  const png=page.getByRole('button',{name:'Télécharger le PNG',exact:true}).filter({visible:true})
  await expect(png).toBeEnabled({timeout:30000});const download=page.waitForEvent('download');await png.click();await download
  await expect(panel().getByText('Non publié',{exact:true})).toBeVisible();assert.equal((await dcaSnapshot()).usage,null)
  await mark();const preparedDca=(await dcaSnapshot()).draft.profile.id
  await page.getByText(/Choisir un profil préparé ·/).click()
  const picker=page.getByRole('group',{name:'Choisir un profil DCA',exact:true})
  await expect(picker.locator(`[data-option][data-value="${preparedDca}"]`)).toContainText('Publié le 03/01/2026')
  await page.getByText(/Filtrer les profils ·/).click();await page.getByLabel('Afficher les profils non publiés',{exact:true}).check()
  await expect(picker.locator(`[data-option][data-value="${preparedDca}"]`)).toHaveCount(0)
  await page.getByLabel('Afficher les profils non publiés',{exact:true}).uncheck()
  await page.getByRole('button',{name:'Créer une participation',exact:true}).click()
  await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  await page.getByLabel('Pseudonyme',{exact:true}).fill('Recette DCA')
  await page.locator('#dca-draft').fill('Contenu personnel DCA à conserver')
  await page.getByRole('button',{name:'Sauvegarder le profil',exact:true}).click()
  await mark();await correct()
  const dca=(await dcaSnapshot());const dcaId=dca.draft.profile.id,saveId=dca.saves.items[0].id
  await page.getByRole('button',{name:'Voir mes profils sauvegardés',exact:true}).click()
  await expect(page.getByRole('article',{name:'Profil enregistré : Recette DCA',exact:true})).toContainText('Publié le 04/01/2026')
  await goto('le-budget-de')
  await expect(panel().getByText('Non publié',{exact:true})).toBeVisible();await mark()
  const budget=await budgetSnapshot(),preparedBudget=budget.activeId
  const budgetPicker=page.getByRole('group',{name:'Choisir un profil',exact:true})
  await expect(budgetPicker.locator(`[data-option][data-value="${preparedBudget}"]`)).toContainText('Publié le 03/01/2026')
  await page.getByLabel('Masquer les profils publiés',{exact:true}).check()
  await expect(budgetPicker.locator(`[data-option][data-value="${preparedBudget}"]`)).toHaveCount(0)
  await page.getByLabel('Masquer les profils publiés',{exact:true}).uncheck()
  await page.getByRole('button',{name:'Adapter ce budget',exact:true}).click()
  await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  await page.locator('#budget-draft').fill('Contenu personnel Budget à conserver')
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  await mark();await correct()
  const personalBudget=(await budgetSnapshot()).activeId
  await goto('le-dca-de?mode=dca')
  await expect(panel().getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  await page.reload();await expect(panel().getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  await page.getByLabel('Pseudonyme',{exact:true}).fill('Recette DCA modifiée')
  await page.getByRole('button',{name:'Mettre à jour le profil',exact:true}).click()
  let snapshot=await dcaSnapshot();assert.equal(snapshot.draft.profile.id,dcaId);assert.equal(snapshot.saves.items[0].id,saveId);assert.equal(snapshot.usage.entries.find(e=>e.id===dcaId).publishedAt,'2026-01-04')
  await goto('le-budget-de');await expect(panel().getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  await page.locator('#budget-draft').fill('Contenu personnel Budget modifié')
  await page.reload();await expect(panel().getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  assert.equal((await budgetSnapshot()).activeId,personalBudget)
  const beforeClose={dca:await page.evaluate(()=>localStorage.getItem('el-dca-used-v1')),budget:await budgetSnapshot()}
  await context.close();await launch()
  await goto('le-budget-de');await expect(panel().getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  assert.equal(await page.locator('#budget-draft').inputValue(),'Contenu personnel Budget modifié')
  assert.deepEqual((await budgetSnapshot()).publicationDates,beforeClose.budget.publicationDates)
  await page.screenshot({path:join(output,`budget-${width}-reopened.png`),fullPage:true})
  await remove();let after=await budgetSnapshot();assert(!after.published.includes(personalBudget));assert(after.published.includes(preparedBudget));assert.equal(after.drafts.find(d=>d.profile.id===personalBudget).text,'Contenu personnel Budget modifié')
  await page.getByRole('button',{name:'Créer un profil d’abonné',exact:true}).click();await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  await goto('le-dca-de?mode=dca');await expect(panel().getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  assert.equal(await page.evaluate(()=>localStorage.getItem('el-dca-used-v1')),beforeClose.dca)
  assert.equal(await page.locator('#dca-draft').inputValue(),'Contenu personnel DCA à conserver')
  await page.screenshot({path:join(output,`dca-${width}-reopened.png`),fullPage:true})
  // Actual second tab receives the state; attempts from a stale Budget editor fail closed.
  const tab=await context.newPage();await tab.goto(base+'le-dca-de?mode=dca')
  const tabPanel=tab.getByRole('region',{name:'Suivi de publication'})
  await expect(tabPanel.getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  await tabPanel.getByRole('button',{name:'Modifier la date de publication',exact:true}).click()
  await remove();await expect(tabPanel.getByText('Non publié',{exact:true})).toBeVisible()
  await tabPanel.getByRole('button',{name:'Confirmer la publication',exact:true}).click()
  await expect(tabPanel.getByRole('alert')).toContainText('changé dans un autre onglet')
  snapshot=await dcaSnapshot();assert(snapshot.usage.entries.some(e=>e.id===preparedDca));assert(!snapshot.usage.entries.some(e=>e.id===dcaId));assert.equal(snapshot.saves.items[0].id,saveId);assert(snapshot.usage.history.some(e=>e.id===dcaId&&e.action==='unpublished'))
  await tab.close();await page.reload();await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  // Named copy is a distinct profile, with no inherited publication marker.
  await mark();await page.getByRole('region',{name:'Composer le DCA'}).getByText('Mes portefeuilles',{exact:true}).click()
  await page.getByRole('button',{name:'Ouvrir Recette DCA modifiée',exact:true}).click()
  await page.getByRole('button',{name:'Enregistrer une copie',exact:true}).click()
  await expect(panel().getByText('Non publié',{exact:true})).toBeVisible();snapshot=await dcaSnapshot();assert.notEqual(snapshot.draft.profile.id,dcaId)
  assert.equal(snapshot.saves.items.length,2);assert.equal(snapshot.saves.items[0].id,saveId)
  await mark();await page.reload();await expect(panel().getByText('Publié le 03/01/2026',{exact:true})).toBeVisible();await correct();await remove()
  // Quota errors must leave persisted state untouched, with no success badge.
  const dcaBytes=await page.evaluate(()=>localStorage.getItem('el-dca-used-v1'))
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='el-dca-used-v1')throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v)}})
  await panel().getByRole('button',{name:'Marquer publié',exact:true}).click();await panel().getByRole('button',{name:'Confirmer la publication',exact:true}).click()
  await expect(panel().getByRole('alert')).toBeVisible();assert.equal(await page.evaluate(()=>localStorage.getItem('el-dca-used-v1')),dcaBytes)
  await page.reload();await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  await goto('le-budget-de');await mark();await page.reload();await correct()
  const budgetTab=await context.newPage();await budgetTab.goto(base+'le-budget-de')
  const otherPanel=budgetTab.getByRole('region',{name:'Suivi de publication'})
  await expect(otherPanel.getByText('Publié le 04/01/2026',{exact:true})).toBeVisible()
  await remove()
  await expect(otherPanel.getByText('Non publié',{exact:true})).toBeVisible()
  const budgetBytes=await page.evaluate(()=>localStorage.getItem('el-budget-workspace-v2'))
  await otherPanel.getByRole('button',{name:'Marquer publié',exact:true}).click();await otherPanel.getByRole('button',{name:'Confirmer la publication',exact:true}).click()
  await expect(otherPanel.getByRole('alert')).toBeVisible();assert.equal(await page.evaluate(()=>localStorage.getItem('el-budget-workspace-v2')),budgetBytes)
  await budgetTab.close()
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='el-budget-workspace-v2')throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v)}})
  await panel().getByRole('button',{name:'Marquer publié',exact:true}).click();await panel().getByRole('button',{name:'Confirmer la publication',exact:true}).click()
  await expect(panel().getByRole('alert')).toBeVisible();assert.equal(await page.evaluate(()=>localStorage.getItem('el-budget-workspace-v2')),budgetBytes)
  await page.reload();await expect(panel().getByText('Non publié',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Profils',exact:true}).click()
  await expect(panel().getByText('Publié le 03/01/2026',{exact:true})).toBeVisible();await correct();await remove()
  await expect(page.getByRole('group',{name:'Choisir un profil',exact:true}).locator(`[data-option][data-value="${preparedBudget}"]`)).toContainText('Non publié')
  await goto('le-dca-de?mode=dca');await page.getByRole('button',{name:'Profils préparés',exact:true}).click()
  await expect(panel().getByText('Publié le 03/01/2026',{exact:true})).toBeVisible();await correct();await remove()
  await page.getByText(/Choisir un profil préparé ·/).click()
  await expect(page.getByRole('group',{name:'Choisir un profil DCA',exact:true}).locator(`[data-option][data-value="${preparedDca}"]`)).toContainText('Non publié')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow')
  await writeFile(join(output,`storage-${width}.json`),JSON.stringify({userDataDir,beforeClose,afterDca:snapshot,afterBudget:after},null,2))
  results.push({width,base,userDataDir,persistentContextRestart:true,preparedDca,dcaId,saveId,preparedBudget,personalBudget,errors})
  assert.deepEqual(errors,[])
 }finally{await context.close()}
}
await writeFile(join(output,'results.json'),JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))

} finally {server?.kill()}
