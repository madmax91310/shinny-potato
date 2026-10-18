#!/usr/bin/env node
// Fallback lane: "last validated code + fresh data".
//
// When the full gate fails on a master snapshot whose code changed since the
// published commit, refreshed data must not wait for a human to repair the code.
// This script checks out the published commit (code that already passed the full
// gate) and overlays every automation data path from the new snapshot. The
// combined tree is then rebuilt and smoke-tested before it may be published.
//
// New assets: a code change can configure assets (or new data fields) that
// collectors then fill. That data reaches the overlay, but the published code does
// not know it and throws (18/10/2026: "Produit inconnu : IE000U9ODG19", then
// "Missing equity artwork: brookfield"), so the whole fallback build failed and
// nothing was published. A data file that names an identifier the published tree
// never mentions keeps its published version (or stays absent):
//   - a valid ISIN anywhere in the file;
//   - a JSON object key that does not start with a digit (dates and years are
//     ordinary refreshes), such as a new equity id or a new status field.
// The old code keeps serving what it knows with fresh data; the new assets wait for
// the new code. Nothing is edited inside a file, and the build and smoke test still
// decide whether the result may be published.
//
// Usage (from a full clone of the new snapshot):
//   node scripts/compose-fallback-snapshot.mjs --published <sha> [--data <rev>]
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { automationPaths, classify } from './classify-deploy-scope.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ISIN = /(?<![A-Z0-9])[A-Z]{2}[A-Z0-9]{9}[0-9](?![A-Z0-9])/g

export function fallbackFiles(dataFiles, allowed) {
  // Same matcher as the data-only lane: only paths an automation may commit.
  return dataFiles.filter(file => classify([file], allowed).dataOnly)
}

// A valid ISIN check digit (Luhn over the letters-as-numbers expansion) keeps
// hashes and random identifiers from being mistaken for assets.
export function isIsin(code) {
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(code)) return false
  const digits = [...code.slice(0, 11)].map(char => parseInt(char, 36)).join('')
  let sum = 0
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 0) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
  }
  return (10 - (sum % 10)) % 10 === Number(code[11])
}

export function isinsIn(text) {
  return new Set((text.match(ISIN) ?? []).filter(isIsin))
}

// Identifiers a data file names: valid ISINs, and JSON object keys that do not
// start with a digit.
export function identifiersIn(file, text) {
  const ids = isinsIn(text)
  if (file.endsWith('.json')) {
    try {
      const visit = node => {
        if (!node || typeof node !== 'object') return
        if (!Array.isArray(node)) for (const key of Object.keys(node)) if (key && !/^[\d-]/.test(key)) ids.add(key)
        for (const child of Object.values(node)) visit(child)
      }
      visit(JSON.parse(text))
    } catch { /* invalid JSON: the build decides */ }
  }
  return ids
}

// Identifiers the new version of a file adds to its published version.
export function introducedIdentifiers(file, text, publishedText = '') {
  const before = identifiersIn(file, publishedText)
  return [...identifiersIn(file, text)].filter(id => !before.has(id)).sort()
}

const TOKEN = /^[A-Za-z0-9_.-]+$/

// Whether the published tree mentions an identifier: a whole token for simple ids,
// a plain substring otherwise. The tree is read once as text (about 100 MB).
export function publishedMentions(codeSha, cwd) {
  const text = execFileSync('sh', ['-c', `git archive --format=tar ${codeSha} | tar -xOf -`], { cwd, encoding: 'utf8', maxBuffer: 1 << 30 })
  const tokens = new Set(text.split(/[^A-Za-z0-9_.-]+/))
  for (const isin of isinsIn(text)) tokens.add(isin) // also ISINs embedded in ids such as etfIE00B4L5Y983
  const mentioned = id => (TOKEN.test(id) ? tokens.has(id) : text.includes(id))
  // An id built on an ISIN ("etfFR0007054358") is known when its ISIN is: the
  // published registries resolve assets by ISIN, not by the key's prefix.
  return id => {
    const isins = [...isinsIn(id)]
    return isins.length ? isins.every(mentioned) : mentioned(id)
  }
}

export function compose({ published, data = 'HEAD', cwd = ROOT, allowed }) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const dataSha = git('rev-parse', '--verify', `${data}^{commit}`)
  const codeSha = git('rev-parse', '--verify', `${published}^{commit}`)
  git('merge-base', '--is-ancestor', codeSha, dataSha) // throws when histories diverge
  // Paths are read from the NEW snapshot's workflows: they define what its data is.
  const paths = allowed ?? automationPaths(path.join(cwd, '.github/workflows'))
  const files = fallbackFiles(git('ls-tree', '-r', '--name-only', dataSha).split('\n').filter(Boolean), paths)
  const publishedFiles = new Set(git('ls-tree', '-r', '--name-only', codeSha).split('\n').filter(Boolean))
  git('checkout', '--quiet', '--detach', codeSha)
  for (let i = 0; i < files.length; i += 200) git('checkout', dataSha, '--', ...files.slice(i, i + 200))

  // Identifiers each file adds, then which of them the published tree mentions elsewhere.
  const introduced = new Map()
  for (const file of files) {
    let text
    try { text = readFileSync(path.join(cwd, file), 'utf8') } catch { continue } // removed path
    const before = publishedFiles.has(file) ? git('show', `${codeSha}:${file}`) : ''
    const ids = introducedIdentifiers(file, text, before)
    if (ids.length) introduced.set(file, ids)
  }
  const isKnown = introduced.size ? publishedMentions(codeSha, cwd) : () => true
  const heldBack = []
  for (const [file, ids] of introduced) {
    const unknown = ids.filter(id => !isKnown(id))
    if (!unknown.length) continue
    if (publishedFiles.has(file)) git('checkout', codeSha, '--', file)
    else { git('rm', '--quiet', '--cached', '--', file); rmSync(path.join(cwd, file), { force: true }) }
    heldBack.push({ file, ids: unknown })
  }
  const held = new Set(heldBack.map(entry => entry.file))
  return { codeSha, dataSha, files: files.filter(file => !held.has(file)), heldBack }
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
  if (result.heldBack.length) {
    const ids = [...new Set(result.heldBack.flatMap(entry => entry.ids))].sort()
    const sample = list => list.length > 12 ? `${list.slice(0, 12).join(', ')}, … (+${list.length - 12})` : list.join(', ')
    const lines = [
      `${result.heldBack.length} data file(s) kept at their published version: they name ${ids.length} identifier(s) the published code does not know (${sample(ids)}).`,
      ...result.heldBack.map(entry => `- ${entry.file}: ${sample(entry.ids)}`),
    ]
    console.log(lines.join('\n'))
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Voie de secours : actifs en attente du nouveau code\n\n${lines.join('\n')}\n`)
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `code_sha=${result.codeSha}\ndata_sha=${result.dataSha}\nheld_back=${result.heldBack.length}\n`)
}
