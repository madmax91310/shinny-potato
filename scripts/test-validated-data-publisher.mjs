import assert from 'node:assert/strict'
import {consumerChanges,requiredDataPath} from './prepare-validated-data.mjs'
assert.deepEqual(consumerChanges(['src/data/automated-scpi.json','scripts/collect_corum.py']),[])
assert.deepEqual(consumerChanges(['src/pages/Home.jsx','src/tools.js','src/data/editorial-calendar.js']),['src/pages/Home.jsx','src/tools.js','src/data/editorial-calendar.js'],'Pending calendar code must trigger full code publication instead of repeatedly publishing old code with newer data')
for(const path of ['src/data/catalog.js','src/pages/scpi-presentation/lib.js','src/pages/presentations/Actors.jsx','src/pages/presentation-shared/imageExport.js','src/styles.css']) assert.deepEqual(consumerChanges([path]),[path])
assert.equal(requiredDataPath('src/data/automated-scpi.json'),'src/data/automated-scpi.json')
for(const path of ['../src/data/automated-scpi.json','src/data/../../other.json','src/data/config.js','src/data/actor.json;echo danger']) assert.throws(()=>requiredDataPath(path))
console.log('Validated data publication: all application code changes block overlay; data refreshes remain independent.')
const {producerPaths,requiredFiles}=await import('./prepare-validated-data.mjs')
const registry={'x.yml':['src/data/a.json','public/data/investors']}
const allowed=['src/data/a.json','public/data/investors']
assert.deepEqual(producerPaths('x.yml','',registry),registry['x.yml'])
assert.throws(()=>producerPaths('unknown.yml','',registry))
assert.throws(()=>producerPaths('x.yml','src/data/a.json',registry))
assert.deepEqual(requiredFiles(registry['x.yml'],['src/data/a.json','public/data/investors/a.json','public/data/investors/b.json','src/pages/Home.jsx'],allowed),['public/data/investors/a.json','public/data/investors/b.json','src/data/a.json'])
assert.throws(()=>requiredFiles(['src/data/a.json'],[],allowed))
assert.throws(()=>requiredFiles(['src/data/a.json'],['src/data/a.json'],[]))
assert.throws(()=>requiredDataPath('public/data/../private'))
console.log('Producer receipts cover multiple outputs and every recorded directory member; unknown and unowned files fail closed.')

assert.deepEqual(consumerChanges(['src/data/inflation-monthly.js']),[],'Generated INSEE data is checked as producer bytes, not interpreted as changed financial code')
