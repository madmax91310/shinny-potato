// GitHub freezes reusable workflow definitions before a checkout runs. Runtime
// scripts/data, in contrast, come from the selected immutable validation commit.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

export const GATE_REFERENCE = 'scripts/pages-gate-definition.json'
const workflowPath = /^\.github\/workflows\/[\w.-]+\.ya?ml$/
const commit = value => assert.match(value ?? '', /^[a-f0-9]{40}$/, 'An exact workflow/code commit is required')

export function gateDefinition(ref, git) {
  commit(ref)
  const read = path => git('show', `${ref}:${path}`)
  const contract = JSON.parse(read(GATE_REFERENCE))
  assert.equal(contract.schemaVersion, 1, 'Unknown Pages definition contract')
  assert.equal(contract.entrypoint, '.github/workflows/deploy-pages.yml')
  assert(Array.isArray(contract.definitions) && contract.definitions.length)
  assert.equal(new Set(contract.definitions).size, contract.definitions.length)
  for (const path of contract.definitions) assert.match(path, workflowPath)
  const pending = [contract.entrypoint], visited = new Set()
  while (pending.length) {
    const path = pending.pop()
    if (visited.has(path)) continue
    assert(contract.definitions.includes(path), `Undeclared reusable gate definition: ${path}`)
    visited.add(path)
    // Local reusable workflow paths are literal in GitHub Actions. Reading all
    // such references also fails closed for anchors or a reference in a comment.
    const refs = read(path).match(/\.\/\.github\/workflows\/[\w.-]+\.ya?ml/g) ?? []
    pending.push(...refs.map(value => value.slice(2)))
  }
  assert.equal(visited.size, contract.definitions.length, 'Unrelated workflow in the Pages definition contract')
  const files = Object.fromEntries([GATE_REFERENCE, ...visited].sort().map(path => [path, git('rev-parse', `${ref}:${path}`)]))
  const fingerprint = createHash('sha256').update(JSON.stringify(files)).digest('hex')
  return {files, fingerprint}
}

export function compatibleGate(definitionSha, codeSha, git) {
  try { return gateDefinition(definitionSha, git).fingerprint === gateDefinition(codeSha, git).fingerprint }
  catch { return false } // Missing objects/contracts/dependencies never certify new code.
}

export function gateReceipt(definitionSha, codeSha, git) {
  assert(compatibleGate(definitionSha, codeSha, git), 'Requested code does not match the executing Pages gate definition')
  return {schemaVersion: 1, definitionSha, codeSha, ...gateDefinition(definitionSha, git)}
}

export function verifyGateReceipt(receipt, codeSha, git) {
  assert.equal(receipt.schemaVersion, 1)
  assert.equal(receipt.codeSha, codeSha, 'Publication must use the exact fully validated code')
  assert.deepEqual(receipt, gateReceipt(receipt.definitionSha, codeSha, git), 'Validation definition receipt changed')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 4, 'Usage: node scripts/pages-gate-definition.mjs <receipt.json> <code-sha>')
  const git = (...args) => execFileSync('git', args, {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim()
  const receipt = JSON.parse(readFileSync(process.argv[2], 'utf8'))
  verifyGateReceipt(receipt, process.argv[3], git)
  console.log(`Verified full gate definition ${receipt.fingerprint}: workflow ${receipt.definitionSha}, code ${receipt.codeSha}`)
}
