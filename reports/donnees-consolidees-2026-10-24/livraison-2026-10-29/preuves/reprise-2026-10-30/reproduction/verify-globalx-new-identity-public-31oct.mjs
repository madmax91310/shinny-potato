import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {readFile as readBytes} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {references,pct} from '../src/pages/dca-profiles/engine.js'
import {holdingsReconciliationDetails,rejectedPerimeterDetails,accountingWeight} from '../src/data/holdings-reconciliation.js'
import {portfolioAnalytics,selectConcentrationGroup} from '../src/pages/dca-profiles/analytics.js'
const base='https://madmax91310.github.io/shinny-potato/',out='/dev/shm/data-automation-20261028/proofs-29oct/globalx-silver-new-identity-public-31oct',results=[]
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const holdings=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
const catalog=JSON.parse(readFileSync('src/pages/dca-profiles/catalog.json'))
const normalize=s=>String(s).replace(/[\u00a0\u202f]/g,' ')
const hash=b=>createHash('sha256').update(b).digest('hex')
let browser
try{
 browser=await chromium.launch({headless:true,proxy:{server:process.env.HTTPS_PROXY},...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {})})
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await context.addInitScript(()=>{window.__painted=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...a){window.__painted.push(String(t));return fill.call(this,t,...a)}})
 await page.goto(base)
 mkdirSync(out,{recursive:true})
 for(const [id,allocation] of [['silver-new-identity',[['IE000UL6CLP7',50],['world',50]]]]){
  const lines=allocation.map(([asset,weight])=>({asset,isin:references[asset].isin,label:references[asset].name,weight,amount:0}))
  const expected=portfolioAnalytics(lines,references,holdings),group=selectConcentrationGroup(expected.groups)
  const position=group.rows.find(row=>row.isin==='CA38141A6025');assert(position)
  assert(Math.abs(position.weight-.323*.5)<1e-12,'Native issuer weight0.323% times50% allocation, without renormalisation')
  const reversed=selectConcentrationGroup(portfolioAnalytics([...lines].reverse(),references,holdings).groups)
  assert(Math.abs(reversed.rows.find(row=>row.isin==='CA38141A6025').weight-position.weight)<1e-12,'Order cannot change the newly identified company contribution')
  for(const line of lines)if(holdings[line.asset]?.approximation)assert.equal(catalog[line.asset]?.holdings?.complete,false,'A benchmark-only physical reference cannot be labelled a complete fund composition in the catalogue')
  await page.evaluate(lines=>localStorage.setItem('epargnant-publication:v1:simple-exposure-draft',JSON.stringify({lines,field:'overlap',exposureLimit:4})),lines)
  await page.goto(base+'le-dca-de')
  await page.getByText('Voir l’analyse détaillée',{exact:true}).filter({visible:true}).click()
  const panel=page.getByRole('region',{name:'Analyse du portefeuille',exact:true})
  await panel.getByRole('heading',{name:'Ce que tu détiens vraiment',exact:true}).waitFor()
  await panel.getByText('Chargement de l’analyse des détentions…',{exact:true}).waitFor({state:'hidden'})
  await panel.getByText('Concentration et poids cumulés',{exact:true}).click()
  if(group){
   const ui=normalize(await panel.locator('.dca-concentration').innerText())
   for(const value of [pct(group.top5),pct(group.top10),pct(group.coverage)])assert(ui.includes(normalize(value)),id+': '+value)
  }else{
   await panel.getByText('Aucune composition compatible disponible pour ce périmètre.',{exact:false}).waitFor()
   assert.equal(await panel.locator('.dca-concentration').count(),0,'No stale concentration when all data is unavailable or inapplicable')
  }
  await panel.locator('summary').filter({hasText:'Recouvrement entre les supports'}).click()
  assert.equal(await panel.locator('.dca-pair-grid article').count(),expected.pairs.length)
  const pairs=await panel.locator('.dca-pair-grid article strong').allTextContents()
  assert.deepEqual(pairs.map(normalize),expected.pairs.map(p=>normalize(p.full?pct(p.overlap):'Partiel')))
  const accounting=lines.map(line=>({line,proof:holdingsReconciliationDetails(holdings[line.asset])})).filter(x=>x.proof)
  const rejected=lines.map(line=>({line,proof:rejectedPerimeterDetails(catalog[line.asset]?.holdingsStatus,line.isin)})).filter(x=>x.proof)
  if(accounting.length||rejected.length||expected.qualification.some(q=>!q.complete)||expected.incompatiblePairs.length){
   await panel.locator('summary').filter({hasText:'Sources, couverture du catalogue et détail des comparaisons'}).click()
   const source=page.getByRole('region',{name:'Vérification des expositions',exact:true})
   await source.locator('summary').filter({hasText:'Positions retenues et solde hors périmètre'}).click()
   for(const {line,proof}of accounting){
    const item=source.getByRole('article',{name:`Rapprochement comptable ${line.label}`,exact:true})
    await item.waitFor()
    const text=normalize(await item.innerText())
    for(const value of [accountingWeight(proof.selectedWeightPct),accountingWeight(proof.publishedNetWeightPct),...proof.unidentifiedPositions.map(r=>r.name)])assert(text.includes(normalize(value)),id+' accounting '+value)
   }
   for(const {proof}of rejected){
    const text=normalize(await source.innerText())
    for(const value of [proof.asOf,accountingWeight(proof.navReconciliation.selectedWeightPct),accountingWeight(proof.navReconciliation.publishedNetWeightPct)])assert(text.includes(normalize(value)),id+' rejected perimeter '+value)
   }
   await source.getByText('Positions communes entre ETF et actions',{exact:true}).click()
   await source.getByText('Pourquoi certaines comparaisons restent partielles ou impossibles',{exact:true}).click()
   const reasons=normalize(await source.innerText())
   for(const q of expected.qualification.filter(q=>!q.complete))for(const reason of q.reasons)assert(reasons.includes(normalize(reason)),id+' qualification '+reason)
   for(const pair of expected.incompatiblePairs.slice(0,20))for(const reason of pair.reasons)assert(reasons.includes(normalize(reason)),id+' scope '+reason)
  }
  const image=page.getByRole('img',{name:'Répartition et expositions du portefeuille',exact:true})
  await image.waitFor();await image.evaluate(img=>img.decode())
  const painted=(await page.evaluate(()=>window.__painted)).map(normalize)
  for(const text of [pct(group?.coverage||0),pct(group?.top5||0),pct(group?.top10||0),`${group?.identified||0} titres identifiés`,...(!group?['Aucune liste compatible']:[])])assert(painted.includes(normalize(text)),id+' canvas '+text)
  assert(!painted.some(t=>/fictif|polémique|risqué|profil pédagogique|CFD/.test(t)))
  const preview=Buffer.from(await image.evaluate(async img=>Array.from(new Uint8Array(await(await fetch(img.src)).arrayBuffer()))))
  const downloading=page.waitForEvent('download')
  await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click()
  const downloaded=await downloading,file=`${out}/${id}.png`
  await downloaded.saveAs(file)
  assert.equal(hash(await readBytes(file)),hash(preview),'Downloaded PNG is exactly the preview')
  results.push({id,allocation,newIdentity:{isin:position.isin,name:position.name,sourceWeightPct:.323,portfolioWeightPct:position.weight,asOf:'2026-10-30',sourceRun:41151066938,sourceRecord:'62fbee7ac293d7558b1d84bc62582f1e99fdaf91',orderInvariant:true},qualifications:expected.qualification,pairs:expected.pairs,png:{bytes:preview.length,sha256:hash(preview)},version:await page.evaluate(()=>fetch('/shinny-potato/build-info.json',{cache:'no-store'}).then(r=>r.json()))})
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000})
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' responsive')
   await panel.screenshot({path:`${out}/${id}-${width}.png`})
   if(width===390){
    const mobilePreview=Buffer.from(await image.evaluate(async img=>Array.from(new Uint8Array(await(await fetch(img.src)).arrayBuffer()))))
    const mobileDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le PNG',exact:true}).click();const d=await mobileDownload;const bytes=await readBytes(await d.path());assert.equal(hash(bytes),hash(mobilePreview));await d.saveAs(`${out}/${id}-mobile-export.png`);await d.delete();results.at(-1).mobilePNG={bytes:bytes.length,sha256:hash(bytes)}
   }
  }
 }
 assert.deepEqual(errors,[])
 writeFileSync(out+'/results.json',JSON.stringify({checkedAt:new Date().toISOString(),results,errors},null,2));console.log('GlobalX Silver current complete portfolio: newCA38141A6025 preserved0.323%→0.1615%, order invariant; actualpublic concentration/coverage/overlap/canvas/2PNG match source snapshot.')
}finally{await browser?.close();}
