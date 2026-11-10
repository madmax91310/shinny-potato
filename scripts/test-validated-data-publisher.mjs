import assert from 'node:assert/strict'
import {consumerChanges,requiredDataPath} from './prepare-validated-data.mjs'
assert.deepEqual(consumerChanges(['src/data/automated-scpi.json','scripts/collect_corum.py']),[])
assert.deepEqual(consumerChanges(['src/pages/Home.jsx','src/tools.js','src/data/editorial-calendar.js']),['src/pages/Home.jsx','src/tools.js','src/data/editorial-calendar.js'],'Pending calendar code must trigger full code publication instead of repeatedly publishing old code with newer data')
for(const path of ['src/data/catalog.js','src/pages/scpi-presentation/lib.js','src/pages/presentations/Actors.jsx','src/pages/presentation-shared/imageExport.js','src/styles.css']) assert.deepEqual(consumerChanges([path]),[path])
assert.equal(requiredDataPath('src/data/automated-scpi.json'),'src/data/automated-scpi.json')
for(const path of ['../src/data/automated-scpi.json','src/data/../../other.json','src/data/config.js','src/data/actor.json;echo danger']) assert.throws(()=>requiredDataPath(path))
console.log('Validated data publication: all application code changes block overlay; data refreshes remain independent.')
const {producerPaths,requiredFiles}=await import('./prepare-validated-data.mjs')
const registry={'x.yml':['src/data/a.json','public/data/investors']}
const allowed=['src/data/a.json','public/data/investors']
assert.deepEqual(producerPaths('x.yml','',registry),registry['x.yml'])
assert.throws(()=>producerPaths('unknown.yml','',registry))
assert.throws(()=>producerPaths('x.yml','src/data/a.json',registry))
assert.deepEqual(requiredFiles(registry['x.yml'],['src/data/a.json','public/data/investors/a.json','public/data/investors/b.json','src/pages/Home.jsx'],allowed),['public/data/investors/a.json','public/data/investors/b.json','src/data/a.json'])
assert.throws(()=>requiredFiles(['src/data/a.json'],[],allowed))
assert.throws(()=>requiredFiles(['src/data/a.json'],['src/data/a.json'],[]))
assert.throws(()=>requiredDataPath('public/data/../private'))
console.log('Producer receipts cover multiple outputs and every recorded directory member; unknown and unowned files fail closed.')

assert.deepEqual(consumerChanges(['src/data/inflation-monthly.js']),[],'Generated INSEE data is checked as producer bytes, not interpreted as changed financial code')


assert.equal(requiredDataPath('public/data/holdings-discovery.json'),'public/data/holdings-discovery.json')
for(const path of ['public/data/private.js','public/data/../private.json','public/data/a.json/child'])assert.throws(()=>requiredDataPath(path))

// A stale checked-in projection must not block a valid rebuild. No unrelated
// source becomes exempt merely because its name resembles a generated file.
const {primaryDataPaths}=await import('./prepare-validated-data.mjs')
const {readFileSync}=await import('node:fs')
const {execFileSync}=await import('node:child_process')
const derived=JSON.parse(readFileSync('scripts/validated-derived-data.json')).outputs
const prebuild=JSON.parse(readFileSync('package.json')).scripts.prebuild
assert(prebuild.split('&&').some(command=>command.trim()==='npm run generate:app'),'Prebuild must execute the named preparation pipeline')
// Follow the public command instead of assuming every producer is inline in npm.
// --list exposes the executed plan without rewriting inputs during this check.
const pipeline=execFileSync('npm',['run','generate:app','--','--list'],{encoding:'utf8'}).split('\n').map(line=>line.trim())
for(const [path,generator]of Object.entries(derived)){
 assert(pipeline.includes('node '+generator),`${path}: generator must run in prebuild`)
 assert(readFileSync(generator,'utf8').includes('/'+path.split('/').at(-1)),`${path}: output must be declared by its generator`)
}
const raw=['src/data/automated-monthly.json','src/data/anniversary-levels.json','src/data/dca-complete-holdings.json','src/data/my-history-links.json']
assert.deepEqual(primaryDataPaths([...raw,...Object.keys(derived)]),raw)
const producers=JSON.parse(readFileSync('scripts/validated-data-producers.json'))
for(const producer of Object.keys(producers))assert(producerPaths(producer,'',producers).length>0)
assert.throws(()=>producerPaths('only-derived.yml','',{'only-derived.yml':['src/data/equity-history-links.json']}))
console.log('Only nine explicit reproducible projections are rebuilt; every other source stays mandatory, including future unknown JSON outputs.')

