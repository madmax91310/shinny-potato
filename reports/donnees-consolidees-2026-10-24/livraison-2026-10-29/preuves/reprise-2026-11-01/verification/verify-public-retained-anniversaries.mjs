import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'
import {choose} from '../../../../../../scripts/card-selection.mjs'
const base='https://madmax91310.github.io/shinny-potato',out=process.env.PROOF_DIR??'/dev/shm/automation-20261101/proofs/public-retained-anniversaries'
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({proxy:{server:process.env.HTTPS_PROXY}})
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[],rows=[]
 page.on('pageerror',e=>errors.push(e.message))
 const get=async path=>{const r=await context.request.get(base+path,{headers:{'cache-control':'no-cache'}});assert(r.ok());return r.json()}
 const build=await get('/build-info.json'),manifest=await get('/data/publication-manifest.json')
 const files=['src/data/automated-monthly.json','src/data/automated-etf-monthly.json','src/data/anniversary-levels.json']
 const data=Object.fromEntries(files.map(path=>[path,JSON.parse(execFileSync('git',['cat-file','blob',manifest.files[path]],{maxBuffer:64*1024*1024}))]))
 const levels=data[files[2]],ids=['etcPalladium','etf_world_communication','etf_clean_energy','etf_financials','etfIE00B2QWCY14']
 const months=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
 const norm=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[\u00a0\u202f]/g,' ').replace(/−/g,'-')
 for(const id of ids) {
  const level=levels[id];assert(level);assert(['2026-10-29','2026-10-30'].includes(level.asOf))
  const candidates=files.slice(0,2).map(path=>({path,record:data[path][id]})).filter(x=>x.record?.parser==='official-nav')
  assert.equal(candidates.length,1,id+' exact official series')
  const {path,record}=candidates[0],points=Object.fromEntries(record.anniversaryPoints??record.points)
  assert.equal(record.currency,level.currency)
  await page.goto(base+'/il-y-a-x-ans',{waitUntil:'networkidle'})
  await choose(page.locator('#subject-select'),id)
  await choose(page.locator('#secondary-select'),'1')
  await page.getByRole('button',{name:'🔄 Générer',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('pre')?.textContent.includes('2025'))
  const text=await page.locator('pre').innerText(),normalized=norm(text)
  const date=level.asOf.split('-').reverse().join('/')
  assert(normalized.includes(date),id+' true retained valuation date')
  const match=normalized.match(/📅 ([A-Za-z]+) (2025) :/);assert(match,id+' explicit historical month')
  const month=String(months.indexOf(match[1].toLowerCase())+1).padStart(2,'0'),ym=match[2]+'-'+month
  assert(points[ym]>0,id+' published historical price')
  const evolution=(level.value/points[ym]-1)*100,formatted=new Intl.NumberFormat('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(evolution)
  assert(normalized.includes(norm((evolution>=0?'+':'')+formatted+' %')),id+' independent price-only evolution')
  if(id!=='etcPalladium')assert(normalized.includes('hors distributions'))
  const downloads=[]
  for(const width of (id==='etcPalladium'?[1440,390]:[1440])) {
   await page.setViewportSize({width,height:1000})
   const preview=page.getByRole('button',{name:'Aperçu',exact:true});if(await preview.isVisible())await preview.click()
   await page.getByRole('tab',{name:'Image',exact:true}).click()
   const image=page.locator('.publication-image-stage img');await image.evaluate(img=>img.decode())
   const bytes=Buffer.from((await image.getAttribute('src')).split(',')[1],'base64'),pending=page.waitForEvent('download')
   await page.getByRole('button',{name:'Télécharger l’image PNG',exact:true}).click()
   const file=out+'/'+id+'-'+width+'.png';await(await pending).saveAs(file)
   const saved=await fs.readFile(file),sha=b=>createHash('sha256').update(b).digest('hex')
   assert.equal(sha(saved),sha(bytes));assert(saved.length>10000)
   downloads.push({width,bytes:saved.length,sha256:sha(saved)})
  }
  rows.push({id,sourceSeriesPath:path,sourceSeriesBlob:manifest.files[path],level,historyMonth:ym,
   historicalPrice:points[ym],independentPriceEvolutionPct:evolution,text,downloads,
   limit:'Retained dated level still usable, not a new successful source control and not a qualification of the missing October income-return tail.'})
  await page.setViewportSize({width:1440,height:1000})
 }
 assert.deepEqual(await get('/build-info.json'),build);assert.deepEqual(errors,[])
 await fs.writeFile(out+'/proof.json',JSON.stringify({checkedAt:new Date().toISOString(),buildInfo:build,rows,errors,
  limit:'Five actually consumed retained observations, independent arithmetic and six PNGs; the latest collection failures remain distinct.'},null,2))
 console.log('5 retained exact-share anniversary levels: real dates, independent price evolution, explicit income convention and6PNG exports verified')
}finally{await browser.close()}
