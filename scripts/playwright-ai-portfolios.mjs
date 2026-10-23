import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import {spawn,spawnSync} from 'node:child_process'
import {chromium} from 'playwright'
import {choose} from './card-selection.mjs'
import {rehearsal} from './rehearse-ai-week.mjs'
import {register,refresh} from './ai-portfolios.mjs'
import {clone,addDays} from '../src/pages/ai-portfolios/lib.js'
import {FORMATS} from '../src/pages/ai-portfolios/publication.js'
const output=process.env.AI_REHEARSAL_OUTPUT??'/tmp/ai-final-rehearsal';fs.mkdirSync(output,{recursive:true})
const production=fs.readFileSync('data/ai-portfolios/book.json'),boot=JSON.parse(fs.readFileSync('public/data/ai-portfolios/overview.json')),full=rehearsal(3),fourth=rehearsal(4),scope=rehearsal(3,true)
delete scope.market.series['qa-claude-only'].points[scope.market.asOf]
Object.assign(scope,refresh(scope.book,scope.market))
const refMissing=clone(full);delete refMissing.market.series['qa-sp500'].points[refMissing.market.asOf];Object.assign(refMissing,refresh(refMissing.book,refMissing.market))
const now=addDays(full.market.asOf,1)+'T12:00:00Z'
const thin=f=>({...f,market:{...f.market,series:{},universe:f.market.universe.map(a=>({...a,seriesFile:'series/00.json'}))},catalogueLoaded:false,sourceRevisionCount:0})

