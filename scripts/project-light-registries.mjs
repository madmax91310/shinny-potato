import * as historyVisuals from '../src/data/history-visual-identities.js'
import * as commodities from '../src/data/commodity-publication-data.js'
import * as exposures from '../src/data/portfolio-exposure-data.js'
import * as cards from '../src/data/etf-cards.js'
import * as publication from '../src/data/etf-publication-data.js'
import { readFileSync } from 'node:fs'
import { parseSync } from 'vite'
import * as instruments from '../src/data/instruments.js'
import * as facts from '../src/data/instrument-facts.js'
import * as listings from '../src/data/instrument-listings.js'
import * as pea from '../src/data/instrument-pea.js'
import * as ter from '../src/data/etf-ter.js'
import * as terEvidence from '../src/data/etf-ter-evidence.js'
import * as portfolio from '../src/data/portfolio-assets.js'
import * as admissions from '../src/data/portfolio-admissions.js'
import * as certifiedIndices from '../src/data/certified-monthly-indices.js'
import * as currencies from '../src/data/portfolio-currencies.js'
import * as calendarFx from '../src/data/calendar-fx.js'
import * as reference from '../src/data/instrument-reference-evidence.js'
import * as metrics from '../src/data/qualified-exposure-metrics.js'
import * as qualified from '../src/data/qualified-exposure-sheets.js'
import * as practical from '../src/data/practical-source-data.js'
import * as preferredTickers from '../src/data/preferred-instrument-tickers.js'

export function exportedFunctionDeclarations(source, filename) {
  const parsed = parseSync(filename, source)
  if (parsed.errors.length) throw Error(`Invalid canonical registry: ${filename}`)
  return new Map(parsed.program.body.filter(node => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration')
    .map(node => [node.declaration.id.name, source.slice(node.start, node.end)]))
}

// Build-derived projections, never a second hand-maintained set of figures.
// The browser receives resolved metadata without importing all issuer holdings.
// Canonical function bodies retain runtime validation and formatting behaviour.
export function projectLightRegistries() {
  const definitions = [
    ['history-visual-identities',historyVisuals,''],
    ['calendar-fx', calendarFx, "import { fxRate } from '../lib/fx-rate.js';"],
    ['commodity-publication-data', commodities, ''], ['portfolio-exposure-data', exposures, ''], ['etf-cards', cards, ''], ['etf-publication-data', publication, ''],
    ['qualified-exposure-sheets', qualified, ''],
    ['qualified-exposure-metrics', metrics, ''],
    ['instrument-reference-evidence', reference, ''],
    ['instruments', instruments, "import { PEA_REVIEWS_BY_ISIN } from './instrument-pea.js';"],
    ['instrument-facts', facts, "import { getInstrumentListings } from './instrument-listings.js'; export { getInstrumentListings };"],
    ['instrument-listings', listings, ''], ['instrument-pea', pea, ''], ['etf-ter', ter, ''], ['etf-ter-evidence', terEvidence, ''],
    ['portfolio-assets', portfolio, ''], ['portfolio-admissions', admissions, ''], ['certified-monthly-indices', certifiedIndices, ''], ['portfolio-currencies', currencies, ''], ['practical-source-data', practical, ''], ['preferred-instrument-tickers',preferredTickers,''],
  ]
  const projections = new Map(definitions.map(([name, exports, imports]) => {
    if(name==='portfolio-assets') exports={...exports,ASSETS:exports.ASSETS.map(asset=>asset.manualOnly && /^(?:equity-|manual-)/.test(asset.id)?Object.fromEntries([...['id','isin','name','instrumentType','cat','emoji','manualOnly','returnCurrency','basis','underlyingMechanism'].filter(k=>asset[k]!==undefined).map(k=>[k,asset[k]]),['historyPending',true]]):asset)}
    const source = readFileSync(new URL(`../src/data/${name}.js`, import.meta.url), 'utf8')
    const functions = exportedFunctionDeclarations(source, `${name}.js`)
    const counts = new Map(),shapeCounts=new Map()
    const keysFor=value=>Object.keys(value).filter(k=>value[k]!==undefined)
    function visit(value) {
      if (typeof value === 'string' && value.length > 40) counts.set(value, (counts.get(value) ?? 0) + 1)
      else if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') {
        const key=JSON.stringify(keysFor(value));shapeCounts.set(key,(shapeCounts.get(key)??0)+1)
        Object.values(value).forEach(visit)
      }
    }
    Object.values(exports).filter(value => typeof value !== 'function').forEach(visit)
    const texts = [...counts].filter(([, count]) => count > 1).map(([value]) => value)
    const indexes = new Map(texts.map((value, i) => [value, i]))
    const shapes=[...shapeCounts].filter(([key,n])=>n>=4&&key.length>50).map(([key])=>JSON.parse(key))
    const shapeIds=new Map(shapes.map((keys,i)=>[JSON.stringify(keys),i]))
    const factories=shapes.map((keys,i)=>`const __registryShape${i}=v=>({${keys.map((key,j)=>JSON.stringify(key)+':v['+j+']').join(',')}});`).join('\n')
    function serialize(value) {
      if (typeof value === 'string' && indexes.has(value)) return `__registryText${indexes.get(value)}`
      if (Array.isArray(value)) return '[' + value.map(v => serialize(v) ?? 'null').join(',') + ']'
      if (value && typeof value === 'object' && shapeIds.has(JSON.stringify(keysFor(value)))) return `/* @__PURE__ */ __registryShape${shapeIds.get(JSON.stringify(keysFor(value)))}([${keysFor(value).map(k=>serialize(value[k])??'null').join(',')}])`
      if (value && typeof value === 'object') return '{' + Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => JSON.stringify(k) + ':' + serialize(v)).join(',') + '}'
      return JSON.stringify(value)
    }
    const declarations = texts.map((text,index)=>`const __registryText${index} = ${JSON.stringify(text)};`).join("\n")
    const code = Object.entries(exports).flatMap(([key, value]) => {
      if (name === 'instrument-facts' && key === 'getInstrumentListings') return []
      if (typeof value !== 'function') return `export const ${key} = ${serialize(value)};`
      const declaration = functions.get(key)
      if (!declaration) throw new Error(`Missing canonical registry function: ${name}.${key}`)
      return declaration
    }).join('\n')
    return [`/src/data/${name}.js`, imports + '\n' + factories + '\n' + declarations + '\n' + code]
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
