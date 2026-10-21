import assert from 'node:assert/strict'
import { choose } from './card-selection.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../src/pages/ai-portfolios/data.js'
import { clone,addDays } from '../src/pages/ai-portfolios/lib.js'
import { register,refresh } from './ai-portfolios.mjs'
const output='/tmp/ai-portfolios-qa';fs.mkdirSync(output,{recursive:true})
const sourceBytes=fs.readFileSync('public/data/ai-portfolios/snapshot.json','utf8'),actual=JSON.parse(sourceBytes)
const blank={...actual,book:{version:1,revision:0,competitions:[],audit:[]},state:{daily:{},weekly:{},valuationRevisions:[]}}
const market=clone(actual.market);market.generatedAt=new Date().toISOString();const defaults=defaultConfig(market.calendarFrom),qaDay=addDays(market.calendarFrom,3)
const config={...defaults,name:'DÉMONSTRATION QA · jamais publiée',launchDate:qaDay,participants:defaults.participants.map(p=>({...p,model:'Modèle fictif de test'}))}
let book={version:1,revision:0,competitions:[],audit:[]},index=0
const submit=op=>{book=register(book,{version:1,requestId:'qa-request-'+index++,expectedRevision:book.revision,competitionId:book.competitions[0]?.id,operation:op},market,qaDay+'T09:00:00Z')}
submit({type:'create',config})
for(const p of config.participants)submit({type:'decision',decision:{participant:p.id,kind:'target',weights:{[config.universe[0]]:33,[config.universe[1]]:33,[config.universe[2]]:33},decisionDate:qaDay,model:p.model,reason:'Allocation synthétique exclusivement pour la recette navigateur.'}})
submit({type:'launch'})
const result=refresh(book,market),fixture={book:result.book,market,state:result.state,defaults}
fs.writeFileSync(output+'/fixture.json',JSON.stringify(fixture))
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4337','--strictPort'],{stdio:['ignore','pipe','pipe']})
let serverLog='';for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog=(serverLog+chunk.toString()).slice(-4000)})
const url='http://127.0.0.1:4337/shinny-potato/';let browser
try {
 let ready=false
 for(let i=0;i<600;i++){assert.equal(server.exitCode,null,'Preview stopped: '+serverLog);try{if((await fetch(url,{signal:AbortSignal.timeout(500)})).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
 assert(ready,'Preview not ready after 60 seconds: '+serverLog)
 browser=await chromium.launch({headless:true,args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/data/ai-portfolios/snapshot.json',route=>route.fulfill({json:blank}))
 await page.goto(url)
 await page.getByRole('link',{name:/Portefeuilles IA/}).first().click()
 await page.getByRole('heading',{name:'Une feuille blanche, pour chaque IA.'}).waitFor()
 await page.getByRole('button',{name:'Configurer et saisir les décisions'}).click()
 await page.getByRole('heading',{name:'Règles communes'}).waitFor()
 await page.getByRole('button',{name:'Préparer la création',exact:true}).click()
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger la demande JSON'}).click()])
 await download.saveAs(output+'/demande.json')
 const req=JSON.parse(fs.readFileSync(output+'/demande.json'));assert.equal(req.operation.type,'create');assert.equal(req.expectedRevision,0);assert.equal(req.operation.config.participants.length,3)
 assert.equal(fs.readFileSync('public/data/ai-portfolios/snapshot.json','utf8'),sourceBytes,'Browser edits must not change the durable book')
 // Exercise exported request in the real CLI, isolated from the published book.
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ai-ui-import-'));fs.mkdirSync(path.join(temp,'data/ai-portfolios'),{recursive:true})
 fs.writeFileSync(path.join(temp,'data/ai-portfolios/book.json'),JSON.stringify(blank.book));fs.writeFileSync(path.join(temp,'data/ai-portfolios/market.json'),JSON.stringify(market))
 const {spawnSync}=await import('node:child_process');const imported=spawnSync(process.execPath,['scripts/ai-portfolios.mjs','import',output+'/demande.json','--root',temp],{encoding:'utf8'});assert.equal(imported.status,0,imported.stderr)
 assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'data/ai-portfolios/book.json'))).competitions.length,1);fs.rmSync(temp,{recursive:true})
 // Demo is intercepted in the browser only. No demo decision is saved in production.
 await page.unroute('**/data/ai-portfolios/snapshot.json')
 await page.route('**/data/ai-portfolios/snapshot.json',route=>route.fulfill({json:fixture}))
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
 await choose(page.getByRole('group',{name:'Forme de la réponse',exact:true}),'hold')
 await page.getByRole('textbox',{name:'Modèle utilisé',exact:true}).fill('Modèle test suivant')
 await page.getByRole('textbox',{name:'Justification',exact:true}).fill('Conserver le portefeuille de recette.')
 await page.getByRole('button',{name:'Valider le brouillon et préparer l’enregistrement'}).click()
 await page.getByText(/Demande préparée : decision/).waitFor()
 // Missing expected close must suspend ranking, tweet and PNG exports.
 const missing=clone(fixture),last=missing.state.weekly[book.competitions[0].id][0].date,asset=missing.market.universe.find(a=>a.id===config.benchmark),calendar=missing.market.calendars[asset.calendar]
 const expected=Object.keys(calendar).filter(d=>d<=last).sort().at(-1);delete missing.market.series[config.benchmark].points[expected]
 await page.unroute('**/data/ai-portfolios/snapshot.json');await page.route('**/data/ai-portfolios/snapshot.json',route=>route.fulfill({json:missing}));await page.reload()
 await page.getByText(/Bilan incomplet/).waitFor();assert.equal(await page.getByRole('button',{name:'Télécharger PNG'}).isDisabled(),true)
 const mobile=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true})
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.route('**/data/ai-portfolios/snapshot.json',route=>route.fulfill({json:fixture}))
 await mobile.goto(url+'portefeuilles-ia');await mobile.getByRole('heading',{name:/La course au/}).waitFor()
 assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');assert.equal(await mobile.locator('select').count(),0,'Reuse shared button pickers')
 await mobile.screenshot({path:output+'/mobile.png',fullPage:true})
 await mobile.getByRole('button',{name:'Gestion',exact:true}).click();await mobile.getByRole('heading',{name:'Règles communes'}).waitFor()
 assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile management overflow')
 await mobile.screenshot({path:output+'/mobile-gestion.png',fullPage:true})
 assert.deepEqual(errors,[])
 console.log('Navigateur : navigation, état vide, configuration, export/import durable CLI, classement, conservation, retouche éditoriale isolée, PNG classement/focus/courbes, données manquantes et mobile validés. Artéfacts : '+output)
} finally {await browser?.close();server.kill()}