function stressFixture(){
 const m=clone(full.market),c=clone(full.book.competitions[0].config);c.maxLines=20;c.name='RECETTE VISUELLE · 20 lignes';c.participants[0].name='Assistant de recette au nom très long pour vérifier les PNG';c.participants[0].model='Modèle déclaré manuellement avec un nom long, uniquement pour cette recette isolée'
 const more=Array.from({length:20},(_,i)=>'qa-many-'+i)
 for(const id of more){m.status[id]={ok:true};m.universe.push({...m.universe[2],id,symbol:id,ticker:'TEST'+id.split('-').at(-1),name:'Ligne de recette visuelle au nom volontairement long '+id});m.series[id]={...clone(m.series['qa-eur']),symbol:id}}
 c.universe=m.universe.map(a=>a.id);m.asOf='2026-07-09';m.generatedAt='2026-07-10T09:00:00Z';let b={version:1,revision:0,competitions:[],audit:[]},i=0
 const op=operation=>{b=register(b,{version:1,requestId:'qa-stress-'+i++,expectedRevision:b.revision,competitionId:b.competitions[0]?.id,operation},m,m.generatedAt)}
 op({type:'create',config:c});for(const p of c.participants)op({type:'decision',decision:{participant:p.id,kind:'target',weights:p.id==='chatgpt'?Object.fromEntries(more.map(id=>[id,4])):{'qa-usd':20,'qa-eur':20,'qa-gbp':20,'qa-jpy':20},model:p.model,decisionDate:'2026-07-10',reason:'Vingt lignes de recette, sans portefeuille réel.'}});op({type:'launch'});m.asOf='2026-10-23';m.generatedAt=now;const result=refresh(b,m)
 const row=result.state.current[b.competitions[0].id].rows[0],capital=10000/(1+.8*.001),price=m.series['qa-eur'].points['2026-07-13'].synthetic,last=m.series['qa-eur'].points[m.asOf].synthetic,expected=10000-capital*.8*(1+.001)+capital*.8/price*last;assert(Math.abs(row.value-expected)<1e-6,'Independent twenty-line valuation')
 return {...full,market:m,...result}
}
const fixtures={blank:boot,three:thin(full),four:thin(fourth),scope:thin(scope),ref:thin(refMissing),catchup:thin(full),stress:thin(stressFixture())};let active='three'
const server=http.createServer((req,res)=>{const name=(req.url??'').slice(1);if(!fixtures[name]){res.writeHead(404);res.end();return}res.setHeader('Content-Type','application/json');res.setHeader('Access-Control-Allow-Origin','*');res.end(JSON.stringify(fixtures[name]))})
await new Promise(r=>server.listen(4338,'127.0.0.1',r))
const preview=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4337','--strictPort'],{stdio:'ignore'}),base='http://127.0.0.1:4337/shinny-potato/';let browser
try{
 for(let i=0;i<600;i++){assert.equal(preview.exitCode,null);try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],requests=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()))
 await page.clock.setFixedTime(new Date(now))
 await page.route('**/data/ai-portfolios/overview.json',r=>r.continue({url:'http://127.0.0.1:4338/'+active}))
 await page.route('**/data/ai-portfolios/details/*.json',r=>r.fulfill({json:Object.fromEntries(full.market.universe.map(a=>[a.id,{asset:{...a,seriesFile:'series/00.json'},status:active==='catchup'&&a.id==='qa-gbp'?{ok:false,error:'Rattrapage de recette requis'}:{ok:true}}]))}))
 await page.route('**/data/ai-portfolios/series/00.json',r=>r.fulfill({json:full.market.series}))
 await page.route('**/data/ai-portfolios/catalogue.json',r=>r.fulfill({json:{version:1,asOf:full.market.asOf,columns:['id','name','ticker','currency','instrumentType','calendar','symbol','timezone','status','seriesFile'],rows:full.market.universe.map(a=>[a.id,a.name,a.ticker,a.currency,a.instrumentType,a.calendar,a.symbol,a.timezone,a.status,'series/00.json'])}}))
 await page.goto(base+'portefeuilles-ia');await page.getByRole('heading',{name:/La course au/}).waitFor()
 assert(!requests.some(u=>/catalogue.json|\/details\/|\/series\//.test(u)),'No initial catalogue, proofs or histories')
 for(const label of ['Vue d’ensemble','Portefeuille','Décisions','Images'])assert(await page.getByRole('button',{name:label,exact:true}).count())
 await page.getByRole('button',{name:'Portefeuille',exact:true}).click();await page.getByText('Performance investissement',{exact:false}).first().waitFor();assert(await page.locator('.ai-positions article').count()>0)
 await page.getByRole('button',{name:'Décisions',exact:true}).click();await page.getByRole('button',{name:'Télécharger le dossier individuel',exact:true}).waitFor()
 const [dossier]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger le dossier individuel',exact:true}).click()]);await dossier.saveAs(output+'/dossier.txt');assert(fs.readFileSync(output+'/dossier.txt','utf8').includes('Contribution nette')||fs.readFileSync(output+'/dossier.txt','utf8').includes('contribution nette'))
 const field=page.getByRole('textbox',{name:'Réponse JSON à vérifier',exact:true}),good={version:1,participant:'chatgpt',kind:'hold',model:'Recette manuelle',decisionDate:full.market.asOf,reason:'Conservation déterministe de recette.'}
 await field.fill('{invalide');await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse',exact:true}).click();await page.getByRole('alert').filter({hasText:'JSON illisible'}).waitFor()
 await field.fill(JSON.stringify({...good,participant:'claude'}));await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse',exact:true}).click();await page.getByRole('alert').filter({hasText:'participant'}).waitFor()
 await field.fill(JSON.stringify(good));await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse',exact:true}).click();await page.getByRole('status').filter({hasText:'Réponse vérifiée'}).waitFor();assert(await page.getByRole('button',{name:'Charger le catalogue complet',exact:true}).count()===0,'Catalogue is outside the decision space')
 assert(!requests.some(u=>u.includes('catalogue.json')),'Hold import never loads the global catalogue')
 await page.getByRole('button',{name:'Valider le brouillon et préparer l’enregistrement',exact:true}).click()
 await page.getByText('Copie de sécurité facultative',{exact:true}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger la demande JSON',exact:true}).click()]);await download.saveAs(output+'/demande.json');const proposal=JSON.parse(fs.readFileSync(output+'/demande.json'))
 assert.equal(proposal.expectedRevision,full.book.revision);assert.equal(proposal.operation.decision.kind,'hold')
 const saved=register(full.book,proposal,full.market,now);assert.equal(saved.revision,full.book.revision+1);assert.throws(()=>register(saved,proposal,full.market,now),/périmé/)
 const updated=refresh(saved,full.market),root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-mobile-save-')),folder=path.join(root,'data/ai-portfolios');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'book.json'),JSON.stringify(updated.book));fs.writeFileSync(path.join(folder,'market.json'),JSON.stringify(full.market));const cli=spawnSync(process.execPath,['scripts/ai-portfolios.mjs','refresh','--root',root],{encoding:'utf8'});assert.equal(cli.status,0,cli.stderr)
 const commit=spawnSync('git',['init','-q'],{cwd:root});assert.equal(commit.status,0);assert.equal(spawnSync('git',['add','.'],{cwd:root}).status,0);assert.equal(spawnSync('git',['-c','user.name=QA','-c','user.email=qa@example.invalid','commit','-qm','Recette isolée mobile'],{cwd:root}).status,0)
 fixtures.saved={...thin(full),book:JSON.parse(fs.readFileSync(path.join(folder,'book.json'))),state:updated.state};active='saved';await page.reload();await page.getByRole('button',{name:'Décisions',exact:true}).click();await page.getByText(`Révision chargée : ${saved.revision}.`,{exact:false}).waitFor();await page.getByText(proposal.requestId,{exact:false}).first().waitFor()
 active='three';await page.reload();await page.getByRole('button',{name:'Décisions',exact:true}).click();
 const response=page.getByRole('textbox',{name:'Réponse JSON à vérifier',exact:true}),verify=page.getByRole('button',{name:'Vérifier et prévisualiser la réponse',exact:true})
 for(const bad of [{...good,kind:'target',weights:{'qa-usd':90}},{...good,kind:'trades',amounts:{'qa-usd':1000000}}]){await response.fill(JSON.stringify(bad));await verify.click();await page.getByRole('alert').filter({hasText:/Poids|Liquidités/}).waitFor();assert.equal(await page.getByRole('button',{name:'Télécharger la demande JSON',exact:true}).count(),0)}
 const target={...good,kind:'target',weights:{'qa-usd':25,'qa-eur':25,'qa-gbp':20,'qa-jpy':20}}
 await response.fill(JSON.stringify(target));await verify.click();await page.getByRole('status').filter({hasText:'Réponse vérifiée'}).waitFor();await page.getByRole('button',{name:'Valider le brouillon et préparer l’enregistrement',exact:true}).click();await page.getByRole('link',{name:'Confirmer sur GitHub',exact:true}).waitFor()
 active='catchup';await page.reload();await page.getByRole('button',{name:'Décisions',exact:true}).click();await page.getByRole('textbox',{name:'Réponse JSON à vérifier',exact:true}).fill(JSON.stringify(target));await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse',exact:true}).click();await page.getByRole('alert').filter({hasText:/Rattrapage de recette requis/}).waitFor();assert.equal(await page.getByRole('button',{name:'Télécharger la demande JSON',exact:true}).count(),0)
 active='three';await page.reload();await page.getByRole('button',{name:'Images',exact:true}).click();const formatPicker=page.getByRole('group',{name:'Format de l’image',exact:true});await formatPicker.waitFor()
 const pngs=[]
 for(const [format] of FORMATS){await choose(formatPicker,format);await page.locator('.ai-image').first().waitFor();const buttons=page.getByRole('button',{name:/Télécharger PNG/});const count=await buttons.count();assert(count>0);for(let i=0;i<count;i++){const [file]=await Promise.all([page.waitForEvent('download'),buttons.nth(i).click()]);const name=`${format}-${i+1}.png`;await file.saveAs(output+'/'+name);assert(fs.readFileSync(output+'/'+name).subarray(1,4).toString()==='PNG');pngs.push(name)}}
 await choose(formatPicker,'individual');const original=await page.locator('.ai-image').first().getAttribute('src');await page.getByRole('textbox',{name:'Titre temporaire',exact:true}).fill('Titre temporaire de recette');assert.notEqual(await page.locator('.ai-image').first().getAttribute('src'),original);assert.deepEqual(fixtures.three.book,full.book)
 // A tab already open with its image renderer loaded must download after the
 // old deployment's JS files disappear. Downloads use retained canvases, not imports.
 const retiredRequests=[];page.on('requestfailed',r=>retiredRequests.push({url:r.url(),type:r.resourceType(),error:r.failure()?.errorText}))
 await page.route('**/assets/*.js',r=>r.abort('failed'));let retained
 try{[retained]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Télécharger PNG/}).first().click()])}
 catch(error){
  console.error('Retained PNG failure:',JSON.stringify({errors,requests:retiredRequests.slice(-20),visibleText:(await page.locator('body').innerText()).slice(0,5000),images:await page.locator('.ai-image').count()}))
  await page.screenshot({path:output+'/retained-png-failure.png',fullPage:true});throw error
 }
 await retained.saveAs(output+'/onglet-apres-deploiement.png');await page.unroute('**/assets/*.js')
 active='four';await page.reload();await page.getByRole('button',{name:'Images',exact:true}).click();await choose(page.getByRole('group',{name:'Format de l’image',exact:true}),'curves');const boxes=page.getByRole('checkbox');if(!await boxes.last().isChecked())await boxes.last().check();const [four]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Télécharger PNG/}).first().click()]);await four.saveAs(output+'/quatre-courbes.png')
 for(const n of [1,2]){for(let i=0;i<await boxes.count();i++)await boxes.nth(i).setChecked(i<n);const [f]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Télécharger PNG/}).first().click()]);await f.saveAs(output+'/courbes-'+n+'-participant.png')}
 active='stress';await page.reload();await page.getByRole('button',{name:'Images',exact:true}).click();await page.locator('.ai-image').first().waitFor();assert.equal(await page.getByRole('button',{name:/Télécharger PNG/}).count(),4);for(let i=0;i<4;i++){const [f]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Télécharger PNG/}).nth(i).click()]);await f.saveAs(output+'/vingt-lignes-'+(i+1)+'.png')}
 active='three';await page.reload();await page.getByRole('button',{name:'Images',exact:true}).click();await choose(page.getByRole('group',{name:'Période de l’image',exact:true}),'week');for(const period of ['month','quarter','all']){await choose(page.getByRole('group',{name:'Période de l’image',exact:true}),period);await page.locator('.ai-image').first().waitFor()}
 await choose(page.getByRole('group',{name:'Période de l’image',exact:true}),'week');await choose(page.getByRole('group',{name:'Format de l’image',exact:true}),'moves');await choose(page.getByRole('group',{name:'Participant de l’image',exact:true}),'claude');const [zero]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Télécharger PNG/}).first().click()]);await zero.saveAs(output+'/aucun-mouvement.png')
 active='scope';await page.reload();await page.getByText(/Bilan incomplet/).first().waitFor();await page.getByRole('button',{name:'Images',exact:true}).click();await page.locator('.ai-image').first().waitFor();await choose(page.getByRole('group',{name:'Format de l’image',exact:true}),'comparison');await page.getByRole('status').filter({hasText:/claude/}).waitFor();await choose(page.getByRole('group',{name:'Format de l’image',exact:true}),'individual');await choose(page.getByRole('group',{name:'Participant de l’image',exact:true}),'claude');await page.getByRole('status').filter({hasText:/claude/}).waitFor();await choose(page.getByRole('group',{name:'Participant de l’image',exact:true}),'chatgpt');await page.locator('.ai-image').first().waitFor()
 active='ref';await page.reload();await page.getByRole('button',{name:'Images',exact:true}).click();await page.getByRole('status').filter({hasText:/world/}).waitFor();await choose(page.getByRole('group',{name:'Format de l’image',exact:true}),'moves');await page.locator('.ai-image').first().waitFor()
 active='three';await page.reload();await page.setViewportSize({width:390,height:844});for(const label of ['Vue d’ensemble','Portefeuille','Décisions','Images']){await page.getByRole('button',{name:label,exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile overflow in '+label);await page.screenshot({path:output+'/mobile-'+label.replaceAll(' ','-')+'.png',fullPage:true})}
 for(const [format] of FORMATS){await choose(page.getByRole('group',{name:'Format de l’image',exact:true}),format);const [file]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Télécharger PNG/}).first().click()]);await file.saveAs(output+'/mobile-'+format+'.png')}
 await page.setViewportSize({width:1440,height:1000});active='blank';await page.reload();await page.getByRole('heading',{name:'Une feuille blanche, pour chaque IA.'}).waitFor();await page.getByRole('button',{name:'Configuration et catalogue',exact:true}).click();await page.getByRole('button',{name:'Ajouter un participant',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Nom du participant',exact:true}).count(),4);await page.getByRole('button',{name:'Retirer Participant',exact:true}).click()
 await page.unroute('**/data/ai-portfolios/catalogue.json');await page.getByRole('button',{name:'Charger le catalogue complet',exact:true}).click();const search=page.getByRole('searchbox',{name:'Rechercher un actif',exact:true});await search.waitFor();await search.fill('MSFT');assert(await page.locator('.ai-source').count()>0);await search.fill('Bitcoin');assert(await page.locator('.ai-source').count()>0);await search.fill('IE00B53SZB19');assert.equal(await page.locator('.ai-source').count(),1);await search.fill('');assert(await page.locator('.ai-source').count()<=25)
 // Initial dossiers on an empty ledger, with a real exhaustive catalogue.
 const modelInputs=page.getByRole('textbox',{name:'Modèle déclaré',exact:true});for(let i=0;i<3;i++)await modelInputs.nth(i).fill('RECETTE INITIALE '+i)
 await page.getByRole('button',{name:'Décisions',exact:true}).click();const initialTexts=[]
 for(const [i,id] of ['chatgpt','claude','gemini'].entries()){
  await choose(page.getByRole('group',{name:'Participant du dossier',exact:true}),id)
  const text=await page.getByRole('textbox',{name:'Instructions à copier',exact:true}).inputValue();initialTexts.push(text);assert(text.includes('DOSSIER DE LANCEMENT'));assert(text.includes('Aucune position'));assert(text.includes('IE00B5BMR087'));assert(text.includes('RECETTE INITIALE '+i));assert(text.includes('schéma à compléter'))
  for(let j=0;j<3;j++)if(i!==j)assert(!text.includes('RECETTE INITIALE '+j))
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger le dossier individuel',exact:true}).click()]);await download.saveAs(output+'/dossier-initial-'+id+'.txt')
 }
 const [schema]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Télécharger le format attendu',exact:true}).click()]);await schema.saveAs(output+'/format-allocation-initiale.json');const initialSchema=JSON.parse(fs.readFileSync(output+'/format-allocation-initiale.json'));assert.equal(initialSchema.kind,'target');assert.deepEqual(initialSchema.weights,{})
 assert(await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse',exact:true}).isDisabled(),'No real competition created by preparing dossiers')
 assert.deepEqual(errors,[]);assert.deepEqual(fs.readFileSync('data/ai-portfolios/book.json'),production);fs.writeFileSync(output+'/browser-report.json',JSON.stringify({scope:'Recette isolée, données déterministes, serveur local ; aucun résultat de production fabriqué',pngs,desktop:true,mobile:true,oldTabDownload:true,completeSearch:true,durableReload:true,initialEmptyDossiers:true,initialTargetSchema:true,independentAvailability:true,productionBookUnchanged:true},null,2));console.log('Recette navigateur complète : '+output)
}finally{await browser?.close();preview.kill();await new Promise(r=>server.close(r))}
