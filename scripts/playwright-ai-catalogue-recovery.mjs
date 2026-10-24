import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {rehearsal} from './rehearse-ai-week.mjs'
import {register,refresh} from './ai-portfolios.mjs'
import {proposalFromIssue} from './ai-owner-issue.mjs'
import {publishRuntime} from './ai-runtime-projection.mjs'
import {decodeProposal} from '../src/pages/ai-portfolios/request-transport.js'
import {decodeCatalogue} from '../src/pages/ai-portfolios/runtime.js'
import {choose} from './card-selection.mjs'
const original=fs.readFileSync('data/ai-portfolios/book.json'),source=JSON.parse(original),existing=source.competitions.find(c=>c.status==='draft'&&!c.decisions.length)
if(!existing){console.log('Existing-draft browser regression: no applicable draft in this snapshot; synthetic owner journey remains available.');process.exit(0)}
const assets=decodeCatalogue(JSON.parse(fs.readFileSync('public/data/ai-portfolios/catalogue.json'))),root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-catalogue-recovery-')),output=process.env.AI_REHEARSAL_OUTPUT??'/tmp/ai-catalogue-recovery';fs.mkdirSync(output,{recursive:true})
const remoteBase=process.env.AI_BROWSER_BASE,preview=remoteBase?null:spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4458','--strictPort'],{stdio:'ignore'}),base=remoteBase??'http://127.0.0.1:4458/shinny-potato/'
let browser
try{
 if(!remoteBase)for(let n=0;n<600;n++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(remoteBase?{proxy:{server:process.env.HTTPS_PROXY??process.env.HTTP_PROXY,bypass:'127.0.0.1,localhost'}}:{})})
 const proofs=[]
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  let book=structuredClone(source),market=rehearsal(3).market,clock='2026-10-24T12:00:00Z',state,requests=[],accepted=[],missing=false,publicationMismatch=false
  const fixture=structuredClone(market),authorized=new Set(existing.config.universe),chosen=['USD','EUR','GBP','JPY'].map(currency=>assets.find(a=>authorized.has(a.id)&&a.instrumentType==='EQUITY'&&a.currency===currency))
  assert(chosen.every(Boolean),'Four currencies must resolve to exact archived instrument IDs')
  market.universe=structuredClone(assets);market.asOf='2026-10-23';market.generatedAt=clock;market.series={}
  const used=[existing.config.benchmark,...chosen.map(a=>a.id)],fakeIds=['qa-sp500','qa-usd','qa-eur','qa-gbp','qa-jpy']
  used.forEach((id,i)=>{const a=market.universe.find(a=>a.id===id),fake=fixture.universe.find(a=>a.id===fakeIds[i]);Object.assign(a,{calendar:fake.calendar,timezone:fake.timezone,seriesFile:'series/00.json'});market.series[id]={...structuredClone(fixture.series[fake.id]),symbol:a.qualifiedSymbol??a.symbol,currency:a.currency,timezone:a.timezone,priceScale:a.priceScale??1,isin:a.isin,listingEvidenceId:a.evidenceId,responseSha256:a.responseSha256};market.status[id]={ok:true,lastSuccess:clock}})
  // Every simulated price/calendar below is explicitly a deterministic fixture;
  // identity/universe are copied from the real snapshot, never written back.
  function persist(){state=refresh(book,market,state).state;const overview=publishRuntime(root,book,market,state);fs.writeFileSync(path.join(root,'public/data/ai-portfolios/overview.json'),JSON.stringify(overview));fs.mkdirSync(path.join(root,'public/data/ai-portfolios/series'),{recursive:true});fs.writeFileSync(path.join(root,'public/data/ai-portfolios/series/00.json'),JSON.stringify(market.series))}
  persist()
  const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500,acceptDownloads:true});context.setDefaultTimeout(30000)
  await context.route('**/data/ai-portfolios/**',async route=>{const name=new URL(route.request().url()).pathname.split('/data/ai-portfolios/')[1];requests.push(name);if(name==='catalogue.json'&&missing){const c=JSON.parse(fs.readFileSync(path.join(root,'public/data/ai-portfolios/catalogue.json')));const i=c.rows.findIndex(r=>r[0]===existing.config.universe[0]);c.rows[i][0]='isolated-replaced-id';return route.fulfill({json:c})}if(name==='catalogue.json'&&publicationMismatch){const c=JSON.parse(fs.readFileSync(path.join(root,'public/data/ai-portfolios/catalogue.json')));c.revision='different-version';return route.fulfill({json:c})}const file=path.join(root,'public/data/ai-portfolios',name);if(fs.existsSync(file))return route.fulfill({contentType:'application/json',body:fs.readFileSync(file)});return route.abort()})
  await context.route('https://github.com/madmax91310/shinny-potato/issues/new**',route=>{const url=new URL(route.request().url()),payload=JSON.stringify({title:url.searchParams.get('title'),body:url.searchParams.get('body')}).replaceAll('<','\\u003c');return route.fulfill({contentType:'text/html; charset=utf-8',body:`<h1>RECETTE ISOLÉE · GitHub SIMULÉ</h1><button>Create</button><p id="result"></p><script>document.querySelector('button').onclick=async()=>{const r=await fetch('https://github.com/ai-isolated-confirm',{method:'POST',body:JSON.stringify(${payload})});document.querySelector('#result').textContent=await r.text()}</script>`})})
  await context.route('https://github.com/ai-isolated-confirm',async route=>{const {title,body}=route.request().postDataJSON(),event={repository:{full_name:'madmax91310/shinny-potato',owner:{id:123}},sender:{id:123},issue:{user:{id:123},title,body}},decoded=await decodeProposal(body.match(/AI_PORTFOLIO_REQUEST_V1\n([A-Za-z0-9_-]+)/)[1]);assert.equal(title,'Portefeuilles IA · '+decoded.requestId);const p=await proposalFromIssue(event,market);assert.equal(p.competitionId,existing.id);assert.notEqual(p.operation.type,'create');const prior=book.audit.find(e=>e.requestId===p.requestId);if(!prior){book=register(book,p,market,clock);accepted.push(p);persist()}return route.fulfill({json:{state:'recorded'}})})
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.setFixedTime(new Date(clock));await page.goto(base+'portefeuilles-ia');await page.getByRole('heading',{name:'Reprendre '+existing.config.name,exact:true}).waitFor();assert(!requests.some(p=>/catalogue|details|series/.test(p)))
  // Restore an old creation draft whose request is already in the durable audit.
  // Typed models must attach to the existing competition, never produce a second create.
  const creation=book.audit.find(e=>e.competitionId===existing.id&&e.operation==='create')
  if(creation){await page.evaluate(({config,id})=>localStorage.setItem('ai-portfolios-owner-draft-v1',JSON.stringify({version:1,updatedAt:new Date().toISOString(),selected:'',participant:config.participants[0].id,config,decision:{kind:'target',model:'RECETTE',decisionDate:'2026-10-24',reason:'',weights:{},amounts:{}},request:{version:1,requestId:id,expectedRevision:0,competitionId:null,operation:{type:'create',config}},drafts:[]})),{config:existing.config,id:creation.requestId});await page.reload();await page.getByRole('button',{name:'Restaurer le brouillon',exact:true}).click();await page.getByRole('group',{name:'Compétition',exact:true}).locator('[data-option][aria-pressed="true"][data-value="'+existing.id+'"]').waitFor();assert.equal(await page.getByRole('button',{name:'Préparer la création',exact:true}).count(),0)}
  await page.getByRole('button',{name:'Configuration et catalogue',exact:true}).click()
  const models=page.getByRole('textbox',{name:'Modèle déclaré',exact:true});await models.nth(0).fill('Gratuit · RECETTE ISOLÉE');await page.getByRole('button',{name:'Préparer la modification',exact:true}).click();const link=page.getByRole('link',{name:'Confirmer sur GitHub',exact:true});await link.waitFor()
  const first=await link.getAttribute('href');await page.getByRole('button',{name:'Actualiser le livre distant',exact:true}).click();await page.getByRole('status').filter({hasText:'Livre distant chargé'}).waitFor();assert.equal(await link.getAttribute('href'),first,'Overview refresh cannot recompact or shrink the prepared universe');assert.equal(await models.nth(0).inputValue(),'Gratuit · RECETTE ISOLÉE')
  await models.nth(1).fill('Modèle deux · RECETTE');assert.equal(await link.count(),0,'Field edit invalidates prepared confirmation immediately')
  for(let i=2;i<existing.config.participants.length;i++)await models.nth(i).fill('Modèle '+i+' · RECETTE')
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await page.reload();await page.getByRole('button',{name:'Restaurer le brouillon',exact:true}).click();await page.getByRole('button',{name:'Configuration et catalogue',exact:true}).click();assert.equal(await models.nth(0).inputValue(),'Gratuit · RECETTE ISOLÉE');assert.equal(await models.nth(1).inputValue(),'Modèle deux · RECETTE')
  // Mismatched publication and truly missing IDs are distinct and actionable.
  publicationMismatch=true;await page.getByRole('button',{name:'Préparer la modification',exact:true}).click();await page.getByRole('alert').filter({hasText:'versions du catalogue'}).waitFor();assert.equal(await link.count(),0);publicationMismatch=false;missing=true
  await page.getByRole('button',{name:'Préparer la modification',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await link.count(),0);missing=false
  // Reload invalidates that deliberately incompatible cached reference without losing inputs.
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await page.reload();await page.getByRole('button',{name:'Restaurer le brouillon',exact:true}).click();await page.getByRole('button',{name:'Configuration et catalogue',exact:true}).click()
  async function confirm(){await link.waitFor();const [popup]=await Promise.all([context.waitForEvent('page'),link.click()]);await popup.getByRole('button',{name:'Create',exact:true}).click();await popup.locator('#result').filter({hasText:'recorded'}).waitFor();await popup.close();await page.getByRole('button',{name:'Vérifier l’enregistrement',exact:true}).click();await page.getByRole('status').filter({hasText:'Enregistrement durable confirmé'}).first().waitFor()}
  await page.getByRole('button',{name:'Préparer la modification',exact:true}).click();await confirm();assert.deepEqual(book.competitions[0].config.universe,existing.config.universe);assert.equal(book.competitions.length,source.competitions.length);assert.equal(book.competitions[0].config.participants[0].model,'Gratuit · RECETTE ISOLÉE')
  assert.equal(accepted[0].operation.type,'configure');assert.equal(await link.count(),0)
  // Receipt replaces overview, then preparing again uses the exact same full basis.
  await page.getByRole('button',{name:'Préparer la modification',exact:true}).click();await link.waitFor();await models.nth(0).fill('Gratuit · RECETTE ISOLÉE');await page.getByRole('button',{name:'Décisions',exact:true}).click()
  for(const [i,p] of existing.config.participants.entries()){
   await choose(page.getByRole('group',{name:'Participant de la décision',exact:true}),p.id)
   const response={version:1,participant:p.id,model:book.competitions[0].config.participants[i].model,kind:i===0?'target':'hold',decisionDate:'2026-10-24',reason:'RECETTE ISOLÉE, aucune allocation réelle',...(i===0?{weights:Object.fromEntries(chosen.map(a=>[a.id,20]))}:{})}
   await page.getByRole('textbox',{name:'Réponse JSON à vérifier',exact:true}).fill(JSON.stringify(response));await page.getByRole('button',{name:'Vérifier et prévisualiser la réponse',exact:true}).click();try{await page.getByRole('status').filter({hasText:'Réponse vérifiée'}).waitFor()}catch(e){console.log('IMPORT DIAGNOSTIC',await page.getByRole('alert').allTextContents());await page.screenshot({path:output+'/import-error.png',fullPage:true});throw e};await page.getByRole('button',{name:'Valider le brouillon et préparer l’enregistrement',exact:true}).click();await confirm()
  }
  await page.getByRole('button',{name:'Configuration et catalogue',exact:true}).click();await page.getByRole('button',{name:'Préparer le lancement',exact:true}).click();await confirm();assert.equal(book.competitions[0].startDate,'2026-10-26')
  market.asOf='2026-10-26';market.generatedAt='2026-10-27T12:00:00Z';({book,state}=refresh(book,market,state));persist();await page.reload();await page.getByRole('button',{name:'Portefeuille',exact:true}).click();await page.locator('.ai-positions article').first().waitFor();assert.equal(book.competitions[0].decisions.filter(d=>d.status==='executed').length,existing.config.participants.length+1)
  await page.screenshot({path:output+'/recovered-'+viewport.width+'.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.deepEqual(fs.readFileSync('data/ai-portfolios/book.json'),original)
  console.log('Recovered existing competition in isolated browser',viewport.width)
  proofs.push({viewport,existingCompetition:existing.id,universePreserved:existing.config.universe.length,isolatedOnly:true,confirmation:'simulated web Create; trusted proposal decoder and engine',initialLight:true,refresh:true,restoration:true,staleLinkInvalidated:true,publicationMismatch:true,exactMissingId:true,modelsPreserved:true,receipt:true,importedAllocations:existing.config.participants.length,isolatedLaunch:'2026-10-26',execution:true,errors})
  await context.close()
 }
 fs.writeFileSync(output+'/proof.json',JSON.stringify({application:base,scope:'Real book/catalogue copied; all writes, GitHub and prices isolated/deterministic. No real authenticated Create claimed.',proofs},null,2));console.log(JSON.stringify({output,proofs}))
}finally{await browser?.close();preview?.kill()}
