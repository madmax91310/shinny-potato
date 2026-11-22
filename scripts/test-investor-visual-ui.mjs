// Real UI downloads for every available investor, against a built or public site.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir,readFile,writeFile } from 'node:fs/promises'
import { choose } from './card-selection.mjs'
import { observeInvestorCanvas } from './investor-canvas-audit.mjs'
import { cash, publicationPlan, portfolioOwner } from '../src/pages/investor-portfolio/publication.js'
import { INVESTORS,normalizePortfolio,buildTweet } from '../src/pages/investor-portfolio/data.js'
const base=process.env.INVESTOR_VISUAL_URL || 'http://127.0.0.1:4310/shinny-potato/'
const out=process.env.INVESTOR_VISUAL_OUT || 'test-artifacts/investor-visual-ui'
const remote=base.startsWith('https:')
const audit=process.env.INVESTOR_POSTER_AUDIT==='1'
const baseline=process.env.INVESTOR_VISUAL_BASELINE==='1'
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),...(remote&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
await mkdir(out,{recursive:true})
const errors=[],results=[]
try {
 const context=await browser.newContext({acceptDownloads:true,permissions:['clipboard-read','clipboard-write']})
 if (audit) await context.addInitScript(observeInvestorCanvas)
 const page=await context.newPage()
 const reviews=await (await fetch(base+'data/investors/review-metadata.json')).json()
 page.on('pageerror',error=>errors.push(error.message))
 for(const width of baseline ? [1440] : [1440,390,320]) {
  await page.setViewportSize({width,height:1000});await page.goto(base+'portefeuilles-investisseurs')
  for(const [slug] of INVESTORS) {
   const payload=await(await fetch(base+`data/investors/${slug}.json?visual=${Date.now()}`)).json(),portfolio=normalizePortfolio(payload)
   await choose(page.getByLabel('Choisir un investisseur'),slug)
   await page.locator('.ip-meta').getByText(portfolio.identity.displayName+' · '+portfolio.identity.entityName, {exact:true}).waitFor({state:'attached'})
   if(!baseline) await page.waitForFunction(text=>document.querySelector('#ip-draft')?.value===text,buildTweet(portfolio))
   const report={slug,width,investor:portfolio.identity.displayName,entity:portfolio.identity.entityName,period:portfolio.snapshot.periodEnd,
    review:reviews.find(row=>row.data.identity.slug===slug),source:portfolio.sourceUrl}
   if(width<700)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
   const downloadButton=page.getByRole('button',{name:'⬇️ Télécharger le PNG',exact:true})
   if(portfolio.problem) {
    assert(await downloadButton.isDisabled());
    if(process.env.INVESTOR_FULL_ZIPS==='1'){
     await page.getByRole('tab',{name:'Texte',exact:true}).click()
     const [zip]=await Promise.all([page.waitForEvent('download',{timeout:180000}),page.getByRole('button',{name:'Télécharger les PNG détaillés (ZIP)',exact:true}).click()])
     await zip.saveAs(`${out}/${slug}-details-${width}.zip`)
    }
    results.push({...report,status:'incomplete',problem:portfolio.problem})
   } else {
    const path=`${out}/${slug}-${width}.png`
    assert(!await page.getByLabel('Positions du visuel',{exact:true}).innerText().then(text=>text.includes('unité ?')||text.includes('devise inconnue')),`${slug}: qualified aggregate must retain its currency/unit`)
    // Mobile exercises preview-first; desktop exercises download-first.
    if(width<700) {
     await page.getByRole('tab',{name:'Image',exact:true}).click()
     await page.getByRole('img',{name:`Portefeuille ${portfolioOwner(portfolio)}`,exact:true}).waitFor()
    }
    const [download]=await Promise.all([page.waitForEvent('download'),downloadButton.click()]);await download.saveAs(path)
    assert(download.url().startsWith('blob:'),`${slug}: main PNG uses the mobile-safe Blob transfer`)
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    const image=page.getByRole('img',{name:`Portefeuille ${portfolioOwner(portfolio)}`,exact:true})
    await image.waitFor()
    const preview=Buffer.from((await image.getAttribute('src')).split(',')[1],'base64'),bytes=await readFile(path)
    assert.deepEqual(preview,bytes,`${slug}: preview differs from download`)
    const [previewDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger cet aperçu',exact:true}).click()])
    const previewPath=`${out}/${slug}-preview-download-${width}.png`;await previewDownload.saveAs(previewPath)
    assert.deepEqual(await readFile(previewPath),bytes,`${slug}: the two download buttons differ`)
    assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1350)
    if(width<700)assert.deepEqual(bytes,await readFile(`${out}/${slug}-1440.png`),`${slug}: viewport changed export`)
    if(!audit && !baseline) await page.locator('.studio-preview').screenshot({path:`${out}/${slug}-preview-${width}.png`})
    assert.equal(await page.getByText(/Télécharger la série pour X|Image suivante|Image précédente/).count(), 0)
    assert.equal(await page.locator('.publication-image-stage img').count(), 1)
    assert.equal(download.suggestedFilename(), previewDownload.suggestedFilename())
    assert.equal(download.suggestedFilename(), `portefeuille-${slug}-${portfolio.snapshot.periodEnd}.png`)
    await page.getByRole('tab',{name:'Texte',exact:true}).click()
    if(process.env.INVESTOR_FULL_ZIPS==='1'){
     const [zip]=await Promise.all([page.waitForEvent('download',{timeout:300000}),page.getByRole('button',{name:'Télécharger les PNG détaillés (ZIP)',exact:true}).click()])
     await zip.saveAs(`${out}/${slug}-details-${width}.zip`)
    }
    if (audit && width===1440) {
      const boxes=await page.evaluate(()=>window.investorCanvasLettering)
      const plan=publicationPlan(portfolio)
      const owner=portfolioOwner(portfolio)
      const initials=owner.match(/[\p{L}\p{N}]+/gu)?.slice(0,3).map(word=>word[0]).join('').toLocaleUpperCase('fr-FR')
      const quarter=Math.ceil(Number(portfolio.snapshot.periodEnd.slice(5,7))/3)
      const expected=[owner,`Portefeuille · T${quarter} ${portfolio.snapshot.periodEnd.slice(0,4)}`,
        ...plan.entries.flatMap(row=>[...row.box.lines,row.percent]),
        `Valeur déclarée hors options · ${cash(plan.total,plan.currency)}`,'Épargnant Libre']
      const actual=boxes.map(box=>box.text)
      if(actual[2]===initials) {actual.splice(2,1); report.monogram=true}
      assert.deepEqual(actual,expected,`${slug}: texte du PNG`)
      for (const row of plan.entries) {
        assert(!/https?:|portrait détouré|CUSIP|\b\d+\/\d+\b/i.test(row.label) && (!row.cusip || !row.label.includes(row.cusip)),
          `${slug}: annotation interdite ${row.label}`)
        assert(row.weight === row.value / plan.total, `${slug}: poids hors options`)
      }
      assert(plan.entries.every(row => row.box.lines.length <= 2), `${slug}: libellé sur plus de deux lignes`)
      for(const [index,box] of boxes.entries()){
        assert(box.left>=0 && box.top>=0 && box.right<=1080 && box.bottom<=1350,`${slug}: débordement ${box.text}`)
        assert(box.lowContrastFraction<.05,`${slug}: contraste ${box.text} (${box.lowContrastFraction})`)
        for(const previous of boxes.slice(0,index)){
          const overlapX=Math.min(previous.right,box.right)-Math.max(previous.left,box.left)
          const overlapY=Math.min(previous.bottom,box.bottom)-Math.max(previous.top,box.top)
          assert(overlapX<=2 || overlapY<=2,`${slug}: collision ${box.text} / ${previous.text}`)
        }
      }
      report.layout={letters:boxes,entries:plan.entries.map(({label,cusip,shareClass,value,weight,other})=>({label,cusip,shareClass,value,weight,other:!!other}))}
    }
    results.push({...report,status:'ready',total:portfolio.total,previewEqualsDownload:true})
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  }
 }
 assert.deepEqual(errors,[])
 console.log(`${results.length} parcours Chromium sur ${INVESTORS.length} profils, aperçu identique au PNG et états incomplets.`)
} catch (error) {
 errors.push(error.message)
 throw error
} finally {
 await writeFile(`${out}/results.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),results,errors},null,2))
 await browser.close()
}
