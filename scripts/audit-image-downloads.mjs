import {chromium} from 'playwright'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const base=process.env.IMAGE_AUDIT_BASE||'http://127.0.0.1:4173/shinny-potato/'
const out=process.env.IMAGE_AUDIT_OUT||'test-artifacts/image-audit/before'
const routes=process.env.IMAGE_AUDIT_ROUTES?JSON.parse(process.env.IMAGE_AUDIT_ROUTES):['performance-depuis','classements-performances','tweets-factsheets','generateur-portefeuilles','le-dca-de?mode=dca','le-budget-de','calculateur-investissement','comparatif-courtiers','fiches-etf','comparatif-etf','portefeuilles-investisseurs','fiches-pratiques','il-y-a-x-ans','presentations','france-100-menages','fiche-lexique','pouvoir-achat','duels-portefeuilles']
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox'],...(process.env.IMAGE_AUDIT_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})})
const reports=[]
for(const width of [390,320]) for(const route of routes){
 const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true})
 const page=await context.newPage();page.setDefaultTimeout(12000)
 const report={route,width,errors:[]},id=route.replace(/[^a-zA-Z0-9-]/g,'_')+'-'+width
 page.on('pageerror',e=>report.errors.push(e.message))
 try{
 await page.goto(base+route,{waitUntil:'networkidle'})
 const generate=page.getByRole('button',{name:/^Générer (le portefeuille|un portefeuille|l’image|une image)/}).first()
 if(await generate.isVisible())await generate.click()
 const preview=page.getByRole('button',{name:'Aperçu',exact:true}).first();if(await preview.isVisible())await preview.click()
 const tab=page.getByRole('tab',{name:'Image',exact:true}).first();if(await tab.isVisible())await tab.click()
 await page.waitForTimeout(800)
 report.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
 report.buttons=await page.locator('button,a[download]').filter({visible:true}).evaluateAll(es=>es.map(e=>({text:e.textContent.trim(),disabled:e.disabled})))
 const button=page.locator('button,a[download]').filter({hasText:/Télécharger/}).filter({visible:true}).last()
 if(await button.isVisible()&&await button.isEnabled()){
 const [download]=await Promise.all([page.waitForEvent('download'),button.click()])
 const bytes=await readFile(await download.path());report.file=download.suggestedFilename();report.sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(`${out}/${id}.png`,bytes)
 if(route==='fiches-etf')await page.locator('.studio-preview img').first().evaluate(img=>img.decode())
 const data=bytes.toString('base64')
 report.preview=await page.evaluate(async data=>{
  const img=new Image();img.src='data:image/png;base64,'+data;await img.decode()
  const output=document.createElement('canvas');output.width=img.width;output.height=img.height;output.getContext('2d').drawImage(img,0,0)
  const exact=output.toDataURL()
  const matches=[],differences=[];const expected=output.getContext('2d').getImageData(0,0,img.width,img.height).data
  for(const e of document.querySelectorAll('img,canvas'))try{
   if(e instanceof HTMLImageElement)await e.decode()
   const c=document.createElement('canvas');c.width=e.naturalWidth||e.width;c.height=e.naturalHeight||e.height;c.getContext('2d').drawImage(e,0,0)
   if(c.toDataURL()===exact)matches.push(e.tagName+':'+(e.alt||e.className))
   else if(c.width===img.width&&c.height===img.height){const actual=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let changed=0,significant=0,maxDelta=0;for(let i=0;i<actual.length;i++){const delta=Math.abs(actual[i]-expected[i]);if(delta)changed++;if(delta>3)significant++;maxDelta=Math.max(maxDelta,delta)}differences.push({element:e.tagName+':'+(e.alt||e.className),changed,significant,maxDelta,preview:c.toDataURL()})}
  }catch{}
  return {width:img.width,height:img.height,matches,differences}
 },data)
 for(const [i,difference] of report.preview.differences.entries()){await writeFile(`${out}/${id}-preview-${i}.png`,Buffer.from(difference.preview.split(',')[1],'base64'));delete difference.preview}
 }else report.blocked='Aucun bouton de téléchargement actif dans ce parcours initial'
 await page.screenshot({path:`${out}/${id}-ui.png`,fullPage:true})
 }catch(e){report.failure=e.message;await page.screenshot({path:`${out}/${id}-failure.png`,fullPage:true}).catch(()=>{})}
 reports.push(report);await writeFile(`${out}/results.json`,JSON.stringify(reports,null,2));console.log(id,report.failure||report.blocked||JSON.stringify(report.preview));await context.close()
}
await browser.close()