// Exercise the ordinary entry point in an isolated repository. Its expected
// source files must exist before any public result, including early exits.
const {mkdtempSync,mkdirSync,writeFileSync,rmSync}=await import('node:fs')
const {tmpdir}=await import('node:os')
const {join}=await import('node:path')
const {main:prepare}=await import('./prepare-validated-data.mjs')
const root=mkdtempSync(join(tmpdir(),'publisher-expected-receipt-')),previousCwd=process.cwd(),previousFetch=globalThis.fetch
const envKeys=['DATA_PRODUCER','REQUIRED_DATA_PATH','REQUIRED_DATA_RECEIPT','EXPECTED_DATA_RECEIPT','GITHUB_REPOSITORY','GITHUB_OUTPUT'],previousEnv=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]))
try{
 process.chdir(root)
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 git('init','-q');git('config','user.name','isolated test');git('config','user.email','test@example.invalid')
 mkdirSync('public/data/investors',{recursive:true});writeFileSync('public/data/investors/test.json','{"value":1}\n');writeFileSync('public/data/investors/review-metadata.json','[]\n')
 git('add','.');git('commit','-qm','recorded source data');const base=git('rev-parse','HEAD')
 mkdirSync('src/pages',{recursive:true});writeFileSync('src/pages/test.jsx','export default 1\n');git('add','.');git('commit','-qm','pending consumer code');const next=git('rev-parse','HEAD')
 Object.assign(process.env,{DATA_PRODUCER:'update-investor-13f.yml',REQUIRED_DATA_PATH:'',REQUIRED_DATA_RECEIPT:join(root,'required.json'),EXPECTED_DATA_RECEIPT:join(root,'receipt.json'),GITHUB_REPOSITORY:'test/repo',GITHUB_OUTPUT:join(root,'outputs')})
 for(const scenario of ['newer-public-data','pending-consumer','public-lookup-failure']){
  git('checkout','-q','--detach',scenario==='newer-public-data'?base:next)
  const source=git('rev-parse','HEAD');writeFileSync(process.env.GITHUB_OUTPUT,'')
  for(const p of [process.env.REQUIRED_DATA_RECEIPT,process.env.EXPECTED_DATA_RECEIPT])rmSync(p,{force:true})
  globalThis.fetch=async()=>{
   const expected=JSON.parse(readFileSync(process.env.REQUIRED_DATA_RECEIPT)),receipt=JSON.parse(readFileSync(process.env.EXPECTED_DATA_RECEIPT))
   assert.deepEqual(receipt,{schemaVersion:1,commit:source,files:expected});assert.equal(Object.keys(expected).length,2)
   for(const [path,sha]of Object.entries(expected))assert.equal(sha,git('rev-parse',`${source}:${path}`))
   if(scenario==='public-lookup-failure')throw Error('isolated unavailable public endpoint')
   return{ok:true,json:async()=>({sha:base,dataSha:scenario==='newer-public-data'?next:base})}
  }
  if(scenario==='public-lookup-failure')await assert.rejects(prepare(),/isolated unavailable/)
  else await prepare()
  const outputs=readFileSync(process.env.GITHUB_OUTPUT,'utf8');assert(outputs.includes('receipt_ready=true'));assert(outputs.includes('data_sha='+source));assert(!outputs.includes('current=true'))
  if(scenario==='pending-consumer')assert(outputs.includes('needs_code=true'))
 }
}finally{
 globalThis.fetch=previousFetch;process.chdir(previousCwd)
 for(const k of envKeys)if(previousEnv[k]===undefined)delete process.env[k];else process.env[k]=previousEnv[k]
 rmSync(root,{recursive:true,force:true})
}
console.log('Expected producer receipts are frozen before public lookup and survive newer-data/code-gate exits and network failure; no publication is inferred.')
const publicationWorkflow=readFileSync(new URL('../.github/workflows/publish-validated-data.yml',import.meta.url),'utf8')
const receiptUpload=publicationWorkflow.split(/(?=      - uses: actions\/upload-artifact@)/).find(s=>s.includes('name: data-publication-receipt'))
assert(receiptUpload?.includes('always()')&&receiptUpload.includes('steps.plan.outputs.receipt_ready'))
assert(!receiptUpload.split('with:')[0].includes('steps.producer.outcome')&&!receiptUpload.split('with:')[0].includes('steps.plan.outputs.current'),'Expected receipt must remain observable when publication is skipped or fails')

