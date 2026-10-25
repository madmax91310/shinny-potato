import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { TOOLS } from '../src/tools.js'

const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
export function staticFiles(key, files = new Set()) {
  const chunk = manifest[key]
  assert(chunk, `Missing manifest entry: ${key}`)
  if (files.has(chunk.file)) return files
  files.add(chunk.file)
  for (const dependency of chunk.imports ?? []) staticFiles(dependency, files)
  return files
}
export const initialFiles = staticFiles('index.html')
export const homeFiles = staticFiles('src/pages/Home.jsx')
assert(manifest['src/pages/Home.jsx'].isDynamicEntry, 'Home must remain deferred on tool routes')
assert(!initialFiles.has(manifest['src/pages/Home.jsx'].file), 'Home loads eagerly')
export const toolChunks = Object.entries(manifest).filter(([key]) => /^src\/pages\/.+\/App\.jsx$/.test(key))
assert.equal(toolChunks.length, new Set([...TOOLS.filter(tool => tool.status === 'disponible').map(tool => tool.bundle ?? tool.to), '/tweet-midi']).size)
assert.deepEqual(new Set(manifest['index.html'].dynamicImports), new Set(['src/pages/Home.jsx', ...toolChunks.map(([key]) => key)]))
for (const [key, chunk] of toolChunks) {
  assert(chunk.isDynamicEntry, `${key} is not a dynamic entry`)
  assert(!initialFiles.has(chunk.file), `${key} loads eagerly`)
}
// Collected data grows every month without any code change. Size limits therefore apply to
// code; data bytes are reported, never budgeted (data-bytes-plugin.mjs splits the two).
const sizes = JSON.parse(await readFile('dist/.vite/data-bytes.json', 'utf8'))
const share = file => {
  const { code = 0, data = 0 } = sizes[file] ?? {}
  return code + data ? code / (code + data) : 1
}
let initialBytes = 0
let initialGzip = 0
let largest = 0
for (const file of new Set(Object.values(manifest).map(chunk => chunk.file))) {
  if (!file.endsWith('.js')) continue
  const content = await readFile(`dist/${file}`)
  largest = Math.max(largest, content.length)
  // Minified bytes attributed to code, proportionally to rendered code and data.
  assert(content.length * share(file) <= 500_000, `${file} code exceeds Vite's default warning limit`)
  if (initialFiles.has(file)) {
    initialBytes += content.length
    initialGzip += gzipSync(content).length
  }
}
assert(initialBytes <= 300_000, 'Initial JavaScript exceeds the 300 kB regression budget')
console.log(`Route bundles: ${toolChunks.length} lazy tools; initial JS ${(initialBytes / 1000).toFixed(2)} kB, gzip ${(initialGzip / 1000).toFixed(2)} kB; largest chunk ${(largest / 1000).toFixed(2)} kB.`)

// A split file is not a lighter route: count all static imports exactly once.
const budgets = JSON.parse(await readFile('scripts/route-budgets.json', 'utf8')).routes
assert.deepEqual(new Set(Object.keys(budgets)), new Set(toolChunks.map(([key]) => key)), 'Every tool needs an explicit total-route budget')
for (const [key] of toolChunks) {
  const files = [...staticFiles(key)].filter(file => file.endsWith('.js'))
  const contents = await Promise.all(files.map(file => readFile(`dist/${file}`)))
  const bytes = contents.reduce((sum, content) => sum + content.length, 0)
  const gzip = contents.reduce((sum, content) => sum + gzipSync(content).length, 0)
  const code = files.reduce((sum, file) => sum + (sizes[file]?.code ?? 0), 0)
  const data = files.reduce((sum, file) => sum + (sizes[file]?.data ?? 0), 0)
  assert(code <= budgets[key], `${key}: route code ${code} exceeds its ${budgets[key]} byte budget (rendered, data excluded)`)
  console.log(`Route total: ${key}: ${(bytes / 1000).toFixed(1)} kB (${(gzip / 1000).toFixed(1)} kB gzip), ${files.length} files; code ${(code / 1000).toFixed(1)}/${(budgets[key] / 1000).toFixed(0)} kB, data ${(data / 1000).toFixed(1)} kB`)
}
