import {hydrateMarketSeries} from './ai-series-store.mjs'
import assert from 'node:assert/strict'
import { choose } from './card-selection.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../src/pages/ai-portfolios/data.js'
import { clone,addDays } from '../src/pages/ai-portfolios/lib.js'
import { register,refresh } from './ai-portfolios.mjs'
const output='/tmp/ai-portfolios-qa';fs.mkdirSync(output,{recursive:true})
const sourceBytes=fs.readFileSync('public/data/ai-portfolios/overview.json','utf8'),boot=JSON.parse(sourceBytes)
const actual={...boot,market:JSON.parse(fs.readFileSync('data/ai-portfolios/market.json'))};actual.defaults=defaultConfig(undefined,actual.market)
const blank={...boot,book:{version:1,revision:0,competitions:[],audit:[]},state:{daily:{},weekly:{},valuationRevisions:[]}}
const market=clone(actual.market);market.generatedAt=new Date().toISOString();const defaults=defaultConfig(market.calendarFrom,market),qaDay=addDays(market.calendarFrom,3)
const qualified=market.universe.filter(a=>a.status==='qualified'&&!a.selectionBlock&&!a.leveraged&&a.instrumentType==='EQUITY'&&a.sourceId==='nasdaq'&&!a.isin&&a.coverageFrom<=qaDay).slice(0,3).map(a=>a.id)
hydrateMarketSeries(market,process.cwd(),qualified)
market.asOf=[market.asOf,...qualified.map(id=>Object.keys(market.series[id].points).sort().at(-1))].sort()[0]
const fixtureNow=addDays(market.asOf,1)+'T12:00:00Z';market.generatedAt=fixtureNow
assert.equal(qualified.length,3,'Three newly discovered, genuinely qualified Nasdaq listings without invented ISINs required for browser QA')
const config={...defaults,benchmark:qualified[0],universe:qualified,name:'DÉMONSTRATION QA · jamais publiée',launchDate:qaDay,participants:defaults.participants.map(p=>({...p,model:'Modèle fictif de test'}))}
let book={version:1,revision:0,competitions:[],audit:[]},index=0
const submit=op=>{book=register(book,{version:1,requestId:'qa-request-'+index++,expectedRevision:book.revision,competitionId:book.competitions[0]?.id,operation:op},market,qaDay+'T09:00:00Z')}
submit({type:'create',config})
for(const p of config.participants)submit({type:'decision',decision:{participant:p.id,kind:'target',weights:{[config.universe[0]]:33,[config.universe[1]]:33,[config.universe[2]]:33},decisionDate:qaDay,model:p.model,reason:'Allocation synthétique exclusivement pour la recette navigateur.'}})
submit({type:'launch'})
const result=refresh(book,market),fixture={...boot,book:result.book,market:{...market,universe:market.universe.filter(a=>qualified.includes(a.id)),series:{},revisions:[]},state:result.state,defaults:boot.defaults}
fs.writeFileSync(output+'/fixture.json',JSON.stringify(fixture))
fs.writeFileSync(output+'/blank.json',JSON.stringify(blank))
const completeCatalogue=JSON.parse(fs.readFileSync('public/data/ai-portfolios/catalogue.json'))
const staleCatalogue=clone(completeCatalogue),staleRow=staleCatalogue.rows.find(r=>r[staleCatalogue.columns.indexOf('id')]===qualified[0])
staleRow[staleCatalogue.columns.indexOf('coverageThrough')]=addDays(blank.market.asOf,-14)
staleRow[staleCatalogue.columns.indexOf('reason')]='Qualification technique existante, fixture de fraîcheur.'
fs.writeFileSync(output+'/stale-catalogue.json',JSON.stringify(staleCatalogue))
// Test time is frozen at the last real observations. The fixture catalogue uses
// that same cutoff even after the live catalogue advances with only held assets.
fs.writeFileSync(output+'/fixture-catalogue.json',JSON.stringify({...completeCatalogue,asOf:market.asOf}))

