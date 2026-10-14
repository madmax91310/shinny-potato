import { createHash } from 'node:crypto'
import * as history from '../src/data/market-history.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { projectReviewCatalog } from '../src/data/review-projection.js'

// Projections are derived from the same registries on every build/dev startup.
// No fetched copy or independently maintained financial value is introduced.
export function projectToolData() {
  const modules = new Map(), groups = []
  function partition(name, values, array = false) {
    const parts = []; let part = [], bytes = 0
    for (const entry of values) {
      const size = Buffer.byteLength(JSON.stringify(entry))
      if (bytes && bytes + size > 160_000) { parts.push(part); part = []; bytes = 0 }
      part.push(entry); bytes += size
    }
    if (part.length) parts.push(part)
    const imports = parts.map((part, i) => {
      const key = `virtual:tool-data:${name}:${i}`
      modules.set(key, `export default ${JSON.stringify(array ? part : Object.fromEntries(part))};`)
      groups.push({ name: `${name}-${i}`, test: new RegExp(`tool-data:${name}:${i}$`), priority: 120 })
      return `import p${i} from '${key}';`
    }).join('\n')
    return imports + '\nexport default ' + (array ? `[${parts.map((_,i) => `...p${i}`).join(',')}]` : `/* @__PURE__ */ Object.assign({},${parts.map((_,i) => `p${i}`).join(',')})`) + ';'
  }
  const historyCode = Object.entries(history).map(([key, value]) => {
    if (key === 'ASSETS' || key === 'BASELINE_ASSETS') {
      const id = `virtual:tool-data:${key}`
      modules.set(id, partition(`history-${key.toLowerCase()}`, Object.entries(value)))
      return `export { default as ${key} } from '${id}';\nimport ${key} from '${id}';`
    }
    if (typeof value === 'function') return `export ${value.toString()}`
    return `export const ${key} = ${value instanceof Set ? `new Set(${JSON.stringify([...value])})` : JSON.stringify(value)};`
  }).join('\n')
  const reviewId = 'virtual:tool-data:review'
  modules.set(reviewId, partition('review-metadata', projectReviewCatalog(DATA_CATALOG), true))
  const records = DATA_CATALOG.map(record => {
    const content = JSON.stringify(record)
    const hash = createHash('sha256').update(content).digest('hex').slice(0,20)
    return { record, content, fileName: `data/catalog/${hash}.json` }
  })
  const index = DATA_CATALOG.map(({ fields: _fields, ...record }) => record)
  let base = '/', build = false
  return { groups, plugin: {
    name: 'project-tool-data', enforce: 'pre',
    configResolved(config) { base = config.base; build = config.command === 'build' },
    resolveId(id) { if (modules.has(id)) return '\0' + id },
    load(id) { return modules.get(id.replace(/^\0/, '')) },
    configureServer(server) {
      const files = new Map(records.map(r => [base + r.fileName, r.content]))
      server.middlewares.use((req,res,next) => {
        const body = files.get(req.url?.split('?')[0])
        if (!body) return next()
        res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(body)
      })
    },
    transform(code, id) {
      const path = id.replaceAll('\\', '/').split('?')[0]
      if (path.endsWith('/src/data/market-history.js')) return { code: historyCode, map: null }
      if (path.endsWith('/src/data/review-catalog.js')) return { code: `export { default as REVIEW_CATALOG } from '${reviewId}';`, map: null }
      if (path.endsWith('/src/data/catalog-browser.js')) {
        if (build) for (const r of records) this.emitFile({ type: 'asset', fileName: r.fileName, source: r.content })
        return { code: `export const CATALOG_INDEX = ${JSON.stringify(index)};\nexport const RECORD_URLS = ${JSON.stringify(Object.fromEntries(records.map(r => [r.record.id, base + r.fileName])))};`, map: null }
      }
    },
  } }
}
