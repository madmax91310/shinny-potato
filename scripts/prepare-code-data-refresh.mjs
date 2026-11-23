// A fully validated code snapshot may adopt later data while holding the Pages
// lock. Source/code changes still require their own complete validation.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {appendFileSync,readFileSync,writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {automationPaths,classify} from './classify-deploy-scope.mjs'
import {compose} from './compose-fallback-snapshot.mjs'
import {requiredFiles,primaryDataPaths} from './prepare-validated-data.mjs'
export function codeDataCandidates({code,head,ancestor,changed,allowed,history}) {
 assert(ancestor(code,head),'Validated code must belong to master history')
 // Follow the master history one commit at a time. A change and its later
 // revert still form a boundary for data collected with the intervening code.
 const candidates = [code]
 for (const next of history(code, head)) {
  if (!ancestor(code, next)) continue
  if (!classify(changed(candidates.at(-1), next), allowed).dataOnly) break
  candidates.push(next)
 }
 return candidates
}

export function prepareRefresh({code, candidates, composeData, restoreCode, rejected}) {
 // Only the unknown-identifier holdback can defer a suffix. A compatibility
 // error or failed build remains a blocking error for its own release.
 for (const data of [...candidates].reverse()) {
  if (data === code) return code
  const result = composeData(data)
  if (!result.heldBack.length) return data
  rejected(data, result.heldBack)
  restoreCode()
 }
 throw new Error('The validated code snapshot must be a publication candidate')
}

async function main(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 const ancestor=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true}catch{return false}}
 const code=git('rev-parse','HEAD');assert.equal(code,process.env.VALIDATED_CODE_SHA)
 git('fetch','--no-tags','origin','refs/heads/master:refs/remotes/origin/master')
 const allowed=automationPaths()
 assert.equal(git('status','--porcelain','--untracked-files=no'),'','Validated checkout must be clean before composing data')
 const candidates=codeDataCandidates({code,head:git('rev-parse','origin/master'),ancestor,allowed,
  changed:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),
  history:(a,b)=>git('rev-list','--first-parent','--reverse',`${a}..${b}`).split('\n').filter(Boolean)})
 const data=prepareRefresh({
  code, candidates,
  composeData: data => compose({published:code,data,allowed}),
  restoreCode: () => git('reset','--hard',code),
  rejected: (data, heldBack) => console.warn(
   `Deferring ${data} until full validation covers its new identifiers: ${heldBack.map(({file, ids}) => `${file} (${ids.slice(0, 5).join(', ')})`).join('; ')}`
  )
 })
 const refresh=data!==code
 if(refresh){
  const producers=JSON.parse(readFileSync(new URL('./validated-data-producers.json',import.meta.url)))
  const paths=primaryDataPaths(Object.values(producers).flat())
  const files=requiredFiles(paths,git('ls-tree','-r','--name-only',data).split('\n'),allowed)
  writeFileSync(process.env.REQUIRED_DATA_RECEIPT,JSON.stringify(Object.fromEntries(files.map(path=>[path,git('rev-parse',`${data}:${path}`)])))+'\n')
 }
 appendFileSync(process.env.GITHUB_OUTPUT,`code_sha=${code}\ndata_sha=${data}\nrefresh=${refresh}\n`)
 console.log(`Fully validated code ${code}; data ${data}; data rebuild required: ${refresh}`)
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main()
