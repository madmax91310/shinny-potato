import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'
import {expect} from 'playwright/test'
import {BUDGET_PROFILES} from '../src/pages/budget-profiles/data.js'
const base=process.env.BUDGET_PUBLIC_BASE||'http://127.0.0.1:4493/shinny-potato'
const output=process.env.BUDGET_ARTIFACTS||'test-artifacts/budget-downloads'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined})
const results=[]
try {
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true})
  const page=await context.newPage();await page.goto(base+'/le-budget-de')
  for(const profile of BUDGET_PROFILES)for(const mode of ['social','detailed','summary']){
   await page.getByRole('group',{name:'Choisir un profil',exact:true}).locator(`[data-value="${profile.id}"]`).click()
   await page.getByRole('group',{name:'Version de l’image',exact:true}).locator(`[data-value="${mode}"]`).click()
   const region=page.getByRole('region',{name:'Image du budget',exact:true})
   await expect(region).toHaveAttribute('aria-busy','false',{timeout:30000})
   const count=Number((await page.locator('.budget-image-count').innerText()).match(/^\d+/)[0])
   for(let index=0;index<count;index++){
    if(count>1)await page.getByRole('button',{name:`Image ${index+1} sur ${count}`,exact:true}).click()
    await expect(region).toHaveAttribute('aria-busy','false',{timeout:30000})
    const img=region.locator('img');await expect(img).toHaveAttribute('alt',new RegExp(`image ${index+1} sur ${count}`))
    await expect.poll(()=>img.evaluate(i=>[i.naturalWidth,i.naturalHeight])).toEqual([1080,1350])
    const expected=await img.evaluate(async i=>[...new Uint8Array(await(await fetch(i.src)).arrayBuffer())])
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
    const download=await pending,bytes=await readFile(await download.path())
    const filename=`budget-${profile.id}-${mode}${count>1?`-${String(index+1).padStart(2,'0')}-sur-${String(count).padStart(2,'0')}`:''}.png`
    assert.equal(download.suggestedFilename(),filename);assert.deepEqual(bytes,Buffer.from(expected));assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[1080,1350])
    results.push({width,id:profile.id,mode,page:index+1,count,filename,bytes:bytes.length})
   }
  }
  await context.close();console.log(`Downloaded every page, all modes, ${BUDGET_PROFILES.length} profiles at ${width}px`)
 }
 await writeFile(output+'/downloads.json',JSON.stringify(results,null,2))
}finally{await browser.close()}
