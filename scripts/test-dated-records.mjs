import assert from 'node:assert/strict'
import {mergeDatedRecords} from './lib/dated-records.mjs'
import {advanceRadar} from './lib/editorial-radar.mjs'
const older={sourceUrl:'https://issuer.test/old',countries:{asOf:'2026-09-30',checkedAt:'2026-10-22',rows:[{name:'FR',weightPct:100}]}},newer={sourceUrl:'https://issuer.test/new',countries:{asOf:'2026-10-21',checkedAt:'2026-10-21',rows:[{name:'FR',weightPct:90},{name:'US',weightPct:10}]}}
for(const registries of [[{fund:newer},{fund:older}],[{fund:older},{fund:newer}]]) {
 const r=mergeDatedRecords(...registries).fund
 assert.equal(r.countries.asOf,'2026-10-21')
 assert.deepEqual(r.countries.rows,newer.countries.rows)
 assert.equal(r.countries.sourceUrl??r.sourceUrl,'https://issuer.test/new')
}
const row={family:'etf',entity:'IE00B4L5Y983',label:'World',field:'aum',fieldLabel:'Encours',value:100,period:'2026-10-21',checkedAt:'2026-10-22',scope:'fund USD',sourceUrl:'https://issuer.test/fund'}
const initial=advanceRadar(null,[row],{now:new Date('2026-10-22T12:00:00Z')})
const result=advanceRadar(initial.state,[{...row,value:200,period:'2026-09-30'}],{now:new Date('2026-10-22T13:00:00Z')})
assert.equal(result.feed.errors.length,0)
assert.equal(result.newEvents.length,0)
assert(Object.values(result.state.current).every(r=>r.value===100))
assert(Object.values(result.state.ignoredObservations).some(r=>r.reason==='older-observation'))
console.log('Observation dates outrank registry order and check dates; stale observations retained as diagnostics, without false signals or evidence renewal.')
