import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {appendFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
// These pending editorial changes do not interpret financial observations.
const independent=new Set(['src/data/editorial-calendar.js','src/pages/Home.jsx','src/tools.js'])
export const consumerChanges=paths=>paths.filter(path=>/^src\/.*\.(?:[cm]?js|jsx|tsx?|css)$/.test(path)&&!independent.has(path))
export function requiredDataPath(path){assert.match(path??'',/^src\/data\/[a-z0-9-]+\.json$/);return path}
async function main(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 const ancestor=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true}catch{return false}}
 const source=git('rev-parse','HEAD');assert.match(source,/^[a-f0-9]{40}$/)
 const path=requiredDataPath(process.env.REQUIRED_DATA_PATH)
 const repo=process.env.GITHUB_REPOSITORY;assert.match(repo??'',/^[\w.-]+\/[\w.-]+$/)
 const url=`https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/build-info.json?data=${source}-${Date.now()}`
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});assert(response.ok,'Published code identity unavailable')
 const info=await response.json();assert.match(info.sha??'',/^[a-f0-9]{40}$/);assert.match(info.dataSha??info.sha,/^[a-f0-9]{40}$/)
 assert(ancestor(info.sha,source),'Published code is outside this data history')
 const write=value=>appendFileSync(process.env.GITHUB_OUTPUT,value+'\n')
 if(!ancestor(info.dataSha??info.sha,source)){write('current=false');console.log('A newer data snapshot is already public.');return}
 const changed=git('diff','--name-only',info.sha,source,'--','src').split('\n').filter(Boolean)
 const blocked=consumerChanges(changed)
 if(blocked.length){write('current=false');console.log('Data waits for changed financial consumers: '+blocked.join(', '));return}
 const blob=git('rev-parse',`${source}:${path}`);assert.match(blob,/^[a-f0-9]{40}$/)
 write(`code_sha=${info.sha}\ndata_sha=${source}\nrequired_blob=${blob}\ncurrent=true`)
 console.log(`Validated data ${source} may update unchanged financial consumers in published code ${info.sha}.`)
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main()
