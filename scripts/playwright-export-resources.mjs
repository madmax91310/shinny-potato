import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {staticBrowser,staticBase as base} from './static-browser.mjs'
function installProbe() {
  window.exportLifecycle={created:[],revoked:[],failed:0}
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),click=HTMLAnchorElement.prototype.click
  URL.createObjectURL=blob=>{const url=create(blob);window.exportLifecycle.created.push(url);return url}
  URL.revokeObjectURL=url=>{window.exportLifecycle.revoked.push(url);return revoke(url)}
  window.restoreExportClick=()=>{HTMLAnchorElement.prototype.click=click}
  HTMLAnchorElement.prototype.click=function(){if(this.href.startsWith('blob:')){window.exportLifecycle.failed++;throw Error('Injected download failure')}return click.call(this)}
}
for(const width of [1440,390]) {
const {browser,page}=await staticBrowser(width),errors=[]
page.on('pageerror',error=>{if(error.message!=='Injected download failure')errors.push(error.message)})
try {
 await page.goto(base+'il-y-a-x-ans?asset=apple')
 await page.locator('#secondary-select [data-option][data-value="3"]').click()
 await page.getByRole('button',{name:/^(🔄 )?Générer$/}).click()
 if(width<1024)await page.getByRole('button',{name:'Aperçu',exact:true}).click()
 await page.getByRole('tab',{name:'Image',exact:true}).click()
 await page.locator('.publication-image-stage img').waitFor()
 await page.waitForFunction(()=>document.querySelector('.publication-image-stage img')?.complete)
 await page.evaluate(installProbe)
 await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
 await page.waitForFunction(()=>window.exportLifecycle.failed===1)
 const proof=await page.evaluate(()=>({...window.exportLifecycle,anchors:[...document.querySelectorAll('a[download]')].filter(a=>window.exportLifecycle.created.includes(a.href)).length}))
 assert.equal(proof.failed,1)
 assert.equal(proof.anchors,0,'failed export removes temporary link')
 await page.waitForFunction(()=>window.exportLifecycle.revoked.length===window.exportLifecycle.created.length)
 assert.deepEqual(await page.evaluate(()=>window.exportLifecycle.revoked),proof.created,'failed export releases its Blob URL')
 await page.evaluate(()=>window.restoreExportClick())
 const preview=Buffer.from(await page.locator('.publication-image-stage img').evaluate(async img=>{const blob=await fetch(img.src).then(r=>r.blob());return new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob)})}),'base64')
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Réessayer le PNG',exact:true}).click()])
 assert.equal(download.suggestedFilename(),'il-y-a-3-ans-apple.png')
 assert.deepEqual(await readFile(await download.path()),preview,'retry downloads the unmodified preview')
 await page.goto(base+'donnees-a-revoir')
 const diagnostics=page.getByRole('button',{name:/^Exporter les \d+ diagnostics filtrés \(JSON\)$/})
 await diagnostics.waitFor()
 await page.getByText('Chargement des preuves et des contrats consommateurs…',{exact:true}).waitFor({state:'hidden'})
 await page.evaluate(installProbe)
 await diagnostics.click()
 await page.waitForFunction(()=>window.exportLifecycle.failed===1)
 assert.equal(await page.locator('a[download][href^="blob:"]').count(),0)
 await page.waitForFunction(()=>window.exportLifecycle.revoked.length===window.exportLifecycle.created.length)
 assert.deepEqual(await page.evaluate(()=>window.exportLifecycle.revoked),await page.evaluate(()=>window.exportLifecycle.created))
 await page.evaluate(()=>window.restoreExportClick())
 const [jsonDownload]=await Promise.all([page.waitForEvent('download'),diagnostics.click()])
 assert.equal(jsonDownload.suggestedFilename(),'donnees-a-revoir.json')
 const payload=JSON.parse(await readFile(await jsonDownload.path(),'utf8'))
 assert(Array.isArray(payload.rows) && payload.rows.every(row=>typeof row.id==='string'))
 assert.equal(payload.filters.kind,'action')
 assert(Number.isFinite(Date.parse(payload.generatedAt)))
 for(const entry of [
  {path:'impact-frais',button:'Télécharger l’image PNG',kind:'png',name:/^epargnant-libre-impact-des-frais\.png$/},
  {path:'comparatif-courtiers',button:'Télécharger l’image PNG',kind:'png',name:/^duel-courtiers-.+\.png$/},
  {path:'fiches-pratiques',button:'Télécharger l’image PNG',kind:'png',name:/^epargnant-libre-.+\.png$/},
  {path:'simulateur-patrimoine',button:'Télécharger l’image',kind:'png',name:/^projection-patrimoine\.png$/},
  {path:'simulateur-patrimoine',button:'Exporter JSON',kind:'wealth',name:/^simulation-patrimoine\.json$/},
  {path:'simulateur-patrimoine',button:'Exporter les projections CSV',kind:'csv',name:/^projection-patrimoine\.csv$/},
  {path:'france-100-menages',button:'Exporter le JSON',kind:'household',name:/^france-100-menages-.+\.json$/},
  {path:'bibliotheque-donnees',button:'Exporter la fiche JSON',kind:'record',name:/^donnees-.+\.json$/},
 ]){
  await page.goto(base+entry.path)
  if(width<1024 && (entry.kind==='png'||entry.kind==='household'))await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  if(entry.kind==='png')await page.getByRole('tab',{name:'Image',exact:true}).click()
  const action=page.getByRole('button',{name:entry.button,exact:true})
  const [file]=await Promise.all([page.waitForEvent('download'),action.click()])
  assert.match(file.suggestedFilename(),entry.name)
  const bytes=await readFile(await file.path())
  if(entry.kind==='png'){
   assert.equal(bytes.subarray(1,4).toString(),'PNG')
   assert(bytes.readUInt32BE(16)>300 && bytes.readUInt32BE(20)>300)
  }else if(entry.kind==='csv')assert(bytes.toString().startsWith('patrimoine;annee;capital;capital_reel;'))
  else {
   const data=JSON.parse(bytes.toString())
   if(entry.kind==='wealth')assert(data.version===1 && data.portfolios.a && data.portfolios.b)
   else {assert.equal(data.schemaVersion,1);assert.equal(typeof data.id,'string')}
  }
 }
 assert.deepEqual(errors,[])
 console.log(`Export lifecycle ${width}px: injected click failure releases link/URL; retry downloads PNG equal to preview; direct JSON failure/retry and eight PNG/JSON/CSV consumer downloads OK.`)
} finally {await browser.close()}

}
