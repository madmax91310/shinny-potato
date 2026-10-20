import assert from 'node:assert/strict'
import {consumerChanges,requiredDataPath} from './prepare-validated-data.mjs'
assert.deepEqual(consumerChanges(['src/data/automated-scpi.json','scripts/collect_corum.py','src/pages/Home.jsx','src/tools.js','src/data/editorial-calendar.js']),[])
for(const path of ['src/data/catalog.js','src/pages/scpi-presentation/lib.js','src/pages/presentations/Actors.jsx','src/pages/presentation-shared/imageExport.js','src/styles.css']) assert.deepEqual(consumerChanges([path]),[path])
assert.equal(requiredDataPath('src/data/automated-scpi.json'),'src/data/automated-scpi.json')
for(const path of ['../src/data/automated-scpi.json','src/data/../../other.json','src/data/config.js','src/data/actor.json;echo danger']) assert.throws(()=>requiredDataPath(path))
console.log('Validated data publication: financial consumer changes block overlay; editorial changes and data refreshes remain independent.')
