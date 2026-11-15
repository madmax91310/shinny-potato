import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { expect } from 'playwright/test'
import { waitPreview } from './wait-preview.mjs'
import { BUDGET_NEW_EDITORIAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText, budgetPublicIncomeRows, budgetPublicExpenseRows, budgetPublicSavingsRows, budgetImageExpenses, euro, analyzeBudget, sourceReply } from '../src/pages/budget-profiles/lib.js'
import { socialBudgetLabel } from '../src/pages/budget-profiles/socialImage.js'
const root=process.env.BUDGET_PUBLIC_BASE || 'http://127.0.0.1:4493/shinny-potato'
const output=process.env.BUDGET_ARTIFACTS || 'test-artifacts/budget-new-profiles'
mkdirSync(output,{recursive:true})
const server=process.env.BUDGET_PUBLIC_BASE ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4493','--strictPort'],{stdio:'ignore'})
let browser
const results=[]
const normalize=s=>s.replace(/\s+/g,' ').trim()
try {
  if(server) await waitPreview(server,root)
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})})
  for(const width of [1440,390,320]) {
    const context=await browser.newContext({viewport:{width,height:950},permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'})
    await context.addInitScript(()=>{
      const fill=CanvasRenderingContext2D.prototype.fillText
      window.budgetDraw=[]
      CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
        if(value==='LE BUDGET DE')window.budgetDraw=[]
        const size=Number(this.font.match(/([\d.]+)px/)?.[1]||0),w=this.measureText(value).width
        const left=x-(this.textAlign==='right'?w:this.textAlign==='center'?w/2:0)
        window.budgetDraw.push({text:String(value),left,right:left+w,y,size,height:this.canvas.height,width:this.canvas.width})
        return fill.call(this,value,x,y,...args)
      }
    })
    const page=await context.newPage(),errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(root+'/le-budget-de')
    const picker=page.getByRole('group',{name:'Choisir un profil',exact:true})
    for(const p of BUDGET_NEW_EDITORIAL_PROFILES) {
      const img=page.getByRole('region',{name:'Image du budget'}).locator('img')
      const previousProfileUrl=await img.getAttribute('src').catch(()=>null)
      await picker.locator(`[data-value="${p.id}"]`).click()
      await expect(page.getByLabel('Texte prêt à publier')).toHaveValue(buildBudgetText(p))
      if(previousProfileUrl) await expect(img).not.toHaveAttribute('src',previousProfileUrl)
      await page.getByRole('button',{name:'Copier le texte',exact:true}).click()
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),buildBudgetText(p))
      for(const mode of ['social','detailed','summary']) {
        const modeButton=page.getByRole('group',{name:'Version de l’image',exact:true}).locator(`[data-value="${mode}"]`)
        const wasSelected=await modeButton.getAttribute('aria-pressed')==='true'
        const previousUrl=await img.getAttribute('src')
        await modeButton.click()
        if(!wasSelected) await expect(img).not.toHaveAttribute('src',previousUrl)
        await expect(page.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeEnabled()
        await expect(img).toHaveAttribute('alt',new RegExp(p.name))
        const dimensions=await img.evaluate(e=>[e.naturalWidth,e.naturalHeight])
        if(mode==='social') assert.deepEqual(dimensions,[1080,1350],`${p.name}: one complete image, no long fallback`)
        const bytes=await img.evaluate(async e=>Array.from(new Uint8Array(await (await fetch(e.src)).arrayBuffer())))
        const downloadPromise=page.waitForEvent('download')
        await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
        const download=await downloadPromise
        assert.deepEqual(readFileSync(await download.path()),Buffer.from(bytes))
        const drawn=await page.evaluate(()=>window.budgetDraw)
        assert(drawn.length)
        const visible=normalize(drawn.map(t=>t.text).join(' '))
        assert(!/exemple|ficti[fv]|reconstitu|version éditoriale|personnage éditorial|20\d\d|\.json|PR #/i.test(visible))
        for(const row of [...budgetPublicIncomeRows(p),...(mode==='summary'?budgetImageExpenses(p,'summary'):budgetPublicExpenseRows(p)),...budgetPublicSavingsRows(p)]) {
          const label=mode==='social'?socialBudgetLabel(row.label):row.label
          assert(visible.includes(normalize(label)),`${p.name}/${mode}: ${label}`)
          assert(visible.includes(normalize(euro(row.amount,p.currency))),`${p.name}/${mode}: ${row.amount}`)
        }
        const a=analyzeBudget(p)
        for(const k of ['income','expenses','savings','balance']) if(k!=='savings'||a.savings)assert(visible.includes(normalize(euro(Math.abs(a[k]),p.currency))))
        for(const t of drawn)assert(t.left>=20&&t.right<=t.width-20&&t.y>=0&&t.y+t.size<=t.height,JSON.stringify(t))
        for(let i=0;i<drawn.length;i++)for(const b of drawn.slice(i+1)){
          const a=drawn[i]
          assert(!(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.y+a.size,b.y+b.size)-Math.max(a.y,b.y)>2),`${p.name}/${mode}: overlapping text ${JSON.stringify([a,b])}`)
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
        const filename=`${width}-${p.id}-${mode}.png`
        writeFileSync(`${output}/${filename}`,Buffer.from(bytes))
        results.push({width,id:p.id,mode,dimensions,bytes:bytes.length,rows:drawn.length,filename})
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
    assert.deepEqual(errors,[])
    await page.screenshot({path:`${output}/${width}-workspace.png`,fullPage:true})
    await context.close()
  }
  writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2)+'\n')
  console.log(`Seven profiles, ${results.length} exact PNGs, one 4:5 per new profile, full labels/amounts, no overlaps, copies, source provenance and personal drafts verified at 1440/390/320.`)
} finally {await browser?.close();server?.kill()}