// Artifact names are immutable per run. The outer producer already froze its
// exact expectation before a nested code gate; never replace it with --all.
const codeWorkflow=readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8')
assert.match(codeWorkflow,/producer_receipt_declared:[\s\S]*?type: boolean\s+default: false/)
const codeReceiptUpload=codeWorkflow.split(/(?=      - uses: actions\/upload-artifact@)/).find(s=>s.includes('name: data-publication-receipt'))
assert(codeReceiptUpload.includes('!inputs.producer_receipt_declared'),'Nested code validation must preserve the original producer artifact without a name collision')
assert.match(codeWorkflow,/Record the data snapshot requested for publication[\s\S]*?data_publication.py receipt --all/,'The local full-snapshot validation receipt remains mandatory')
assert.match(publicationWorkflow,/publish-code:[\s\S]*?producer_receipt_declared: true/,'Only the outer caller that uploaded its receipt declares ownership')
console.log('Nested code validation preserves the immutable producer receipt; direct code publication keeps its default all-snapshot receipt.')

// Distinct artifacts from two collectors shared a caller SHA and Pages kept
// serving the preceding dataset. Deployment identity must follow the receipt,
// without changing GITHUB_SHA, skipping the order guard or weakening verification.
const {deploySnapshot}=await import('./deploy-validated-pages.mjs')
const endpoint='https://api.github.com/repos/madmax91310/shinny-potato/pages/deployments'
const baseDeployment={repo:'madmax91310/shinny-potato',ref:'refs/heads/master',event:'schedule',artifactId:'13777766942',
 codeSha:'d7c50e6ed9a36302ed788c1ce5e46d9fca7530a3',dataSha:'d515b99bdebe787a0b5d476285e74e68e59fa4f5',
 headSha:'d515b99bdebe787a0b5d476285e74e68e59fa4f5',eventSha:'200166e59320852553b6c720076fff8d461485c1',
 token:'isolated-api-credential',oidcToken:'isolated-runtime-credential',oidcUrl:'https://vstoken.actions.githubusercontent.com/isolated',
 build:{sha:'d7c50e6ed9a36302ed788c1ce5e46d9fca7530a3',dataSha:'d515b99bdebe787a0b5d476285e74e68e59fa4f5'}}
