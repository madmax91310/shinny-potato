import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {setTimeout as wait} from 'node:timers/promises'
import {createHash} from 'node:crypto'
const [base,expectedCode,expectedData=expectedCode,manifestPath='dist/data/publication-manifest.json']=process.argv.slice(2)
if(!/^https:/.test(base??'') || ![expectedCode,expectedData].every(s=>/^[0-9a-f]{40}$/.test(s??'')))throw Error('Exact publication URL/code/data identity required')
const expected=JSON.parse(readFileSync(manifestPath))
async function json(path){
 const url=new URL(path,base.endsWith('/')?base:base+'/');url.searchParams.set('verify',`${expectedData}-${Date.now()}`)
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)})
 if(!response.ok)throw Error(`${path}: HTTP ${response.status}`)
 return response.json()
}
async function verifyPublicFiles(manifest){
 const entries=Object.entries(manifest.files).filter(([path])=>path.startsWith('public/data/'))
 let next=0
 await Promise.all(Array.from({length:4},async()=>{
  while(next<entries.length){
   const [path,hash]=entries[next++]
   const url=new URL(path.slice('public/'.length),base.endsWith('/')?base:base+'/')
   url.searchParams.set('verify',`${expectedData}-${Date.now()}`)
   const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)})
   assert.ok(response.ok,`${path}: HTTP ${response.status}`)
   const body=Buffer.from(await response.arrayBuffer())
   const actual=createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')
   assert.equal(actual,hash,`Public bytes differ from validated data: ${path}`)
  }
 }))
 return entries.length
}
let last
for(let attempt=0;attempt<30;attempt++){
 try{
  const before=await json('build-info.json')
  assert.equal(before.sha,expectedCode);assert.equal(before.dataSha??before.sha,expectedData)
  const manifest=await json('data/publication-manifest.json')
  assert.deepEqual(manifest,expected,'Published data differs from the validated artifact')
  const publicFilesVerified=await verifyPublicFiles(manifest)
  const summary=await json('data/data-automation-summary.json')
  const after=await json('build-info.json');assert.deepEqual(after,before,'Publication changed during verification')
  mkdirSync('test-artifacts',{recursive:true})
  writeFileSync('test-artifacts/publication-verified.json',JSON.stringify({build:after,checkedAt:new Date().toISOString(),files:Object.keys(manifest.files).length,publicFilesVerified,summary},null,2)+'\n')
  console.log(`Verified public code ${expectedCode}, data ${expectedData}, ${Object.keys(manifest.files).length} data files.`)
  process.exit(0)
 }catch(error){last=error;console.log(`Public verification ${attempt+1}/30: ${error.message.slice(0,220)}`)}
 if(attempt<29)await wait(15000)
}
throw last
