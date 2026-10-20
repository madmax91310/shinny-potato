import {publicationCodeEpoch} from './publication-code-epoch.mjs'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {appendFileSync,readFileSync,writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {automationPaths,classify} from './classify-deploy-scope.mjs'
// Every changed application module requires the full code gate. Publishing newer
// data over older editorial code would keep superseding the pending calendar build.
export const consumerChanges=paths=>paths.filter(path=>/^src\/.*\.(?:[cm]?js|jsx|tsx?|css)$/.test(path)&&path!=='src/data/inflation-monthly.js')
export function requiredDataPath(path){assert.match(path??'',/^(?:src\/data\/(?:[a-z0-9-]+\.json|inflation-monthly\.js)|public\/data\/[a-z0-9-]+(?:\.json)?)$/);return path}
export function producerPaths(producer,single,registry){
 if(producer){assert(Object.hasOwn(registry,producer),'Unknown validated producer');assert(!single,'Choose a producer or a legacy single path');return registry[producer].map(requiredDataPath)}
 return [requiredDataPath(single)]
}
export function requiredFiles(paths,files,allowed){
 assert(paths.length>0,'No producer data configured')
 const selected=[...new Set(paths.flatMap(path=>{const found=files.filter(file=>file===path||file.startsWith(path+'/'));assert(found.length,`No recorded producer data: ${path}`);return found}))].sort()
 assert(classify(selected,allowed).dataOnly,'Required data must belong to collector commit paths')
 return selected
}
async function main(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 const ancestor=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true}catch{return false}}
 const source=git('rev-parse','HEAD');assert.match(source,/^[a-f0-9]{40}$/)
 const registry=JSON.parse(readFileSync(new URL('./validated-data-producers.json',import.meta.url)))
 const paths=producerPaths(process.env.DATA_PRODUCER,process.env.REQUIRED_DATA_PATH,registry)
 const files=requiredFiles(paths,git('ls-tree','-r','--name-only',source).split('\n'),automationPaths())
 const repo=process.env.GITHUB_REPOSITORY;assert.match(repo??'',/^[\w.-]+\/[\w.-]+$/)
 const url=`https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/build-info.json?data=${source}-${Date.now()}`
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});assert(response.ok,'Published code identity unavailable')
 const info=await response.json();assert.match(info.sha??'',/^[a-f0-9]{40}$/);assert.match(info.dataSha??info.sha,/^[a-f0-9]{40}$/)
 assert(ancestor(info.sha,source),'Published code is outside this data history')
 const write=value=>appendFileSync(process.env.GITHUB_OUTPUT,value+'\n')
 if(!ancestor(info.dataSha??info.sha,source)){write('current=false\nneeds_code=false');console.log('A newer data snapshot is already public.');return}
 write('code_epoch='+publicationCodeEpoch(info.sha,source,git,automationPaths()))
 const changed=git('diff','--name-only',info.sha,source,'--','src').split('\n').filter(Boolean)
 const blocked=consumerChanges(changed)
 if(blocked.length){write('current=false\nneeds_code=true');console.log('Data needs the full code gate for changed financial consumers: '+blocked.join(', '));return}
 const required=Object.fromEntries(files.map(path=>[path,git('rev-parse',`${source}:${path}`)]))
 for(const blob of Object.values(required))assert.match(blob,/^[a-f0-9]{40}$/)
 writeFileSync(process.env.REQUIRED_DATA_RECEIPT,JSON.stringify(required)+'\n')
 // Keep legacy outputs while callers migrate to the producer registry.
 write(`code_sha=${info.sha}\ndata_sha=${source}\nrequired_blob=${required[files[0]]}\ncurrent=true\nneeds_code=false`)
 console.log(`Validated producer: ${files.length} exact files from ${source}, published code ${info.sha}.`)
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main()

