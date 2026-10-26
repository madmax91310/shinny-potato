import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {staticBrowser,staticBase as base} from './static-browser.mjs'
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
 await page.evaluate(()=>{
  window.exportLifecycle={created:[],revoked:[],failed:0}
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),click=HTMLAnchorElement.prototype.click
  URL.createObjectURL=blob=>{const url=create(blob);window.exportLifecycle.created.push(url);return url}
  URL.revokeObjectURL=url=>{window.exportLifecycle.revoked.push(url);return revoke(url)}
  window.restoreExportClick=()=>{HTMLAnchorElement.prototype.click=click}
  HTMLAnchorElement.prototype.click=function(){if(this.href.startsWith('blob:')){window.exportLifecycle.failed++;throw Error('Injected download failure')}return click.call(this)}
 })
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
 assert.deepEqual(errors,[])
 console.log(`Export lifecycle ${width}px: injected click failure releases link/URL; retry downloads PNG equal to preview.`)
} finally {await browser.close()}

}
