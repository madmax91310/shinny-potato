import { readFileSync } from 'node:fs'
import * as instruments from '../src/data/instruments.js'
import * as facts from '../src/data/instrument-facts.js'
import * as listings from '../src/data/instrument-listings.js'
import * as pea from '../src/data/instrument-pea.js'
import * as ter from '../src/data/etf-ter.js'
import * as portfolio from '../src/data/portfolio-assets.js'
import * as currencies from '../src/data/portfolio-currencies.js'
import * as reference from '../src/data/instrument-reference-evidence.js'
import * as metrics from '../src/data/qualified-exposure-metrics.js'
import * as qualified from '../src/data/qualified-exposure-sheets.js'
import * as practical from '../src/data/practical-source-data.js'

// Build-derived projections, never a second hand-maintained set of figures.
// The browser receives resolved metadata without importing all issuer holdings.
// Canonical function bodies retain runtime validation and formatting behaviour.
export function projectLightRegistries() {
  const definitions = [
    ['qualified-exposure-sheets', qualified, ''],
    ['qualified-exposure-metrics', metrics, ''],
    ['instrument-reference-evidence', reference, ''],
    ['instruments', instruments, "import { PEA_REVIEWS_BY_ISIN } from './instrument-pea.js';"],
    ['instrument-facts', facts, "import { getInstrumentListings } from './instrument-listings.js'; export { getInstrumentListings };"],
    ['instrument-listings', listings, ''], ['instrument-pea', pea, ''], ['etf-ter', ter, ''],
    ['portfolio-assets', portfolio, ''], ['portfolio-currencies', currencies, ''], ['practical-source-data', practical, ''],
  ]
  const projections = new Map(definitions.map(([name, exports, imports]) => {
    const source = readFileSync(new URL(`../src/data/${name}.js`, import.meta.url), 'utf8')
    const counts = new Map()
    function visit(value) {
      if (typeof value === 'string' && value.length > 40) counts.set(value, (counts.get(value) ?? 0) + 1)
      else if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') Object.values(value).forEach(visit)
    }
    Object.values(exports).filter(value => typeof value !== 'function').forEach(visit)
    const texts = [...counts].filter(([, count]) => count > 1).map(([value]) => value)
    const indexes = new Map(texts.map((value, i) => [value, i]))
    function serialize(value) {
      if (typeof value === 'string' && indexes.has(value)) return `__registryTexts[${indexes.get(value)}]`
      if (Array.isArray(value)) return '[' + value.map(v => serialize(v) ?? 'null').join(',') + ']'
      if (value && typeof value === 'object') return '{' + Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => JSON.stringify(k) + ':' + serialize(v)).join(',') + '}'
      return JSON.stringify(value)
    }
    const declarations = `const __registryTexts = Object.freeze(${JSON.stringify(texts)});`
    const code = Object.entries(exports).flatMap(([key, value]) => {
      if (name === 'instrument-facts' && key === 'getInstrumentListings') return []
      if (typeof value !== 'function') return `export const ${key} = ${serialize(value)};`
      const declaration = source.match(new RegExp(`export function ${key}\\([\\s\\S]*?\\n}`))?.[0]
      if (!declaration) throw new Error(`Missing canonical registry function: ${name}.${key}`)
      return declaration
    }).join('\n')
    return [`/src/data/${name}.js`, imports + '\n' + declarations + '\n' + code]
  }))
  return {
    name: 'project-light-registries', enforce: 'pre',
    transform(_code, id) {
      const path = id.replaceAll('\\', '/').split('?')[0]
      const key = [...projections.keys()].find(suffix => path.endsWith(suffix))
      if (key) return { code: projections.get(key), map: null }
    },
  }
}
