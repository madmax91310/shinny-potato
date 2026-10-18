#!/usr/bin/env node
// Fallback lane: "last validated code + fresh data".
//
// When the full gate fails on a master snapshot whose code changed since the
// published commit, refreshed data must not wait for a human to repair the code.
// This script checks out the published commit (code that already passed the full
// gate) and overlays every automation data path from the new snapshot. The
// combined tree is then rebuilt and smoke-tested before it may be published.
//
// Usage (from a full clone of the new snapshot):
//   node scripts/compose-fallback-snapshot.mjs --published <sha> [--data <rev>]
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { automationPaths, classify } from './classify-deploy-scope.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function fallbackFiles(dataFiles, allowed) {
  // Same matcher as the data-only lane: only paths an automation may commit.
  return dataFiles.filter(file => classify([file], allowed).dataOnly)
}

export function compose({ published, data = 'HEAD', cwd = ROOT, allowed }) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const dataSha = git('rev-parse', '--verify', `${data}^{commit}`)
  const codeSha = git('rev-parse', '--verify', `${published}^{commit}`)
  git('merge-base', '--is-ancestor', codeSha, dataSha) // throws when histories diverge
  // Paths are read from the NEW snapshot's workflows: they define what its data is.
  const paths = allowed ?? automationPaths(path.join(cwd, '.github/workflows'))
  const files = fallbackFiles(git('ls-tree', '-r', '--name-only', dataSha).split('\n').filter(Boolean), paths)
  git('checkout', '--quiet', '--detach', codeSha)
  for (let i = 0; i < files.length; i += 200) git('checkout', dataSha, '--', ...files.slice(i, i + 200))
  return { codeSha, dataSha, files }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
  const published = option('--published')
  if (!/^[0-9a-f]{40}$/.test(published ?? '')) {
    console.error('Fallback lane unavailable: published commit unknown.')
    process.exit(1)
  }
  const result = compose({ published, data: option('--data') ?? 'HEAD' })
  console.log(`Fallback snapshot: code ${result.codeSha.slice(0, 8)} (published) + ${result.files.length} automation data file(s) from ${result.dataSha.slice(0, 8)}.`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `code_sha=${result.codeSha}\ndata_sha=${result.dataSha}\n`)
}
