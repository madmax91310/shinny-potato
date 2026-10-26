import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {resolve} from 'node:path'
import {projectSelectedData,anniversaryProjection} from './project-selected-data.mjs'
import * as canonical from '../src/pages/tweet-midi/data/marketHistory.js'
import {references} from '../src/pages/dca-profiles/records.js'
import {ROUTING_PRESENTATIONS} from '../src/data/routing-presentations.js'
import {ROUTING_PRESENTATION_FACTS} from '../src/data/routing-presentation-facts.js'
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'
import {ETFS,CATEGORY_ORDER} from '../src/data/etf-cards.js'
import {buildText,buildFactRows} from '../src/pages/etf-sheets/lib.js'
import {getETFArt,ETF_ART} from '../src/pages/etf-sheets/visualIdentity.js'
import {existsSync} from 'node:fs'
assert.deepEqual(Object.keys(ETF_ART).sort(),ETFS.map(e=>e.id).sort())
for(const row of ROUTING_PRESENTATIONS){const art=getETFArt(row.id);assert(existsSync(`public/asset-art/${art.scene}`),row.id)}
const plugin=projectSelectedData(),files=new Map(),requests=[]
plugin.configResolved({base:'/shinny-potato/'})
plugin.generateBundle.call({emitFile:r=>files.set('/shinny-potato/'+r.fileName,JSON.parse(r.source))})
const previous=globalThis.fetch
let fail=false
function uri(code){return 'data:text/javascript;base64,'+Buffer.from(code).toString('base64')}
globalThis.fetch=async url=>{requests.push(url);if(fail){fail=false;return {ok:false}}return {ok:files.has(url),json:async()=>structuredClone(files.get(url))}}
try{
 const loader=uri(plugin.transform('',resolve('src/data/history-browser.js')).code)
 const code=plugin.transform('',resolve('src/pages/tweet-midi/data/anniversaryHistory.js')).code
  .replace("'../../../lib/history-dates.js'",JSON.stringify(pathToFileURL(resolve('src/lib/history-dates.js')).href))
  .replace("'../../../lib/investment-series.js'",JSON.stringify(pathToFileURL(resolve('src/lib/investment-series.js')).href))
  .replace("'../../../data/history-browser.js'",JSON.stringify(loader))
  .replace("'../../../data/history-window-quality.js'",JSON.stringify(pathToFileURL(resolve('src/data/history-window-quality.js')).href))
 const projected=await import(uri(code)),p=anniversaryProjection()
 assert(Object.values(p.assets).every(asset=>!Object.hasOwn(asset,'points')&&!Object.hasOwn(asset,'anniversaryPoints')))
 assert.equal(requests.length,0)
 for(const asset of canonical.ANNIVERSAIRE_ELIGIBLE_ASSETS){
  const before=requests.length
  assert.deepEqual(projected.getValidYearsBackOptions(asset.id,new Date('2026-10-17')),canonical.getValidYearsBackOptions(asset.id,new Date('2026-10-17')))
  await projected.anniversaryRecords.load(asset.id)
  assert.equal(requests.length,before+1)
  await projected.anniversaryRecords.load(asset.id)
  assert.equal(requests.length,before+1,'history cache')
  for(const years of [1,3,5,10]){
   const ym=canonical.ymForYearsBack(years,new Date('2026-10-17'))
   let expected
   try {expected=canonical.getHistoricalPrice(asset.id,ym)} catch(error) {assert.match(error.message,/cours reportés|rapprochement financier non résolu/);assert.throws(()=>projected.getHistoricalPrice(asset.id,ym),{message:error.message});continue}
   assert.equal(projected.getHistoricalPrice(asset.id,ym),expected,asset.id+' '+ym)
  }
 }
 const exposure=await import(uri(plugin.transform('',resolve('src/pages/dca-profiles/records.js')).code))
 assert(!Object.values(exposure.references).some(r=>r.countries||r.sectors||r.equitySleeve))
 const beforeNonEquity=requests.length
 // Gold and Bitcoin point at exact shares (ISIN, classification outside equities) and never fetch an equity exposure.
 for(const id of ['gold','btc']){
  assert(/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(references[id]?.isin??''),`${id} references an exact share`)
  assert(references[id].outsideClassification&&!references[id].countries&&!references[id].sectors,`${id} has no equity exposure record`)
  assert(exposure.exposureRecords.isReady(id))
  await exposure.exposureRecords.load(id)
 }
 assert.equal(requests.length,beforeNonEquity,'gold and Bitcoin require no equity exposure fetch')
 const ids=Object.keys(references)
 fail=true
 await assert.rejects(exposure.exposureRecords.load(ids[0]))
 assert(!exposure.exposureRecords.isReady(ids[0]))
 for(const id of ids){await exposure.exposureRecords.load(id);assert.deepEqual(exposure.references[id],references[id])}
 assert.deepEqual(await exposure.loadExposureCatalog(),references)
 assert.equal(ROUTING_PRESENTATIONS.length,70)
 for(const r of ROUTING_PRESENTATIONS){
  const sheet=ETFS.find(e=>e.isin===r.isin),f=ROUTING_PRESENTATION_FACTS[r.isin],c=AUTOMATED_ETF[r.isin].characteristics
  assert(CATEGORY_ORDER.includes(sheet.category),'presentation is visible in a declared category')
  assert(sheet&&f.characteristicsSource.url&&f.characteristicsSource.checkedAt===c.checkedAt)
  assert.equal(f.domicile,c.domicile??null,'no inferred domicile')
  assert.equal(f.replicationMethod,c.replicationMethod??null,'no inferred replication')
  assert(!/undefined|null|NaN/.test(buildText(sheet)))
  assert(buildFactRows(sheet).every(row=>typeof row.text==='string'&&row.text.length))
 }
 console.log(`Selected records: ${p.eligible.length} anniversary histories match all tested dates; ${ids.length} exposure records and catalogue reconstruct exactly, cache/retry verified; 70 presentations preserve observed facts.`)
}finally{globalThis.fetch=previous}
