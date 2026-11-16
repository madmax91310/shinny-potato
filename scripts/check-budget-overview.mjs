import assert from 'node:assert/strict'
import { expect } from 'playwright/test'
import { readFile } from 'node:fs/promises'
import { analyzeBudget, euro } from '../src/pages/budget-profiles/lib.js'

export async function checkBudgetOverview(page, profiles, output, width) {
  await page.getByRole('group',{name:'Version de l’image',exact:true}).locator('[data-value="overview"]').click()
  for(const profile of profiles) {
    await page.getByRole('group',{name:'Choisir un profil',exact:true}).locator(`[data-value="${profile.id}"]`).click()
    const region=page.getByRole('region',{name:'Image du budget',exact:true})
    await expect(region).toHaveAttribute('aria-busy','false',{timeout:30000})
    await expect(page.locator('.budget-image-count')).toHaveText('1 image · 1 080 × 1 350 px')
    const img=region.locator('img')
    assert.deepEqual(await img.evaluate(i=>[i.naturalWidth,i.naturalHeight]),[1080,1350])
    const drawn=await page.evaluate(()=>window.budgetOverviewText)
    const a=analyzeBudget(profile)
    for(const key of ['income','expenses','savings','balance']) {
      // A complete ledger omits an empty transfers section; the ordinary
      // four-total overview still has to display its zero explicitly.
      if(key==='savings'&&profile.mainImage==='complete'&&!profile.savings.length)continue
      assert(drawn.some(t=>t.text===`${profile.approximate?'≈ ':''}${euro(Math.abs(a[key]),profile.currency)}`),profile.id+' '+key)
    }
    for(const t of drawn)assert(t.left>=30&&t.right<=1050&&t.y>=0&&t.y+t.size<=1350,profile.id+' bounds '+JSON.stringify(t))
    for(let i=0;i<drawn.length;i++)for(const b of drawn.slice(i+1)){const a=drawn[i];assert(!(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.y+a.size,b.y+b.size)-Math.max(a.y,b.y)>1),profile.id+' overlap')}
    const pending=page.waitForEvent('download')
    await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
    const download=await pending
    assert.equal(await download.failure(),null)
    const bytes=await readFile(await download.path())
    assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1350)
    const expected=await img.evaluate(async i=>[...new Uint8Array(await(await fetch(i.src)).arrayBuffer())])
    assert.deepEqual(bytes,Buffer.from(expected))
    if(profile===profiles[0])await download.saveAs(`${output}/overview-${width}.png`)
  }
  if(profiles.length>1) {
    await page.evaluate(()=>{window.failBudgetEncoding=true})
    await page.getByRole('group',{name:'Choisir un profil',exact:true}).locator(`[data-value="${profiles[0].id}"]`).click()
    await expect(page.getByRole('button',{name:'Réessayer l’image',exact:true})).toBeVisible()
    await expect(page.getByText('Préparation de l’image…',{exact:true})).toHaveCount(0)
    await expect(page.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeDisabled()
    await page.getByRole('button',{name:'Réessayer l’image',exact:true}).click()
    await expect(page.getByRole('region',{name:'Image du budget',exact:true})).toHaveAttribute('aria-busy','false',{timeout:30000})
    await expect(page.getByRole('button',{name:'Télécharger le PNG',exact:true})).toBeEnabled()
  }
  console.log(`Budget overview: ${profiles.length} profiles at ${width}px, totals, bounds, overlaps and exact downloaded PNG checked.`)
}

export function captureOverviewText() {
  const toBlob=HTMLCanvasElement.prototype.toBlob
  HTMLCanvasElement.prototype.toBlob=function(callback,...args){
    if(window.failBudgetEncoding&&this.width===1080){window.failBudgetEncoding=false;callback(null);return}
    return toBlob.call(this,callback,...args)
  }

  const original=CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){
    if(this.canvas.width===1080){
      if(value==='LE BUDGET DE')window.budgetOverviewText=[]
      const size=Number(this.font.match(/([\d.]+)px/)?.[1]||0),w=this.measureText(value).width
      const left=x-(this.textAlign==='right'?w:this.textAlign==='center'?w/2:0)
      window.budgetOverviewText?.push({text:String(value),left,right:left+w,y,size})
    }
    return original.call(this,value,x,y,...args)
  }
}
