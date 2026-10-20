// Select a master snapshot before every validation job pins that exact commit.
import {execFileSync} from 'node:child_process'
import {appendFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {automationPaths, classify} from './classify-deploy-scope.mjs'

export function chooseSnapshot({requested, master, ancestor, changed, allowed, fullGate=false}) {
  if(!ancestor(requested,master))return requested
  const paths=changed(requested,master)
  // Workflow definitions are fixed by the triggering event: never run old gates
  // against a snapshot that changed those definitions. Ordinary code still runs
  // every mandatory validation against the selected immutable commit.
  const gatesChanged=paths.some(path=>path.startsWith('.github/workflows/'))
  return classify(paths,allowed).dataOnly || (fullGate&&!gatesChanged) ? master : requested
}

export function alreadyPublished(candidate, info, ancestor) {
  const valid = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
  return valid(info?.sha) && valid(info?.dataSha ?? info?.sha)
    && ancestor(candidate, info.sha) && ancestor(candidate, info.dataSha ?? info.sha)
}

async function main() {
  const git = (...args) => execFileSync('git', args, {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim()
  const ancestor = (a,b) => {try {git('merge-base','--is-ancestor',a,b); return true} catch {return false}}
  const requested = git('rev-parse','HEAD')
  let candidate = requested, current = true
  if (process.env.PAGES_PRODUCTION === 'true') {
    git('fetch','--no-tags','origin','refs/heads/master:refs/remotes/origin/master')
    const master = git('rev-parse','refs/remotes/origin/master')
    if (!ancestor(requested, master)) throw new Error('Requested publication is outside master history')
    candidate = chooseSnapshot({requested,master,ancestor,allowed:automationPaths(),fullGate:true,
      changed:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean)})
    const repo = process.env.GITHUB_REPOSITORY
    const url = `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/build-info.json?selection=${Date.now()}`
    try {
      const response = await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)})
      if (response.ok) current = !alreadyPublished(candidate, await response.json(), ancestor)
    } catch { /* Unknown publication keeps all validations; it never skips them. */ }
  }
  const output = `commit_sha=${candidate}\ncurrent=${current}\n`
  console.log(`Requested ${requested}; selected ${candidate}; validation required: ${current}`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,output)
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
