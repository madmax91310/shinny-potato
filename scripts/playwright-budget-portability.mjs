import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText } from '../src/pages/budget-profiles/lib.js'
import { DRAFT_KEY, WORKSPACE_KEY } from '../src/pages/budget-profiles/storage.js'
const base = process.env.BUDGET_PUBLIC_BASE ?? 'http://127.0.0.1:4405/shinny-potato'
const server = process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4405','--strictPort'],{stdio:'ignore'})
const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}: {})})
const dir='test-artifacts/budget-profiles';mkdirSync(dir,{recursive:true})
const p=BUDGET_PROFILES[0],q=BUDGET_PROFILES[1],custom='Mon texte personnel\n\nDeuxième paragraphe à préserver.'
const upload = (page, backup) => page.getByLabel('Restaurer une sauvegarde').setInputFiles({name:'budget.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))})
try {
 if(server)await waitPreview(server,base)
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:950},permissions:['clipboard-read','clipboard-write']})
  await context.addInitScript(({key,profile,text})=>localStorage.setItem(key,JSON.stringify({profile,text,edited:true})),{key:DRAFT_KEY,profile:p,text:custom})
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(base+'/le-budget-de'); await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(custom)
  const picker=page.getByRole('group',{name:'Choisir un profil budget'})
  await picker.locator(`[data-value="${q.id}"]`).click();await picker.locator(`[data-value="${p.id}"]`).click()
  await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(custom)
  await page.getByText('Filtrer les profils',{exact:true}).click()
  for(const [label,value] of [['Pays de résidence','France'],['Ressources mensuelles par devise','EUR:2500:4000'],['Configuration du foyer','couple'],['Enfants au foyer','yes'],['Logement','tenant']])await page.getByRole('group',{name:label,exact:true}).locator(`[data-value="${value}"]`).click()
  await expect(picker.locator('[data-value]')).toHaveCount(1)
  await expect(picker.locator('[data-value]')).toHaveAttribute('data-value','reddit-famille-bourges-2026-07-12')
  await page.getByRole('group',{name:'Ressources mensuelles par devise',exact:true}).locator('[data-value="CHF:2500:4000"]').click()
  await expect(page.getByText('Aucun profil ne correspond. Le budget ouvert reste affiché.')).toBeVisible()
  await page.getByRole('button',{name:'Effacer les filtres',exact:true}).click()
  await page.getByLabel('À publier prochainement',{exact:true}).check()
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
  await expect(page.getByLabel('Profil publié',{exact:true})).not.toBeChecked()
  await page.reload();await expect(page.getByLabel('À publier prochainement',{exact:true})).toBeChecked();await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(custom)
  await page.getByText('Brouillons et transfert entre appareils',{exact:true}).click()
  const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les brouillons et statuts',exact:true}).click()
  const backup=JSON.parse(readFileSync(await(await promise).path(),'utf8'))
  assert.equal(backup.version,2);assert.equal(backup.workspace.drafts.find(d=>d.profile.id===p.id).text,custom)
  const incoming=structuredClone(backup);incoming.workspace.drafts.find(d=>d.profile.id===p.id).text='Version de mon autre appareil';incoming.workspace.published=[p.id];incoming.workspace.queued=[]
  const before=await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY)
  await upload(page,incoming);await expect(page.getByRole('region',{name:'Aperçu de l’import'})).toContainText('conflit')
  await page.getByRole('region',{name:'Aperçu de l’import'}).locator('details').first().locator('summary').click()
  await expect(page.getByRole('region',{name:'Aperçu de l’import'})).toContainText('Publié : oui')
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),before,'Preview is read only')
  await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click();await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(custom);await expect(page.getByLabel('Profil publié',{exact:true})).not.toBeChecked()
  await upload(page,incoming);await page.getByLabel('Gestion des conflits',{exact:true}).selectOption('use-imported');await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click()
  await expect(page.getByLabel('Texte prêt à publier')).toHaveValue('Version de mon autre appareil');await expect(page.getByLabel('Profil publié',{exact:true})).toBeChecked();await expect(page.getByLabel('À publier prochainement',{exact:true})).not.toBeChecked()
  const archives=page.getByLabel('Version locale archivée',{exact:true})
  await archives.selectOption({index:1});await page.getByRole('button',{name:'Examiner cette version archivée',exact:true}).click()
  await page.getByLabel('Gestion des conflits',{exact:true}).selectOption('use-imported');await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click()
  await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(custom)
  await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click();await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(p))
  await upload(page,incoming)
  await page.evaluate(key=>{const value=JSON.parse(localStorage.getItem(key));value.queued.push('autre-onglet');localStorage.setItem(key,JSON.stringify(value))},WORKSPACE_KEY)
  await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click();await expect(page.getByText(/Import non appliqué/)).toBeVisible()
  const stale=await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY)
  await upload(page,{...incoming,version:999});await expect(page.getByText(/Format, version ou données de sauvegarde invalides/)).toBeVisible();assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),stale)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`${dir}/portability-${width}.png`,fullPage:true});assert.deepEqual(errors,[])
  // Transfer to a separate browser profile, with no previous personal draft.
  const other=await browser.newContext({viewport:{width,height:950}}),otherPage=await other.newPage();await otherPage.goto(base+'/le-budget-de');await otherPage.getByText('Brouillons et transfert entre appareils',{exact:true}).click();await upload(otherPage,incoming)
  if(await otherPage.getByLabel('Gestion des conflits',{exact:true}).count())await otherPage.getByLabel('Gestion des conflits',{exact:true}).selectOption('use-imported')
  await otherPage.getByRole('button',{name:'Appliquer cet import',exact:true}).click();await otherPage.getByRole('group',{name:'Reprendre un brouillon',exact:true}).locator(`[data-value="${p.id}"]`).click();await expect(otherPage.getByLabel('Texte prêt à publier')).toHaveValue('Version de mon autre appareil');await other.close()
  // The legacy bytes remain intact and a corrupt v2 record can be explicitly archived.
  await page.evaluate(key=>localStorage.setItem(key,'{damaged-workspace'),WORKSPACE_KEY);await page.reload()
  await expect(page.getByRole('alert')).toContainText('conservé sans modification');await page.getByText('Brouillons et transfert entre appareils',{exact:true}).click();await upload(page,incoming)
  await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click()
  const recovery=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les brouillons et statuts',exact:true}).click()
  const recovered=JSON.parse(readFileSync(await(await recovery).path(),'utf8'))
  assert(Object.entries(recovered.recovery).some(([key,value])=>key.startsWith('el-budget-recovery-')&&value.includes('{damaged-workspace')))
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).text,DRAFT_KEY),custom)
  await page.reload();await expect(page.getByLabel('Texte prêt à publier')).toHaveValue('Version de mon autre appareil')
  await context.close()
 }
 const blocked=await browser.newContext({viewport:{width:320,height:950}})
 await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage blocked')}})
 const blockedPage=await blocked.newPage();await blockedPage.goto(base+'/le-budget-de')
 const blockedPicker=blockedPage.getByRole('group',{name:'Choisir un profil budget'})
 await blockedPicker.locator(`[data-value="${p.id}"]`).click();await blockedPage.getByLabel('Texte prêt à publier').fill('Texte conservé même sans stockage')
 await blockedPicker.locator(`[data-value="${q.id}"]`).click();await blockedPicker.locator(`[data-value="${p.id}"]`).click()
 await expect(blockedPage.getByLabel('Texte prêt à publier')).toHaveValue('Texte conservé même sans stockage')
 await blockedPage.getByText('Brouillons et transfert entre appareils',{exact:true}).click()
 const blockedExport=blockedPage.waitForEvent('download');await blockedPage.getByRole('button',{name:'Exporter les brouillons et statuts',exact:true}).click()
 const blockedBackup=JSON.parse(readFileSync(await(await blockedExport).path(),'utf8'))
 assert.equal(blockedBackup.workspace.drafts.find(d=>d.profile.id===p.id).text,'Texte conservé même sans stockage')
 await blocked.close()
 console.log('Budget browser portability: 1440/390/320 px, combined filters, restored personal drafts, queued status, manual transfer, read-only preview, both conflict choices, stale import rejection, invalid version and archived corrupt bytes passed.')
}finally{await browser.close();server?.kill()}
