import * as tweetBank from '../src/pages/tweet-bank/data.js'
import { compactHistory } from './compact-history.mjs'
import { createHash } from 'node:crypto'
import * as marketFacts from '../src/pages/market-facts/data.js'
import * as duel from '../src/data/duel-assets.js'
import * as history from '../src/data/market-history.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { projectReviewCatalog } from '../src/data/review-projection.js'

// Lossless string interning keeps repeated source URLs and review instructions
// from growing once per company/field. Objects and dates remain unchanged.
export function compactLiteral(value) {
  value=JSON.parse(JSON.stringify(value))
  // Shared literal values are reconstructed losslessly. Arrays/objects stay
  // independent: factories prevent accidental aliasing between catalog rows.
  const counts=new Map(),values=new Map()
  function visit(v) {
    if(v===null||typeof v!=='object')return
    const key=JSON.stringify(v)
    if(key.length>=50){counts.set(key,(counts.get(key)??0)+1);values.set(key,v)}
    Object.values(v).forEach(visit)
  }
  visit(value)
  const repeated=[...counts].filter(([key,n])=>n>=2&&key.length*(n-1)>60).map(([key])=>key).sort((a,b)=>a.length-b.length)
  const ids=new Map(repeated.map((key,i)=>[key,i]))
  function encode(v,root=false){
    if(v&&typeof v==='object'){
      const key=JSON.stringify(v)
      if(!root&&ids.has(key))return `v${ids.get(key)}()`
      if(Array.isArray(v))return '['+v.map(x=>encode(x)).join(',')+']'
      return '{'+Object.entries(v).map(([k,x])=>JSON.stringify(k)+':'+encode(x)).join(',')+'}'
    }
    return JSON.stringify(v)
  }
  const code=repeated.map((key,i)=>`const v${i}=()=>(${encode(values.get(key),true)});`).join('\n')+'\nexport default '+encode(value)+';'
  const countsText=new Map(),tokens=/"(?:[^"\\]|\\.)*"(\s*:)?/g
  code.replace(tokens,(s,key)=>{if(!key&&s.length>=26)countsText.set(s,(countsText.get(s)??0)+1);return s})
  const shared=[...countsText].filter(([,n])=>n>=2).map(([s])=>s),indices=new Map(shared.map((s,i)=>[s,i]))
  return `const strings=Object.freeze([${shared.join(',')}]);\n`+code.replace(tokens,(s,key)=>!key&&indices.has(s)?`strings[${indices.get(s)}]`:s)

}

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
      modules.set(key, name.startsWith('history-') ? compactHistory(Object.fromEntries(part)) : compactLiteral(array ? part : Object.fromEntries(part)))
      groups.push({ name: `${name}-${i}`, test: new RegExp(`tool-data:${name}:${i}$`), priority: 120 })
      return `import p${i} from '${key}';`
    }).join('\n')
    return imports + '\nexport default ' + (array ? `[${parts.map((_,i) => `...p${i}`).join(',')}]` : `/* @__PURE__ */ Object.assign({},${parts.map((_,i) => `p${i}`).join(',')})`) + ';'
  }
  const historyCode = "import {assetHistoryMinDate} from '../lib/history-dates.js';export {derivedAnnualInflation} from '../lib/annual-inflation.js';export const getAssetMinDate=id=>assetHistoryMinDate(ASSETS,VERIFIED_MIN_DATE_OVERRIDES,id);\n"+Object.entries(history).map(([key, value]) => {
    if (key === 'ASSETS' || key === 'BASELINE_ASSETS') {
      const id = `virtual:tool-data:${key}`
      modules.set(id, partition(`history-${key.toLowerCase()}`, Object.entries(value)))
      return `export { default as ${key} } from '${id}';\nimport ${key} from '${id}';`
    }
    if (typeof value === 'function') return ''
    return `export const ${key} = ${value instanceof Set ? `new Set(${JSON.stringify([...value])})` : JSON.stringify(value)};`
  }).join('\n')
  // These tools consume finished facts / annual series. Do not ship the raw
  // monthly histories and issuer parsers used to derive them at build time.
  const bankId = 'virtual:tool-data:tweet-bank'
  modules.set(bankId, compactLiteral(Object.fromEntries(Object.entries(tweetBank).filter(([,value]) => typeof value !== 'function'))))
  const factsId = 'virtual:tool-data:market-facts'
  modules.set(factsId, compactLiteral(marketFacts))
  const duelId = 'virtual:tool-data:duel-catalog'
  modules.set(duelId, compactLiteral({ CATALOG:duel.CATALOG, EUR_USD:duel.EUR_USD, FX_SOURCE:duel.FX_SOURCE, ROLES:duel.ROLES }))
  const reviewId = 'virtual:tool-data:review'
  modules.set(reviewId, partition('review-metadata', projectReviewCatalog(DATA_CATALOG), true))
  const records = DATA_CATALOG.map(record => {
    const content = JSON.stringify(record)
    const hash = createHash('sha256').update(content).digest('hex').slice(0,20)
    return { record, content, fileName: `data/catalog/${hash}.json` }
  })
  // Search needs identity only; consumer links remain in the fetched full record.
  const index = DATA_CATALOG.map(({ id, type, name, aliases }) => ({ id, type, name, aliases }))
  let base = '/', build = false
  return { groups, plugin: {
    name: 'project-tool-data', enforce: 'pre',
    configResolved(config) { base = config.base; build = config.command === 'build' },
    resolveId(id) { if (modules.has(id)) return {id:'\0' + id,moduleSideEffects:false} },
    load(id) { id=typeof id==='string'?id:id.id;return modules.get(id.replace(/^\0/, '')) },
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
      if (path.endsWith('/src/pages/tweet-bank/data.js')) return { code: `import data from '${bankId}'; export const {TWEETS,MONTHS,CATEGORIES,FORMATS,GOLD_CATEGORIES,COOLDOWN_DAYS}=data; export function getTweet(id) { return TWEETS.find(t => t.id === id); }`, map:null }
      if (path.endsWith('/src/pages/market-facts/data.js')) return { code: `import data from '${factsId}'; export const {FACTS,FAMILIES}=data;`, map:null }
      if (path.endsWith('/src/data/duel-assets.js')) return { code: `export {euroReturn} from '../lib/duel-returns.js'; import data from '${duelId}'; export const {CATALOG,EUR_USD,FX_SOURCE,ROLES}=data; export const ITEM_BY_ID=new Map(CATALOG.map(item=>[item.id,item]));`, map:null }
      if (path.endsWith('/src/data/market-history.js')) return { code: historyCode, map: null }
      if (path.endsWith('/src/data/review-catalog.js')) return { code: `export { default as REVIEW_CATALOG } from '${reviewId}';`, map: null }
      if (path.endsWith('/src/data/catalog-browser.js')) {
        if (build) for (const r of records) this.emitFile({ type: 'asset', fileName: r.fileName, source: r.content })
        return { code: `export const CATALOG_INDEX = ${JSON.stringify(index)};\nexport const RECORD_URLS = ${JSON.stringify(Object.fromEntries(records.map(r => [r.record.id, base + r.fileName])))};`, map: null }
      }
    },
  } }
}
