import assert from 'node:assert/strict'
import { readUsageHistory, saveUsageHistory, usageDate, USED_KEY } from '../src/pages/dca-profiles/usage-history.js'
import { localToday } from '../src/lib/publication-date.js'
const data=new Map(), storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}
for(const legacy of [['old'],{version:2,entries:[{id:'old',publishedAt:'2026-01-01T23:30:00.000Z'}]}]){
 data.clear();const raw=JSON.stringify(legacy);data.set(USED_KEY,raw)
 let state=readUsageHistory(storage);assert(state.readable);assert.equal(data.get(USED_KEY),raw)
 const before=structuredClone(state.entries)
 state=saveUsageHistory(state,'new',true,'2026-01-04',storage)
 assert.deepEqual(state.entries.filter(e=>e.id==='old'),before)
 state=saveUsageHistory(state,'old',true,'2026-01-03',storage)
 assert.deepEqual(state.history.at(-1).previous,before)
 state=saveUsageHistory(state,'old',false,null,storage)
 assert(!state.ids.includes('old'));assert(state.ids.includes('new'))
 assert.equal(state.history.at(-1).previous[0].publishedAt,'2026-01-03')
 assert.deepEqual(readUsageHistory(storage),state)
 const bytes=data.get(USED_KEY)
 assert(saveUsageHistory(state,'new',true,'2026-02-30',storage).error);assert.equal(data.get(USED_KEY),bytes)
 const other=saveUsageHistory(state,'other',true,'2026-01-05',storage)
 assert(saveUsageHistory(state,'new',false,null,storage).error);assert.equal(data.get(USED_KEY),other.raw)
 assert.equal(usageDate({publishedAt:'2026-01-03'}),'2026-01-03')
 assert.equal(usageDate({publishedAt:'2026-01-01T23:30:00.000Z'}),localToday(new Date('2026-01-01T23:30:00.000Z')))
}
console.log('Publication: legacy bytes/dates retained, append-only history, current state, correction, invalid dates, stale writes, unrelated ids preserved.')
