import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {readFileSync,mkdirSync} from 'node:fs'
import {readFile as readBytes} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {references,pct} from '../src/pages/dca-profiles/engine.js'
import {holdingsReconciliationDetails,rejectedPerimeterDetails,accountingWeight} from '../src/data/holdings-reconciliation.js'
import {portfolioAnalytics,selectConcentrationGroup} from '../src/pages/dca-profiles/analytics.js'
const port=4374,base=`http://127.0.0.1:${port}/shinny-potato/`
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'})
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const holdings=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
const catalog=JSON.parse(readFileSync('src/pages/dca-profiles/catalog.json'))
const normalize=s=>String(s).replace(/[\u00a0\u202f]/g,' ')
const hash=b=>createHash('sha256').update(b).digest('hex')
let browser
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}: {})})
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await context.addInitScript(()=>{window.__painted=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...a){window.__painted.push(String(t));return fill.call(this,t,...a)}})
 await page.goto(base)
 mkdirSync('test-artifacts/dca-compositions',{recursive:true})
 for(const [id,allocation] of [
  ['panx-profile',[['FR0013412269',53],['FR0011550185',33],['LU1681043599',7],['FR0011871110',1.5],['FR0013412012',2],['FR0013412020',1.5],['lvmh',1.5],['bnp',0.5]]],
  ['core',[['world',45],['sp500',35],['nasdaq',20]]],
  ['residual-identities',[['acwi',50],['small',50]]],
  ['nav-residual',[['emerging',60],['infrastructure',40]]],
  ['hedged-unsupported',[['IE00B441G979',60],['world',40]]],
  ['cloud',[['cloud',50],['sp500',50]]],
  ['new-issuer-portfolios',[['IE00BZ56SW52',50],['IE00BKLF1R75',50]]],
  ['retained-globalx-and-jpm',[['IE000NDWFGA5',50],['IE0003UVYC20',50]]],
  ['neutral',[['world',60],['gold',20],['btc',10],['IE0008UEVOE0',10]]],
  ['fund-and-index',[['world',60],['FR0013411980',40]]],
  ['native-index-pair',[['FR0013411980',50],['FR0013411998',50]]],
  ['europe-pea-partial',[['europe',40],['FR0011869304',30],['FR0011871110',30]]],
  ['europe-only-no-identifiers',[['europe',100]]],
  ['outside-equity-only',[['gold',50],['btc',50]]],
 ]){
  const lines=allocation.map(([asset,weight])=>({asset,isin:references[asset].isin,label:references[asset].name,weight,amount:0}))
  const expected=portfolioAnalytics(lines,references,holdings),group=selectConcentrationGroup(expected.groups)
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
  const downloaded=await downloading,file=`test-artifacts/dca-compositions/${id}.png`
  await downloaded.saveAs(file)
  assert.equal(hash(await readBytes(file)),hash(preview),'Downloaded PNG is exactly the preview')
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000})
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' responsive')
   await panel.screenshot({path:`test-artifacts/dca-compositions/${id}-${width}.png`})
  }
 }
 assert.deepEqual(errors,[])
 console.log('Built site: 14 complete/partial/unidentified/inapplicable/native-index/mixed/reconciled/retained portfolios, identical analysis/canvas/download, desktop and mobile verified.')
}finally{await browser?.close();server.kill()}
