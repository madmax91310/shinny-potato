import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'
const base='https://madmax91310.github.io/shinny-potato',out=process.env.PROOF_DIR??'/dev/shm/automation-20261101/proofs/public-wisdomtree-aum'
await fs.mkdir(out,{recursive:true})
const source=JSON.parse(await fs.readFile(process.env.SOURCE_PROOF??new URL('../wisdomtree-ordinary-after-merge-41356552885.json',import.meta.url),'utf8'))
const browser=await chromium.launch({headless:true,proxy:{server:process.env.HTTPS_PROXY}})
try{
 const ctx=await browser.newContext({acceptDownloads:true,permissions:['clipboard-read','clipboard-write'],viewport:{width:Number(process.env.SCREEN_WIDTH??1440),height:1000}}),page=await ctx.newPage(),errors=[],results=[]
 await page.addInitScript(()=>{window.__painted=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__painted.push(String(text));return original.call(this,text,...args)}})
 page.on('pageerror',e=>errors.push(e.message))
 const get=async path=>{const r=await ctx.request.get(base+path,{headers:{'cache-control':'no-cache'}});assert(r.ok());return r.json()}
 const build=await get('/build-info.json'),manifest=await get('/data/publication-manifest.json'),path='src/data/automated-etf.json',blob=manifest.files[path];assert.match(blob,/^[a-f0-9]{40}$/)
 const recordedBlob=execFileSync('git',['rev-parse',source.recordCommit+':'+path],{encoding:'utf8'}).trim();assert.equal(blob,recordedBlob,'Ordinary WisdomTree AUM record not yet published')
 const registry=JSON.parse(execFileSync('git',['cat-file','blob',blob],{maxBuffer:64*1024*1024}))
 const norm=s=>s.replace(/\s+/gu,' ').trim()
 for(const row of source.instrumentsExpectedAndRecorded){
  const aum=registry[row.isin].aum;for(const key of ['amount','currency','scope','asOf','sourceUrl','sha256','checkedAt'])assert.deepEqual(aum[key],row.aum[key],row.isin+':'+key)
  const amount=new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(aum.amount/1e6),currency={USD:'$',EUR:'€'}[aum.currency];assert(currency)
  const expected=`Encours : Fonds : ${amount} M${currency} au ${aum.asOf.split('-').reverse().join('/')}`
  await page.goto(base+'/fiches-etf?isin='+row.isin,{waitUntil:'networkidle'})
  if(await page.getByRole('tab',{name:'Texte',exact:true}).isVisible())await page.getByRole('tab',{name:'Texte',exact:true}).click()
  const card=page.locator('.es-card');await card.getByText('ISIN : '+row.isin,{exact:true}).waitFor();assert(norm(await card.innerText()).includes(norm(expected)))
  if(await page.getByRole('tab',{name:'Texte',exact:true}).isVisible())await page.getByRole('tab',{name:'Texte',exact:true}).click()
  await page.getByRole('button',{name:'📋 Copier le texte',exact:true}).click();const text=await page.evaluate(()=>navigator.clipboard.readText());assert(norm(text).includes(norm(expected)));assert.doesNotMatch(text,/NaN|undefined/)
  if(await page.getByRole('button',{name:'Aperçu',exact:true}).isVisible())await page.getByRole('button',{name:'Aperçu',exact:true}).click()
  await page.getByRole('tab',{name:'Image',exact:true}).click()
  const image=page.getByRole('img',{name:/^Fiche ETF /});await image.waitFor();await image.evaluate(e=>e.decode());const preview=await image.getAttribute('src');assert(preview.startsWith('data:image/png;base64,'))
  const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger l’image',exact:true}).click();const file=out+'/'+row.isin+'.png';await(await dl).saveAs(file);const bytes=await fs.readFile(file);assert(bytes.length>10000);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.deepEqual(bytes,Buffer.from(preview.split(',')[1],'base64'),'Export differs from current preview')
  const labels=await page.evaluate(()=>window.__painted);assert(norm(labels.join(' ')).includes(norm(expected)))
  results.push({isin:row.isin,financialAsOf:aum.asOf,sourceCheckedAt:aum.checkedAt,expected,sourceSha256:aum.sha256,visible:await card.innerText(),text,png:{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),matchesPreview:true}})
 }
 assert.deepEqual(await get('/build-info.json'),build);assert.equal((await get('/data/publication-manifest.json')).files[path],blob);assert.deepEqual(errors,[])
 await fs.writeFile(out+'/proof.json',JSON.stringify({checkedAt:new Date().toISOString(),buildInfo:build,viewportWidth:Number(process.env.SCREEN_WIDTH??1440),sourceRun:source.runId,recordCommit:source.recordCommit,manifestPath:path,manifestBlob:blob,results,errors,limit:'Seven exact native AUM values and presentation consumers, not all fields. Actual ordinary transport HTTP; browser fallback remains separately exercised in GitHub read-only control.'},null,2)+'\n')
 console.log('Seven native WisdomTree AUM values: source, exact record/public blob, text, canvas and 7 matching PNG verified')
}finally{await browser.close()}
