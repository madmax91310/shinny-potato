#!/usr/bin/env node
// Decides whether a snapshot may use the data-only deployment lane.
//
// A snapshot is "data only" when every file changed since the commit currently
// published on GitHub Pages is a path that an automation is allowed to commit
// (the paths passed to commit-validated-data.sh in .github/workflows). Its code
// is then identical to a snapshot that already passed the full gate, so editorial
// and visual browser checks become advisory: they can no longer hold refreshed
// data back. Any doubt (unknown published commit, unrelated history, code change)
// keeps the full gate.
//
// Usage: node scripts/classify-deploy-scope.mjs [--head <rev>] [--published <sha>] [--published-url <url>]
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, appendFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

export function automationPaths(workflowDir = path.join(ROOT, '.github/workflows')) {
  const paths = new Set()
  for (const file of readdirSync(workflowDir).filter(name => /\.ya?ml$/.test(name))) {
    const text = readFileSync(path.join(workflowDir, file), 'utf8')
    for (const match of text.matchAll(/commit-validated-data\.sh\s+(?:'[^']*'|"[^"]*")\s+([^\n]+)/g)) {
      for (const token of match[1].trim().split(/\s+/)) {
        const cleaned = token.replace(/^["']|["']$/g, '')
        if (cleaned && !cleaned.startsWith('$') && !cleaned.startsWith('-')) paths.add(cleaned)
      }
    }
  }
  return [...paths].sort()
}

function toMatcher(pattern) {
  if (!pattern.includes('*')) return file => file === pattern || file.startsWith(`${pattern.replace(/\/$/, '')}/`)
  const regex = new RegExp(`^${pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')}$`)
  return file => regex.test(file)
}

export function classify(changedFiles, allowed) {
  const matchers = allowed.map(toMatcher)
  const outside = changedFiles.filter(file => !matchers.some(match => match(file)))
  return { dataOnly: outside.length === 0, outside }
}

async function publishedSha(explicit, url) {
  if (explicit) return explicit
  if (!url) return null
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
    if (!response.ok) return null
    const info = await response.json()
    return /^[0-9a-f]{40}$/.test(info?.sha ?? '') ? info.sha : null
  } catch {
    return null
  }
}

function output(values) {
  for (const [key, value] of Object.entries(values)) console.log(`${key}=${value}`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''))
}

async function main() {
  const args = process.argv.slice(2)
  const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
  const head = git('rev-parse', option('--head') ?? 'HEAD')
  const candidate = await publishedSha(option('--published'), option('--published-url'))
  let published = null
  try { if (candidate) published = git('rev-parse', '--verify', `${candidate}^{commit}`) } catch { /* unknown below */ }
  const fullGate = reason => { console.log(`Full gate: ${reason}`); output({ data_only: 'false', published: published ?? '' }) }
  if (!candidate) return fullGate('published commit unknown')
  if (!published) return fullGate(`published commit ${candidate} not in history`)
  try { git('merge-base', '--is-ancestor', published, head) } catch { return fullGate(`${head} does not descend from published ${published}`) }
  const changed = git('diff', '--name-only', published, head).split('\n').filter(Boolean)
  const { dataOnly, outside } = classify(changed, automationPaths())
  if (!dataOnly) return fullGate(`${outside.length} non-data file(s) changed since ${published.slice(0, 8)}: ${outside.slice(0, 10).join(', ')}`)
  console.log(`Data-only lane: ${changed.length} automation data file(s) changed since published ${published.slice(0, 8)}.`)
  output({ data_only: 'true', published })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
