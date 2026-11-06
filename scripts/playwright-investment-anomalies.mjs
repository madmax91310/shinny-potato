import assert from 'node:assert/strict'
import {derive,fmtEUR} from '../src/pages/investment-calculator/lib.js'
import {chromium} from 'playwright'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const base=process.env.AUDIT_BASE??'http://127.0.0.1:4173/shinny-potato'
const out=process.env.AUDIT_OUT??'test-artifacts/investment-unit-calculator'
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({headless:true}),rows=[]
try{
 for(const width of [1440,390])for(const [id,year,month]of [['etfLU1829219390',2020,1],['etf_timber_ishares',2026,1],['etf_timber_ishares',2026,2],['etf_timber_ishares',2026,3]])for(const mode of ['lump','dca']){
 const ctx=await browser.newContext({viewport:{width,height:960},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true})
 const state={currency:'native',scenario:'standard',crisisId:'covid',assetId:id,startYear:year,startMonth:month,amountRaw:'1000',mode,customLabel:'',customStart:'',customEnd:'',overridePriceRaw:''}
 await ctx.addInitScript(state=>{localStorage.setItem('epargnant-publication:v1:investment-settings',JSON.stringify(state));window.__painted=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...a){window.__painted.push(String(t));return f.call(this,t,...a)}},state)
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message))
 await p.goto(`${base}/calculateur-investissement`,{waitUntil:'networkidle'})
 await p.locator('.workspace-tool-view').waitFor({state:'attached'});const preview=p.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click();await p.getByRole('tab',{name:'Texte',exact:true}).click(); await p.locator('.ic-card, .ic-error, [role=alert]').first().waitFor({timeout:60000})
 const key=`${id}-${year}-${month}-${mode}-${width}`,body=await p.locator('body').innerText(),row={key,state,width,url:p.url(),body,errors}
 assert.equal(await p.locator('.ic-card').count(),1,`Expected a qualified result: ${body}`)
 if(await p.locator('.ic-card').count()){
 row.value=await p.locator('.ic-hero-number').innerText();const expected=derive(state);assert.equal(row.value,fmtEUR(expected.result.finalValue,expected.currency),'Displayed result matches the exact selected window and mode');
 await p.getByRole('button',{name:'𝕏 Copier le texte du post',exact:true}).click();row.text=await p.evaluate(()=>navigator.clipboard.readText());assert(row.text.includes(row.value),'Copied text and displayed result agree')
 const dl=p.waitForEvent('download');await p.getByRole('button',{name:/Télécharger une image/}).click();const d=await dl;await d.saveAs(`${out}/${key}.png`);row.pngSha256=createHash('sha256').update(readFileSync(`${out}/${key}.png`)).digest('hex')
 await p.getByRole('tab',{name:'Image',exact:true}).click();await p.locator('.publication-image-stage img').waitFor({state:'visible',timeout:60000});const src=await p.locator('.publication-image-stage img').getAttribute('src');row.previewSha256=createHash('sha256').update(Buffer.from(src.split(',')[1],'base64')).digest('hex');assert.equal(row.pngSha256,row.previewSha256);row.painted=await p.evaluate(()=>window.__painted);assert(row.painted.includes(row.value),`Canvas value ${row.value}`)
 }
 assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`${out}/${key}-page.png`,fullPage:true});rows.push(row);writeFileSync(`${out}/results.json`,JSON.stringify(rows,null,2));console.log(key,row.value??'refused');await ctx.close()
 }
}finally{await browser.close()}
