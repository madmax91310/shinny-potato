import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { collectObservations } from './update-editorial-radar.mjs'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { collectRadarNews } from './lib/radar-news.mjs'

// Data publication is one atomic commit on a dedicated branch. It does not
// rewrite master or depend on an application rebuild for each observation.
const repo = process.env.GITHUB_REPOSITORY, token = process.env.GH_TOKEN
if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') || !token) throw new Error('Connexion GitHub du workflow manquante.')
async function api(path, method = 'GET', body, allow404 = false) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, { method, signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    if (allow404 && response.status === 404) return null
    if (response.ok) return response.json()
    if (method === 'GET' && response.status >= 500 && attempt < 2) { await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); continue }
    throw new Error(`Publication radar refusée (${response.status}) : ${method} ${path}`)
  }
}
const branch = 'radar-data'
let ref = await api(`git/ref/heads/${branch}`, 'GET', undefined, true)
let previous = null
if (ref) {
  const files = await api(`git/trees/${ref.object.sha}`)
  const stateFile = files.tree.find(file => file.path === 'state.json')
  if (!stateFile) throw new Error('La branche radar existe sans historique : initialisation silencieuse refusée.')
  const blob = await api(`git/blobs/${stateFile.sha}`)
  previous = JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8'))
}
const { observations, errors } = await collectObservations()
if (!observations.length || errors.some(error => error.family === 'radar')) throw new Error('Sources locales incomplètes ; historique conservé.')
const news = await collectRadarNews()
observations.push(...news.observations); errors.push(...news.errors)
const result = advanceRadar(previous, observations, { sourceRevision: process.env.RADAR_SOURCE_SHA ?? '', errors })
const output = resolve(process.env.RUNNER_TEMP ?? '/tmp', 'editorial-radar')
await mkdir(output, { recursive: true })
await writeFile(resolve(output, 'feed.json'), `${JSON.stringify(result.feed, null, 2)}\n`)
// Create only after successful extraction and validation.
const parent = ref ? ref.object.sha : (await api('git/ref/heads/master')).object.sha
const commit = await api(`git/commits/${parent}`)
const tree = []
for (const [path, content] of [['state.json', result.state], ['feed.json', result.feed]]) {
  const blob = await api('git/blobs', 'POST', { content: `${JSON.stringify(content, null, 2)}\n`, encoding: 'utf-8' })
  tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
}
const nextTree = await api('git/trees', 'POST', { base_tree: commit.tree.sha, tree })
const nextCommit = await api('git/commits', 'POST', { message: `Radar: ${result.newEvents.length} new signals, validated daily observations`, tree: nextTree.sha, parents: [parent] })
if (ref) await api(`git/refs/heads/${branch}`, 'PATCH', { sha: nextCommit.sha, force: false })
else await api('git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: nextCommit.sha })
console.log(`Radar publié : ${result.feed.observationCount} observations, ${result.newEvents.length} nouveautés, ${result.feed.errors.length} réserves.`)
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `## Radar éditorial\n\n${result.feed.observationCount} observations analysées ; ${result.newEvents.length} nouveaux signaux ; ${result.feed.errors.length} observations non exploitables.\n\nLe premier relevé est silencieux. Les signaux suivants conservent leurs deux observations et leurs sources.\n`)
