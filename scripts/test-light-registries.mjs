import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { projectLightRegistries, exportedFunctionDeclarations } from './project-light-registries.mjs'
import { projectSelectedData } from './project-selected-data.mjs'
import { splitEtfRecords,splitInstrumentMetadataRecords,splitCharacteristicMetadataRecords } from './split-etf-records.mjs'
import characteristicMetadata from '../src/data/instrument-characteristic-metadata.js'
import { readFileSync } from 'node:fs'

const issuerParts=splitEtfRecords(), reconstructed={}
for(let i=0;i<issuerParts.groups.length;i++){
 const code=issuerParts.plugin.load(issuerParts.plugin.resolveId(`virtual:etf-issuer-part:${i}`))
 Object.assign(reconstructed,(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default)
}
assert.deepEqual(reconstructed,JSON.parse(readFileSync(new URL('../src/data/automated-etf.json',import.meta.url))))
const metadataParts=splitInstrumentMetadataRecords(),metadata={}
for(let i=0;i<metadataParts.groups.length;i++) {
 const code=metadataParts.plugin.load(metadataParts.plugin.resolveId(`virtual:instrument-metadata-part:${i}`))
 Object.assign(metadata,(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default)
}
assert.deepEqual(metadata,JSON.parse(readFileSync(new URL('../src/data/automated-instrument-metadata.json',import.meta.url))))
// Future successful observations must grow into more bounded chunks, not one oversized file.
const expandedMetadata=Object.fromEntries(Array.from({length:8},(_,i)=>Object.entries(metadata).map(([isin,record])=>[`${i}:${isin}`,record])).flat())
const expandedParts=splitInstrumentMetadataRecords(expandedMetadata),expandedDecoded={}
assert(expandedParts.groups.length>metadataParts.groups.length)
for(let i=0;i<expandedParts.groups.length;i++) {
 const code=expandedParts.plugin.load(expandedParts.plugin.resolveId(`virtual:instrument-metadata-part:${i}`))
 assert(Buffer.byteLength(code)<450_000)
 Object.assign(expandedDecoded,(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default)
}
assert.deepEqual(expandedDecoded,expandedMetadata)
const characteristicParts=splitCharacteristicMetadataRecords(),characteristics={}
for(let i=0;i<characteristicParts.groups.length;i++) {
 const code=characteristicParts.plugin.load(characteristicParts.plugin.resolveId(`virtual:characteristic-metadata-part:${i}`))
 Object.assign(characteristics,(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default)
}
assert.deepEqual(characteristics,characteristicMetadata)
for(const observations of Object.values(characteristics))assert(Object.keys(observations).every(field=>['distribution','domicile','replicationMethod','currencyHedge'].includes(field)))

// Execute the generated modules in isolation: any accidental dependency on a
// non-exported helper or raw issuer module must fail here, before publication.
const names = ['etf-cards','etf-publication-data','commodity-publication-data','portfolio-exposure-data','qualified-exposure-metrics','qualified-exposure-sheets', 'instruments', 'instrument-facts', 'instrument-listings', 'instrument-pea', 'etf-ter', 'etf-ter-evidence',
  'portfolio-assets', 'portfolio-currencies', 'practical-source-data', 'instrument-reference-evidence','preferred-instrument-tickers']
const directory = await mkdtemp(join(tmpdir(), 'light-registries-'))
// A one-line body is semantically identical and must not break extraction.
const compactFunction = exportedFunctionDeclarations('export function example(value) { return value + 1 }', 'fixture.js').get('example')
assert.equal((await import('data:text/javascript;base64,' + Buffer.from(compactFunction).toString('base64'))).example(2), 3)
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
  for (const name of [...names, 'history-visual-identities', 'calendar-fx', 'portfolio-admissions', 'certified-monthly-indices']) {
    const result = plugin.transform('', `/app/src/data/${name}.js`)
    assert(result?.code)
    await writeFile(join(directory, `${name}.js`), result.code)
  }
  // Existing Oxlint checks every generated binding, even in branches not exercised
  // by a particular ISIN fixture. This guard does not change the repository lint.
  const config = join(directory, 'bindings.json')
  await writeFile(config, JSON.stringify({ env: { browser: true }, rules: { 'no-undef': 'error' } }))
  const lintBindings = path => execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url)), '--config', config, '--no-ignore', '-A', 'all', '-D', 'no-undef', path], { encoding: 'utf8' })
  const negative = join(directory, 'missing-binding.js')
  await writeFile(negative, 'export function broken() { return missingCanonicalHelper() }')
  assert.throws(() => lintBindings(negative), error => error.status === 1 && error.stdout.includes('missingCanonicalHelper') && error.stdout.includes('no-undef'))
  await rm(negative)
  lintBindings(directory)
  // Exercise the generated annual FX functions, including their default
  // arguments: the light registry deliberately has no raw monthly FX binding.
  const calendarCode=plugin.transform('', '/app/src/data/calendar-fx.js').code
    .replace("'../lib/fx-rate.js'",JSON.stringify(new URL('../src/lib/fx-rate.js',import.meta.url).href))
  const lightCalendar=await import('data:text/javascript;base64,'+Buffer.from(calendarCode).toString('base64'))
  const fullCalendar=await import('../src/data/calendar-fx.js')
  const fxFixture=JSON.parse(readFileSync(new URL('../src/data/monthly-fx.json',import.meta.url)))
  for(const year of [2021,2022,2023,2024,2025])for(const currency of ['EUR','USD','JPY']){
    assert.equal(lightCalendar.calendarRate(year,currency),fullCalendar.calendarRate(year,currency))
    assert.equal(lightCalendar.convertCalendarReturn(28.24,year,currency,'EUR'),fullCalendar.convertCalendarReturn(28.24,year,currency,'EUR'))
    assert.equal(lightCalendar.convertCalendarReturn(28.24,year,currency,'EUR',fxFixture),fullCalendar.convertCalendarReturn(28.24,year,currency,'EUR',fxFixture))
  }
  const missingFx=structuredClone(fxFixture);delete missingFx.months['2024-12']
  assert.equal(lightCalendar.convertCalendarReturn(28.24,2025,'JPY','EUR',missingFx),null)
  assert.equal(lightCalendar.convertCalendarReturn(30.51,2023,'JPY','EUR',missingFx),fullCalendar.convertCalendarReturn(30.51,2023,'JPY','EUR'))
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
  // Source convention must survive the initial thin view, before selected-record hydration.
  for(const asset of canonical['portfolio-assets'].ASSETS.filter(a=>a.underlyingMechanism)){
    const thin=projected['portfolio-assets'].ASSETS.find(a=>a.id===asset.id)
    for(const field of ['isin','cat','basis','underlyingMechanism'])assert.equal(thin[field],asset[field],`${asset.id}: lost source identity/convention ${field}`)
  }
  for (const isin of Object.keys(canonical.instruments.INSTRUMENTS_BY_ISIN)) {
    for (const name of ['instruments', 'instrument-facts', 'instrument-listings', 'etf-ter','preferred-instrument-tickers']) {
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
