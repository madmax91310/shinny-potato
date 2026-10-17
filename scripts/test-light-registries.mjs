import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { projectLightRegistries } from './project-light-registries.mjs'
import { projectSelectedData } from './project-selected-data.mjs'
import { splitEtfRecords } from './split-etf-records.mjs'
import { readFileSync } from 'node:fs'

const issuerParts=splitEtfRecords(), reconstructed={}
for(let i=0;i<issuerParts.groups.length;i++){
 const code=issuerParts.plugin.load(issuerParts.plugin.resolveId(`virtual:etf-issuer-part:${i}`))
 Object.assign(reconstructed,(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default)
}
assert.deepEqual(reconstructed,JSON.parse(readFileSync(new URL('../src/data/automated-etf.json',import.meta.url))))

// Execute the generated modules in isolation: any accidental dependency on a
// non-exported helper or raw issuer module must fail here, before publication.
const names = ['etf-cards','etf-publication-data','commodity-publication-data','portfolio-exposure-data','qualified-exposure-metrics','qualified-exposure-sheets', 'instruments', 'instrument-facts', 'instrument-listings', 'instrument-pea', 'etf-ter', 'etf-ter-evidence',
  'portfolio-assets', 'portfolio-currencies', 'practical-source-data', 'instrument-reference-evidence']
const directory = await mkdtemp(join(tmpdir(), 'light-registries-'))
const selectedRecords = new Map()
projectSelectedData().generateBundle.call({emitFile:({fileName,source})=>{
 if(fileName.startsWith('data/portfolio/')) {const record=JSON.parse(source);selectedRecords.set(record.id,record)}
}})
const restoreAssets = assets=>assets.map(asset=>{
 if(!asset.historyPending)return asset
 const record=selectedRecords.get(asset.id)
 assert(record,`Selected portfolio data missing: ${asset.id}`)
 for(const [key,value] of Object.entries(asset))if(key!=='historyPending')assert.deepEqual(value,record[key],`${asset.id}.${key}`)
 return record
})
try {
  const plugin = projectLightRegistries()
  await writeFile(join(directory, 'package.json'), '{"type":"module"}')
  for (const name of names) {
    const result = plugin.transform('', `/app/src/data/${name}.js`)
    assert(result?.code)
    await writeFile(join(directory, `${name}.js`), result.code)
  }
  const projected = {}, canonical = {}
  for (const name of names) {
    const actual = await import(pathToFileURL(join(directory, `${name}.js`)))
    const expected = await import(`../src/data/${name}.js`)
    projected[name] = actual; canonical[name] = expected
    assert.deepEqual(Object.keys(actual), Object.keys(expected))
    for (const [key, value] of Object.entries(expected)) if (typeof value !== 'function') {
      const restored=name==='portfolio-assets'&&key==='ASSETS'?restoreAssets(actual[key]):actual[key]
      assert.deepEqual(JSON.parse(JSON.stringify(restored)), JSON.parse(JSON.stringify(value)), `${name}.${key}`)
    }
  }
  for (const isin of Object.keys(canonical.instruments.INSTRUMENTS_BY_ISIN)) {
    for (const name of ['instruments', 'instrument-facts', 'instrument-listings', 'etf-ter']) {
      for (const [key, fn] of Object.entries(canonical[name])) {
        if (typeof fn !== 'function' || ['affirmInstrumentPea', 'formatInstrumentListing'].includes(key)) continue
        let expected
        try { expected = fn(isin) } catch (error) {
          assert.throws(() => projected[name][key](isin), {message:error.message})
          continue
        }
        assert.deepEqual(projected[name][key](isin), expected, `${name}.${key}(${isin})`)
      }
    }
  }
  for (const asset of canonical['portfolio-assets'].ASSETS) assert.deepEqual(restoreAssets([projected['portfolio-assets'].getAsset(asset.id)])[0], asset)
  console.log('Light registries: all exported values and per-ISIN helpers match the canonical modules.')
} finally { await rm(directory, {recursive:true, force:true}) }
