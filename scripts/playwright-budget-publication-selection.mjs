import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_PROFILES, BUDGET_PUBLICATION_SELECTION } from '../src/pages/budget-profiles/data.js'
import { budgetDisplayName } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
const base=process.env.BUDGET_PUBLIC_BASE||'http://127.0.0.1:4495/shinny-potato'
const server=process.env.BUDGET_PUBLIC_BASE?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4495','--strictPort'],{stdio:'ignore'})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
const key='el-budget-workspace-v2',p=BUDGET_PROFILES.find(p=>p.name==='Guillaume'),published=BUDGET_PUBLICATION_SELECTION[0].id,kept=BUDGET_PROFILES.find(p=>p.name==='Julie et Alex').id
const fixture={version:4,drafts:[{profile:p,text:'Mon texte personnalisé à conserver.',edited:true,textFinance:budgetFinancialReference(p)}],activeId:p.id,published:[published],publicationDates:{[published]:'2026-10-12'},used:[BUDGET_PUBLICATION_SELECTION[1].id],queued:[kept]}
mkdirSync('test-artifacts/budget-publication-selection',{recursive:true})
try{
 if(server)await waitPreview(server,base)
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:950}})
  await context.addInitScript(({key,fixture})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(fixture))},{key,fixture})
  const page=await context.newPage();await page.goto(base+'/le-budget-de');await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(fixture.drafts[0].text)
  await page.getByText('Préparer les prochaines publications',{exact:true}).click();const section=page.getByRole('region',{name:'Sélection de publications'})
  await expect(section.locator('input[type="checkbox"]')).toHaveCount(BUDGET_PUBLICATION_SELECTION.length)
  await expect(section.getByLabel('Préparer '+budgetDisplayName(BUDGET_PROFILES.find(p=>p.id===published)),{exact:true})).toBeDisabled()
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).queued,key),[kept],'Opening the selection never changes local statuses')
  await section.getByRole('button',{name:'Sélectionner les profils disponibles',exact:true}).click()
  await section.getByRole('button',{name:'Ajouter la sélection à la file',exact:true}).click()
  const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
  assert.deepEqual(state.queued,[kept,...BUDGET_PUBLICATION_SELECTION.filter(x=>x.id!==published).map(x=>x.id)])
  assert.deepEqual(state.published,fixture.published);assert.deepEqual(state.publicationDates,fixture.publicationDates);assert.deepEqual(state.used,fixture.used)
  assert.equal(state.drafts.find(d=>d.profile.id===p.id).text,fixture.drafts[0].text)
  await page.reload();await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(fixture.drafts[0].text)
  await page.getByText('Préparer les prochaines publications',{exact:true}).click();await expect(page.getByRole('button',{name:'Sélectionner les profils disponibles',exact:true})).toBeDisabled()
  await page.getByText('Brouillons et transfert entre appareils',{exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les brouillons et statuts',exact:true}).click();const downloaded=JSON.parse(readFileSync(await (await downloadPromise).path(),'utf8'))
  assert.deepEqual(downloaded.workspace.queued,state.queued);assert.deepEqual(downloaded.workspace.publicationDates,fixture.publicationDates)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.getByRole('region',{name:'Sélection de publications'}).screenshot({path:`test-artifacts/budget-publication-selection/${width}.png`,});await context.close()
  const stale=await browser.newContext({viewport:{width,height:950}});await stale.addInitScript(({key,fixture})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(fixture))},{key,fixture});const editor=await stale.newPage();await editor.goto(base+'/le-budget-de');await editor.getByText('Préparer les prochaines publications',{exact:true}).click();await editor.getByRole('button',{name:'Sélectionner les profils disponibles',exact:true}).click()
  const other=await stale.newPage();await other.goto(base+'/le-budget-de');await other.evaluate(key=>{const data=JSON.parse(localStorage.getItem(key));data.queued.push('other-tab-preserved');localStorage.setItem(key,JSON.stringify(data))},key)
  await editor.getByRole('button',{name:'Ajouter la sélection à la file',exact:true}).click();await expect(editor.getByText(/La sélection n’a pas été enregistrée/)).toBeVisible();assert.deepEqual(await other.evaluate(key=>JSON.parse(localStorage.getItem(key)).queued,key),[kept,'other-tab-preserved']);await stale.close()
  const damaged=await browser.newContext({viewport:{width,height:950}});await damaged.addInitScript(key=>localStorage.setItem(key,'{broken bytes'),key);const corrupt=await damaged.newPage();await corrupt.goto(base+'/le-budget-de');await corrupt.getByText('Préparer les prochaines publications',{exact:true}).click();await corrupt.getByRole('button',{name:'Sélectionner les profils disponibles',exact:true}).click();await corrupt.getByRole('button',{name:'Ajouter la sélection à la file',exact:true}).click();await expect(corrupt.getByText(/La sélection n’a pas été enregistrée/)).toBeVisible();assert.equal(await corrupt.evaluate(key=>localStorage.getItem(key),key),'{broken bytes');await damaged.close()
 }
 console.log('Publication selection: 12 curated profiles, explicit additive queue, published dates and personal drafts preserved, backup export, stale-tab rejection and corrupt storage checked at 1440/390/320.')
}finally{await browser.close();server?.kill()}
