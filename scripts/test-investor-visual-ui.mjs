// Real UI downloads for every available investor, against a built or public site.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir,readFile,writeFile } from 'node:fs/promises'
import { choose } from './card-selection.mjs'
import { editorialSeries } from '../src/pages/investor-portfolio/publication.js'
import { INVESTORS,normalizePortfolio,buildTweet } from '../src/pages/investor-portfolio/data.js'
const base=process.env.INVESTOR_VISUAL_URL || 'http://127.0.0.1:4310/shinny-potato/'
const out=process.env.INVESTOR_VISUAL_OUT || 'test-artifacts/investor-visual-ui'
const remote=base.startsWith('https:')
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),...(remote&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
await mkdir(out,{recursive:true})
try {
 const context=await browser.newContext({acceptDownloads:true,permissions:['clipboard-read','clipboard-write']})
 const page=await context.newPage(),errors=[],results=[]
 page.on('pageerror',error=>errors.push(error.message))
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:1000});await page.goto(base+'portefeuilles-investisseurs')
  for(const [slug] of INVESTORS) {
   const payload=await(await fetch(base+`data/investors/${slug}.json?visual=${Date.now()}`)).json(),portfolio=normalizePortfolio(payload)
   await choose(page.getByLabel('Choisir un investisseur'),slug)
   await page.waitForFunction(text=>document.querySelector('#ip-draft')?.value===text,buildTweet(portfolio))
   if(width===390)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
   const downloadButton=page.getByRole('button',{name:'⬇️ Télécharger le PNG',exact:true})
   if(portfolio.problem) {
    assert(await downloadButton.isDisabled());
    if(process.env.INVESTOR_FULL_ZIPS==='1'){
     await page.getByRole('tab',{name:'Texte',exact:true}).click()
     const [zip]=await Promise.all([page.waitForEvent('download',{timeout:180000}),page.getByRole('button',{name:'Télécharger les PNG détaillés (ZIP)',exact:true}).click()])
     await zip.saveAs(`${out}/${slug}-details-${width}.zip`)
    }
    results.push({slug,width,status:'incomplete',problem:portfolio.problem})
   } else {
    const path=`${out}/${slug}-${width}.png`
    assert(!await page.getByLabel('Positions du visuel',{exact:true}).innerText().then(text=>text.includes('unité ?')||text.includes('devise inconnue')),`${slug}: qualified aggregate must retain its currency/unit`)
    // Mobile exercises preview-first; desktop exercises download-first.
    if(width===390) {
     await page.getByRole('tab',{name:'Image',exact:true}).click()
     await page.getByRole('img',{name:`Portefeuille ${portfolio.identity.displayName}`,exact:true}).waitFor()
    }
    const [download]=await Promise.all([page.waitForEvent('download'),downloadButton.click()]);await download.saveAs(path)
    assert(download.url().startsWith('blob:'),`${slug}: main PNG uses the mobile-safe Blob transfer`)
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    const image=page.getByRole('img',{name:`Portefeuille ${portfolio.identity.displayName}`,exact:true})
    await image.waitFor()
    const preview=Buffer.from((await image.getAttribute('src')).split(',')[1],'base64'),bytes=await readFile(path)
    assert.deepEqual(preview,bytes,`${slug}: preview differs from download`)
    const [previewDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger cet aperçu',exact:true}).click()])
    const previewPath=`${out}/${slug}-preview-download-${width}.png`;await previewDownload.saveAs(previewPath)
    assert.deepEqual(await readFile(previewPath),bytes,`${slug}: the two download buttons differ`)
    assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1350)
    if(width===390)assert.deepEqual(bytes,await readFile(`${out}/${slug}-1440.png`),`${slug}: viewport changed export`)
    await page.locator('.studio-preview').screenshot({path:`${out}/${slug}-preview-${width}.png`})
    const series=editorialSeries(portfolio)
    for(let index=1;index<series.pages.length;index++) {
     const previous=await image.getAttribute('src')
     await page.getByRole('button',{name:'Image suivante',exact:true}).click()
     await page.waitForFunction(previous=>{const img=document.querySelector('.publication-image-stage img');return img&&img.src!==previous},previous)
     const [next]=await Promise.all([page.waitForEvent('download'),downloadButton.click()])
     const file=`${out}/${slug}-page-${index+1}-${width}.png`;await next.saveAs(file)
     const content=await readFile(file)
     assert.deepEqual(Buffer.from((await image.getAttribute('src')).split(',')[1],'base64'),content)
     assert.equal(content.readUInt32BE(16),1080);assert.equal(content.readUInt32BE(20),1350)
     if(width===390)assert.deepEqual(content,await readFile(`${out}/${slug}-page-${index+1}-1440.png`))
    }
    for(let index=series.pages.length-1;index>0;index--)await page.getByRole('button',{name:'Image précédente',exact:true}).click()
    await page.getByRole('tab',{name:'Texte',exact:true}).click()
    if(width===390)await page.getByRole('button',{name:'Réglages',exact:true}).click()
    if(series.pages.length>1){
     const [zip]=await Promise.all([page.waitForEvent('download',{timeout:180000}),page.getByRole('button',{name:'Télécharger la série pour X (ZIP)',exact:true}).click()])
     await zip.saveAs(`${out}/${slug}-series-${width}.zip`)
    }
    if(width===390)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
    if(process.env.INVESTOR_FULL_ZIPS==='1'){
     const [zip]=await Promise.all([page.waitForEvent('download',{timeout:300000}),page.getByRole('button',{name:'Télécharger les PNG détaillés (ZIP)',exact:true}).click()])
     await zip.saveAs(`${out}/${slug}-details-${width}.zip`)
    }
    results.push({slug,width,status:'ready',period:portfolio.snapshot.periodEnd,total:portfolio.total,previewEqualsDownload:true})
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  }
 }
 assert.deepEqual(errors,[])
 await writeFile(`${out}/results.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),results,errors},null,2))
 console.log(`${results.length} parcours réels : ${INVESTORS.length} profils × ordinateur/mobile, PNG rouverts, aperçu identique et états incomplets.`)
}finally{await browser.close()}
