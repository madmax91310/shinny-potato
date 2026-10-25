import {COVERAGE_SOURCES} from './lib/radar-coverage.mjs'
import {CONSUMER_SOURCES,parseConsumer} from './lib/radar-consumer.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { EXTRA_SOURCES } from './lib/radar-extra-sources.mjs'
import { parsePublication, PUBLICATION_SOURCES } from './lib/radar-publications.mjs'
import { mkdir, readFile } from 'node:fs/promises'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { parsePurchasingFeed, PURCHASING_SOURCES } from './lib/purchasing-power-news.mjs'
import { RADAR_URL } from '../src/pages/editorial-radar/client.js'
const now=new Date(), day=now.toISOString().slice(0,10)
const row={family:'etf',entity:'FR001400U5Q4',label:'Amundi PEA Monde',field:'ter',fieldLabel:'Frais annuels',value:.2,sourceUrl:'https://www.amundietf.fr/product',scope:'Part FR001400U5Q4',period:day,checkedAt:day,unit:'% / an',tool:'/fiches-etf',priority:'high'}
const initial=advanceRadar(null,[row],{now})
let feed=advanceRadar(initial.state,[{...row,value:.15}],{now}).feed
const url='http://127.0.0.1:4327/shinny-potato/'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4327','--strictPort'],{stdio:'ignore'})
let browser
await mkdir('test-artifacts/radar',{recursive:true})
try{
 for(let i=0;i<450;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({...process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{},args:['--no-sandbox']})
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 let failure=false
 await context.route(RADAR_URL,route=>route.fulfill(failure?{status:503,body:'Unavailable'}:{contentType:'application/json',body:JSON.stringify(feed)}))
 await page.goto(url)
 await page.getByRole('link',{name:/Radar éditorial/}).first().click()
 await page.getByRole('heading',{name:'Radar éditorial',exact:true}).waitFor()
 await page.getByRole('heading',{name:/frais annuels, 0,2.*0,15/i}).waitFor()
 assert.equal(await page.locator('.radar-card').count(),1)
 assert.ok(await page.getByLabel('1 signaux non lus').count()>0)
 await page.screenshot({path:'test-artifacts/radar/desktop.png',fullPage:true})
 await page.locator('.radar-draft summary').click()
 const draft=page.getByRole('textbox',{name:/Brouillon/})
 assert.match(await draft.inputValue(),/0,2.*0,15/)
 await draft.fill('Mon texte personnalisé')
 await page.getByRole('button',{name:'Copier le brouillon',exact:true}).click()
 await page.getByText('Brouillon copié.',{exact:true}).waitFor()
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'Mon texte personnalisé')
 await page.getByRole('button',{name:'Rétablir le texte',exact:true}).click()
 assert.match(await draft.inputValue(),/0,2.*0,15/)
 await page.locator('.radar-filter-panel > summary').click()
 await page.getByRole('button',{name:'Courtiers',exact:true}).click()
 await page.getByRole('heading',{name:'Aucun signal pour cette sélection',exact:true}).waitFor()
 await page.getByRole('button',{name:'Tout',exact:true}).click()
 await page.getByRole('button',{name:'Marquer comme lu',exact:true}).click()
 await page.getByRole('button',{name:'Non lus',exact:true}).click()
 await page.getByRole('heading',{name:'Aucun signal pour cette sélection',exact:true}).waitFor()
 await page.reload()
 await page.getByRole('button',{name:'Lu',exact:true}).waitFor()
 failure=true
 await page.getByRole('button',{name:'Actualiser',exact:true}).click()
 await page.getByRole('alert').waitFor()
 assert.equal(await page.locator('.radar-card').count(),1,'Derniers signaux conservés après échec')
 failure=false;feed={...feed,checkedAt:new Date(now-48*3600000).toISOString()}
 await page.getByRole('button',{name:'Actualiser',exact:true}).click()
 await page.getByText(/plus de 36 heures/).waitFor()
 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});await mobile.goto(url+'radar-editorial')
 await mobile.getByRole('heading',{name:/frais annuels, 0,2.*0,15/i}).waitFor()
 await mobile.screenshot({path:'test-artifacts/radar/mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Pas de débordement mobile')
 assert.deepEqual(errors,[])
 // A noisy feed opens on five actionable groups; each other state stays accessible.
 const base = feed.events[0]
 const stamp = now.toISOString()
 feed = {...feed, checkedAt:stamp, events:[
   ...Array.from({length:7},(_,i)=>({...base,id:`fee-${i}`,entity:`fund-${i}`,label:`ETF test ${i}`,title:`ETF test ${i}`,detectedAt:stamp})),
   {...base,id:'related',entity:'fund-0',field:'pea',fieldLabel:'Éligibilité au PEA',before:false,after:true,beforeText:'Non',afterText:'Oui',detectedAt:stamp},
   {...base,id:'composition',field:'countries:United States',fieldLabel:'Poids des États-Unis',before:60,after:63,beforeText:'60 %',afterText:'63 %',detectedAt:stamp},
   {...base,id:'launch',entity:'issuer-launch',field:'announcement',kind:'new',label:'Vanguard will launch a UCITS ETF',title:'Lancement annoncé',detectedAt:stamp},
   {...base,id:'old-fee',entity:'old-fund',detectedAt:new Date(now-20*86400000).toISOString()},
 ]}
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('heading',{name:'ETF test 0 : 2 changements regroupés',exact:true}).waitFor()
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),2)
 await mobile.getByRole('button',{name:'Marquer le sujet comme lu',exact:true}).click()
 await mobile.getByRole('button',{name:'Autres sujets exploitables',exact:true}).click()
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),5)
 await mobile.getByRole('button',{name:'À suivre',exact:true}).click()
 await mobile.getByRole('heading',{name:/Lancement annoncé : Vanguard/}).waitFor()
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),1)
 await mobile.getByRole('button',{name:'Variations secondaires',exact:true}).click()
 await mobile.getByRole('heading',{name:/poids des États-Unis/i}).waitFor()
 await mobile.getByRole('button',{name:'Historique complet',exact:true}).click()
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),10)
 await mobile.getByRole('button',{name:'Prioritaires',exact:true}).click()
 await mobile.screenshot({path:'test-artifacts/radar/selection-mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Grouped mobile feed has no overflow')
 // Exercise both legacy feed corrections and a real later reporting period.
 const filing={...base,id:'filing-revision',family:'investisseurs',entity:'investor-test',label:'Investisseur test',field:'filing',fieldLabel:'Positions et mouvements déclarés',kind:'publication',beforePeriod:'2026-06-30',period:'2026-06-30',before:{positions:[{ticker:'ABC',changePct:null,isNew:false}]},after:{positions:[{ticker:'ABC',changePct:null,isNew:false},{ticker:'XYZ',changePct:null,isNew:true}]},beforeText:'1 position suivie',afterText:'2 positions suivies',scope:'Déclaration 13F · hors options · publication différée',sourceUrl:'https://www.sec.gov/Archives/test',tool:'/portefeuilles-investisseurs',detectedAt:stamp}
 feed={...feed,events:[filing,{...filing,id:'filing-new-quarter',beforePeriod:'2026-06-30',period:'2026-09-30'}]}
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('button',{name:'Autres sujets exploitables',exact:true}).click()
 await mobile.getByRole('heading',{name:/Investisseur test : Positions et mouvements déclarés · 2026-09-30/}).waitFor()
 assert.equal(await mobile.locator('.radar-card').count(),1,'Only the later quarter is actionable')
 await mobile.getByRole('button',{name:'Variations secondaires',exact:true}).click()
 await mobile.getByRole('heading',{name:/Investisseur test : relevé révisé pour la même période/}).waitFor()
 await mobile.getByText(/cette mise à jour ne prouve pas une nouvelle opération/).waitFor()
 assert.equal(await mobile.locator('.radar-draft').count(),0,'A correction is not offered as a publication')
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Revision mobile has no overflow')
 await mobile.screenshot({path:'test-artifacts/radar/filing-revision-mobile.png',fullPage:true})
 await page.reload()
 await page.getByRole('button',{name:'Autres sujets exploitables',exact:true}).click()
 await page.getByRole('heading',{name:/Investisseur test : Positions et mouvements déclarés · 2026-09-30/}).waitFor()
 await page.getByRole('button',{name:'Variations secondaires',exact:true}).click()
 await page.getByRole('heading',{name:/Investisseur test : relevé révisé pour la même période/}).waitFor()
 assert.equal(await page.locator('.radar-draft').count(),0)
 await page.screenshot({path:'test-artifacts/radar/filing-revision-desktop.png',fullPage:true})
 await mobile.getByRole('button',{name:'Prioritaires',exact:true}).click()
 feed=initial.feed
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('heading',{name:'Le radar est en veille',exact:true}).waitFor()
 // Real official publication excerpts, grouped facts and no unrelated tool routing.
 const scenarioNow=new Date('2026-10-24T15:00:00Z')
 const salaries=JSON.parse(await readFile('scripts/fixtures/radar-publications/salary-observations.json','utf8'))
 const salaryStart=advanceRadar(null,salaries.map(row=>({...row,value:row.entity==='salary-median'?2190:4334,period:'2024',publishedAt:'2025-10-23',publicationId:'https://www.insee.fr/fr/statistiques/8657156',sourceUrl:'https://www.insee.fr/fr/statistiques/8657156'})),{now:scenarioNow})
 const amundiSource=PUBLICATION_SOURCES.find(s=>s.id==='amundi')
 const amundi=parsePublication(await readFile('scripts/fixtures/radar-publications/amundi.html','utf8'),amundiSource,'https://www.amundietf.fr/fr/professionnels/a-propos/news/investors-notice/amundi-renforce-sa-gamme-d-etf-thematiques-lies-a-l-ia',scenarioNow)
 feed=advanceRadar(salaryStart.state,[...salaries,amundi],{now:scenarioNow}).feed
 feed.checkedAt=stamp;feed.events=feed.events.map(event=>({...event,detectedAt:stamp}))
 feed.sources=[{...amundiSource,status:'ok',lastSuccessAt:stamp,queue:{pending:2,error:0,rejected:0}},{id:'dares',name:'DARES',url:'https://dares.travail-emploi.gouv.fr/',status:'error',error:'Vérification de sécurité',queue:{pending:0,error:0,rejected:0}}]
 await mobile.getByRole('button',{name:'Prioritaires',exact:true}).click()
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('heading',{name:/Salaire médian du privé :/}).waitFor()
 await mobile.locator('.radar-filter-panel > summary').click()
 await mobile.getByRole('searchbox').fill('salaire médian')
 assert.equal(await mobile.locator('.radar-page > .radar-list > .radar-card').count(),1)
 await mobile.getByRole('searchbox').fill('sujet introuvable')
 await mobile.getByRole('heading',{name:'Aucun signal pour cette sélection',exact:true}).waitFor()
 await mobile.getByRole('searchbox').fill('')
 await mobile.locator('.radar-filter-panel > summary').click()
 await mobile.locator('.radar-related > summary').first().click()
 await mobile.getByText(/Publication :/).first().waitFor()
 assert.ok(await mobile.getByText(/équivalent temps plein/).count()>0)
 await mobile.getByRole('button',{name:'Autres sujets exploitables',exact:true}).click()
 await mobile.getByRole('heading',{name:/Nouvelle offre annoncée par l’émetteur/}).waitFor()
 assert.equal(await mobile.locator('.radar-products > details').count(),3)
 await mobile.locator('.radar-products > details > summary').first().click()
 assert.ok(await mobile.getByText('Non documenté',{exact:true}).count()>0)
 assert.equal(await mobile.getByRole('link',{name:'Ouvrir l’outil',exact:true}).count(),0)
 await mobile.getByText('Sources de publications et file de traitement',{exact:true}).click()
 await mobile.getByText(/Vérification de sécurité/).waitFor()
 await mobile.screenshot({path:'test-artifacts/radar/amundi-mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
 await page.reload()
 await page.getByRole('heading',{name:/Salaire médian du privé :/}).waitFor()
 await page.screenshot({path:'test-artifacts/radar/insee-desktop.png',fullPage:true})
 // Housing conventions and an explicitly hypothetical mortgage scenario on mobile/desktop.
 const housingSource=EXTRA_SOURCES.find(s=>s.id==='credit-logement')
 const housing=parsePublication(await readFile('scripts/fixtures/radar-extensions/credit-logement.html','utf8'),housingSource,'https://lobservatoire.creditlogement.fr/publications/analyse-marche-immobilier-septembre-2026',scenarioNow)
 feed=advanceRadar(salaryStart.state,[housing],{now:scenarioNow}).feed
 feed.checkedAt=stamp;feed.events=feed.events.map(event=>({...event,detectedAt:stamp}))
 await mobile.getByRole('button',{name:'Prioritaires',exact:true}).click()
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('button',{name:housing.publishedAt?'Prioritaires':'À suivre',exact:true}).click()
 await mobile.getByRole('heading',{name:'Analyse marché immobilier septembre 2026',exact:true}).waitFor()
 await mobile.getByText('Conventions immobilières et scénario',{exact:true}).click()
 await mobile.getByText('Explorer un scénario théorique de budget immobilier',{exact:true}).click()
 await mobile.getByLabel('Taux nominal hypothétique (%)',{exact:true}).fill('3')
 await mobile.getByText(/de capital théorique/).waitFor()
 await mobile.getByText(/ne représente pas un taux de marché collecté/).waitFor()
 await mobile.screenshot({path:'test-artifacts/radar/housing-mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
 await page.reload()
 await page.getByRole('button',{name:housing.publishedAt?'Prioritaires':'À suivre',exact:true}).click()
 await page.getByRole('heading',{name:'Analyse marché immobilier septembre 2026',exact:true}).waitFor()
 await page.getByText('Conventions immobilières et scénario',{exact:true}).click()
 await page.getByText('Explorer un scénario théorique de budget immobilier',{exact:true}).click()
 await page.getByLabel('Taux nominal hypothétique (%)',{exact:true}).fill('3')
 await page.getByText(/de capital théorique/).waitFor()
 feed=initial.feed
 await mobile.getByRole('button',{name:'Prioritaires',exact:true}).click()
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 // New category remains useful on the silent first run and after source errors.
 const official = parsePurchasingFeed(`<rss><channel><item><title>PTZ : nouveau plafond applicable</title><description>Le plafond applicable est de 100 000 euros pour certains foyers.</description><link>https://www.service-public.gouv.fr/particuliers/actualites/A12345</link><pubDate>${day}</pubDate></item></channel></rss>`,PURCHASING_SOURCES[0],now).observations
 feed=advanceRadar(initial.state,official,{now,purchasingSources:[{id:'service-public',name:'Service Public',url:PURCHASING_SOURCES[0].url,checkedAt:now.toISOString(),status:'ok',articles:1,relevant:1}]}).feed
 await mobile.getByRole('button',{name:'Actualiser',exact:true}).click()
 await mobile.getByRole('button',{name:'Historique complet',exact:true}).click()
 await mobile.locator('.radar-filter-panel > summary').click()
 await mobile.getByRole('button',{name:'Pouvoir d’achat',exact:true}).click()
 await mobile.getByRole('heading',{name:'Les informations récupérées',exact:true}).waitFor()
 await mobile.getByRole('heading',{name:'PTZ : nouveau plafond applicable',exact:true}).waitFor()
 await mobile.getByText('Application indiquée',{exact:true}).waitFor()
 await mobile.getByRole('button',{name:'Électricité et gaz',exact:true}).click()
 await mobile.getByText('Aucune information pour ce thème et cette recherche.',{exact:true}).waitFor()
 await mobile.getByRole('button',{name:'Crédit immobilier et PTZ',exact:true}).click()
 await mobile.getByRole('heading',{name:'PTZ : nouveau plafond applicable',exact:true}).waitFor()
 await mobile.screenshot({path:'test-artifacts/radar/purchasing-power-mobile.png',fullPage:true})
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Veille mobile sans débordement')
 assert.deepEqual(errors,[])
 // Actual bounded source excerpts for the new consumer scope. No live sending.
 const consumerManifest=JSON.parse(await readFile('scripts/fixtures/radar-consumer/manifest.json','utf8'))
 const consumerRows=[]
 for(const example of consumerManifest){
  const listing=JSON.parse(await readFile(`scripts/fixtures/radar-consumer/${example.case}-listing.json`,'utf8'))
  const source=CONSUMER_SOURCES.find(row=>row.id===example.source)
  const doc=await readFile(`scripts/fixtures/radar-consumer/${example.case}.html`,'utf8')
  consumerRows.push(parseConsumer(doc,source,example.url,scenarioNow,listing.rows.find(row=>row.url===example.url)))
 }
 const consumerSeed=advanceRadar(null,official,{now:scenarioNow})
 feed=advanceRadar(consumerSeed.state,consumerRows,{now:scenarioNow}).feed
 feed.checkedAt=stamp;feed.events=feed.events.map(event=>({...event,detectedAt:stamp}))
 const energyEvent=feed.events.find(event=>event.topic==='energie')
 feed.events.push({...energyEvent,id:'excluded-history',label:'Fiscalité : changement de barème',title:'Fiscalité : changement de barème'})
 await page.reload()
 await page.getByRole('heading',{name:/Heures creuses : de nouveaux horaires/}).waitFor()
 assert.equal(await page.getByRole('heading',{name:/Fiscalité :/}).count(),0,'Excluded legacy feed cannot leak through UI')
 await page.getByText('Calendrier des dates annoncées',{exact:true}).click()
 await page.getByText(/Entrée en vigueur annoncée/).waitFor()
 await page.locator('.radar-score > summary').first().click()
 await page.getByText(/Ce score ne prédit pas les vues/).first().waitFor()
 await page.locator('.radar-filter-panel > summary').click()
 await page.getByRole('button',{name:'Épargne et placements',exact:true}).click()
 await page.getByRole('heading',{name:/Prêt de titres : Bourse Direct/}).waitFor()
 await page.getByRole('button',{name:'Tous les thèmes',exact:true}).click()
 await page.getByRole('searchbox').fill('heures creuses')
 await page.getByRole('heading',{name:/Heures creuses :/}).waitFor()
 assert.ok(await page.getByText('Source officielle',{exact:false}).count()>0)
 await page.getByRole('searchbox').fill('')
 await page.screenshot({path:'test-artifacts/radar/consumer-desktop.png',fullPage:true})
 await mobile.goto(url+`radar-editorial?subject=${energyEvent.id}`)
 await mobile.locator(`#subject-${energyEvent.id}`).waitFor()
 await mobile.getByText('Application annoncée : 2026-11-01',{exact:true}).waitFor()
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Consumer mobile has no overflow')
 await mobile.screenshot({path:'test-artifacts/radar/consumer-mobile.png',fullPage:true})
 assert.deepEqual(errors,[])
 // Newly connected real source excerpts: current UI, historical true dates.
 const coverageManifest=JSON.parse(await readFile('scripts/fixtures/radar-coverage/manifest.json','utf8'))
 const coverageRows=[]
 for(const example of coverageManifest){
  const source=COVERAGE_SOURCES.find(s=>s.id===example.source)
  coverageRows.push(parsePublication(await readFile(`scripts/fixtures/radar-coverage/${source.id}.txt`,'utf8'),source,example.listing.url,new Date('2026-10-25T12:00:00Z'),example.listing))
 }
 const coverageSeed=advanceRadar(null,[...official,consumerRows[0]],{now:new Date('2026-10-25T12:00:00Z')})
 feed=advanceRadar(coverageSeed.state,coverageRows,{now:new Date('2026-10-25T12:00:00Z')}).feed
 feed.checkedAt=stamp
 for(const device of [page,mobile]){
  await device.goto(url+'radar-editorial')
  await device.getByRole('button',{name:'Historique complet',exact:true}).click()
  await device.locator('.radar-filter-panel > summary').click()
  await device.getByRole('searchbox').fill('Matrimoine')
  await device.getByRole('heading',{name:/SG lance le programme Matrimoine/}).first().waitFor()
  await device.getByText('Conditions de l’annonce',{exact:true}).first().click()
  await device.getByText('Clients concernés',{exact:true}).first().waitFor()
  assert.ok(await device.getByText('Non documenté',{exact:true}).count()>0)
  const sourceLink=device.locator('a[href="'+coverageRows.find(o=>o.publisher.startsWith('Société Générale')).sourceUrl+'"]')
  assert.ok(await sourceLink.count()>0,'Direct original link preserved')
  await device.getByRole('searchbox').fill('trois nouveaux ETF actifs')
  await device.getByRole('heading',{name:/Amundi élargit/}).first().waitFor()
  await device.getByText(/3 ETF annoncés ; noms non extractibles/).waitFor()
  assert.ok(await device.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
  await device.screenshot({path:`test-artifacts/radar/coverage-${device===page?'desktop':'mobile'}.png`,fullPage:true})
  await device.getByRole('button',{name:'Pouvoir d’achat',exact:true}).click()
  await device.getByRole('searchbox').fill('Saxo Elite')
  await device.getByRole('heading',{name:/Saxo Banque présente Saxo Elite/}).first().waitFor()
  await device.getByText('Conditions de l’annonce',{exact:true}).first().click()
  await device.getByText('Clients concernés',{exact:true}).first().waitFor()
  assert.ok(await device.getByText('2026-04-23',{exact:true}).count()>0,'Old archive retains the original publication date')

 }
 assert.deepEqual(errors,[])
 // Real CSA extract: explicit diffusion differs from the statistical month.
 const qualifiedHousing=parsePublication(await readFile('scripts/fixtures/radar-depth/csa.html','utf8'),housingSource,housing.sourceUrl,scenarioNow)
 feed=advanceRadar(coverageSeed.state,[qualifiedHousing],{now:scenarioNow}).feed
 feed.checkedAt=stamp
 feed.sources=[{id:'fortuneo-tariffs',name:'Fortuneo · brochure tarifaire',url:'https://www.fortuneo.fr/tarifs',status:'ok',lastSuccessAt:stamp,queue:{done:1},silentBaselines:1,depth:'Référence de comparaison, aucune annonce à l’initialisation.'}]
 for(const device of [page,mobile]){
  await device.goto(url+'radar-editorial')
  await device.getByRole('button',{name:'Historique complet',exact:true}).click()
  await device.locator('.radar-filter-panel > summary').click()
  await device.getByRole('searchbox').fill('Analyse marché immobilier septembre')
  await device.getByRole('heading',{name:'Analyse marché immobilier septembre 2026',exact:true}).waitFor()
  await device.getByText(/Publication : 2026-10-15/).first().waitFor()
  await device.getByText('Période des données : 2026-09',{exact:true}).waitFor()
  await device.getByText(/Prêts du secteur concurrentiel aux particuliers/).first().waitFor()
  await device.getByText('Sources de publications et file de traitement',{exact:true}).click()
  await device.getByText(/référence.s. silencieuse.s., sans changement prouvé/).waitFor()
  assert.ok(await device.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1))
  await device.screenshot({path:`test-artifacts/radar/depth-${device===page?'desktop':'mobile'}.png`,fullPage:true})
 }
 assert.deepEqual(errors,[])
 console.log('Radar navigateur : signaux, filtres, lecture persistante, copie, conservation après échec, fraîcheur et mobile validés.')
}finally{await browser?.close();server.kill()}
