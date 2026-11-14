import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_COMPLETENESS, BUDGET_EDITORIAL_CREATIONS } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText } from '../src/pages/budget-profiles/lib.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
import { WORKSPACE_KEY } from '../src/pages/budget-profiles/storage.js'
const base=process.env.BUDGET_PUBLIC_BASE??'http://127.0.0.1:4406/shinny-potato'
const server=process.env.BUDGET_PUBLIC_BASE?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4406','--strictPort'],{stdio:'ignore'})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
const dir='test-artifacts/budget-completeness';mkdirSync(dir,{recursive:true})
const source=BUDGET_ORIGINAL_PROFILES.find(p=>p.name==='Aïcha'),profile=BUDGET_PROFILES.find(p=>p.id===source.id), other=BUDGET_ORIGINAL_PROFILES[0]
const custom='Mon texte personnalisé : 2 300 € de dépenses et 1 050 € pour les projets. Ne pas écraser.'
const legacy={version:3,drafts:[{profile:source,text:custom,edited:true},{profile:other,text:'Ancien texte automatique',edited:false}],activeId:source.id,used:[source.id],queued:[source.id],published:[source.id],publicationDates:{[source.id]:'2026-10-14'}}
const upload=(page,workspace)=>page.getByLabel('Restaurer une sauvegarde').setInputFiles({name:'avant-complements.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'le-budget-de',version:3,workspace,readable:true}))})
try{
 if(server)await waitPreview(server,base)
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:950},permissions:['clipboard-read','clipboard-write']})
  await context.addInitScript(({key,workspace})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(workspace))},{key:WORKSPACE_KEY,workspace:legacy})
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(base+'/le-budget-de')
  const text=page.getByLabel('Texte prêt à publier'),warning=page.getByRole('alert').filter({hasText:'Les montants du budget ont changé'})
  const statuses=async()=>{await expect(page.getByText('Publié le 14/10/2026',{exact:true})).toBeVisible();await expect(page.getByLabel('À publier prochainement',{exact:true})).toBeChecked();await expect(page.getByRole('button',{name:'Marquer non utilisé',exact:true})).toBeVisible()}
  await expect(text).toHaveValue(custom);await expect(warning).toBeVisible();await statuses()
  await page.getByRole('button',{name:'Copier le texte',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),custom);await statuses()
  await page.reload();await expect(text).toHaveValue(custom);await expect(warning).toBeVisible()
  const picker=page.getByRole('group',{name:'Choisir un profil',exact:true})
  await picker.locator(`[data-value="${other.id}"]`).click();await expect(text).toHaveValue(buildBudgetText(BUDGET_PROFILES.find(p=>p.id===other.id)));await expect(warning).toHaveCount(0)
  await picker.locator(`[data-value="${source.id}"]`).click();await expect(text).toHaveValue(custom);await expect(warning).toBeVisible()
  await page.screenshot({path:`${dir}/stale-custom-${width}.png`,fullPage:true})
  await page.getByRole('button',{name:'J’ai vérifié les montants de mon texte',exact:true}).click();await expect(text).toHaveValue(custom);await expect(warning).toHaveCount(0);await statuses()
  await page.reload();await expect(text).toHaveValue(custom);await expect(warning).toHaveCount(0)
  await page.getByText('Brouillons et transfert entre appareils',{exact:true}).click()
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter les brouillons et statuts',exact:true}).click()
  const backup=JSON.parse(readFileSync(await(await download).path(),'utf8'))
  assert.equal(backup.version,4);const saved=backup.workspace.drafts.find(d=>d.profile.id===profile.id);assert.equal(saved.text,custom);assert.equal(saved.textFinance,budgetFinancialReference(profile));assert.equal(backup.workspace.publicationDates[profile.id],'2026-10-14')
  await upload(page,legacy);await expect(page.getByRole('region',{name:'Aperçu de l’import'})).toContainText('conflit');await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click();await expect(warning).toHaveCount(0)
  await upload(page,legacy);await page.getByLabel('Gestion des conflits',{exact:true}).selectOption('use-imported');await page.getByRole('button',{name:'Appliquer cet import',exact:true}).click();await expect(text).toHaveValue(custom);await expect(warning).toBeVisible();await statuses()
  await page.getByText('Source et vérification du profil',{exact:true}).click()
  const photo=page.locator('details').filter({has:page.locator('summary',{hasText:/^Photographie source$/})}).last()
  await photo.locator('summary').click();assert.deepEqual(JSON.parse(await photo.locator('pre').textContent()),source)
  const review=page.locator('details').filter({has:page.locator('summary',{hasText:/^Rapprochement avec la source$/})}).last();await review.locator('summary').click();assert.deepEqual(JSON.parse(await review.locator('pre').textContent()),BUDGET_COMPLETENESS[profile.id]);
  const creation=page.locator('details').filter({has:page.locator('summary',{hasText:/^Créations éditoriales et provenance$/})}).last();await expect(creation).toContainText('pas un témoignage reçu');assert.deepEqual(JSON.parse(await creation.locator('pre').textContent()),BUDGET_EDITORIAL_CREATIONS[profile.id]);assert.equal((await review.locator('tbody tr').count()),5)
  await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click();await expect(text).toHaveValue(buildBudgetText(profile));await expect(warning).toHaveCount(0);await statuses()
  await page.reload();await expect(text).toHaveValue(buildBudgetText(profile));await expect(warning).toHaveCount(0)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  // An adapted contribution keeps its own ID/amounts, never the bank revision.
  await page.getByRole('button',{name:'Adapter ce budget',exact:true}).click();await expect(page.getByLabel('Prénom ou pseudonyme')).toBeVisible();await text.fill('Ma participation personnalisée')
  const amount=page.getByLabel('Dépenses · montant 1',{exact:true});await amount.fill('1060');await expect(warning).toBeVisible();await expect(text).toHaveValue('Ma participation personnalisée')
  const contribution=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activeId,WORKSPACE_KEY);assert(contribution.startsWith('participation-'))
  await page.reload();assert.equal(await amount.inputValue(),'1060');await expect(text).toHaveValue('Ma participation personnalisée');await expect(warning).toBeVisible()
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activeId,WORKSPACE_KEY),contribution)
  await expect(page.getByLabel('La personne a validé les informations à publier.',{exact:true})).not.toBeChecked();await expect(page.getByLabel('Profil publié',{exact:true})).not.toBeChecked()
  assert.deepEqual(errors,[]);await context.close()
  console.log(`Completeness browser ${width}: v3 migration, stale custom warning, exact copy, explicit review, export/import conflicts, immutable source photo, voluntary regeneration, dates/statuses and contribution preserved.`)
 }
}finally{await browser.close();server?.kill()}
