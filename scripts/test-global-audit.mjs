import assert from 'node:assert/strict'
import { simulateCapital } from '../src/pages/fee-impact/lib.js'
import { project } from '../src/pages/wealth-simulator/lib.js'
import { firstGrapheme } from '../src/lib/first-grapheme.js'
import { historicalWindows } from '../src/lib/history-windows.js'
import { portfolioExposure } from '../src/lib/portfolio-exposure.js'
import { frenchLocation } from '../src/data/french-characteristics.js'
import { groupReviews } from '../src/pages/data-review/groups.js'
import { readableSignal } from '../src/pages/editorial-radar/presentation.js'
import { ETFS } from '../src/data/etf-cards.js'
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js'

const pocket = {id:'p',name:'Poche',envelope:'cto',initial:0,monthly:400,fee:.2,rateMode:'gross',rates:{central:7},tax:0,contributionGrowth:0}
for(const rate of [-50,0,7,20]) for(const fee of [0,.2,2]) {
  const result=project({pockets:[{...pocket,fee,rates:{central:rate}}],events:[]},{years:20,inflation:2,scenario:'central'})
  assert.ok(Math.abs(result.final.capital-simulateCapital(400,20,rate,fee))<1e-7)
}
const limited=project({pockets:[{...pocket,depositRoom:500}],events:[]},{years:1,inflation:0})
assert.equal(limited.final.cash,4300)
assert.equal(limited.final.paid,4800)
const taxed=project({pockets:[{...pocket,monthly:0,initial:1000,taxBasis:500,tax:30,fee:0,rates:{central:0}}],events:[]},{years:1,inflation:0})
assert.equal(taxed.final.tax,150)
assert.equal(firstGrapheme('🇫🇷 France'),'🇫🇷');assert.equal(firstGrapheme('👩‍💻 Tech'),'👩‍💻')
assert.equal(frenchLocation('Ireland, Physical'),'Irlande · Réplication physique')
for(const etf of ETFS)assert.equal(getPresentationCopy(etf).name,etf.name,'Le nom du produit ne doit pas être traduit')
const points=Array.from({length:61},(_,i)=>({date:`${2020+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,price:100*1.01**i}))
const history=historicalWindows(points,3);assert.equal(history.count,25);assert.equal(history.worstDrawdown.drawdown,0)
assert.ok(Math.abs(history.min.annualized-(1.01**12-1)*100)<1e-8)
assert.equal(historicalWindows(points.filter((_,i)=>i%12===0),3),null)
const observation={asOf:'2026-09-30',basis:'fund',sourceUrl:'https://example.com',rows:[{name:'United States',weightPct:80},{name:'Japan',weightPct:20}]}
const records={a:{countries:observation},b:{countries:{...observation,asOf:'2026-08-31'}}}
const lines=[{isin:'a',pct:70},{isin:'b',pct:30}]
let groups=portfolioExposure(lines,records,'countries');assert.equal(groups.length,2);assert.equal(groups[0].coverage,70);assert.equal(groups[0].rows[0].weight,56)
records.b.countries={...observation,basis:'index'};assert.equal(portfolioExposure(lines,records,'countries').length,2)
records.b.countries={...observation,rows:[{name:'A',weightPct:101}]};assert.equal(portfolioExposure(lines,records,'countries').length,1)
assert.equal(portfolioExposure([{isin:'a',pct:101}],records,'countries').length,0)
const issue={name:'Contrat',category:'reserve',urls:['https://example.com'],tools:['Fiches'],id:'1'}
assert.equal(groupReviews([issue,{...issue,id:'2'}]).length,1)
assert.equal(groupReviews([issue,{...issue,name:'Autre contrat'}]).length,2)
assert.match(readableSignal({title:'ETF : poids du pays netherlands en mouvement',beforeText:'5 %',afterText:'8 %'}).title,/Pays-Bas/)
console.log('Audit global : cohérence inter-outils, capacité saisie, base fiscale, fenêtres mensuelles, périmètres distincts, noms ETF préservés et regroupements validés.')

if (process.argv.includes('--browser')) {
 const {chromium}=await import('playwright'), {spawn}=await import('node:child_process')
 const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4401'],{stdio:'ignore'})
 const base='http://127.0.0.1:4401/shinny-potato'
 let browser
 try {
  for(let i=0;i<150;i++){try{if((await fetch(base+'/')).ok)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})})
  const page=await browser.newPage({viewport:{width:1280,height:900}}), errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(base+'/generateur-portefeuilles',{waitUntil:'networkidle'})
  await page.getByText('Expositions pays et secteurs · Portefeuille',{exact:true}).click()
  await page.locator('.portfolio-exposure section').first().waitFor()
  assert.match(await page.locator('.portfolio-exposure').innerText(),/photographie|composition qualifiée/)
  await page.goto(base+'/duels-portefeuilles',{waitUntil:'networkidle'})
  await page.getByText('Expositions pays et secteurs · A',{exact:true}).click()
  await page.locator('.portfolio-exposure').first().locator('section').first().waitFor()
  assert.match(await page.locator('.portfolio-exposure').first().innerText(),/Couverture|composition qualifiée/)
  await page.goto(base+'/calculateur-investissement',{waitUntil:'networkidle'})
  await page.getByText('Ce que change la date de départ',{exact:true}).click()
  await page.locator('.portfolio-exposure').getByText(/^\d+ fenêtres disponibles|^Historique mensuel continu insuffisant/).waitFor()
  assert.match(await page.locator('.portfolio-exposure').innerText(),/fenêtres|insuffisant/)
  await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle'})
  await page.getByLabel('Vérifications regroupées par source').locator(':scope > summary').click()
  assert.ok(await page.getByLabel('Vérifications regroupées par source').locator('details').count()>0)
  await page.goto(base+'/portefeuilles-investisseurs',{waitUntil:'networkidle'})
  assert.equal(await page.getByText('Évolution des photographies 13F archivées',{exact:true}).count(),1)
  await page.getByText('Évolution des photographies 13F archivées',{exact:true}).click()
  assert.match(await page.locator('.portfolio-exposure').first().innerText(),/photographie|total déclaré/)
  for(const route of ['/fiches-etf','/fiches-pratiques?fiche=etf-volatility','/simulateur-patrimoine','/impact-frais','/performance-depuis']) {
   await page.goto(base+route,{waitUntil:'networkidle'});await page.locator('h1').waitFor()
   if(route==='/performance-depuis') {
    await page.getByText('Ce que change la date de départ',{exact:true}).click()
    await page.locator('.portfolio-exposure').getByText(/^\d+ fenêtres disponibles, recalculées/).waitFor()
    assert.match(await page.locator('.portfolio-exposure').innerText(),/fenêtres disponibles/)
   }
   await page.setViewportSize({width:390,height:844})
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route)
   await page.setViewportSize({width:1280,height:900})
  }
  assert.deepEqual(errors,[])
  console.log('Audit global Chromium : expositions des deux outils, fenêtres historiques, sources regroupées, archives 13F et cinq pages mobiles validés.')
 } finally {await browser?.close();server.kill()}
}

// Never combine incompatible or undeclared taxonomies, or call partial rows complete.
const {comparePortfolioExposure}=await import('../src/lib/portfolio-exposure.js')
const sector={...observation,method:'Published Sector weights, percent of net assets, no renormalisation'}
const subindustry={...sector,method:'Published SubIndustry weights, percent of net assets, no renormalisation'}
const taxonomies={a:{sectors:sector},b:{sectors:subindustry}}
assert.equal(portfolioExposure(lines,taxonomies,'sectors').length,2)
assert.deepEqual(comparePortfolioExposure([{isin:'a',pct:100}],[{isin:'b',pct:100}],taxonomies,'sectors'),[])
taxonomies.b.sectors={...sector}
assert.equal(portfolioExposure(lines,taxonomies,'sectors').length,1)
assert.equal(comparePortfolioExposure([{isin:'a',pct:100}],[{isin:'b',pct:100}],taxonomies,'sectors').length,1)
taxonomies.a.sectors={...sector,rows:[{name:'Technology',weightPct:40}]}
const partialExposure=portfolioExposure([{isin:'a',pct:100}],taxonomies,'sectors')[0]
assert.equal(partialExposure.coverage,100)
assert.equal(partialExposure.detailedCoverage,40)
assert.equal(partialExposure.complete,false)
assert.deepEqual(comparePortfolioExposure([{isin:'a',pct:100}],[{isin:'a',pct:100}],taxonomies,'sectors'),[])
assert.equal(portfolioExposure(lines,{a:{countries:observation},b:{countries:observation}},'countries').length,2)
