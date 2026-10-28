import assert from 'node:assert/strict'
import fs from 'node:fs'
import zlib from 'node:zlib'
import{createHash}from'node:crypto'
import {chromium} from '/workspace/shinny-potato-review-20261028/node_modules/playwright/index.mjs'
import {choose} from '/workspace/shinny-potato-review-20261028/scripts/card-selection.mjs'
const base=process.env.REVIEW_PUBLIC_BASE??'https://madmax91310.github.io/shinny-potato'
const output=process.env.REVIEW_PUBLIC_OUTPUT??'/workspace/scratch/review-public';fs.mkdirSync(output,{recursive:true})
const browser=await chromium.launch({headless:true}),results=[]
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true,permissions:['clipboard-write','clipboard-read']}),page=await context.newPage(),errors=[],loaded={},removed=[]
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable',{maxTotalBufferSize:500000000,maxResourceBufferSize:200000000})
  await page.addInitScript(()=>{const original=window.fetch;window.fetch=async(...args)=>{const response=await original(...args);if(response.url.split('?')[0].endsWith('/automation-status.json'))response.clone().json().then(d=>{window.__monitorCapture={schemaVersion:d.schemaVersion,reportScopeSchemaVersion:d.reportScopeSchemaVersion,reportScopes:d.reportScopes,monitoring:{checkedAt:d.monitoring?.checkedAt},workflows:Object.fromEntries(Object.entries(d.workflows??{}).map(([k,v])=>[k,{monitorVersion:v.monitorVersion}]))}}).catch(e=>{window.__monitorCaptureError=String(e)});return response}})
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/data\/ai-portfolios\//.test(r.url()))removed.push(r.url())})
  page.on('response',async r=>{for(const file of ['asset-field-coverage.json','data-review-inbox.json','financial-reconciliation.json'])if(r.url().split('?')[0].endsWith('/'+file)&&r.ok())try{loaded[file]=await r.json()}catch(e){console.log('READ FAILED',r.url(),String(e))}})
  if(process.env.REVIEW_STATUS_FIXTURE)await page.route('**/automation-status/automation-status.json',r=>r.fulfill({json:JSON.parse(zlib.gunzipSync(fs.readFileSync(process.env.REVIEW_STATUS_FIXTURE)))}))
  await page.goto(base+'/donnees-a-revoir',{waitUntil:'networkidle',timeout:60000})
  const inbox=page.getByRole('region',{name:'Tous les problèmes de données'}),search=inbox.getByRole('searchbox',{name:'Recherche globale des problèmes'})
  await inbox.getByText(/champs examinés/).waitFor()
  for(let n=0;Object.keys(loaded).length<4&&n<300;n++){const status=await page.evaluate(()=>window.__monitorCapture);if(status)loaded['automation-status.json']=status;await new Promise(r=>setTimeout(r,100))}
  console.log('LOADED',Object.keys(loaded),errors);assert.equal(Object.keys(loaded).length,4,'All four actual evidence documents loaded in the browser')
  const download=page.waitForEvent('download');await inbox.getByRole('button',{name:/Exporter les \d+ diagnostics filtrés/}).click();const file=await download,path=output+'/diagnostics-'+width+'.json';await file.saveAs(path)
  const exported=JSON.parse(fs.readFileSync(path)),rows=exported.rows
  assert(rows.length>100)
  const refs=new Set();const visit=v=>{if(v&&typeof v==='object'){if(typeof v.scopeRef==='string')refs.add(v.scopeRef);Object.values(v).forEach(visit)}};visit(rows)
  const definitions=exported.reportScopes??{},missing=[...refs].filter(k=>!definitions[k])
  const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
  if(process.env.REVIEW_EXPECT_SCOPES){assert.equal(exported.reportScopeSchemaVersion,loaded['automation-status.json'].reportScopeSchemaVersion);assert.deepEqual(definitions,loaded['automation-status.json'].reportScopes);assert(Object.keys(definitions).length>0);assert.deepEqual(missing,[]);for(const key of Object.keys(definitions))assert.equal(createHash('sha256').update(JSON.stringify(canonical(definitions[key]))).digest('hex'),key)}
  console.log('PROOF EXPORT',JSON.stringify({width,references:refs.size,definitions:Object.keys(definitions).length,sourceDefinitions:Object.keys(loaded['automation-status.json'].reportScopes??{}).length,missing:missing.length}))
  const financial=loaded['financial-reconciliation.json'].rows.filter(r=>r.open||r.residualOpen)
  for(const r of financial)assert(rows.some(v=>v.signals.some(s=>s.id==='financial:'+r.id)),r.id+' retained')
  const deep=rows.filter(r=>r.asset).at(-1)
  await search.fill(deep.asset);await inbox.locator('article').first().waitFor();assert((await inbox.innerText()).includes(deep.asset))
  await inbox.getByRole('button',{name:'Copier le diagnostic complet',exact:true}).first().click()
  assert((await inbox.innerText()).includes('Diagnostic copié.')||await inbox.getByRole('textbox',{name:'Diagnostic complet à copier'}).count()>0)
  await search.fill('');await inbox.getByText('Filtrer par classe, outil ou étape',{exact:true}).click();await choose(inbox.getByRole('group',{name:'Classe du problème',exact:true}),'history')
  await inbox.getByRole('heading').first().waitFor();const historicalText=await inbox.innerText();assert(/preuve|documentée|historique/i.test(historicalText))
  const last=inbox.getByRole('navigation',{name:'Pages des problèmes de données'}).getByRole('button',{name:'Dernière page'});if(!await last.isDisabled())await last.click()
  assert(await last.isDisabled());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
  assert.equal(await page.locator('a[href*="/portefeuilles-ia"]').count(),0);assert.deepEqual(removed,[]);assert.deepEqual(errors,[])
  await page.screenshot({path:output+'/history-'+width+'.png',fullPage:false})
  results.push({width,actualDocuments:Object.keys(loaded),actionRows:rows.length,financialCases:financial.length,monitorCheckedAt:loaded['automation-status.json'].monitoring?.checkedAt,monitorVersion:Object.values(loaded['automation-status.json'].workflows).map(w=>w.monitorVersion??null),sharedScopeReferences:refs.size,sharedScopeDefinitions:Object.keys(definitions).length,missingScopeDefinitions:missing.length,historyLastPage:true,deepSearch:true,copy:true,removedRequests:removed,pageErrors:errors})
  await context.close()
 }
 fs.writeFileSync(output+'/results.json',JSON.stringify({checkedAt:new Date().toISOString(),base,isolated:!!process.env.REVIEW_STATUS_FIXTURE,results},null,2)+'\n');console.log(JSON.stringify(results))
}finally{await browser.close()}
