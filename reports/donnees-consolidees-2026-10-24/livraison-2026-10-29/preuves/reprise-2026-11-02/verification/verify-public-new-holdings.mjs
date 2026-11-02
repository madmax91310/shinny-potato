import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'

const base='https://madmax91310.github.io/shinny-potato'
const out=process.env.PROOF_DIR??'/dev/shm/automation-20261101/proofs/public-exposure-recovery'
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,proxy:{server:process.env.HTTPS_PROXY}})
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true})
 const page=await context.newPage(),errors=[],results=[]
 page.on('pageerror',e=>errors.push(e.message))
 const get=async path=>{const r=await context.request.get(base+path,{headers:{'cache-control':'no-cache'}});assert(r.ok());return r.json()}
 const first=await get('/build-info.json'),manifest=await get('/data/publication-manifest.json')
 const catalogPath='src/pages/dca-profiles/catalog.json',blob=manifest.files[catalogPath]
 assert.match(blob,/^[a-f0-9]{40}$/)
 const fromManifest=path=>JSON.parse(execFileSync('git',['cat-file','blob',manifest.files[path]],{maxBuffer:32*1024*1024}))
 const catalog=fromManifest(catalogPath),holdingsManifest=fromManifest('src/pages/dca-profiles/holdings-manifest.json')
 const normalize=s=>s.replace(/[\u00a0\u202f]/g,' ')
 const pct=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(n)+' %'
 for(const isin of ['IE00B52SF786','IE00B5377D42','IE00B5WHFQ43','IE00B0M63516','IE00B4M7GH52','IE00B52XQP83','IE00BJ5JPJ87','IE00B1FZS574','IE00B8KGV557','IE00B86MWN23','IE00B2QWDY88']) {
  const matches=Object.entries(catalog).filter(([key,r])=>r.isin===isin)
  assert(matches.length>0,isin)
  const [,record]=matches[0]
  assert.equal(record.holdingsStatus?.status,'validated',isin)
  assert.equal(record.holdingsStatus?.asOf,'2026-10-30',isin)
  const holdingsPath='src/pages/dca-profiles/holdings-'+holdingsManifest[isin]+'.json'
  const holdings=fromManifest(holdingsPath)[isin],weights=holdings.rows.map(r=>r.weightPct).sort((a,b)=>b-a)
  assert.equal(holdings.asOf,'2026-10-30');assert(weights.every(Number.isFinite))
  const independentlySummed={top5:weights.slice(0,5).reduce((a,b)=>a+b,0),top10:weights.slice(0,10).reduce((a,b)=>a+b,0),coverage:weights.reduce((a,b)=>a+b,0)}
  if(holdings.navReconciliation){assert.equal(holdings.navReconciliation.normalizationApplied,false);assert(Math.abs(independentlySummed.coverage-holdings.navReconciliation.selectedWeightPct)<1e-9)}
  await page.goto(base+'/le-dca-de',{waitUntil:'networkidle'})
  await page.getByRole('searchbox',{name:'Rechercher : Ajouter un actif',exact:true}).fill(isin)
  await page.getByRole('button',{name:new RegExp(isin)}).click()
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  const panel=page.getByRole('region',{name:'Analyse du portefeuille',exact:true})
  await panel.getByRole('heading',{name:'Ce que tu détiens vraiment',exact:true}).waitFor()
  await panel.getByText('Chargement de l’analyse des détentions…',{exact:true}).waitFor({state:'hidden'})
  await panel.getByText('Concentration et poids cumulés',{exact:true}).click()
  const concentration=await panel.locator('.dca-concentration').innerText()
  assert.doesNotMatch(concentration,/NaN|undefined/)
  for(const n of [independentlySummed.top5,independentlySummed.top10])assert(normalize(concentration).includes(normalize(pct(n))),isin+' independently summed concentration')
  const shots=[]
  for(const width of [1440,390]) {
   await page.setViewportSize({width,height:1000})
   const image=page.getByRole('img',{name:'Répartition et expositions du portefeuille',exact:true})
   await image.evaluate(img=>img.decode())
   const preview=Buffer.from(await image.evaluate(async img=>Array.from(new Uint8Array(await(await fetch(img.src)).arrayBuffer()))))
   const pending=page.waitForEvent('download')
   await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
   const file=out+'/'+isin+'-'+width+'.png'
   await(await pending).saveAs(file)
   const saved=await fs.readFile(file),sha=b=>createHash('sha256').update(b).digest('hex')
   assert.equal(sha(saved),sha(preview));assert(saved.length>10000)
   shots.push({width,pngBytes:saved.length,sha256:sha(saved)})
  }
  results.push({isin,catalogKeys:matches.map(([key])=>key),name:record.name,holdingsStatus:record.holdingsStatus,
   concentration,holdingsPath,holdingsBlob:manifest.files[holdingsPath],independentlySummed,navReconciliation:holdings.navReconciliation,holdingsQualification:record.holdings,shots})
  // Reset only this browser's draft. No source data or production write.
  await page.evaluate(()=>localStorage.removeItem('epargnant-publication:v1:simple-exposure-draft'))
  await page.setViewportSize({width:1440,height:1000})
 }
 const last=await get('/build-info.json');assert.deepEqual(last,first);assert.deepEqual(errors,[])
 await fs.writeFile(out+'/proof.json',JSON.stringify({checkedAt:new Date().toISOString(),buildInfo:first,
  manifestCatalogBlob:blob,results,errors,
  limit:'Actual public selection, analytics and identical preview/download PNGs; not a new independent certification of all source positions or unrelated exposures.'},null,2))
 console.log('11 exact funds: current published composition, public analytics, desktop/mobile and22identical PNG exports verified')
}finally{await browser.close()}