// Stream the full real catalogue over HTTP. Sending ~70 MB through CDP's
// base64 route.fulfill transport measures the test harness instead of the UI.
// Fixtures remain exclusively in /tmp, never in public/, dist/ or the book.
const fixtures=http.createServer((req,res)=>{
 const name=(req.url??'').slice(1)
 if(!['blank.json','fixture.json','missing.json','scope.json','stale-catalogue.json','fixture-catalogue.json'].includes(name)||!fs.existsSync(output+'/'+name)){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'no-store'})
 fs.createReadStream(output+'/'+name).pipe(res)
})
await new Promise((resolve,reject)=>{fixtures.once('error',reject);fixtures.listen(4338,'127.0.0.1',resolve)})
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4337','--strictPort'],{stdio:['ignore','pipe','pipe']})
let serverLog='';for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog=(serverLog+chunk.toString()).slice(-4000)})
const url='http://127.0.0.1:4337/shinny-potato/';let browser
try {
 let ready=false
 for(let i=0;i<600;i++){assert.equal(server.exitCode,null,'Preview stopped: '+serverLog);try{if((await fetch(url,{signal:AbortSignal.timeout(500)})).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
 assert(ready,'Preview not ready after 60 seconds: '+serverLog)
 browser=await chromium.launch({headless:true,args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[]
 page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message)})
 await page.route('**/data/ai-portfolios/overview.json',route=>route.continue({url:'http://127.0.0.1:4338/blank.json'}))
 await page.route('**/data/ai-portfolios/catalogue.json',route=>route.continue({url:'http://127.0.0.1:4338/stale-catalogue.json'}))
 await page.goto(url)
 await page.getByRole('link',{name:/Portefeuilles IA/}).first().click()
 await page.getByRole('heading',{name:'Une feuille blanche, pour chaque IA.'}).waitFor()
 await page.getByRole('button',{name:'Configurer et saisir les décisions'}).click()
 await page.getByRole('heading',{name:'Règles communes'}).waitFor()
 assert.equal(await page.locator('.ai-source').count(),0,'No catalogue downloaded before explicit consultation')
 await page.getByRole('button',{name:'Ajouter un participant',exact:true}).click()
 assert.equal(await page.getByRole('textbox',{name:'Nom du participant',exact:true}).count(),4)
 await page.getByRole('button',{name:'Retirer Participant',exact:true}).click()
 await page.getByRole('button',{name:'Charger le catalogue complet',exact:true}).click()
 await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).waitFor()
 assert(await page.locator('.ai-source').count()<=25,'Catalogue pagination')
 await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).fill(market.universe.find(a=>a.id===qualified[0]).ticker)
 const staleCard=page.locator('.ai-source').filter({hasText:market.universe.find(a=>a.id===qualified[0]).name}).first()
 await staleCard.getByText('Rattrapage nécessaire avant utilisation.',{exact:true}).waitFor()
 await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).fill('')

 await choose(page.getByRole('group',{name:'Famille du catalogue',exact:true}),'Actions')
 assert(await page.locator('.ai-source').count()>0,'Family filter remains usable')
 await choose(page.getByRole('group',{name:'Famille du catalogue',exact:true}),'')
 await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).fill('IE00B53SZB19')
 assert.equal(await page.locator('.ai-source').count(),1,'Nasdaq exact instrument deduplicated across alternatives')
 const authorized=new Set(actual.defaults.universe)
 const sharded=actual.market.universe.findLast(a=>authorized.has(a.id)&&a.status==='qualified'&&!a.selectionBlock&&a.instrumentType==='EQUITY'&&a.seriesFile&&!actual.market.series[a.id])
 if(sharded){
  await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).fill(sharded.isin??sharded.ticker)
  const checkbox=page.locator('.ai-source').filter({hasText:sharded.name}).first().locator('input[type=checkbox]').first()
  if(await checkbox.isChecked())await checkbox.uncheck()
  await Promise.all([page.waitForResponse(r=>r.url().endsWith(sharded.seriesFile)&&r.ok()),checkbox.click()])
  await page.waitForFunction(()=>document.querySelector('.ai-source input[type=checkbox]')?.checked);assert(await checkbox.isChecked(),'Qualified new equity is selectable after on-demand price hydration')
 }
 await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).fill('does-not-exist')
 assert.equal(await page.locator('.ai-source').count(),0)
 await page.getByRole('searchbox',{name:'Rechercher un actif',exact:true}).fill('')
 await page.getByRole('button',{name:'Préparer la création',exact:true}).click()
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger la demande JSON'}).click()])
 await download.saveAs(output+'/demande.json')
 const req=JSON.parse(fs.readFileSync(output+'/demande.json'));assert.equal(req.operation.type,'create');assert.equal(req.expectedRevision,0);assert.equal(req.operation.config.participants.length,3)
 assert.equal(fs.readFileSync('public/data/ai-portfolios/overview.json','utf8'),sourceBytes,'Browser edits must not change the durable book')
 // Exercise exported request in the real CLI, isolated from the published book.
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ai-ui-import-'));fs.mkdirSync(path.join(temp,'data/ai-portfolios'),{recursive:true})
 fs.writeFileSync(path.join(temp,'data/ai-portfolios/book.json'),JSON.stringify(blank.book));fs.writeFileSync(path.join(temp,'data/ai-portfolios/market.json'),JSON.stringify(market))
 const {spawnSync}=await import('node:child_process');const imported=spawnSync(process.execPath,['scripts/ai-portfolios.mjs','import',output+'/demande.json','--root',temp],{encoding:'utf8'});assert.equal(imported.status,0,imported.stderr)
 assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'data/ai-portfolios/book.json'))).competitions.length,1);fs.rmSync(temp,{recursive:true})
 // Demo is intercepted in the browser only. No demo decision is saved in production.
 await page.unroute('**/data/ai-portfolios/catalogue.json')
 await page.route('**/data/ai-portfolios/catalogue.json',route=>route.continue({url:'http://127.0.0.1:4338/fixture-catalogue.json'}))
 await page.clock.setFixedTime(new Date(fixtureNow))
 await page.unroute('**/data/ai-portfolios/overview.json')
 await page.route('**/data/ai-portfolios/overview.json',route=>route.continue({url:'http://127.0.0.1:4338/fixture.json'}))
 await page.reload();await page.getByRole('heading',{name:/La course au/}).waitFor()
 assert.equal(await page.locator('.ai-ranking article').count(),4)
 await page.screenshot({path:output+'/desktop.png',fullPage:true})
 const [ranking]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger PNG'}).click()]);await ranking.saveAs(output+'/classement.png')
 const png=fs.readFileSync(output+'/classement.png');assert.equal(png.readUInt32BE(16),1200);assert.ok(png.readUInt32BE(20)>=900)
 const financialText=await page.getByRole('textbox',{name:'Tweet modifiable'}).inputValue();assert.match(financialText,/Pas un conseil financier/)
 await page.getByRole('textbox',{name:'Tweet modifiable'}).fill('Retouche éditoriale QA')
 await page.getByRole('button',{name:'Rétablir le texte'}).click();assert.equal(await page.getByRole('textbox',{name:'Tweet modifiable'}).inputValue(),financialText)
 await choose(page.getByRole('group',{name:'Format de l’image',exact:true}),'chart')
 const [chart]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger PNG'}).click()]);await chart.saveAs(output+'/courbes.png')
 await page.getByRole('button',{name:'Portefeuille',exact:true}).click()
 await page.getByRole('heading',{name:'ChatGPT · le portefeuille'}).waitFor()
 assert.equal(await page.locator('.ai-scroll tbody tr').count(),3)
 const [focus]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger PNG'}).click()]);await focus.saveAs(output+'/focus.png')
 await page.getByRole('button',{name:'Gestion',exact:true}).click()
 const dossier=await page.getByRole('textbox',{name:'Instructions à copier'}).inputValue()
 assert(dossier.includes('Arrêté financier : '+market.asOf),'Weekly exchange defaults to the latest daily holdings, with the last common weekly return reported separately')
 assert.match(dossier,/DOSSIER HEBDOMADAIRE/);assert.match(dossier,/Référence exacte/);assert.match(dossier,/unités synthétiques/)
 const [brief]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger le dossier individuel'}).click()]);await brief.saveAs(output+'/dossier-chatgpt.txt')
 await page.getByRole('textbox',{name:'Réponse JSON à vérifier'}).fill(JSON.stringify({version:1,participant:'chatgpt',kind:'target',model:'Test QA',decisionDate:fixtureNow.slice(0,10),reason:'Identifiant invalide de test',weights:{UNKNOWN:30}}))
 await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse'}).click()
 await page.getByText(/Identifiant inconnu ou hors univers : UNKNOWN/).waitFor()
 await page.getByRole('textbox',{name:'Réponse JSON à vérifier'}).fill(JSON.stringify({version:1,participant:'chatgpt',kind:'hold',model:'Test QA',decisionDate:fixtureNow.slice(0,10),reason:'Conserver, réponse exclusivement destinée à la recette.'}))
 await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse'}).click()
 await page.getByText(/Réponse vérifiée pour l’aperçu/).waitFor({timeout:60000})
 await choose(page.getByRole('group',{name:'Forme de la réponse',exact:true}),'hold')
 await page.getByRole('textbox',{name:'Modèle utilisé',exact:true}).fill('Modèle test suivant')
 await page.getByRole('textbox',{name:'Justification',exact:true}).fill('Conserver le portefeuille de recette.')
 await page.getByRole('button',{name:'Valider le brouillon et préparer l’enregistrement'}).click()
 await page.getByText(/Demande préparée : decision/).waitFor()
 // A source used only by another participant cannot block a healthy focus or
 // briefing. The synthetic wrapper below is strictly confined to /tmp fixtures.
 const scopeMarket=clone(market),scopeBook=clone(result.book),scopeComp=scopeBook.competitions[0],qaId='qa:other-only',basis=qualified[0]
 scopeMarket.universe.push({...scopeMarket.universe.find(a=>a.id===basis),id:qaId,instrumentId:qaId,name:'ACTIF FICTIF DE RECETTE — autre participant',ticker:'QA_OTHER',symbol:'QA_OTHER',evidenceId:qaId,seriesFile:null})
 scopeMarket.series[qaId]={...clone(scopeMarket.series[basis]),symbol:'QA_OTHER',listingEvidenceId:qaId}
 scopeComp.config.universe.push(qaId)
 const otherInitial=scopeComp.decisions.find(d=>d.participant==='claude')
 otherInitial.weights[qaId]=otherInitial.weights[basis];delete otherInitial.weights[basis]
 otherInitial.execution.trades.find(t=>t.id===basis).id=qaId
 otherInitial.execution.after.positions.find(t=>t.id===basis).id=qaId
 for(const field of ['positions','flows']){otherInitial.execution.portfolio[field][qaId]=otherInitial.execution.portfolio[field][basis];delete otherInitial.execution.portfolio[field][basis]}
 const scopeWeek=fixture.state.weekly[scopeComp.id][0].date,scopeCalendar=scopeMarket.calendars[scopeMarket.universe.find(a=>a.id===qaId).calendar]
 delete scopeMarket.series[qaId].points[Object.keys(scopeCalendar).filter(d=>d<=scopeWeek).sort().at(-1)]
 const scopeResult=refresh(scopeBook,scopeMarket),scopeFixture={...fixture,book:scopeResult.book,market:{...scopeMarket,universe:scopeMarket.universe.filter(a=>[...qualified,qaId].includes(a.id)),series:{}},state:scopeResult.state}
 fs.writeFileSync(output+'/scope.json',JSON.stringify(scopeFixture))
 await page.unroute('**/data/ai-portfolios/overview.json');await page.route('**/data/ai-portfolios/overview.json',route=>route.continue({url:'http://127.0.0.1:4338/scope.json'}));await page.reload()
 await page.getByText(/Bilan incomplet/).waitFor();assert(await page.getByRole('button',{name:'Télécharger PNG'}).isDisabled(),'Ranking stays incomplete')
 await page.getByRole('button',{name:'Portefeuille',exact:true}).click()
 const [scopedFocus]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger PNG'}).click()]);await scopedFocus.saveAs(output+'/focus-independent.png')
 assert.equal(Buffer.compare(fs.readFileSync(output+'/focus.png'),fs.readFileSync(output+'/focus-independent.png')),0,'An unrelated missing quote changes neither the healthy focus figures nor its PNG layout')
 await page.getByRole('button',{name:'Gestion',exact:true}).click()
 assert(!(await page.getByRole('button',{name:'Copier le dossier individuel',exact:true}).isDisabled()),'Healthy participant briefing remains complete')
 await choose(page.getByRole('group',{name:'Participant du dossier',exact:true}),'claude')
 assert(await page.getByRole('button',{name:'Copier le dossier individuel',exact:true}).isDisabled(),'Affected participant stays blocked')
 // Missing expected close must suspend ranking, tweet and PNG exports.
 const missingMarket=clone(market),last=fixture.state.weekly[book.competitions[0].id][0].date,asset=market.universe.find(a=>a.id===config.benchmark),calendar=market.calendars[asset.calendar]
 const expected=Object.keys(calendar).filter(d=>d<=last).sort().at(-1);delete missingMarket.series[config.benchmark].points[expected]
 const missing={...fixture,state:refresh(result.book,missingMarket,result.state).state}
 fs.writeFileSync(output+'/missing.json',JSON.stringify(missing))
 await page.unroute('**/data/ai-portfolios/overview.json');await page.route('**/data/ai-portfolios/overview.json',route=>route.continue({url:'http://127.0.0.1:4338/missing.json'}));await page.reload()
 await page.getByText(/Bilan incomplet/).waitFor();assert.equal(await page.getByRole('button',{name:'Télécharger PNG'}).isDisabled(),true)
 await page.getByRole('button',{name:'Gestion',exact:true}).click()
 assert(await page.getByRole('button',{name:'Copier le dossier individuel',exact:true}).isDisabled(),'Incomplete briefing cannot be presented as complete')
 assert(await page.getByRole('button',{name:'Télécharger le dossier individuel',exact:true}).isDisabled())
 const mobile=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true})
 await mobile.clock.setFixedTime(new Date(fixtureNow));mobile.on('pageerror',e=>errors.push(e.message));await mobile.route('**/data/ai-portfolios/overview.json',route=>route.continue({url:'http://127.0.0.1:4338/fixture.json'}))
 await mobile.goto(url+'portefeuilles-ia');await mobile.getByRole('heading',{name:/La course au/}).waitFor()
 assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');assert.equal(await mobile.locator('select').count(),0,'Reuse shared button pickers')
 assert(await mobile.locator('.ai-toolbar>.ai-field').first().evaluate(e=>e.getBoundingClientRect().width>=e.parentElement.getBoundingClientRect().width-2),'Competition names retain a readable full-width field on mobile')
 await mobile.screenshot({path:output+'/mobile.png',fullPage:true})
 await mobile.getByRole('button',{name:'Gestion',exact:true}).click();await mobile.getByText('Règles communes · configuration',{exact:true}).click();await mobile.getByRole('heading',{name:'Règles communes'}).waitFor()
 assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile management overflow')
 await mobile.screenshot({path:output+'/mobile-gestion.png',fullPage:true})
 assert.deepEqual(errors,[])
 console.log('Navigateur : navigation, état vide, configuration, export/import durable CLI, classement, conservation, retouche éditoriale isolée, PNG classement/focus/courbes, données manquantes et mobile validés. Artéfacts : '+output)
} finally {await browser?.close();server.kill();fixtures.closeAllConnections();fixtures.close()}
