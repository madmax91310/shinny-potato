import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_NEW_EDITORIAL_PROFILES as initialEditorialProfiles, BUDGET_QUALIFIED_EDITORIAL_PROFILES, BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES, BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText, budgetPublicIncomeRows, budgetPublicExpenseRows, budgetPublicSavingsRows, budgetImageExpenses, euro, analyzeBudget, sourceReply, matchesBudgetFilters } from '../src/pages/budget-profiles/lib.js'
import { socialBudgetLabel } from '../src/pages/budget-profiles/socialImage.js'
import { budgetFinancialReference } from '../src/pages/budget-profiles/completion.js'
const batch=process.env.BUDGET_BATCH || 'all'
assert(['all','previous','qualified','complementary'].includes(batch),'Invalid budget batch')
const availableProfiles = {previous:initialEditorialProfiles,qualified:BUDGET_QUALIFIED_EDITORIAL_PROFILES,complementary:BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES,all:[...initialEditorialProfiles,...BUDGET_QUALIFIED_EDITORIAL_PROFILES,...BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES]}[batch]
const [part,parts]=(process.env.BUDGET_PART || '0/1').split('/').map(Number)
assert(Number.isInteger(part)&&Number.isInteger(parts)&&parts>0&&part>=0&&part<parts,'Invalid budget partition')
const partitionedProfiles=availableProfiles.filter((_,index)=>index%parts===part)
const BUDGET_NEW_EDITORIAL_PROFILES = process.env.BUDGET_PROFILE_ID ? partitionedProfiles.filter(p=>p.id===process.env.BUDGET_PROFILE_ID) : partitionedProfiles
assert(BUDGET_NEW_EDITORIAL_PROFILES.length,'Requested budget profile was not found')
const root=process.env.BUDGET_PUBLIC_BASE || 'http://127.0.0.1:4493/shinny-potato'
const output=process.env.BUDGET_ARTIFACTS || `test-artifacts/budget-new-profiles-${batch}-${part}-of-${parts}`
const widths=process.argv.length>2?process.argv.slice(2).map(Number):[1440,390,320]
assert(widths.length&&widths.every(width=>[1440,390,320].includes(width)),'Invalid budget viewport')
mkdirSync(output,{recursive:true})
const server=process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4493','--strictPort'],{stdio:'ignore'})
let browser
const results=[]
const normalize=s=>s.replace(/\s+/g,' ').trim()
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
    await context.addInitScript(()=>{
      const fill=CanvasRenderingContext2D.prototype.fillText
      window.budgetCanvases=[]
      CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
        if(value==='LE BUDGET DE'){this.canvas.budgetDraw=[];window.budgetCanvases=[...window.budgetCanvases.slice(-15),this.canvas]}
        const size=Number(this.font.match(/([\d.]+)px/)?.[1]||0),w=this.measureText(value).width
        const left=x-(this.textAlign==='right'?w:this.textAlign==='center'?w/2:0)
        this.canvas.budgetDraw?.push({text:String(value),left,right:left+w,y,size,height:this.canvas.height,width:this.canvas.width})
        return fill.call(this,value,x,y,...args)
      }
    })
    const page=await context.newPage(),errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(root+'/le-budget-de')
    const picker=page.getByRole('group',{name:'Choisir un profil',exact:true})
    for(const p of BUDGET_NEW_EDITORIAL_PROFILES) {
      if(batch==='complementary') {
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
      for(const mode of [...(p.mainImage==='complete'?['overview']:[]),'social','detailed','summary']) {
        const modeButton=page.getByRole('group',{name:'Version de l’image',exact:true}).locator(`[data-value="${mode}"]`)
        const wasSelected=await modeButton.getAttribute('aria-pressed')==='true'
        const previousUrl=await img.getAttribute('src')
        await modeButton.click()
        if(!wasSelected) await expect(img).not.toHaveAttribute('src',previousUrl)
        await expect(page.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeEnabled()
        await expect(img).toHaveAttribute('alt',new RegExp(p.name))
        const count=Number((await page.locator('.budget-image-count').textContent()).match(/^\d+/)[0])
        for(let part=0;part<count;part++) {
          if(count>1)await page.getByRole('button',{name:`Image ${part+1} sur ${count}`,exact:true}).click()
          await expect(page.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeEnabled()
          await img.evaluate(e=>e.decode())
          const dimensions=await img.evaluate(e=>[e.naturalWidth,e.naturalHeight])
          assert.deepEqual(dimensions,[1080,1350],`${p.name}: every X page is 4:5, no long fallback`)
          if(mode==='overview')assert.equal(count,1,'Complete main image must be a single PNG')
          const previewDigest=await img.evaluate(async e=>{
            const bytes=await (await fetch(e.src)).arrayBuffer()
            return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
          })
          const downloadPromise=page.waitForEvent('download')
          await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
          const download=await downloadPromise
          const bytes=readFileSync(await download.path())
          assert.equal(createHash('sha256').update(bytes).digest('hex'),previewDigest,'Downloaded bytes match the selected preview')
          const filename=`${width}-${p.id}-${mode}-${part+1}.png`
          writeFileSync(`${output}/${filename}`,bytes)
          results.push({width,id:p.id,mode,page:part+1,count,dimensions,bytes:bytes.length,filename})
        }
        const frames=await page.evaluate(()=>{const canvases=window.budgetCanvases,last=canvases.at(-1);return canvases.slice(-(last.budgetPageCount||1)).map(c=>c.budgetDraw)})
        const drawn=frames.flat()
        assert(drawn.length)
        const visible=normalize(drawn.map(t=>t.text).join(' '))
        assert(!/exemple|ficti[fv]|reconstitu|version éditoriale|personnage éditorial|20\d\d|\.json|PR #/i.test(visible))
        for(const row of [...budgetPublicIncomeRows(p),...(mode==='summary'?budgetImageExpenses(p,'summary'):budgetPublicExpenseRows(p)),...budgetPublicSavingsRows(p)]) {
          const label=['social','overview'].includes(mode)?socialBudgetLabel(row.label):row.label
          assert(visible.includes(normalize(label)),`${p.name}/${mode}: ${label}`)
          assert(visible.includes(normalize(euro(row.amount,p.currency))),`${p.name}/${mode}: ${row.amount}`)
        }
        const a=analyzeBudget(p)
        for(const k of ['income','expenses','savings','balance']) if(k!=='savings'||a.savings)assert(visible.includes(normalize(euro(Math.abs(a[k]),p.currency))))
        for(const t of drawn)assert(t.left>=20&&t.right<=t.width-20&&t.y>=0&&t.y+t.size<=t.height,JSON.stringify(t))
        for(const frame of frames)for(let i=0;i<frame.length;i++)for(const b of frame.slice(i+1)){
          const a=frame[i]
          assert(!(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.y+a.size,b.y+b.size)-Math.max(a.y,b.y)>2),`${p.name}/${mode}: overlapping text ${JSON.stringify([a,b])}`)
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
      }
      const details=page.getByText('Source et vérification du profil',{exact:true}).locator('..')
      await details.locator('summary').first().click()
      await expect(page.getByText('Faits conservés de la source',{exact:true})).toBeVisible()
      assert.equal(await details.getByText('Photographie source',{exact:true}).count(),0,'No authored ledger presented as an original source photograph')
      await page.getByRole('button',{name:'Copier la source pour une réponse',exact:true}).click()
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),sourceReply(p))
      await details.locator('summary').first().click()
    }
    const last=BUDGET_NEW_EDITORIAL_PROFILES.at(-1)
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
  console.log(`${BUDGET_NEW_EDITORIAL_PROFILES.length} profiles, ${results.length} exact PNGs, numbered 4:5 X pages, full labels/amounts, no overlaps, copies, source provenance and personal drafts verified at ${widths.join('/')}.`)
} finally {await browser?.close();server?.kill()}
