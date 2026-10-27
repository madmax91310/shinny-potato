import assert from 'node:assert/strict'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
const base = 'https://madmax91310.github.io/shinny-potato/'
const out = 'test-artifacts/investment-public'
await mkdir(out, {recursive:true})
const before = await (await fetch(base + 'build-info.json?qa=' + Date.now(), {cache:'no-store'})).json()
const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
const checks = []
let activePage
try {
  for (const width of [1280,393]) for (const [assetId, name, mode] of [
    ['or','Or','dca'], ['diageo','Diageo','lump'], ['msciWorld','MSCI World','lump'],
  ]) {
    const context = await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500,acceptDownloads:true})
    await context.addInitScript(() => {
      window.__investmentExports = new Map()
      const blobs = new WeakMap()
      const fill = CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText = function(value,...args) {
        if(this.canvas.width===1600 && this.canvas.height===2040) (this.canvas.__investmentWords??=[]).push(String(value))
        return fill.call(this,value,...args)
      }
      const metadata = canvas => {
        if(canvas.width!==1600 || canvas.height!==2040) return null
        return {words:[...(canvas.__investmentWords??[])],pixel:Array.from(canvas.getContext('2d').getImageData(0,1000,1,1).data)}
      }
      const remember = (url,meta) => {if(meta){window.__investmentExports.set(url,meta);if(window.__investmentExports.size>24)window.__investmentExports.delete(window.__investmentExports.keys().next().value)}}
      const data = HTMLCanvasElement.prototype.toDataURL
      HTMLCanvasElement.prototype.toDataURL = function(...args) {const value=data.apply(this,args);remember(value,metadata(this));return value}
      const blob = HTMLCanvasElement.prototype.toBlob
      HTMLCanvasElement.prototype.toBlob = function(callback,...args) {const meta=metadata(this);return blob.call(this,value=>{if(value&&meta)blobs.set(value,meta);callback(value)},...args)}
      const url = URL.createObjectURL
      URL.createObjectURL = function(value) {const result=url.call(this,value);remember(result,blobs.get(value));return result}
    })
    const page = await context.newPage(), errors=[]
    activePage = page
    page.on('pageerror',error=>errors.push(error.message))
    await page.goto(base+'calculateur-investissement?image-qa='+Date.now(),{waitUntil:'networkidle',timeout:90000})
    const settings=page.getByRole('button',{name:'Réglages',exact:true})
    if(await settings.isVisible()) await settings.click()
    await choose(page.getByRole('group',{name:'Choisir un actif',exact:true}),assetId)
    await page.getByRole('button',{name:mode==='dca'?'Mensuel (DCA)':'Versement unique',exact:true}).click()
    const previewTab=page.getByRole('button',{name:'Aperçu',exact:true})
    if(await previewTab.isVisible())await previewTab.click()
    await page.getByRole('tab',{name:'Image',exact:true}).click()
    await page.waitForFunction(({name,mode})=>{
      const image=document.querySelector('.publication-image-stage img'),meta=image&&window.__investmentExports.get(image.src)
      return image?.complete && image.naturalWidth===1600 && meta
        && new RegExp('\\b'+name+'\\b','i').test(meta.words.join(' '))
        && meta.words.includes(mode==='dca'?'par mois dans':'investis dans')
    },{name,mode},{timeout:90000})
    const preview=page.locator('.publication-image-stage img')
    const meta=await preview.evaluate(image=>window.__investmentExports.get(image.src))
    assert.equal(meta.words.filter(word=>word==='Épargnant Libre').length,1)
    assert(meta.words.includes('Investi') && meta.words.includes('Performance'))
    assert(!meta.words.some(word=>/moyenne mensuelle|MENSUEL|Source\s*:|https?:|@Epargnantlibre|Pas un conseil financier/.test(word)))
    assert(meta.pixel.slice(0,3).every(channel=>channel<50),'Public image must use obsidian backdrop')
    if(assetId==='diageo')assert(meta.words.some(word=>word.includes('GBp')),'Native GBp suffix must remain visible')
    const png=Buffer.from(await preview.evaluate(async image=>Array.from(new Uint8Array(await(await fetch(image.src)).arrayBuffer()))))
    const tag=width+'-'+assetId+'-'+mode
    await writeFile(out+'/'+tag+'-export.png',png)
    for(const label of ['Télécharger cet aperçu','📊 Télécharger une image']) {
      const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:label,exact:true}).click()])
      assert.equal(await download.failure(),null)
      assert((await readFile(await download.path())).equals(png),label+': downloaded PNG differs from preview')
    }
    assert.deepEqual(errors,[])
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflows viewport')
    await page.screenshot({path:out+'/'+tag+'-page.png',fullPage:true})
    checks.push({width,assetId,mode,downloads:2,words:meta.words})
    await context.close()
  }
  const after=await(await fetch(base+'build-info.json?qa='+Date.now(),{cache:'no-store'})).json()
  await writeFile(out+'/verified.json',JSON.stringify({before,after,checkedAt:new Date().toISOString(),checks},null,2)+'\n')
  console.log('PUBLIC_INVESTMENT_VERIFIED '+JSON.stringify({before,after,cases:checks.length,downloads:checks.length*2}))
} catch(error) {
  if(activePage && !activePage.isClosed()) {
    await activePage.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{})
    console.log('PUBLIC_QA_DIAGNOSTIC '+JSON.stringify(await activePage.evaluate(()=>({
      image:Array.from(document.querySelectorAll('.publication-image-stage img')).map(image=>({width:image.naturalWidth,protocol:image.src.split(':')[0]})),
      exports:window.__investmentExports?.size,
      lastWords:Array.from(window.__investmentExports?.values()??[]).slice(-3).map(meta=>meta.words),
      text:document.body.innerText.slice(-2500),
    })).catch(()=>({unavailable:true}))))
  }
  throw error
} finally {await browser.close()}
