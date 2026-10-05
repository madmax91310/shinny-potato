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
export const toolChunks = Object.entries(manifest).filter(([key]) => /^src\/pages\/.+\/App\.jsx$/.test(key))
assert.equal(toolChunks.length, new Set(TOOLS.filter(tool => tool.status === 'disponible').map(tool => tool.bundle ?? tool.to)).size)
assert.deepEqual(new Set(manifest['index.html'].dynamicImports), new Set(toolChunks.map(([key]) => key)))
for (const [key, chunk] of toolChunks) {
  assert(chunk.isDynamicEntry, `${key} is not a dynamic entry`)
  assert(!initialFiles.has(chunk.file), `${key} loads eagerly`)
}
let initialBytes = 0
let initialGzip = 0
let largest = 0
for (const file of new Set(Object.values(manifest).map(chunk => chunk.file))) {
  if (!file.endsWith('.js')) continue
  const content = await readFile(`dist/${file}`)
  largest = Math.max(largest, content.length)
  assert(content.length <= 500_000, `${file} exceeds Vite's default warning limit`)
  if (initialFiles.has(file)) {
    initialBytes += content.length
    initialGzip += gzipSync(content).length
  }
}
assert(initialBytes <= 300_000, 'Initial JavaScript exceeds the 300 kB regression budget')
console.log(`Route bundles: ${toolChunks.length} lazy tools; initial JS ${(initialBytes / 1000).toFixed(2)} kB, gzip ${(initialGzip / 1000).toFixed(2)} kB; largest chunk ${(largest / 1000).toFixed(2)} kB.`)
