// A fully validated code snapshot may adopt later data while holding the Pages
// lock. Source/code changes still require their own complete validation.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {appendFileSync,readFileSync,writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {automationPaths,classify} from './classify-deploy-scope.mjs'
import {compose} from './compose-fallback-snapshot.mjs'
import {requiredFiles,primaryDataPaths} from './prepare-validated-data.mjs'
export function codeDataSnapshot({code,head,ancestor,changed,allowed,history=()=>[]}) {
 assert(ancestor(code,head),'Validated code must belong to master history')
 if(classify(changed(code,head),allowed).dataOnly)return head
 // Later unvalidated code must not discard the valid data prefix that arrived
 // before it. Never cross that code change to adopt subsequent observations.
 let candidate=code
 for(const next of history(code,head)){
  if(!ancestor(code,next))continue
  if(!classify(changed(candidate,next),allowed).dataOnly)break
  candidate=next
 }
 return candidate
}
async function main(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 const ancestor=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true}catch{return false}}
 const code=git('rev-parse','HEAD');assert.equal(code,process.env.VALIDATED_CODE_SHA)
 git('fetch','--no-tags','origin','refs/heads/master:refs/remotes/origin/master')
 const allowed=automationPaths()
 const data=codeDataSnapshot({code,head:git('rev-parse','origin/master'),ancestor,allowed,
  changed:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),
  history:(a,b)=>git('rev-list','--first-parent','--reverse',`${a}..${b}`).split('\n').filter(Boolean)})
 const refresh=data!==code
 if(refresh){
  const producers=JSON.parse(readFileSync(new URL('./validated-data-producers.json',import.meta.url)))
  const paths=primaryDataPaths(Object.values(producers).flat())
  const files=requiredFiles(paths,git('ls-tree','-r','--name-only',data).split('\n'),allowed)
  writeFileSync(process.env.REQUIRED_DATA_RECEIPT,JSON.stringify(Object.fromEntries(files.map(path=>[path,git('rev-parse',`${data}:${path}`)])))+'\n')
  const result=compose({published:code,data,allowed})
  assert.equal(result.heldBack.length,0,'New identifiers need their own full validation before code/data promotion')
 }
 appendFileSync(process.env.GITHUB_OUTPUT,`code_sha=${code}\ndata_sha=${data}\nrefresh=${refresh}\n`)
 console.log(`Fully validated code ${code}; data ${data}; data rebuild required: ${refresh}`)
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main()
