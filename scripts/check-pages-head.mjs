// Publication order follows what is actually online. A fully validated snapshot
// may publish while newer commits are still validating, but never restore older
// published code or data. The workflow gates and publication lock stay mandatory.
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const ancestor = (a, b) => { try { git('merge-base', '--is-ancestor', a, b); return true } catch { return false } }
const sha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
const emit = (current, reason) => {
  console.log(`${current ? 'Publishable' : 'Skipping superseded'} Pages snapshot: ${reason}`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `current=${current}\n`)
}
async function json(url, authenticated = false) {
  const headers = { Accept: 'application/vnd.github+json', 'Cache-Control': 'no-cache' }
  if (authenticated && process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Cannot establish publication order: HTTP ${response.status}`)
  return response.json()
}
const candidate = git('rev-parse', 'HEAD')
if (process.env.PAGES_FALLBACK === 'true' && !sha(process.env.PAGES_CODE_SHA)) {
  throw new Error('Fallback publication requires the exact built code identity')
}
const code = process.env.PAGES_CODE_SHA || candidate
// A checkout is shallow in Actions. Fetch the actual master history before any
// ancestry comparison; a broken/missing remote remains a blocking error.
const shallow = git('rev-parse', '--is-shallow-repository') === 'true'
git('fetch', '--no-tags', ...(shallow ? ['--unshallow'] : []), 'origin', 'refs/heads/master:refs/remotes/origin/master')
const master = git('rev-parse', 'refs/remotes/origin/master')
if (!sha(code) || !ancestor(code, candidate)) throw new Error('Invalid built code identity')
if (!ancestor(candidate, master)) emit(false, 'the built commit is not an ancestor of master')
else if (process.argv.includes('--validation')) emit(true, 'validation may run before newer data collections complete')
else {
  const changed = git('diff', '--name-only', candidate, master).split('\n').filter(Boolean)
  const repository = process.env.GITHUB_REPOSITORY
  const publishedUrl = process.env.PAGES_PUBLISHED_URL ?? (repository ? `https://${repository.split('/')[0]}.github.io/${repository.split('/')[1]}/build-info.json` : null)
  if (!publishedUrl) throw new Error('Published build-info URL is required')
  const url = new URL(publishedUrl); url.searchParams.set('order', `${candidate}-${Date.now()}`)
  const info = await json(url)
  if (!sha(info.sha) || info.dataSha != null && !sha(info.dataSha)) throw new Error('Invalid published build identity')
  const publishedData = [info.dataSha ?? info.sha]
  const codeCurrent = ancestor(info.sha, code)
  // The API additionally protects against a temporarily stale Pages CDN: only
  // a successful deployment with a real page URL counts. Skipped deployment
  // jobs also say success, but have an empty environment_url.
  if (repository) {
    const api = process.env.GITHUB_API_URL ?? 'https://api.github.com'
    const deployments = await json(`${api}/repos/${repository}/deployments?environment=github-pages&per_page=10`, true)
    const states = await Promise.all(deployments.map(async deployment => ({ deployment, statuses: await json(deployment.statuses_url, true) })))
    const active = states.find(({ statuses }) => statuses[0]?.state === 'success' && statuses[0]?.environment_url)
    if (active) {
      if (!sha(active.deployment.sha)) throw new Error('Invalid published deployment identity')
      publishedData.push(active.deployment.sha)
    }
  }
  if (!codeCurrent || !publishedData.every(ref => ancestor(ref, candidate))) emit(false, 'a newer code or data snapshot is already published (or history is unknown)')
  else emit(true, `${candidate}; ${changed.length} newer file change(s) remain eligible for later validated publication`)
}