function deploymentHarness(config=baseDeployment,statuses=['queued','succeed'],settings={}){
 let now=0;const calls=[],logs=[]
 const fetcher=async(url,options)=>{
  calls.push({url:String(url),options})
  if(String(url)===config.oidcUrl)return settings.badOidc?new Response('not-json-private-body'):Response.json({value:'isolated-oidc-assertion'})
  if(String(url)===endpoint)return settings.postFailure?Response.json({}, {status:503}):Response.json({id:config.dataSha,status_url:settings.badStatusUrl??settings.actualStatusUrl??endpoint+'/'+config.dataSha,page_url:'https://madmax91310.github.io/shinny-potato/'},{status:201})
  if(String(url)===endpoint+'/'+config.dataSha+'/cancel')return new Response(null,{status:204})
  assert.equal(String(url),settings.actualStatusUrl??endpoint+'/'+config.dataSha,'Authorization never leaves the exact repository and deployment status endpoint')
  const status=statuses.length>1?statuses.shift():statuses[0]
  return typeof status==='number'?Response.json({}, {status,headers:{'retry-after':'1'}}):Response.json({status})
 }
 return {calls,logs,dependencies:{fetcher,clock:()=>now,sleep:async ms=>{now+=ms},log:message=>logs.push(message),...(settings.timeout?{timeout:settings.timeout}:{})}}
}
for(const [eventSha,dataSha,artifactId]of[
 ['200166e59320852553b6c720076fff8d461485c1','d515b99bdebe787a0b5d476285e74e68e59fa4f5','13777766942'],
 ['d515b99bdebe787a0b5d476285e74e68e59fa4f5','b28fc20865defe23c14ebdc3743b521ccafb1962','13783154054']]){
 const config={...baseDeployment,eventSha,dataSha,headSha:dataSha,artifactId,build:{...baseDeployment.build,dataSha}},h=deploymentHarness(config)
 const result=await deploySnapshot(config,h.dependencies),creation=h.calls.find(c=>c.options.method==='POST')
 assert.equal(JSON.parse(creation.options.body).pages_build_version,dataSha)
 assert.equal(JSON.parse(creation.options.body).artifact_id,Number(artifactId))
 assert.equal(config.eventSha,eventSha,'Caller provenance is retained, never overwritten')
 assert.equal(result.pages_build_version,dataSha);assert.equal(result.deployment_id,dataSha)
 assert(!h.calls.some(c=>c.url.endsWith('/cancel')))
 assert(!JSON.stringify([result,h.logs]).includes('isolated-oidc-assertion'))
}
// Regression from actual GitHub job130120358454/run42897897981, 2026-11-10.
// Its create response is not the REST resource URL assumed by the first mock.
{
 const dataSha='9c9bec68c98073e6c3cb00c53929b5c9f4f28043'
 const config={...baseDeployment,artifactId:'13801124855',codeSha:'a94db8be106863574896bb521337ad71f9c49671',dataSha,headSha:dataSha,build:{sha:'a94db8be106863574896bb521337ad71f9c49671',dataSha}}
 const actualStatusUrl=`https://api.github.com/repos/madmax91310/shinny-potato/pages/deployment/status/${dataSha}`
 const h=deploymentHarness(config,['queued','succeed'],{actualStatusUrl})
 assert.equal((await deploySnapshot(config,h.dependencies)).pages_build_version,dataSha)
 assert.equal(h.calls.filter(c=>c.url===actualStatusUrl).length,2)
 assert(!h.calls.some(c=>c.url.endsWith('/cancel')))
 for(const badStatusUrl of [actualStatusUrl+'?other=1',actualStatusUrl+'#fragment',actualStatusUrl.replace('shinny-potato','other-repository'),actualStatusUrl.replace('api.github.com','api.github.com.evil.example'),actualStatusUrl.replace(dataSha,'a'.repeat(40))]){
  const rejected=deploymentHarness(config,['succeed'],{badStatusUrl})
  await assert.rejects(()=>deploySnapshot(config,rejected.dependencies),/Unexpected Pages status endpoint/)
  assert(!rejected.calls.some(c=>c.url===badStatusUrl),'An invalid response URL is rejected before any authorized GET')
 }
}
for(const change of[{headSha:'a'.repeat(40)},{build:{...baseDeployment.build,dataSha:'a'.repeat(40)}},{artifactId:''},{artifactId:'9007199254740993'},{ref:'refs/heads/other'},{event:'pull_request'},{oidcUrl:'https://example.org/token'}]){
 const h=deploymentHarness();await assert.rejects(()=>deploySnapshot({...baseDeployment,...change},h.dependencies));assert.equal(h.calls.length,0)
}
for(const [statuses,settings,message]of[
 [['deployment_failed'],{},/Pages deployment failed/],
 [['queued'],{timeout:6000},/deadline exceeded/],
 [[503],{},/HTTP 503/],
 [['succeed'],{badStatusUrl:'https://example.org/private'},/Unexpected Pages status endpoint/]]){
 const h=deploymentHarness(baseDeployment,statuses,settings)
 await assert.rejects(()=>deploySnapshot(baseDeployment,h.dependencies),message)
 assert.equal(h.calls.filter(c=>c.url.endsWith('/cancel')).length,1,'Only this incomplete deployment is cancelled')
}
const partial=deploymentHarness(baseDeployment,[503,'succeed']);await deploySnapshot(baseDeployment,partial.dependencies)
assert(!partial.calls.some(c=>c.url.endsWith('/cancel')),'A recovered status request can complete normally')
const failedCreation=deploymentHarness(baseDeployment,['succeed'],{postFailure:true});await assert.rejects(()=>deploySnapshot(baseDeployment,failedCreation.dependencies),/HTTP 503/)
assert.equal(failedCreation.calls.filter(c=>c.options.method==='POST').length,1,'An uncertain creation is never blindly duplicated')
const badIdentity=deploymentHarness(baseDeployment,['succeed'],{badOidc:true});await assert.rejects(()=>deploySnapshot(baseDeployment,badIdentity.dependencies),/Invalid JSON/)
assert.equal(badIdentity.calls.length,1)
assert.match(publicationWorkflow,/id: pages_artifact[\s\S]*PAGES_ARTIFACT_ID: \$\{\{ steps\.pages_artifact\.outputs\.artifact_id \}\}/)
assert.match(publicationWorkflow,/PAGES_DATA_SHA: \$\{\{ steps\.compose\.outputs\.data_sha \}\}/)
assert(publicationWorkflow.indexOf('id: order')<publicationWorkflow.indexOf('node scripts/deploy-validated-pages.mjs'))
assert(publicationWorkflow.indexOf('node scripts/deploy-validated-pages.mjs')<publicationWorkflow.indexOf('node scripts/verify-pages-publication.mjs'))
console.log('Recorded Pages version: both real caller/snapshot cases, exact artifact identity, OIDC isolation, strict chronology, bounded recovery/cancellation and unchanged public verification.');
assert.match(publicationWorkflow,/fetch-depth: 0\s+#.*\n\s+#.*\n\s+filter: blob:none/,'Full ancestry and complete current checkout must survive lazy historical-blob acquisition')
