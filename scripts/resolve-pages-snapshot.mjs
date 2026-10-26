// Select a master snapshot before every validation job pins that exact commit.
import {execFileSync} from 'node:child_process'
import {appendFileSync,writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {automationPaths, classify} from './classify-deploy-scope.mjs'
import {compatibleGate,gateReceipt} from './pages-gate-definition.mjs'
import assert from 'node:assert/strict'

export function chooseSnapshot({requested, master, ancestor, changed, allowed, fullGate=false, compatibleGate:matches}) {
  if(fullGate)assert(typeof matches==='function' && matches(requested), 'Requested snapshot does not match the executing gate definition')
  if(!ancestor(requested,master))return requested
  const paths=changed(requested,master)
  // Only the declared, actually executing gate closure is frozen by GitHub.
  // Unrelated collector workflows must not hold ordinary full-code validation.
  return (classify(paths,allowed).dataOnly && !fullGate) || (fullGate&&matches(master)) ? master : requested
}

export function alreadyPublished(candidate, info, ancestor, {changed,allowed}={}) {
 const valid = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
 if(!valid(candidate)||!valid(info?.sha)||!valid(info?.dataSha??info?.sha)
    ||!ancestor(candidate,info.dataSha??info.sha))return false
 if(ancestor(candidate,info.sha))return true
 // A validated data publisher can serve newer observations over unchanged code.
 // Require that exact data prefix AND prove every intervening path is permitted
 // automation data; a script, workflow or consumer change still needs the gate.
 if(!ancestor(info.sha,candidate)||typeof changed!=='function'||!Array.isArray(allowed))return false
 try{return classify(changed(info.sha,candidate),allowed).dataOnly}
 catch{return false} // Missing history must never certify a publication.
}

export function planSnapshot(options){
 const {requested,info,ancestor}=options
 if(alreadyPublished(requested,info,ancestor,options))return {candidate:requested,current:false}
 const candidate=chooseSnapshot(options)
 return {candidate,current:!alreadyPublished(candidate,info,ancestor,options)}
}

async function main() {
  const git = (...args) => execFileSync('git', args, {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim()
  const ancestor = (a,b) => {try {git('merge-base','--is-ancestor',a,b); return true} catch {return false}}
  const requested = git('rev-parse','HEAD')
  // For our local reusable calls, caller and callee definitions are loaded from
  // the caller's workflow commit, not inputs.ref (which may be newer data/code).
  const definition = process.env.PAGES_DEFINITION_SHA || process.env.GITHUB_WORKFLOW_SHA
  const matches = ref => compatibleGate(definition, ref, git)
  let candidate = requested, current = true
  if (process.env.PAGES_PRODUCTION === 'true') {
    git('fetch','--no-tags','origin','refs/heads/master:refs/remotes/origin/master')
    const master = git('rev-parse','refs/remotes/origin/master')
    if (!ancestor(requested, master)) throw new Error('Requested publication is outside master history')
    const repo = process.env.GITHUB_REPOSITORY
    const url = `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/build-info.json?selection=${Date.now()}`
    let info=null
    try {
      const response = await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)})
      if(response.ok)info=await response.json()
    } catch { /* Unknown publication keeps every validation. */ }
    ;({candidate,current}=planSnapshot({requested,master,info,ancestor,allowed:automationPaths(),fullGate:true,compatibleGate:matches,
      changed:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean)}))
  }
  if(current){
    const receipt=gateReceipt(definition,candidate,git)
    assert(process.env.PAGES_GATE_RECEIPT, 'The gate receipt output is required')
    writeFileSync(process.env.PAGES_GATE_RECEIPT,JSON.stringify(receipt,null,2)+'\n')
    console.log(`Gate definition ${definition}; fingerprint ${receipt.fingerprint}; selected code ${candidate}`)
  }
  const output = `commit_sha=${candidate}\ncurrent=${current}\n`
  console.log(`Requested ${requested}; selected ${candidate}; validation required: ${current}`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,output)
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main()

