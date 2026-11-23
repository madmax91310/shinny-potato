import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_NEW_EDITORIAL_PROFILES as initialEditorialProfiles, BUDGET_QUALIFIED_EDITORIAL_PROFILES, BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES, BUDGET_ROADMAP_EDITORIAL_PROFILES, BUDGET_STUDIO_EDITORIAL_PROFILES, BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText, analyzeBudget, sourceReply, matchesBudgetFilters } from '../src/pages/budget-profiles/lib.js'
import { captureBudgetCanvas, verifyBudgetPng } from './budget-browser-image.mjs'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
const batch=process.env.BUDGET_BATCH || 'all'
assert(['all','previous','qualified','complementary','roadmap','studio'].includes(batch),'Invalid budget batch')
const batches = {
  previous: initialEditorialProfiles,
  qualified: BUDGET_QUALIFIED_EDITORIAL_PROFILES,
  complementary: BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES,
  roadmap: BUDGET_ROADMAP_EDITORIAL_PROFILES,
  studio: BUDGET_STUDIO_EDITORIAL_PROFILES,
}
const availableIds = new Set((batch === 'all' ? Object.values(batches).flat() : batches[batch]).map(profile => profile.id))
const [part,parts]=(process.env.BUDGET_PART || '0/1').split('/').map(Number)
assert(Number.isInteger(part)&&Number.isInteger(parts)&&parts>0&&part<parts&&part>=0,'Invalid budget partition')
const availableProfiles = BUDGET_PROFILES.filter(profile => availableIds.has(profile.id))
const selectedId = process.env.BUDGET_PROFILE_ID
const profiles = availableProfiles.filter((profile, index) => index % parts === part && (!selectedId || profile.id === selectedId))
assert(profiles.length,'Requested budget profile was not found')
const root=process.env.BUDGET_PUBLIC_BASE || 'http://127.0.0.1:4493/shinny-potato'
const output=process.env.BUDGET_ARTIFACTS || `test-artifacts/budget-new-profiles-${batch}-${part}-of-${parts}`
const widths=process.argv.length>2?process.argv.slice(2).map(Number):[1440,390,320]
assert(widths.length&&widths.every(width=>[1440,390,320].includes(width)),'Invalid budget viewport')
mkdirSync(output,{recursive:true})
const server=process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4493','--strictPort'],{stdio:'ignore'})
let browser
const results=[]
try {
  if(server) await waitPreview(server,root)
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
  for(const width of widths) {
    const context=await browser.newContext({viewport:{width,height:950},permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'})
    const existing=BUDGET_PROFILES.find(p=>p.name==='Guillaume')
    await context.addInitScript(({existing,finance})=>{
      if(localStorage.getItem('el-budget-workspace-v2'))return
      localStorage.setItem('el-budget-workspace-v2',JSON.stringify({version:4,
        drafts:[{profile:existing,text:'Mon ancien texte personnel.',edited:true,textFinance:finance}],
        activeId:existing.id,used:[existing.id],published:[existing.id],queued:[existing.id],publicationDates:{[existing.id]:'2026-11-01'}}))
    },{existing,finance:budgetFinancialReference(existing)})
    await context.addInitScript(captureBudgetCanvas)
    const page=await context.newPage(),errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(root+'/le-budget-de')
    const picker=page.getByRole('group',{name:'Choisir un profil',exact:true})
    for(const p of profiles) {
      if(['complementary','roadmap','studio'].includes(batch)) {
        const income=analyzeBudget(p).income
        const [min,max]=[[0,1500],[1500,2500],[2500,4000],[4000,7000],[7000,Infinity]].find(([lo,hi])=>income>=lo&&income<hi)
        const filters={country:p.country||'unknown',income:`${p.currency||'EUR'}:${min}:${max}`,family:p.family||'unknown',children:p.children||'unknown',housing:p.housing||'unknown'}
        await page.getByText('Filtrer les profils',{exact:true}).click()
        for(const [key,label] of [['country','Pays de résidence'],['income','Ressources mensuelles par devise'],['family','Configuration du foyer'],['children','Enfants au foyer'],['housing','Logement']])await page.getByRole('group',{name:label,exact:true}).locator(`[data-value="${filters[key]}"]`).click()
        const expected=BUDGET_PROFILES.filter(profile=>matchesBudgetFilters(profile,filters)).map(p=>p.id).sort()
        assert.deepEqual((await picker.locator('[data-value]').evaluateAll(nodes=>nodes.map(n=>n.dataset.value))).sort(),expected)
        assert(expected.includes(p.id))
        await page.getByRole('button',{name:'Effacer les filtres',exact:true}).click()
        await page.getByText('Filtrer les profils',{exact:true}).click()
      }
      const img=page.getByRole('region',{name:'Image du budget'}).locator('img')
      const previousProfileUrl=await img.getAttribute('src').catch(()=>null)
      await picker.locator(`[data-value="${p.id}"]`).click()
      await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(p))
      if(previousProfileUrl) await expect(img).not.toHaveAttribute('src',previousProfileUrl)
      await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildBudgetText(p))
      const bytes = await verifyBudgetPng(page, p)
      const filename = `${width}-${p.id}.png`
      writeFileSync(`${output}/${filename}`, bytes)
      results.push({ width, id: p.id, count: 1, dimensions: [1080, 1350], bytes: bytes.length, filename })
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      const details=page.getByText('Source et vérification du profil',{exact:true}).locator('..')
      await details.locator('summary').first().click()
      await expect(page.getByText('Faits conservés de la source',{exact:true})).toBeVisible()
      assert.equal(await details.getByText('Photographie source',{exact:true}).count(),0,'No authored ledger presented as an original source photograph')
      await page.getByRole('button',{name:'Copier la source pour une réponse',exact:true}).click()
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),sourceReply(p))
      await details.locator('summary').first().click()
    }
    const last=profiles.at(-1)
    await page.getByLabel('Texte prêt à publier').fill('Mon texte personnel avec mes propres questions.')
    await page.reload()
    await expect(page.getByLabel('Texte prêt à publier')).toHaveValue('Mon texte personnel avec mes propres questions.')
    await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
    await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(last))
    const workspace=await page.evaluate(()=>JSON.parse(localStorage.getItem('el-budget-workspace-v2')))
    assert.deepEqual(workspace.published,[existing.id],'Selection, copy and PNG download never mark a new profile published')
    assert.deepEqual(workspace.publicationDates,{[existing.id]:'2026-11-01'})
    assert(workspace.used.includes(existing.id)&&workspace.queued.includes(existing.id))
    assert.equal(workspace.drafts.find(d=>d.profile.id===existing.id).text,'Mon ancien texte personnel.')
    assert.deepEqual(errors,[])
    await page.screenshot({path:`${output}/${width}-workspace.png`,fullPage:true})
    await context.close()
  }
  writeFileSync(`${output}/results${process.argv.length>2?'-'+widths.join('-'):''}.json`,JSON.stringify(results,null,2)+'\n')
  console.log(`${profiles.length} profiles, ${results.length} exact PNGs, single 4:5 PNGs, grouped expense amounts, no overlaps, copies, source provenance and personal drafts verified at ${widths.join('/')}.`)
} finally {await browser?.close();server?.kill()}
