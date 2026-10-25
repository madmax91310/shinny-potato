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
const derived=JSON.parse(readFileSync('scripts/validated-derived-data.json')).outputs
const pipeline=JSON.parse(readFileSync('package.json')).scripts.prebuild
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
const {execFileSync}=await import('node:child_process')
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
