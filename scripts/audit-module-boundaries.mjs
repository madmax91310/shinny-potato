import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSync } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pureRoots = [
  'src/lib/investment-series.js',
  'src/lib/history-windows.js',
  'src/lib/history-dates.js',
  'src/lib/annual-inflation.js',
  'src/lib/duel-returns.js',
  'src/pages/presentation-shared/image-model.js',
  'src/pages/performance-rankings/engine.js',
  'src/pages/dca-profiles/engine.js',
  'src/pages/wealth-simulator/lib.js',
]
const browserObjects = new Set(['document', 'navigator', 'localStorage', 'sessionStorage'])

// Parse real imports, including re-exports and literal import(). Comments and text
// examples must never become edges. Vite supplies the parser used by this project.
export function inspectModule(source, filename) {
  const parsed = parseSync(filename, source)
  if (parsed.errors.length) throw new Error(`Cannot parse ${filename}: ${parsed.errors[0].message}`)
  const imports = [], browserAccess = [], computedImports = []
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') {
      if (node.source) imports.push({ specifier: node.source.value, dynamic: false })
    }
    if (node.type === 'ImportExpression') {
      const specifier = node.source.type === 'Literal' ? node.source.value
        : node.source.type === 'TemplateLiteral' && node.source.expressions.length === 0 ? node.source.quasis[0].value.cooked : null
      if (typeof specifier === 'string') imports.push({ specifier, dynamic: true })
      else computedImports.push(node.start)
    }
    if (node.type === 'MemberExpression' && node.object.type === 'Identifier' &&
      (browserObjects.has(node.object.name) || ['globalThis', 'window'].includes(node.object.name) && browserObjects.has(node.property.name ?? node.property.value))) browserAccess.push(node.start)
    if (node.type === 'NewExpression' && node.callee.type === 'Identifier' && node.callee.name === 'Image') browserAccess.push(node.start)
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(parsed.program)
  return { imports, browserAccess, computedImports }
}

export function boundaryErrors(graph, pure = pureRoots) {
  const errors = [], visited = new Set(), stack = []
  function cycle(id) {
    if (stack.includes(id)) { errors.push(`Import cycle: ${[...stack.slice(stack.indexOf(id)), id].join(' -> ')}`); return }
    if (visited.has(id)) return
    visited.add(id); stack.push(id)
    for (const edge of graph[id]?.edges ?? []) cycle(edge.target)
    stack.pop()
  }
  for (const [id, module] of Object.entries(graph)) {
    cycle(id)
    if (/^src\/(data|lib|design-system)\//.test(id)) for (const edge of module.edges) {
      if (edge.target.startsWith('src/pages/')) errors.push(`Shared module imports a page: ${id} -> ${edge.target}`)
    }
  }
  for (const entry of pure) {
    const seen = new Set()
    function check(id, chain) {
      if (seen.has(id) || !graph[id]) return
      seen.add(id)
      const module = graph[id], path = [...chain, id]
      if (module.browserAccess.length || module.imports.some(edge => /^(?:react|react-dom|react-router|react-router-dom)(?:\/|$)/.test(edge.specifier)) || id.startsWith('src/design-system/') || extname(id) === '.jsx') {
        errors.push(`Calculation/model imports browser or UI code: ${path.join(' -> ')}`)
        return
      }
      for (const edge of module.edges) check(edge.target, path)
    }
    check(entry, [])
  }
  return errors
}

export function sourceGraph(base = root) {
  const graph = {}
  function scan(folder) {
    for (const entry of readdirSync(resolve(base, folder), { withFileTypes: true })) {
      const name = `${folder}/${entry.name}`
      if (entry.isDirectory()) scan(name)
      else if (/\.(js|jsx)$/.test(name)) {
        const module = inspectModule(readFileSync(resolve(base, name), 'utf8'), name)
        const edges = module.imports.flatMap(edge => {
          if (!edge.specifier.startsWith('.')) return []
          const path = resolve(base, dirname(name), edge.specifier)
          const file = [path, `${path}.js`, `${path}.jsx`, `${path}/index.js`, `${path}/index.jsx`]
            .find(candidate => /\.(js|jsx)$/.test(candidate) && existsSync(candidate))
          return file ? [{ target: relative(base, file).replaceAll('\\', '/'), dynamic: edge.dynamic }] : []
        })
        graph[name] = { ...module, edges }
      }
    }
  }
  scan('src')
  return graph
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const graph = sourceGraph(), errors = boundaryErrors(graph)
  if (process.argv.includes('--json')) console.log(JSON.stringify(graph, null, 2))
  else {
    const edges = Object.values(graph).flatMap(module => module.edges)
    console.log(`Architecture: ${Object.keys(graph).length} source modules, ${edges.length} JS imports (${edges.filter(edge => edge.dynamic).length} deferred); ${errors.length} boundary/cycle errors.`)
    const computed = Object.entries(graph).filter(([, module]) => module.computedImports.length)
    if (computed.length) console.log(`Computed imports require generator/bundle checks: ${computed.map(([id]) => id).join(', ')}`)
  }
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 }
}
